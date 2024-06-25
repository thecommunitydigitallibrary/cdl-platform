import json
import random
from bson import ObjectId
from flask import Blueprint, request
from flask_cors import CORS 
import traceback

from app.db import *
from app.helpers.status import Status
from app.helpers import response
from app.helpers.helpers import token_required, token_required_public, format_time_for_display, format_url, get_communities_helper
from app.models.communities import Communities, Community
from app.models.community_logs import CommunityLogs
from app.models.users import Users
from app.models.judgment import *
from app.models.relevance_judgements import *
from app.models.submission_stats import *
from app.views.submissions import log_community_action
from app.models.logs import Logs


communities = Blueprint('communities', __name__)
CORS(communities)


@communities.route("/api/communities/recommend", methods=["GET"])
@token_required
def get_recommended_communities(current_user):
	"""
		top_n
		method
			random
	"""
	top_n = request.args.get("top_n", 5)
	method = request.args.get("method", "random")

	textdata_communities = Communities()

	all_public = textdata_communities.find({"public": True})
	# all_public_list = [{"name": x.name, "id": str(x._id)} for x in all_public]
	all_public_list = [{"name": x.name, "id": str(x.id)} for x in all_public]
	if method == "random":
		random.shuffle(all_public_list)
		return response.success({"recommended_communities": all_public_list[0:top_n]}, Status.OK)
	else:
		return response.error("Not yet implemented.", Status.BAD_REQUEST)



@communities.route("/api/communities/history", methods=["GET"])
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
						"time": format_time_for_display(log.time, format="relative")
					}
		left_communities = list(left_communities.values())
		return response.success({"left_communities": left_communities}, Status.OK)
	except Exception as e:
		print(e)
		traceback.print_exc()
		return response.error("Failed to get community history, please try again later.", Status.INTERNAL_SERVER_ERROR)


@communities.route("/api/communities", methods=["GET"])
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



@communities.route("/api/communities", methods=["POST", "PATCH"])
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

		community_ispublic = community_info.get("community_is_public", None)
		community_pinned = community_info.get("community_pinned", None)
			
		
		print(community_ispublic, community_pinned)

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
			if community_ispublic != None:
				insert_obj["public"] = community_ispublic
			if community_pinned != None:
				insert_obj["pinned"] = community_pinned

			updated = cdl_communities.update_one({"_id": community_id}, {"$set": insert_obj}, upsert=False)
			if updated.acknowledged:
				return response.success({"message": "Community edited successfully!"}, Status.OK)

		return response.error("Something went wrong. Please try again later", Status.INTERNAL_SERVER_ERROR)
	except Exception as e:
		print(e)
		return response.error("Failed to create community, please try again later.", Status.INTERNAL_SERVER_ERROR)


@communities.route("/api/communities/<id>", methods=["GET"])
#@token_required
@token_required_public
def community(current_user, id):
	"""
	Getting data on a single community
	Mostly for community homepage
	"""
	user_id = current_user.id
	ip = request.remote_addr

	user_communities = current_user.communities
	user_followed_communities = current_user.followed_communities
	
	comm_db = Communities()
	found_comm = comm_db.find_one({"_id": ObjectId(id)})

	if not found_comm or not found_comm.public and ObjectId(id) not in user_communities:
		return response.error("Cannot find community.", Status.NOT_FOUND)

	return_obj = {
		"id": id,
		"name": found_comm.name,
		"description": found_comm.description,
		"public": found_comm.public,
		"following": False,
		"joined": False,
		"pinned_submissions": [],
		"num_followers": 0,
		"joined_users": []
	}

	# currently need to loop through all users to find the number of followers and contributors
	# fine for now, but will probably need to speed up if ever more users
	users_db = Users()
	num_followers = users_db.count({"followed_communities": ObjectId(id)})
	all_joined = users_db.find({"communities": ObjectId(id)})

	all_joined_users = []
	for user in all_joined:
		all_joined_users.append({"username": user.username, "id": str(user_id)})
	total_num_followers = num_followers + len(all_joined_users)
	return_obj["num_followers"] = total_num_followers
	return_obj["joined_users"] = all_joined_users
	

	if ObjectId(id) in user_communities:
		return_obj["joined"] = True
	if ObjectId(id) in user_followed_communities:
		return_obj["following"] = True

	pinned_sub_ids = [x.strip() for x in found_comm.pinned.split(",") if x.strip()]
	sub_db = Logs()
	for psid in pinned_sub_ids:
		try:
			found_sub = sub_db.find_one({"_id": ObjectId(psid)})
			if found_sub:
				all_sub_comms = [str(x) for uid in found_sub.communities for x in found_sub.communities[uid]]
				# check to make sure submission is actually in community before showing
				if id and all_sub_comms:
					return_obj["pinned_submissions"].append({
						"explanation": found_sub.explanation, #fixed from 'title' to 'explanation'
						"submission_url": format_url("", str(found_sub.id)) # was calling 'id' user id insteadof sub id + changed 'url' to 'submission_url'
					})
		except Exception as e:
			print(e)
			traceback.print_exc()
			continue
	
	return response.success(return_obj, Status.OK)




