from flask import Blueprint, request
from flask_cors import CORS
import traceback
import os
import json
import time
from vllm import LLM, SamplingParams
from sentence_transformers import CrossEncoder

os.environ["CUDA_VISIBLE_DEVICES"]="2"
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
    sampling_params = SamplingParams(temperature=0, top_p=0.95, max_tokens=2000)
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
            input : (string) : the input text for the model.
    Returns:
        200 : output of generation.
    """
    request_json =  request.get_json()

    input = request_json.get("input", "")
    print("input", input)

    if not generate_model:
        return {"message": "Generation model not initialized."}, 500
    try:
        prompts = input
        start_time = time.time()
        outputs = generate_model.generate(prompts, sampling_params)
        stop_time = time.time()
        output = outputs[0].outputs[0].text
        print("Request completed in ", stop_time-start_time)
    except Exception as e:
        traceback.print_exc()
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