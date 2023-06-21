import uuid

from bson import ObjectId

from app.models.community_logs import *
from app.models.connections import *
from app.models.logs import *
from app.models.searches_clicks import *
from app.models.recommendations_requests import *
from app.models.recommendations_clicks import *


def log_community_action(ip, user_id, community_id, action, submission_id=None):
	"""
	Logs when a user performs an action with a community.
	Arguments:
		ip : (string) : the IP address of the request sent by the user.
		user_id : (ObjectId) : the ID of the user making an action.
		community_id : (ObjectId) : the ID of the community.
		action : (string) : the action (one of CREATE, JOIN, LEAVE, ADD, DELETE)
		submission_id : (ObjectID) : the ID of the submission being moved (optional, for ADD, DELETE)
	"""

	cdl_community_logs = CommunityLogs()

	log = CommunityLog(ip, user_id, community_id, action, submission_id=submission_id)
	insert = cdl_community_logs.insert(log)
	if not insert.acknowledged:
		print("Error logging community action!", log)
	return insert


def log_extension_search(ip, user_id, source_url, highlighted_text, query, typ):
	"""
	Logs when a user performs a search with a query from the Chrome extension.
	Arguments:
		ip : (string) : the IP address of the request sent by the user.
		user_id : (ObjectID) : the ID of the user making the search.
		source_url : (string) : the full URL of the webpage where the extension is opened.
		highlighted_text : (string) : any highlighted text from the user's webpage (can be "").
		query : (string) the typed query submitted by the user into the extension.
		typ : (string) the search type. One of
			extension_open : no query entered, query is highlighted text, automatic search.
			google_search : "Search Google" button selected.
			dl_search : "Search CS410 DL" button selected.
	Returns:
		hash : either None or search ID for "extension_open" type. None because dl_search opens a new tab with the search,
		so the hash is created when the request to the website search engine happens. This causes "dl_search" to also log
		a "webpage_search".
	TODO: add community
	"""
	cdl_searches_clicks = SearchesClicks()

	hash = str(uuid.uuid4()) if typ == "extension_open" else None
	# changed class here to SearchClickExtension
	log = SearchClickExtension(ip, user_id, source_url, highlighted_text, query, typ, hash) 
	insert = cdl_searches_clicks.insert(log)
	if not insert.acknowledged:
		print("Error: unable to log extension search")
	return hash


def log_connection(ip, user_id, source_id, target_id, description):
	"""
	Logs when a user makes a connection between two submissions.
	Arguments:
		ip : (string) : the IP address of the request sent by the user.
		user_id : (ObjectID) : the ID of the user saving the context.
		source_id : (ObjectID) : the id of the source submission.
		target_id : (ObjectID) : the id of the target submission.
		description : string : text describing the connection.
	Returns:
		insert : Pymongo object with property .acknowledged (should be true on success).
	"""
	cdl_connections = Connections()
	connection = Connection(ip, user_id, source_id, target_id, description)
	return cdl_connections.insert(connection)


def log_submission(ip, user_id, highlighted_text, source_url, explanation, community):
	"""
	Logs when a user submits a webpage to a community.
	Arguments:
		ip : (string) : the IP address of the request sent by the user.
		user_id : (ObjectID) : the ID of the user saving the context.
		highlighted_text : (string) : any highlighted text from the user's webpage (can be "").
		source_url : (string) : the full URL of the webpage where the extension is opened.
		explanation : (string) : the reason provided by the user for why the webpage is helpful.
		community : (string) : the ObjectID of the community to add the result to.
	Returns:
		insert : Pymongo object with property .acknowledged (should be true on success).
		log : (dictionary) the final saved log
	"""

	# the user id: [communities] is to represent who added the submission to which community
	# this will allow a user to add/remove it at will from the places they've added/removed it from/to
	communities = {
		str(user_id): [ObjectId(community)]
	}
	log = Log(ip, user_id, highlighted_text, source_url, explanation, communities)
	cdl_logs = Logs()
	inserted_status = cdl_logs.insert(log)
	return inserted_status, log


def log_search(ip, user_id, source, query, communities, own_submissions, highlighted_text="", url=""):
	"""
	Logs when a user performs a search on the search engine website.
	Arguments:
		ip : (string) : the IP address of the request sent by the user.
		user_id : (ObjectID) : the ID of the user making the search.
		source : (string) : either "webpage_search", "extension_search", or "extension_open"
		query : (string) : the raw query entered by the user.
		communities : (list) : the community scope of the user search.
	Returns:
		search_id : (string) : the search ID of the query.
		insert.acknowledged : (boolean) : indicates if the log was successful.
	"""
	cdl_searches_clicks = SearchesClicks()

	log = {
		"ip": ip,
		"user_id": user_id,
		"type": source,
		"query": query,
		"community": communities,
		"own_submissions": own_submissions,
		"time": time.time()
	}

	if source == "extension_open" or source == "extension_search":
		log["highlighted_text"] = highlighted_text
		log["url"] = url

	insert = cdl_searches_clicks.insert_one_db(log)
	if not insert.acknowledged:
		print("Error: unable to log webpage search")
	return insert.inserted_id, insert.acknowledged


