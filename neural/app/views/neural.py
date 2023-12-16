from flask import Blueprint, request
from flask_cors import CORS
from sentence_transformers import CrossEncoder
import torch
import traceback
import os
from flask_cors import CORS

from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig


neural = Blueprint('neural', __name__)
CORS(neural)


hf_token = os.environ.get("hf_token")

# set up rerank model
try:
    rerank_model = CrossEncoder('cross-encoder/ms-marco-TinyBERT-L-2', max_length=512)
except:
    rerank_model = False

# set up generate model
try:
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16
    )

    device = "cuda:3"

    # mistralai/Mistral-7B-Instruct-v0.1
    # meta-llama/Llama-2-13b-chat-hf

    generate_tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-13b-chat-hf", token=hf_token)
    generate_model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-13b-chat-hf", token=hf_token, quantization_config=bnb_config, device_map=device)
except:
    generate_model = False


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
    VERSION: 0
    """
    
    if mode == "qa":
        if not query:
            return {"message": "Query required for question-answer mode."}, 400
        prompt = "Answer the following question in fewer than 100 words: " + query
    elif mode == "contextual_qa":
        if not query or not context:
            return {"message": "Query and context required for contextual question-answer mode."}, 400
        prompt = "'" + context + "'. Please generate a question I may have after reading the previous text. The question should contain the words'" + query + "'. After generating the question, provide a short answer. Question:" 
    elif mode == "gen_questions":
        if not context:
            return {"message": "Context required for question generation."}, 400
        prompt = "Generate three questions (without answers) that I may have after reading the following text: '" + context + "'. Here are the questions (without answers): "
    elif mode == "summarize":
        if not context:
            return {"message": "Context required for question generation."}, 400
        prompt = context + "... Please summarize the previous text, and only reply with the summary. Summary: "
    
    try:
        with torch.no_grad():
            inputs = generate_tokenizer(prompt, return_tensors="pt").to(device)
            outputs = generate_model.generate(**inputs, max_new_tokens=250)
            resp = generate_tokenizer.decode(outputs[0], skip_special_tokens=True)
            resp = resp[len(prompt):]
    except Exception as e:
        traceback.print_exec()
        return {"message": "Something went wrong with generation, please try again later."}, 400

    return {"output": resp}



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