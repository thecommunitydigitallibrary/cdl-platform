import json
from bson import ObjectId
from flask import Blueprint, request
from flask_cors import CORS
import traceback

from app.db import *
from app.helpers.status import Status
from app.helpers import response
from app.helpers.helpers import token_required, format_time_for_display
from app.models.communities import Communities, Community
from app.models.community_logs import CommunityLogs
from app.models.users import Users
from app.models.judgment import *
from app.views.logs import log_community_action

communities = Blueprint('communities', __name__)
CORS(communities)


@communities.route("/api/communityHistory", methods=["GET"])
@token_required
def get_community_history(current_user):
	"""
	Endpoint for getting all communities that a user has left
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
	Returns:
		200 : dictionary with community info
	"""
	try:
		user_id = current_user.id
		cdl_community_logs = CommunityLogs()
		cdl_communities = Communities()
		all_community_logs = cdl_community_logs.find({"user_id": user_id, "action": "LEAVE"})

		left_communities = {}
		for log in all_community_logs:
			if log.community_id not in current_user.communities:
				community = cdl_communities.find_one({"_id": log.community_id})

				if community:

					is_admin = False
					# some communities do not have admin property?
					try:
						if user_id in community.admins:
							is_admin = True
					except:
						pass

					# assuming that logs are ordered by least recent to most recent
					str_community_id = str(community.id)

					left_communities[str_community_id] = {
						"community_id": str_community_id,
						"name": community.name,
						"description": community.description,
						"join_key": community.join_key,
						"is_admin": is_admin,
						"time": format_time_for_display(log.time)
					}
		left_communities = list(left_communities.values())
		return response.success({"left_communities": left_communities}, Status.OK)
	except Exception as e:
		print(e)
		traceback.print_exc()
		return response.error("Failed to get community history, please try again later.", Status.INTERNAL_SERVER_ERROR)


@communities.route("/api/getCommunities", methods=["GET"])
@token_required
def get_communities(current_user):
	"""
	Endpoint for getting all of the user's current communities, along with their information.
	Called on webpage search page load, which is why username is also returned.
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		There is no content passed in the request except for the token header.
	Returns:
		On success, a dictionary with community info and username (see get_communities_helper for details).
	"""
	try:
		return response.success(get_communities_helper(current_user), Status.OK)
	except Exception as e:
		print(e)
		return response.error("Failed to get communities, please try again later.", Status.INTERNAL_SERVER_ERROR)


def get_communities_helper(current_user, return_dict=False):
	"""
	The helper function for getting a user's communities.
	Arguments:
		current_user : dictionary : the user recovered from the JWT token.
		return_dict : boolean : to return as a dictionary.
	Returns:
		A dictionary with
			community_info: a list of dicts, each containing commnuity_id, name, join_key, is_admin. If return_dict is true, then this is a dictionary mapped with the community_id.
			username: the username of the user.
	"""

	user_communities = current_user.communities
	user_id = current_user.id

	community_struct = []
	for community_id in user_communities:
		if user_id == community_id:
			continue
		cdl_communities = Communities()
		community = cdl_communities.find_one({"_id": community_id})
		if not community:
			print(f"Could not find community for community id: {community_id} and user id: {user_id}")
			break
		else:
			is_admin = False

			# some communities do not have admin property?
			try:
				if user_id in community.admins:
					is_admin = True
			except:
				pass
		community_struct.append({
			"community_id": str(community.id),
			"name": community.name,
			"description": community.description,
			"join_key": community.join_key,
			"is_admin": is_admin
		})

	if return_dict:
		new_community_struct = {}
		for community in community_struct:
			new_community_struct[community["community_id"]] = community
		community_struct = new_community_struct

	return {"community_info": community_struct, "username": current_user.username}


