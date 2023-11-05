import traceback

from flask import Blueprint
from flask_cors import CORS

from app.helpers.helpers import token_required
from app.helpers import response
from app.helpers.status import Status
from app.views.functional import graph_search

graph = Blueprint('graph', __name__)
CORS(graph)


@graph.route("/api/graph/<id>", methods=["GET"])
@token_required
def get_graph(current_user, id):
	try:
		resp = graph_search(current_user, id)

		if len(resp) == 1:
			return resp
		submission, search_results = resp
		print(submission)
		nodes = [
			{
				"id": id,
				"label": submission.get("explanation"),
				"desc": submission.get("highlighted_text") if len(
					submission.get("highlighted_text")) < 200 else f"{submission.get('highlighted_text')[:200]}...",
				"type": "current"
			}
		]
		links = []
		for result in search_results:
			if result["_id"] == id:
				continue
			node = {
				"id": result["_id"],
				"label": result["_source"]["explanation"],
				"type": "first",
			}
			link = {
				"source": id,
				"target": result["_id"]
			}
			nodes.append(node)
			links.append(link)

		data = {
			"nodes": nodes,
			"links": links
		}

		return response.success({"data": data}, Status.OK)
	except Exception as e:
		print(e)
		traceback.print_exc()
		return response.error("Graph Creating Failed!", Status.INTERNAL_SERVER_ERROR)
