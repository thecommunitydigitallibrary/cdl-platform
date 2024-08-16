import json
import os
import re
import time
import traceback
from functools import wraps
from urllib.parse import urlparse

import jwt
import bleach
from bson import ObjectId
from flask import request, current_app
import requests

from app.helpers import response
from app.helpers.status import Status
from app.models.users import Users
from app.models.communities import Communities
from app.models.not_logged_in_users import NotLoggedInUsers, NotLoggedInUser
from app.models.notifications import *



def get_communities_helper(current_user, return_dict=False):
	"""
	The helper function for getting a user's communities.
	Arguments:
		current_user : dictionary : the user recovered from the JWT token.
		return_dict : boolean : to return as a dictionary.
	Returns:
		A dictionary with
			community_info: for joined communities, a list of dicts, each containing 
				community_id
				name
				description
				pinned
				is_public
				join_key (if admin)
				is_admin. 

				If return_dict is true, then this is a dictionary mapped with the community_id.

			followed_community_info: for followed communities, a list of dicts, each containing
				community_id
				name
				description
			username: the username of the user.
	"""

	user_communities = current_user.communities
	user_followed_communities = current_user.followed_communities
	user_id = current_user.id

	cdl_communities = Communities()

	user_followed_communities_struct = []
	for community_id in user_followed_communities:
		community = cdl_communities.find_one({"_id": community_id})
		## TODO probably need to handle here the case where a public community becomes private
		## what to do with the followers?
		if not community:
			print(f"Could not find community for community id: {community_id} and user id: {user_id}")
			continue
		comm_item = {
			"community_id": str(community.id),
			"name": community.name,
			"description": community.description
		}
		user_followed_communities_struct.append(comm_item)
		

	community_struct = []
	for community_id in user_communities:
		if user_id == community_id:
			continue
		community = cdl_communities.find_one({"_id": community_id})
		if not community:
			print(f"Could not find community for community id: {community_id} and user id: {user_id}")
			continue
		else:
			is_admin = False

			# some communities do not have admin property?
			try:
				if user_id in community.admins:
					is_admin = True
			except:
				pass

		comm_item = {
			"community_id": str(community.id),
			"name": community.name,
			"description": community.description,
			"is_admin": is_admin
		}

		if is_admin:
			comm_item["join_key"] = community.join_key

		comm_item["is_public"] = community.public
		comm_item["pinned"] = community.pinned

		community_struct.append(comm_item)

	if return_dict:
		new_community_struct = {}
		for community in community_struct:
			new_community_struct[community["community_id"]] = community
		community_struct = new_community_struct

		new_followed_community_struct = {}
		for community in user_followed_communities_struct:
			new_followed_community_struct[community["community_id"]] = community
		user_followed_communities_struct = new_followed_community_struct


	return_obj = {
		"community_info": community_struct,
		"followed_community_info": user_followed_communities_struct
	}
	try:
		username = current_user.username
		user_id = current_user.id
		return_obj["username"] = username
		return_obj["user_id"] = str(user_id)
	except Exception as e:
		print("Accessed as public, no username found.")

	return return_obj


def format_time_for_display(timestamp, format="date"):

    if format == "relative":
        # hack to compute time ago up to years
        current_time = int(time.time())
        time_ago = current_time - int(timestamp)
        time_map = {"minutes": 60,
                    "hours": 60,
                    "days": 24,
                    "months": 30,
                    "years": 12}
        display_text = "seconds"
        for time_str in time_map:
            if time_ago / time_map[time_str] < 1:
                break
            else:
                time_ago = time_ago / time_map[time_str]
                display_text = time_str
        time_ago = str(int(time_ago))
        if time_ago == "1":
            display_text = display_text[:-1]
        
        return time_ago + " " + display_text + " ago"
    elif format == "date":
        return str(int(float(timestamp) * 1000))
	