@communities.route("/api/createCommunity", methods=["POST", "PATCH"])
@token_required
def create_community(current_user):
	"""
	Endpoint for creating or editing a community.
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		A request data JSON with
			community_name : (str) : the name of the community sent by the user.
			description : (str) : the description of the community sent by the user.
		Only community_name is required for POST, and at least one is required for PATCH.

	Returns:
		200 : dictionary JSON with "status" as "ok" and success message "message"
		500 : dictionary JSON with "status" as "error" and error message "message"
	"""
	try:
		user_id = current_user.id
		ip = request.remote_addr
		community_info = json.loads(request.data.decode("utf-8"))
		community_name = community_info.get("community_name", None)
		community_description = community_info.get("community_description", None)
		community_id = community_info.get("community_id", None)

		if community_name and len(community_name) < 3 or len(community_name) > 100:
			return response.error("The community name must be between 2 characters and 100 characters.", Status.BAD_REQUEST)
		
		if community_description and len(community_description) > 500:
			return response.error("The community name must be less than 500 characters.", Status.BAD_REQUEST)

		cdl_communities = Communities()

		if request.method == "POST":
			if community_name:
				if not community_description:
					community_description = ""
				community = Community(community_name, community_description, [user_id])
				inserted = cdl_communities.insert(community)
				if inserted.acknowledged:
					cdl_users = Users()
					updated = cdl_users.update_one({"_id": user_id}, {"$push": {"communities": inserted.inserted_id}},
					                               upsert=False)
					if updated.acknowledged:
						log_community_action(ip, user_id, inserted.inserted_id, "CREATE")
						return response.success({"message": "Community created successfully!"}, Status.OK)
			else:
				return response.error("Must provide a community name.", Status.BAD_REQUEST)

		elif request.method == "PATCH":
			if not community_name and not community_description:
				return response.error("Must provide name and/or description", Status.BAD_REQUEST)
			try:
				community_id = ObjectId(community_id)
			except Exception as e:
				print(e)
				return response.error("Must provide a valid community id.", Status.BAD_REQUEST)

			# check to make sure user is admin
			community = cdl_communities.find_one({"_id": community_id})

			if not community:
				print("Cannot find community", community)
				return response.error("Cannot find community.", Status.INTERNAL_SERVER_ERROR)

			if user_id not in community.admins:
				return response.error("Must be a community admin to edit the title or description.",
				                      Status.UNAUTHORIZED)

			insert_obj = {}
			if community_name:
				insert_obj["name"] = community_name
			if community_description:
				insert_obj["description"] = community_description
			updated = cdl_communities.update_one({"_id": community_id}, {"$set": insert_obj}, upsert=False)
			if updated.acknowledged:
				return response.success({"message": "Community edited successfully!"}, Status.OK)

		return response.error("Something went wrong. Please try again later", Status.INTERNAL_SERVER_ERROR)
	except Exception as e:
		print(e)
		return response.error("Failed to create community, please try again later.", Status.INTERNAL_SERVER_ERROR)


@communities.route("/api/joinCommunity", methods=["POST"])
@token_required
def join_community(current_user):
	"""
	Endpoint for joining a community.
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		A request data JSON with
			join_key : (str) : the join key of the community sent by the user.
	Returns:
		200 : dictionary JSON with "status" as "ok" and success message "message"
		500 : dictionary JSON with "status" as "error" and error message "message"
	"""
	try:
		user_id = current_user.id
		ip = request.remote_addr
		community_info = request.data
		if community_info:
			join_key = json.loads(community_info.decode("utf-8"))["join_key"]
			cdl_communities = Communities()
			community = cdl_communities.find_one({"join_key": join_key})
			if community:
				community_id = community.id
				# cannot join a community that you are already a part of
				if community_id in current_user.communities:
					return response.error("You are already a member of this community!", Status.BAD_REQUEST)
				cdl_users = Users()
				updated = cdl_users.update_one({"_id": user_id}, {"$push": {"communities": community_id}}, upsert=False)
				if updated.acknowledged:
					log_community_action(ip, user_id, community_id, "JOIN")
					return response.success({"message": "Community successfully joined!"}, Status.OK)
			else:
				return response.error("Cannot find community.", Status.BAD_REQUEST)
		return response.error("Something went wrong. Please try again later", Status.INTERNAL_SERVER_ERROR)
	except Exception as e:
		print(e)
		return response.error("Failed to join community, please try again later.", Status.INTERNAL_SERVER_ERROR)


