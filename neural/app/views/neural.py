from flask import Blueprint, request
from flask_cors import CORS
from sentence_transformers import CrossEncoder
import torch
import traceback
import os
import time
from vllm import LLM, SamplingParams

from flask_cors import CORS

from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig


neural = Blueprint('neural', __name__)
CORS(neural)

# set up rerank model
try:
    rerank_model = CrossEncoder('cross-encoder/ms-marco-TinyBERT-L-2', max_length=512)
except Exception as e:
    rerank_model = False
    print("No rerank", e)

# set up generate model
try:

    sampling_params = SamplingParams(temperature=0.8, top_p=0.95, max_tokens=200)

    generate_model = LLM(model="vicuna-7b-v1.5-awq/", quantization="AWQ", gpu_memory_utilization=0.5)
    
except Exception as e:
    generate_model = False
    print("No generate", e)


@neural.route('/neural/generate', methods=["POST"])
def generate():
    """
    Endpoint for generating text in the extension.
	Arguments:
		request args with:
			query : (string) : the typed query of the user.
			context: (string) : the highlighted text by the user.
			mode : (str) : one of
                qa : given a query, generate the answer
                contextual_qa : given a context and a portion of a query, generate the answer
                gen_questions: given a context, generate some questions
                summarize : given a context, summarize the selection
	Returns:
		200 : output of generation.
    """
    request_json =  request.get_json()

    context = request_json.get("context", "")
    query = request_json.get("query", "")
    mode = request_json.get("mode", "")

    if not generate_model:
        return {"message": "Generation model not initialized."}, 500

    """
    VERSION: 0.1 (Vicuna)
    """
    
    if mode == "qa":
        if not query:
            return {"message": "Query required for question-answer mode."}, 400
        prompt = "Answer the following question with fewer than 100 words. Question: " + query + ". Answer: "

    elif mode == "contextual_qa" or mode == "gen_questions":
        if not context:
            return {"message": "Context required for contextual question generation."}, 400
        
        if len(context.split()) <= 3:
            prompt = "List three diverse, short, curiosity-sparking search engine questions that contain the words: '" + context
            if query:
                prompt += "'. Each question should also explicitly reference the intent '" + query
        else:
            prompt = context + "...List three diverse, short search engine questions that a curious reader might have after reading the preceeding text. The questions should not be answered by the text itself"
            if query:
                prompt += "'. Each question should also explicitly reference the intent '" + context

        prompt += "'. Here are the short search engine questions (separated with newlines):"


    elif mode == "summarize":
        if not context:
            return {"message": "Context required for summarization."}, 400
        prompt = context + "... Please summarize the previous text, and only reply with the summary. Summary: "
    
    try:
        prompts = [prompt]
        start_time = time.time()
        outputs = generate_model.generate(prompts, sampling_params)
        stop_time = time.time()
        output = outputs[0].outputs[0].text
        print("Request completed in ", stop_time-start_time)
    except Exception as e:
        traceback.print_exec()
        return {"message": "Something went wrong with generation, please try again later."}, 400

    return {"output": output}



@neural.route("/neural/rerank/", methods=["POST"])
def neural_rerank():
    """
	Helper function for neural reranking.
	Arguments:
		query : (string): the original user query
		pages : (list) : an array of processed submissions
		topn : (int, default=50) : the number of results to rerank 
	Returns:
		pages : (list) : a reranked pages	
	"""

    data = request.get_json()


    query = data.get("query")
    pages = data.get("pages")
    topn = data.get("topn", 50)

    if not query or not pages:
        print("Missing query or pages")
        return {"pages": pages}, 400


    if rerank_model and len(query.split()) > 2:
        model_input = []
        for hit in pages[:topn]:
            # limit of 200 words or 500 characters
            trunc_exp = " ".join(hit["explanation"].split()[:200])[:500]
            trunc_high = " ".join(hit["highlighted_text"].split()[:200])[:500]
            trunc_query = " ".join(query.split()[:200])[:500]
            model_input.append((trunc_query, trunc_exp + " | " + trunc_high))
        if model_input:
            scores = rerank_model.predict(model_input)
            for i, score in enumerate(scores):
                pages[i]["score"] = pages[i]["score"] + 10 * score

    return {"pages": pages}, 200