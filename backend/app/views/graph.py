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
	print(current_user, id)

	submission, search_results = graph_search(current_user, id)
	# print(search_results)

	nodes = [
		{
			"id": id,
			"label": submission.explanation,
			"desc": submission.highlighted_text if len(
				submission.highlighted_text) < 200 else f"{submission.highlighted_text[:200]}...",
			"type": "current",
		}
	]
	links = []
	h = set()
	h.add(id)
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
		h.add(result["_id"])
		nodes.append(node)
		links.append(link)

	for result in search_results:
		source = result["_id"]
		sub, second_level_results = graph_search(current_user, source)

		for new in second_level_results:
			if new["_id"] == source:
				continue
			if new["_id"] not in h:
				node = {
					"id": new["_id"],
					"label": new["_source"]["explanation"],
					"type": "second",
				}
				h.add(new["_id"])
				nodes.append(node)
				link = {
					"source": source,
					"target": new["_id"]
				}

				links.append(link)

	data = {
		"nodes": nodes,
		"links": links
	}

	print("Data", data)
	return response.success({"data": data}, Status.OK)