@communities.route("/api/leaveCommunity", methods=["POST"])
@token_required
def leave_community(current_user):
	"""
	Endpoint for leaving a community.
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		A request data JSON with
			community_id : (str) : the ID of the community that the user would like to leave.
	Returns:
		200 : dictionary JSON with "status" as "ok" and success message "message"
		500 : dictionary JSON with "status" as "error" and error message "message"
	"""
	try:
		user_id = current_user.id
		ip = request.remote_addr
		community_info = request.data
		if community_info:
			community_id = ObjectId(json.loads(community_info.decode("utf-8"))["community_id"])
			cdl_communities = Communities()
			community = cdl_communities.find_one({"_id": community_id})
			if community:
				community_admins = community.admins

				# cannot leave a community that you created (for now)
				# if user_id in community_admins:
				# 	return response.error("Community admins cannot leave the community.", Status.FORBIDDEN)
				user_communities = current_user.communities

				# cannot leave a community that you are not in
				if community.id not in user_communities:
					return response.error("You are not a member of this community.", Status.FORBIDDEN)
				updated_communities = [x for x in user_communities if x != community.id]
				cdl_users = Users()
				updated = cdl_users.update_one({"_id": user_id}, {"$set": {"communities": updated_communities}},
				                               upsert=False)
				if updated.acknowledged:
					log_community_action(ip, user_id, community_id, "LEAVE")
					return response.success({"message": "Community successfully left!"}, Status.OK)
		return response.error("Something went wrong. Please try again later", Status.INTERNAL_SERVER_ERROR)
	except Exception as e:
		print(e)
		return response.error("Failed to leave community, please try again later.", Status.INTERNAL_SERVER_ERROR)


# Judgments
def log_rel_judgment(ip, user_id, judgments):
	"""
	Logs the relevance judgment submitted by the user.
	Arguments:
		ip : (string) : the IP address of the request sent by the user.
		user_id : (ObjectID) : the ID of the user making the judgment.
		judgments: (dictionary) : keys are result hashes (as described in log_click), values are either 0 or 1.
	Returns:
		insert : Pymongo object with property .acknowledged (should be true on success).
	TODO: change return value to .acknowledged
	"""
	try:
		judgment = Judgment(ip, user_id, judgments)
		cdl_judgments = Judgments()
		return cdl_judgments.insert(judgment)
	except Exception as e:
		print(e)
		return response.error("Failed to log relevant judgement, please try again later.", Status.INTERNAL_SERVER_ERROR)


def get_rel_judgment_count(user_id):
	"""
	Helper function for counting the number of relevance judgments. For MP2.2.
	Arguments:
		user_id : (string) : the ID of the user.

	Returns:
		valid_count : (integer) : the number of judged queries.
	"""
	try:
		cdl_judgments = Judgments()
		all_judgments = [x for x in cdl_judgments.find({"user_id": ObjectId(user_id)})]
		return len(all_judgments)
	except Exception as e:
		print(e)
		return response.error("Failed to get relevant judgements count, please try again later.",
		                      Status.INTERNAL_SERVER_ERROR)


@communities.route("/api/submitRelJudgments", methods=["POST"])
@token_required
def submit_rel_judgments(current_user):
	"""
	Endpoint for submitting a relevance judgment
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		request data (website) with a mapping between result IDs and 1/0 labels.
			Example:
				{"28_63094100d999b482814f371c_d4f6481c-e8ec-488a-bf71-2da4cf26fb1b: "1"}
				where
				28 is the rank,
				63094100d999b482814f371c is the submission id, and
				d4f6481c-e8ec-488a-bf71-2da4cf26fb1b is the query hash.

				This result ID should be included in the search result items.
	Returns:
		200 : JSON with "status" as "ok" and a success "message".
	TODO: change 200 too 400 (will avoid changing for now, as it is during the assignment)
	"""
	try:
		user_id = current_user.id
		ip = request.remote_addr
		submitted_judgments = request.data
		if submitted_judgments:
			submitted_judgments = json.loads(submitted_judgments.decode("utf-8"))
			if submitted_judgments == {}:
				return response.error("Error: Missing judgment in request.", Status.BAD_REQUEST)
			update = log_rel_judgment(ip, user_id, submitted_judgments)
			if update.acknowledged:
				return response.success({"message": "Relevance judgment successfully saved!"}, Status.OK)
		return response.error("Something went wrong. Please try again later", Status.INTERNAL_SERVER_ERROR)
	except Exception as e:
		print(e)
		return response.error("Failed to submit relevant judgement, please try again later.",
		                      Status.INTERNAL_SERVER_ERROR)