@communities.route("/api/communities/follow", methods=["POST"])
@token_required
def follow_community(current_user):
	"""
	Endpoint for following or unfollowing a community.
	Arguments
		current_user : (dictionary) : the user recovered from the JWT token
		A request data JSON with
			community_id : (str) : the ID of the community
			command : (str) : either "follow" or "unfollow"
	Returns:
		200 : dictionary JSON with "status" as "ok" and success message "message"
		500 : dictionary JSON with "status" as "error" and error message "message"
	"""
	try:
		user_id = current_user.id
		ip = request.remote_addr
		req_data = request.data
		req_data = json.loads(req_data.decode("utf-8"))
		community_id = req_data.get("community_id", None)
		command = req_data.get("command", None)

		if not community_id:
			return response.error("Missing community ID in request.", Status.BAD_REQUEST)
		if command not in ["follow", "unfollow"]:
			return response.error("Command must be follow or unfollow.", Status.BAD_REQUEST)

		comm_db = Communities()
		try:
			community_id_objid = ObjectId(community_id)
			found_com = comm_db.find_one({"_id": community_id_objid})
			if not found_com or found_com.public == False:
				return response.error("Cannot find community.", Status.BAD_REQUEST)
		except Exception as e:
			print(e)
			traceback.print_exc()
			return response.error("Invalid community ID.", Status.BAD_REQUEST)
		
		user_communities_followed = current_user.followed_communities


		if command == "follow":
			if community_id_objid in user_communities_followed:
				return response.error("You already follow this community.", Status.BAD_REQUEST)
			
			users_db = Users()
			updated = users_db.update_one({"_id": user_id}, {"$push": {"followed_communities": community_id_objid}}, upsert=False)
			if updated.acknowledged:
				if updated.acknowledged:
					log_community_action(ip, user_id, community_id_objid, "FOLLOW")
					return response.success({"message": "Community successfully followed!"}, Status.OK)
				
		elif command == "unfollow":
			if community_id_objid not in user_communities_followed:
				return response.error("You do not follow this community.", Status.BAD_REQUEST)
			
			users_db = Users()
			updated_unfollowed = [x for x in user_communities_followed if x != community_id_objid]
			# updated = users_db.update_one({"_id": user_id}, {"followed_communities": updated_unfollowed}, upsert=False)
			updated = users_db.update_one({"_id": user_id}, {"$set": {"followed_communities": updated_unfollowed}}, upsert=False)
			if updated.acknowledged:
				if updated.acknowledged:
					log_community_action(ip, user_id, community_id_objid, "UNFOLLOW")
					return response.success({"message": "Community successfully unfollowed!"}, Status.OK)

	except Exception as e:
		print(e)
		traceback.print_exc()
		return response.error("Failed to follow community, please try again later.", Status.INTERNAL_SERVER_ERROR)





@communities.route("/api/communities/join", methods=["POST"])
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


@communities.route("/api/communities/leave", methods=["POST"])
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
