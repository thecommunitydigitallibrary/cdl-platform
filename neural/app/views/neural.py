from flask import Blueprint, request
from flask_cors import CORS
from sentence_transformers import CrossEncoder


neural = Blueprint('neural', __name__)
CORS(neural)


# Set up neural reranking model
try:
    rerank_model = CrossEncoder('cross-encoder/ms-marco-TinyBERT-L-2', max_length=512)
except:
    rerank_model = False



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
            pages = sorted(pages, reverse=True, key=lambda x: x["score"])

    return {"pages": pages}, 200