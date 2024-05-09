import json
import os
import re
import time
import traceback
from functools import wraps
from urllib.parse import urlparse, urldefrag, quote
from collections import defaultdict

import jwt
import bleach
from bson import ObjectId
from flask import request, current_app

from app.helpers import response
from app.helpers.status import Status
from app.models.users import Users
from app.models.not_logged_in_users import NotLoggedInUsers, NotLoggedInUser


import validators


def validate_submission(highlighted_text, explanation, source_url=None):
    """
    Checks to make sure submitted text is not a URL!
    """
    if validators.url(highlighted_text) or validators.url(explanation):
        return False, "Error: The title or description should not be a URL"

    # check to make sure source url is not on wrong page
    # Empty string when text-only submission
    if source_url != None and source_url != "":
        if not validators.url(source_url):
            return False, "Error: The URL is invalid: " + source_url
        forbidden_URLs = ["chrome://"]
        for url in forbidden_URLs:
            if url in source_url:
                return False, "Error: You cannot submit content on URL " + source_url

    char_max_desc = 50000

    char_max_title = 1000

    # cap highlighted text, explanation length
    if highlighted_text and (len(highlighted_text) > char_max_desc):
        return False, "The description is too long. Please limit to 50,000 characters"
    if explanation and (len(explanation) > char_max_title):
        return False, "The title is too long. Please limit to 1,000 characters"
    
    if explanation == "":
        return False, "The title cannot be empty"


    return True, "Validation successful"


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
			cdl_users = Users()
			current_user = cdl_users.find_one({"_id": ObjectId(data["id"])})
			assert current_user != None
		except Exception as e:
			print("Error: ", e)
			return response.error("You must log in to perform this action", Status.NOT_FOUND)
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
	if "pdf" in url or "smartdiff" in url and fragment != "":  # for proxies
		redirect_url += "&redirect_url=" + url + "#" + fragment
	elif "youtube" in url:
		redirect_url += "&redirect_url=" + quote(url)
	else:
		redirect_url += "&redirect_url=" + url

	return redirect_url


def create_page(hits, communities, toggle_display="highlight"):
    """
	Helper function for formatting raw elastic results.
	Arguments:
		hits : (dict): json raw output from elastic
		communities : (dict) : the user's communities
        toggle_display : (str) : highlight to show matched highlighted text, preview to show best preview
	Returns:
		return_obj : (list) : a list of formatted submissions for frontend display
							Note that result_hash and redirect_url will be empty (need to hydrate)
	"""

    return_obj = []


    cdl_users = Users()

    for i, hit in enumerate(hits):
        result = {
            "redirect_url": None,
            "display_url": None,
            "orig_url": None,
            "submission_id": None,
            "result_hash": None,
            "highlighted_text": None,
            "explanation": None,
            "score": hit.get("_score", 0),
            "time": "",
            "type": "submission",
            "communities_part_of": [],
            "username": ""
        }

        if not result["score"]: 
            result["score"] = 0

        if "webpage" in hit["_source"]:
            result["explanation"] = hit["_source"]["webpage"]["metadata"].get("title") or hit["_source"]["webpage"]["metadata"].get("h1") or "No title available"
            result["type"] = "webpage"
            possible_matches = []
            if "highlight" in hit and toggle_display == "highlight":
                possible_matches = hit["highlight"].get("webpage.metadata.description", [])
                if not possible_matches:
                     possible_matches = hit["highlight"].get("webpage.metadata.h1", [])
                if not possible_matches:
                    # in case there are a lot of paragraphs
                    possible_matches = hit["highlight"].get("webpage.all_paragraphs", [])[:10]

                description = " .... ".join(possible_matches)
            else:
                description = None

            if not description:
                description = hit["_source"]["webpage"]["metadata"].get("description", None)
            if not description:
                description = hit["_source"]["webpage"]["metadata"].get("h1", None)
            if not description:
                description = "No Preview Available"
            result["highlighted_text"] = description

        else:
            result["explanation"] = hit["_source"].get("explanation", "No Explanation Available")


            # Old submissions may not have the anonymous field, default to true
            is_anonymous  = hit["_source"].get("anonymous", True)
            if not is_anonymous:
                creator = cdl_users.find_one({"_id": ObjectId(hit["_source"]["user_id"])})
                if creator:
                     result["username"] = creator.username


            description = " .... ".join(hit["highlight"].get("highlighted_text", [])) if hit.get("highlight", None) and toggle_display == "highlight" else hit["_source"].get("highlighted_text", None)
            if not description:
                description ="No Preview Available"

            
            
            result["highlighted_text"] = description

        # So that we can (1) mitigate XSS and (2) keep the highlighted match text
        # AND (3) properly render markdown pages on submission view (quote, code, etc.)
        result["highlighted_text"] = re.sub("<mark>", "@startmark@", result["highlighted_text"])
        result["highlighted_text"] = re.sub("<\/mark>", "@endmark@", result["highlighted_text"])
        result["highlighted_text"] = sanitize_input(result["highlighted_text"])
        result["highlighted_text"] = re.sub("@startmark@", "<mark>", result["highlighted_text"])
        result["highlighted_text"] = re.sub("@endmark@", "</mark>", result["highlighted_text"])



        # possible that returns additional communities?
        result["communities_part_of"] = {community_id: communities[community_id] for community_id in
                                         hit["_source"].get("communities", []) if community_id in communities}

        result["submission_id"] = str(hit["_id"])

        if "time" in hit["_source"]:
            formatted_time = format_time_for_display(hit["_source"]["time"])
            result["time"] = formatted_time
        elif "scrape_time" in hit["_source"]:
            formatted_time = format_time_for_display(hit["_source"]["scrape_time"])
            result["time"] = formatted_time


        # Display URL
        url = hit["_source"].get("source_url", "")

        url = format_url(url, str(result["submission_id"]))
        display_url = build_display_url(url)
        result["display_url"] = display_url
        result["orig_url"] = url             

        return_obj.append(result)

    return return_obj

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
    
     

