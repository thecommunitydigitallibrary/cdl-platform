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
	print(search_results)

	nodes = [
		{
			"id": id,
			"label": submission.explanation,
			"desc": submission.highlighted_text if len(submission.highlighted_text) < 100 else f"{submission.highlighted_text[:100]}...",
			"type": "current",
		}
	]
	links = []
	for result in search_results:
		if result["_id"] == id:
			continue
		node = {
			"id": result["_id"],
			"label": result["_source"]["explanation"],
			"type": "nearby",
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
	# return {
	# 	"status": "ok",
	# 	"data": {"nodes": [{
	# 		"id": "6412242ba16775cc9de298c6",
	# 		"type": "current",
	# 		"title": "AA"
	# 	},
	# 		{
	# 			"id": "6400479525bd2feef310aaa8",
	# 			"type": "nearby",
	# 			"title": "BB"
	# 		},
	# 		{
	# 			"id": "64004acfd96c18cbe2fa1a83",
	# 			"type": "nearby",
	# 			"title": "CC"
	# 		}],
	# 		"links": [{
	# 			"source": "6412242ba16775cc9de298c6",
	# 			"target": "6400479525bd2feef310aaa8"
	# 		},
	# 			{
	# 				"source": "6412242ba16775cc9de298c6",
	# 				"target": "64004acfd96c18cbe2fa1a83"
	# 			}]
	# 	}}
	print("Data", data)
	return response.success({"data": data}, Status.OK)