def log_submission_view(ip, user_id, submission_id):
	"""
	Logs when a user views the full submission.
	Arguments:
		ip : (string) : the IP address of the request sent by the user.
		user_id : (ObjectID) : the ID of the user viewing the submission.
		submission_id : (ObjectID) : the submission ID being viewed.
	Returns:
		insert : Pymongo object with property .acknowledged (should be true on success).
	"""
	log = {
		"ip": ip,
		"user_id": user_id,
		"submission_id": submission_id,
		"type": "submission_view",
		"time": time.time()
	}
	cdl_searches_clicks = SearchesClicks()
	insert = cdl_searches_clicks.insert_one_db(log)
	return insert


def log_click(ip, result_hash, redirect_url):
	"""
	Logs when a user clicks a search result. Also log URL too, just in case. Search result clicks are linked to searches via the hash (overloaded).
	Note that the user can be recovered by search ID (search log has user_id).
	Arguments:
		ip : (string) : the IP address of the request sent by the user.
		result_hash : (string) : a formatted string that contains:
			1. initial rank of the result.
			2 the submission ID (objectID) returned by log_submission.
			3. the search ID has returned by log_search.

			The format is "initialRank_resultID_searchID".
	Returns:
		Nothing
	"""
	try:
		rank, submission_id, search_id = result_hash.split("_")
		if submission_id != "none":
			submission_id = ObjectId(submission_id)
		search_id = ObjectId(search_id)
	except Exception as e:
		print("Error: unable to log click, invalid result_hash", result_hash, e)
		return

	# convert rank to int
	try:
		rank = int(rank)
	except Exception as e:
		print("Error: invalid rank", rank, e)

	# just in case, log url too
	log = {
		"ip": ip,
		"rank": rank,
		"search_id": search_id,
		"submission_id": submission_id,
		"redirect_url": redirect_url,
		"type": "click_search_result",
		"time": time.time()
	}
	cdl_searches_clicks = SearchesClicks()
	insert = cdl_searches_clicks.insert_one_db(log)
	if not insert.acknowledged:
		print("Error: unable to log click")
	else: print("logged search click successfully")
	return

def log_recommendation_request(ip, user_id, communities, method):
	"""
	Logs when a user requests for their recommendations.
	Arguments:
		ip : (string) : the IP address of the request sent by the user.
		user_id : (ObjectID) : the ID of the user making the request.
		communities : (list) : the community scope of the user search.
	Returns:
		recommendation_id : (string) : the search ID of the query.
		insert.acknowledged : (boolean) : indicates if the log was successful.
	"""

	cdl_recommendations_requests = RecommendationsRequests()
	log = {
		"ip": ip,
		"user_id": user_id,
		"community": communities,
		"time": time.time(),
		"method": method
	}

	insert = cdl_recommendations_requests.insert_one_db(log)
	if not insert.acknowledged:
		print("Error: unable to log recommendation request")

	return insert.inserted_id, insert.acknowledged

def log_recommendation_click(ip, rec_result_hash, redirect_url):
	"""
	Logs when a user clicks a recommendation result. 
	User can be recovered by recommendation ID (rec log has user_id).
	Arguments:
		ip : (string) : the IP address of the request sent by the user.
		result_hash : (string) : a formatted string that contains:
			1. initial rank of the result.
			2 the submission ID (objectID) returned by log_submission.
			3. the recommendation_id ID has returned by log_recommendation.

			The format is "initialRank_resultID_recommendationID".
	Returns:
		Nothing
	"""
	try:
		rank, submission_id, recommendation_id = rec_result_hash.split("_")
		if submission_id != "none":
			submission_id = ObjectId(submission_id)
		recommendation_id = ObjectId(recommendation_id)
	except Exception as e:
		print("Error: unable to log click, invalid rec_result_hash", rec_result_hash, e)
		return

	# convert rank to int
	try:
		rank = int(rank)
	except Exception as e:
		print("Error: invalid rank", rank, e)

	log = {
		"ip": ip,
		"rank": rank,
		"recommendation_id": recommendation_id,
		"submission_id": submission_id,
		"redirect_url": redirect_url,
		"type": "click_recommendation_result",
		"time": time.time()
	}

	cdl_recommendations_clicks = RecommendationsClicks()
	insert = cdl_recommendations_clicks.insert_one_db(log)
	if not insert.acknowledged:
		print("Error: unable to log rec click")
	return