def hydrate_with_hash_url(results, search_id, page=0, page_size=10, method="search"):
    """
	Helper function hydrating with result hash and url.
	This is separate from create_page because neural reranking happens in between.
	Arguments:
		results : (list): output of create_pages
		search_id : (string) : the id of the search
		page : (int, default=0) : current page
		page_size : (int, default=10) : the size of each page
	Returns:
		pages : (list) : a reranked pages	
	"""
    for i, result in enumerate(results):
        # result hash
        result_hash = build_result_hash(str((page * page_size) + i), str(result["submission_id"]), str(search_id))

        result["result_hash"] = result_hash

        # build the redirect URL for clicks
        redirect_url = build_redirect_url(result["orig_url"], result_hash, result["highlighted_text"], method)
        result["redirect_url"] = redirect_url
    return results


def hydrate_with_hashtags(results):
    for result in results:
        # add the hashtags
        result["hashtags"] = []
        hashtags_explanation = extract_hashtags(result["explanation"])
        hashtags_ht = extract_hashtags(result["highlighted_text"])

        hashtags = hashtags_explanation + hashtags_ht

        # remove mark in case hashtag is in body
        hashtags = [re.sub("<mark>", "", x) for x in hashtags]
        hashtags = [re.sub("</mark>", "", x) for x in hashtags]

        hashtags = list(set(hashtags))

        result["hashtags"] = hashtags

    return results

def diversify(pages, topn=10):
    """
    Slightly reorders pages to make top n domain-diverse.
    """
    pass

def standardize_url(url):
    # remove fragment from query
    if "#" in url:
        url = url.split("#")[0]
    return url

def extract_hashtags(text):
      # ignores multiple hashtags in a row (from markdown)
      hashtags = [x for x in text.split() if len(x) > 1 and x[0] == "#" and x[1] != "#"]
      return hashtags


def deduplicate(pages):
    """
    Helper function to remove all duplicate pages. Saves them as "children" in top-rated page.
    """
    map_pages = defaultdict(list)

    for page in pages:
        url = page["orig_url"].split("#")[0]
        map_pages[url].append(page)

    for key in map_pages.keys():
        map_pages[key][0]["children"] = map_pages[key][1:11] if len(map_pages[key]) > 10 else map_pages[key][1:]

    return [p[0] for p in map_pages.values()]

def combine_pages(submissions_pages, webpages_index_pages):

    # Building an inverted index to map orig_url to index using the submissions_pages list
    subpgs_url_to_id = {}
    for i, submission_page in enumerate(submissions_pages):
        subpgs_url_to_id[submission_page["orig_url"]] = i

    remaining_webpages = []

    # Using the orig_url_to_idx_map to see if there is an in entry in webpages_index_pages to update score
    for webpage in webpages_index_pages:
        if webpage["orig_url"] in subpgs_url_to_id:
            i = subpgs_url_to_id.get(webpage["orig_url"])
            submissions_pages[i]["score"] = submissions_pages[i]["score"] + webpage["score"]
        else:
            remaining_webpages.append(webpage)
   
    return submissions_pages + remaining_webpages

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