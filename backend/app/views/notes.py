import json
import uuid
import traceback


from flask import Blueprint, request
from flask_cors import CORS

from app.helpers.helpers import token_required
from app.helpers.status import Status
from app.models.notes import Notes
from app.helpers import response

notes = Blueprint('notes', __name__)
CORS(notes)

"""
get post patch delete all along url path api/notes/<id>/<id>/...
limited to fewer than 4 ids
returned ids to frontend should contain full path
"""


def get_notes_helper(user_id, target_note_path=['']):
	"""
	Helper function for notes. Pulls all titles and a specific note (if id provided)
	Arguments:
		user_id : (ObjectId): the user ID recovered by the JWT token.
		target_note_path: (list): ordered nesting of hash IDs of a note to retrieve.
	Return:
		all_titles: a list of {"title": <title>, "id": <id>}
		target_note: node if id is none, otherwise {"title": <title>, "id": <id>, "content": <content>}
	"""
	cdl_notes = Notes()

	all_notes = cdl_notes.find_one({"user_id": user_id})
	all_titles = []
	if all_notes == None:
		return [], None
	target_note = None

	# hard-coded to three levels for now
	for note_id in all_notes.notes.keys():
		note = all_notes.notes[note_id]
		note_item = {"title": note["title"], "id": note["id"], "notes": []}

		for child_l1_note_id in note.get("notes", {}):
			child_note_l1 = all_notes.notes[note_id]["notes"][child_l1_note_id]
			child_note_item_l1 = {"title": child_note_l1["title"], "id": child_note_l1["id"],
			                      "notes": []}

			for child_l2_note_id in child_note_l1.get("notes", []):
				child_note_l2 = all_notes.notes[note_id]["notes"][child_l1_note_id]["notes"][child_l2_note_id]
				child_note_item_l2 = {"title": child_note_l2["title"],
				                      "id": child_note_l2["id"]}

				child_note_item_l1["notes"].append(child_note_item_l2)

			note_item["notes"].append(child_note_item_l1)

		all_titles.append(note_item)

	try:
		if target_note_path != ['']:
			curr_note_level = all_notes.notes
			for i, note_id in enumerate(target_note_path):
				curr_note_level = curr_note_level[note_id]
				if i < len(target_note_path) - 1:
					curr_note_level = curr_note_level.get("notes", {})

			target_note = {"title": curr_note_level["title"], "id": curr_note_level["id"],
			               "content": curr_note_level["content"]}
	except Exception as e:
		print("could not find note for ids ", target_note_path, e)
		traceback.print_exc()


	return all_titles, target_note


@notes.route("/api/notes/", defaults={"subpath": ""}, methods=["GET", "POST"])
@notes.route("/api/notes/<path:subpath>", methods=["GET", "POST", "PATCH", "DELETE"])
@token_required
def handle_notes(current_user, subpath):
	"""
	Endpoint for getting all titles, or creating a specific note.
	Also for getting a specific note, editing a note, or deleting a note.

	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		path : (string) : the path of the IDs (should be <id1>/<id2>/...)
	Returns:
		On GET:
			200 : dictionary JSON with "status" as "ok" and "titles" field as output from get_notes_helper. "note" will be included
			when the ID path matches.
		On POST:
			200 : dictionary JSON with "status" as "ok" and "id" as the created note page id
			500 : dictionary JSON with "status" as "error" and error message "message"
		On PATCH:
			200 : dictionary JSON with "status" as "ok"
			500 : dictionary JSON with "status" as "error" and error message "message"
		On DELETE:
			200 : dictionary JSON with "status" as "ok"
			500 : dictionary JSON with "status" as "error" and error message "message"
	"""
	try:
		user_id = current_user.id
		note_path = subpath.split("|")

		cdl_notes = Notes()

		if request.method == "GET":
			all_titles, note = get_notes_helper(user_id, target_note_path=note_path)
			if note_path == [""]:
				return response.success({"titles": all_titles}, Status.OK)
			else:
				if not note:
					return response.error_payload({
						"message": "Cannot find note page",
						"titles": all_titles}, Status.NOT_FOUND)
				else:
					return response.success({"note": note, "titles": all_titles}, Status.OK)


		elif request.method == "POST":
			try:
				request_data = json.loads(request.data.decode("utf-8"))
				title = request_data["title"]

				if title == "":
					return response.error("Title cannot be empty", Status.INTERNAL_SERVER_ERROR)
				cdl_notes = Notes()

				notepage_id = str(uuid.uuid4())

				if note_path[0] == "":
					note_path[0] = notepage_id
				else:
					note_path.append(notepage_id)

				if len(note_path) > 3:
					return response.error("Only three levels of notes are allowed.", Status.INTERNAL_SERVER_ERROR)

				full_note_path = ".notes.".join(note_path)

				ack = cdl_notes.update_one({"user_id": user_id}, {
					"$set": {"notes." + full_note_path + ".id": "|".join(note_path),
					         "notes." + full_note_path + ".title": title,
					         "notes." + full_note_path + ".content": ""}}, upsert=True)
				if ack.acknowledged:
					return response.success({"id": "|".join(note_path)}, Status.OK)
			except Exception as e:
				print(e)
				traceback.print_exc()
				return response.error("Could not save note.", Status.INTERNAL_SERVER_ERROR)

		elif request.method == "PATCH":
			try:
				json_request = request.get_json()

				if "content" not in json_request or "title" not in json_request:
					return response.error("Request must contain title and content fields.", Status.BAD_REQUEST)
				
				updated_content = json_request["content"]
				updated_title = json_request["title"]
				full_note_path = ".notes.".join(note_path)

				ack = cdl_notes.update_one({"user_id": user_id},
				                           {"$set": {"notes." + full_note_path + ".title": updated_title,
				                                     "notes." + full_note_path + ".content": updated_content,
				                                     "notes." + full_note_path + ".id": "|".join(note_path)}})
				if ack.acknowledged:
					return response.success({"message": "Note updated successfully"}, Status.OK)
				else:
					return response.error("Could not update note page.", Status.INTERNAL_SERVER_ERROR)

			except Exception as e:
				print(e)
				traceback.print_exc()
				return response.error("Something went wrong. Please try again later", Status.INTERNAL_SERVER_ERROR)

		elif request.method == "DELETE":
			try:
				full_note_path = ".notes.".join(note_path)
				ack = cdl_notes.update_one({"user_id": user_id}, {"$unset": {"notes." + full_note_path: ""}})
				if ack.acknowledged:
					return response.success("Note successfully deleted.", Status.OK)
				else:
					return response.error("Could not delete note page.", Status.INTERNAL_SERVER_ERROR)
			except Exception as e:
				print(e)
				traceback.print_exc()
				return response.error("Something went wrong. Please try again later", Status.INTERNAL_SERVER_ERROR)
	except Exception as e:
		print(e)
		traceback.print_exc()
		return response.error("Failed to create notes, please try again later.", Status.INTERNAL_SERVER_ERROR)
