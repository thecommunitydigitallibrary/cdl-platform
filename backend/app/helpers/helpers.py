import json
import os
import re
import time
from functools import wraps
from urllib.parse import urlparse, urldefrag, quote

import jwt
from bson import ObjectId
from flask import request, current_app

from app.helpers import response
from app.helpers.status import Status
from app.models.users import Users


def format_time_for_display(timestamp):
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
	


def extract_payload(request, fields):
	try:
		payload = {field: request.form.get(field) for field in fields}
		if None in [value for value in payload.values()] and request.data:
			payload = {}
			request_data = json.loads(request.data.decode("utf-8"))
			for field in fields:
				payload[field] = request_data[field]
		return payload if None not in [value for value in payload.values()] else None
	except:
		return None


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
			return response.error("Valid token is missing", Status.BAD_REQUEST)
		try:
			data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
			cdl_users = Users()
			current_user = cdl_users.find_one({"_id": ObjectId(data["id"])})
			assert current_user != None
		except Exception as e:
			print("Error: ", e)
			return response.error("Token is invalid", Status.NOT_FOUND)

		return f(current_user, *args, **kwargs)

	return decorator


def build_result_hash(rank, submission_id, search_id):
	"""
	Helper function for building the result hash of format rank_submissionID_searchID
	"""
	result_hash = str(rank) + "_" + submission_id + "_" + search_id
	return result_hash


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


def build_redirect_url(url, result_hash, highlighted_text, method="search"):
	"""
	Helper function for building the redirect URL (so clicks are logged on our backend)
	Arguments:
		url : string : the URL that the submission points to
		result_hash : string : the rank_submissionID_searchID from above function
		highlighted_text : string : the highlighted text of the submission
	"""
	# if method is anything other than 'search', assume redirection call is made from rec and not search (since method = recent/trending/unseen etc)
	if(method!="search"): method="recommendation"

	redirect_url = os.environ["api_url"] + ":" + os.environ["api_port"] + "/api/redirect?"
	redirect_url += "method="+ str(method)
	redirect_url += "&hash=" + result_hash
	url, fragment = urldefrag(url)
	# handling edge cases
	if "pdf" in url and fragment != "":  # for proxies
		redirect_url += "&redirect_url=" + url + "#" + fragment
	elif "youtube" in url:
		redirect_url += "&redirect_url=" + quote(url)
	else:
		if highlighted_text == "" or highlighted_text == "No Preview Available":
			redirect_url += "&redirect_url=" + url
		else:
			redirect_url += "&redirect_url=" + url + "#:~:text=" + highlighted_text[:-3]
	return redirect_url
