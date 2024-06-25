from flask import Blueprint, request
from flask_cors import CORS
import traceback
import os
import re
import time
from vllm import LLM, SamplingParams
from sentence_transformers import SentenceTransformer, util
import torch

os.environ["CUDA_VISIBLE_DEVICES"]="1"
neural = Blueprint('neural', __name__)
CORS(neural)


# set up rerank model
try:
    rerank_model = SentenceTransformer("sentence-transformers/multi-qa-MiniLM-L6-dot-v1")

except Exception as e:
    rerank_model = False
    print("No rerank", e)


# set up generate model
try:
    sampling_params = SamplingParams(temperature=0.0, top_p=0.95, max_tokens=1000, stop_token_ids=[128001, 128009])
    generate_model = LLM(model="llama3-8b-awq/", quantization="AWQ", gpu_memory_utilization=0.75)
except Exception as e:
    generate_model = False
    print("No generate", e)

@neural.route('/neural/generate', methods=["POST"])
def generate():
    """Handles the generation of text.

    Request Parameters
    ---------
        input : str, required
            The full prompt input.

    Returns
    ---------
    On success, a response.success object with the results:
        output : str
            The generated response of the language model.
    """
    request_json =  request.get_json()

    input = request_json.get("input", "")

    if not generate_model:
        return {"message": "Generation model not initialized."}, 500
    try:
        prompts = input
        start_time = time.time()
        outputs = generate_model.generate(prompts, sampling_params)
        stop_time = time.time()
        output = outputs[0].outputs[0].text
        if "<|eot_id|>" in output:
            output = re.sub("<\|eot_id\|>", "", output)
        print("Request completed in ", stop_time-start_time)
    except Exception as e:
        traceback.print_exc()
        return {"message": "Something went wrong with generation, please try again later."}, 400

    return {"output": output}, 200


@neural.route("/neural/rerank/", methods=["POST"])
def neural_rerank():
    """Handles the reranking of search results given a list of queries..

    Request Parameters
    ---------
        queries : list, required
            A list of str, where each item is a separate query.

        documents : list, required
            A list of str, where each item is a document to be ranked.

    Returns
    ---------
    On success, a response.success object with the results:
        ranks : dict
            A dictionary mapping a query index to a list of "scores" and "indices" for the documents.
    """

    data = request.get_json()

    queries = data.get("queries", [])
    documents = data.get("documents", [])

    if not queries or not documents:
        return {"message": "Must send both queries and documents"}, 400
    
    
    encoded_queries = rerank_model.encode(queries)
    encoded_documents = rerank_model.encode(documents)


    similarity = util.dot_score(encoded_queries, encoded_documents)

    return_obj = {}
    for i,_ in enumerate(queries):
        doc_scores = similarity[i]
        topK = torch.topk(doc_scores, min(5, len(doc_scores)))
        return_obj[i] = {"scores": topK.values.tolist(), "indices": topK.indices.tolist()}

    return {"ranks": return_obj}, 200