def token_required_public(f):
    """
    If user is logged in, continue as normal
    Else use IP to 
        check non-user db to find id corresponding to ip
        create new non-user db entry with ip
    return the user, and if non-user, put a flag there
    """
    @wraps(f)
    def decorator(*args, **kwargs):
        token = None
        logged_in = False
        ip = request.remote_addr

        if 'Authorization' in request.headers:
            token = request.headers['Authorization']
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            cdl_users = Users()
            current_user = cdl_users.find_one({"_id": ObjectId(data["id"])})
            assert current_user != None
            logged_in=True
        except Exception as e:
            print("Error: Unable to find user, attempting non-user flow")

        if logged_in:
            return f(current_user, *args, **kwargs)
        else:
            non_users = NotLoggedInUsers()
            new_non_user = non_users.find_one({"ip": ip})
            if not new_non_user:
                 new_non_user = NotLoggedInUser(ip)
                 insert_id = non_users.insert(new_non_user)
                 new_non_user.id = insert_id
            return f(new_non_user, *args, **kwargs)
    return decorator


def token_required(f):
	"""
	This wrapper ensures that any incoming request is coming from a valid account. The cookie is sent via the "Authorization" header, and
	it is a JWT token that contains the ObjectID of the user.
	Arguments:
		f : (function) : whatever function is being wrapped.

	Returns:
		If the token is valid, then the passed function with the current user and any other params passed to the initial function.
		If the token is invalid, then a 403 error with an error message.
	"""
	@wraps(f)
	def decorator(*args, **kwargs):
		token = None
		if 'Authorization' in request.headers:
			token = request.headers['Authorization']
		if not token:
			return response.error("You must log in to perform this action", Status.BAD_REQUEST)
		try:
			data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
			users = Users()
			current_user = users.find_one({"_id": ObjectId(data["id"])})
			assert current_user != None
		except Exception as e:
			print("Error: ", e, token)
			return response.error("You must log in to perform this action", Status.NOT_FOUND)
		return f(current_user, *args, **kwargs)

	return decorator


def build_display_url(url):
	"""
	Helper function for building the display URL. Replaces "/" with " > ". Ignores last slash
	"""
	parsed_url = urlparse(url)
	path = parsed_url.path
	if path and path[-1] == "/":
		path = path[:-1]
	display_url = parsed_url.netloc + re.sub("/", " > ", path)
	return display_url


def format_url(url, submission_id):
    """
    Converts a submission URL into the proper format.
    Handles when empty --> becomes the TextData submission URL (need to handle local vs prod)
    Otherwise it is the submitted URL by the user.

    url: the raw URL of the submission
    submission_id: the str of the submission_id
    """
    if url == "":
        if "localhost" in os.environ["api_url"]:
            url = os.environ["api_url"] + ":" + os.environ["api_port"] + "/submissions/" + submission_id
        else:
            url = os.environ["api_url"] + "/submissions/" + submission_id
    return url
    
    

def hydrate_with_hashtags(title, description):
    """Extracts hashtags from a submission title and description

    Method Parameters
    ----------
    title : str, required
        The title of the submission.

    description : str, required
        The description of the submission.

    Returns
    ---------
    list of str
        A list of hashtags extracted
    """
    hashtags_title = extract_hashtags(title)
    hashtags_description = extract_hashtags(description)

    hashtags = hashtags_title + hashtags_description

    # remove mark in case hashtag is in body
    hashtags = [re.sub("<mark>", "", x) for x in hashtags]
    hashtags = [re.sub("</mark>", "", x) for x in hashtags]

    hashtags = list(set(hashtags))

    return hashtags


def extract_hashtags(text):
      # ignores multiple hashtags in a row (from markdown)
      hashtags = [x for x in text.split() if len(x) > 1 and x[0] == "#" and x[1] != "#"]
      return hashtags


def sanitize_input(input_data):
	"""
	Function to sanitize input data and remove any malicious code string to prevent from security threats
	like XSS attacks.
	
	return: Sanitized input data
	"""
	if input_data and type(input_data)==str:
		try:
			# Define a list of allowed HTML tags and attributes
			allowed_tags = ['mark']
			sanitized_data = bleach.clean(input_data, tags=allowed_tags)
			return sanitized_data

		except Exception as e :
			print(f"Error occured while sanitizing input data {input_data}: ", e)

	return input_data


def publish_to_queue(routing_key, message):
    try:
        url = "http://notification_service:80/notify/publish"


        payload = {
            "routing_key": routing_key,
            "message": message
        }
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'  
        }
        response = requests.post(url, data=json.dumps(payload), headers=headers)
       
        if response.status_code == 200:
            print(f"Message published successfully: {response.json()}")
        else:
            print(f"Failed to publish message: {response.json()}")
    except Exception as e:
        print(f"Error: {str(e)}")


     