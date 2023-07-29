import json
import os
import re
from collections import defaultdict

from bson import ObjectId
from flask import Blueprint, request, redirect
from flask_cors import CORS
import validators
from textblob import TextBlob
import traceback
from sentence_transformers import CrossEncoder

from app.db import get_redis
from app.helpers.helpers import token_required, build_display_url, build_result_hash, build_redirect_url, \
    format_time_for_display
from app.helpers import response
from app.helpers.status import Status
from app.helpers.scraper import ScrapeWorker
from app.models.cache import Cache
from app.models.communities import Communities
from app.models.connections import Connections
from app.models.webpages import Webpages
from app.models.logs import Logs
from app.models.searches_clicks import SearchesClicks
from app.models.recommendations_clicks import RecommendationsClicks
from app.models.user_feedback import UserFeedbacks, UserFeedback
from app.views.communities import get_communities_helper
from app.views.logs import log_connection, log_submission, log_click, log_community_action, log_submission_view, \
    log_search, log_recommendation_request, log_recommendation_click, log_webpage
from elastic.manage_data import ElasticManager

functional = Blueprint('functional', __name__)
CORS(functional)

# Connect to elastic for submissions index operations
elastic_manager = ElasticManager(
    os.environ["elastic_username"],
    os.environ["elastic_password"],
    os.environ["elastic_domain"],
    os.environ["elastic_index_name"],
    None,
    "submissions")

# Connect to elastic for webpages index operations
webpages_elastic_manager = ElasticManager(
    os.environ["elastic_username"],
    os.environ["elastic_password"],
    os.environ["elastic_domain"],
    os.environ["elastic_webpages_index_name"],
    None,
    "webpages")

# Set up neural reranking model
try:
    rerank_model = CrossEncoder('cross-encoder/ms-marco-TinyBERT-L-2', max_length=512)
except:
    rerank_model = False


@functional.route("/api/connect/", methods=["POST"])
@token_required
def create_connection(current_user):
    """
	Endpoint for a user to create a directional connection between two submissions.
	Arguments:
		current_user: dictionary : the user recovered from the JWT token.
		request form with:
			connection_source : string : the id of the source of the connection.
			connection_target : string : the id of the target of the connection.
			connection_description : string : optional text describing the connection, submitted by the user.
	Returns:
		200 : a dictionary with "status" = "ok and a note in the "message" field.
		500 : a dictionary with "status" = "error" and an error in the "message" field.
	"""
    try:
        ip = request.remote_addr
        user_id = current_user.id
        # Changed request.form.get to request.get_json
        connection_source = request.get_json()['connection_source']
        # Changed request.form.get to request.get_json
        connection_target = request.get_json()['connection_target']
        connection_description = request.form.get("connection_description", "")
        try:
            connection_source_id = ObjectId(connection_source)
            connection_target_id = ObjectId(connection_target)
        except:
            print("Cannot convert to ObjectID", connection_source, connection_target)
            return response.error("Error: Invalid source or target id.", Status.BAD_REQUEST)
        ack = log_connection(ip, user_id, connection_source_id, connection_target_id, connection_description)
        if ack.acknowledged:
            return response.success({
                "message": "Connection successfully created",
                "connection_id": str(ack.inserted_id)
            }, Status.OK)
        else:
            return response.error("Cannot make connection, please try again later.", Status.INTERNAL_SERVER_ERROR)
    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Failed to create connection, please try again later.", Status.INTERNAL_SERVER_ERROR)


def validate_submission(highlighted_text, explanation, source_url=None):
    # checks to make sure submitted text is not a URL!
    if validators.url(highlighted_text) or validators.url(explanation):
        return False, "Error: The highlighted text or explanation should not be a URL"

    # check to make sure source url is not on wrong page
    if source_url != None:
        if not validators.url(source_url):
            return False, "Error: The URL is invalid: " + source_url
        forbidden_URLs = ["chrome://"]
        for url in forbidden_URLs:
            if url in source_url:
                return False, "Error: You cannot submit content on URL " + source_url

    char_max_desc = 10000
    word_max_desc = 1000

    char_max_title = 1000
    word_max_title = 100

    # cap highlighted text, explanation length
    if highlighted_text and (len(highlighted_text) > char_max_desc or len(highlighted_text.split()) > word_max_desc):
        return False, "Highlighted text is too long. Please limit to 1000 words or 10,000 characters"
    if explanation and (len(explanation) > char_max_title or len(explanation.split()) > word_max_title):
        return False, "Title is too long. Please limit to 100 words or 1000 characters"

    return True, "Validation successful"


@functional.route("/api/submission/", methods=["POST"])
@token_required
def create_submission(current_user):
    """
	Endpoint for a user to submit a webpage. 
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		request form with
			highlighted_text/description : (string) : any highlighted text from the user's webpage (can be "").
			source_url : (string) : the full URL of the webpage where the extension is opened.
			explanation/title : (string) : the reason provided by the user for why the webpage is helpful.
			community : (string) : the ID of the community to add the result to

	Returns:
		200 : a dictionary with "status" = "ok and a note in the "message" field.
		500 : a dictionary with "status" = "error" and an error in the "message" field.
	"""
    try:
        ip = request.remote_addr
        user_id = current_user.id
        highlighted_text = request.form.get("highlighted_text")
        source_url = request.form.get("source_url")
        explanation = request.form.get("explanation")
        community = request.form.get("community", "")

        # hard-coded to prevent submissions to the web community
        if community == "63a4c21aee3be6ac5c533a55" and str(user_id) != "63a4c201ee3be6ac5c533a54":
            return response.error("You cannot submit to this community.", Status.FORBIDDEN)

        if community == "":
            return response.error("Error: A community must be selected.", Status.BAD_REQUEST)
        if not Communities().find_one({"_id": ObjectId(community)}):
            return response.error("Error: Cannot find community.", Status.BAD_REQUEST)
        if ObjectId(community) not in current_user.communities:
            return response.error("Error: You do not have access to this community.", Status.FORBIDDEN)

        # for some reason, in the case that there is no explanation or URL
        if not explanation or not source_url:
            return response.error("Missing explanation or source url.", Status.BAD_REQUEST)

        validated, message = validate_submission(highlighted_text, explanation, source_url=source_url)
        if not validated:
            return response.error(message, Status.BAD_REQUEST)

        # for logging a top-level submission
        status, doc = log_submission(ip, user_id, highlighted_text, source_url, explanation, community)

        if status.acknowledged:
            doc.id = status.inserted_id
            index_status = elastic_manager.add_to_index(doc)
            
            print("SUBMISSION_INDEX_STATUS", index_status)

            scraper = ScrapeWorker()
            if not scraper.is_scraped_before(source_url):
                data = scraper.scrape(source_url)  # Triggering Scraper

                # Check if the scrape was not successful
                if data["scrape_status"]["code"] != 1:
                    data["webpage"] = {}

                # insert in MongoDB
                insert_status, webpage = log_webpage(data["url"],
                                                     data["webpage"],
                                                     data["scrape_status"],
                                                     data["scrape_time"]
                                                     )
                if insert_status.acknowledged and data["scrape_status"]["code"] == 1:
                    # index in OpenSearch
                    index_status = webpages_elastic_manager.add_to_index(webpage)
                    print("WEBPAGE_INDEX_STATUS", index_status)

                else:
                    print("Unable to insert webpage data in database.")

            return response.success({
                "message": "Context successfully submitted and indexed.",
                "submission_id": str(status.inserted_id)
            }, Status.OK)
        else:
            return response.error("Unable to make submission. Please try again later.", Status.INTERNAL_SERVER_ERROR)
    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Failed to create submission, please try again later.", Status.INTERNAL_SERVER_ERROR)


@functional.route("/api/submission/batch/", methods=["POST"])
@token_required
def create_batch_submission(current_user):
    """
	Endpoint for a user to submit a batch of webpages.
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		request form with
			community : (string) : the ID of the community to add the submissions to
			data : (list) : list of JSON objects:
				highlighted_text/description : (string) : any highlighted text from the user's webpage (can be "").
				source_url : (string) : the full URL of the webpage where the extension is opened.
				explanation/title : (string) : the reason provided by the user for why the webpage is helpful.

	Returns:
		In all cases, a status code and a list containing the status/error message (if any) for each attempted submission.
		This is so that errors can be assessed individually and so you can re-send the submissions that failed.
	"""
    requests = request.get_json()
    data = requests['data']
    community = requests['community']
    results = {}
    errors = []
    for i, submission in enumerate(data):
        try:
            ip = request.remote_addr
            user_id = current_user.id
            highlighted_text = submission["highlighted_text"]
            source_url = submission["source_url"]
            explanation = submission["explanation"]
            # hard-coded to prevent submissions to the web community
            if community == "63a4c21aee3be6ac5c533a55" and str(user_id) != "63a4c201ee3be6ac5c533a54":
                error_message = "You cannot submit to this community."
                error_status = Status.BAD_REQUEST
                results[f'Submission {i}'] = {'message': error_message, 'status': error_status }
                errors.append(i)
                continue
            if community == "":
                error_message = "Error: A community must be selected."
                error_status = Status.BAD_REQUEST
                results[f'Submission {i}'] = {'message': error_message, 'status': error_status }
                errors.append(i)
                continue
            if not Communities().find_one({"_id": ObjectId(community)}):
                error_message = "Error: Cannot find community."
                error_status = Status.BAD_REQUEST
                results[f'Submission {i}'] = {'message': error_message, 'status': error_status }
                continue
            if ObjectId(community) not in current_user.communities:
                error_message = "Error: You do not have access to this community."
                error_status = Status.FORBIDDEN
                results[f'Submission {i}'] = {'message': error_message, 'status': error_status }
                errors.append(i)
                continue
            # for some reason, in the case that there is no explanation or URL
            if not explanation or not source_url:
                error_message = "Missing explanation or source url."
                error_status = Status.BAD_REQUEST
                results[f'Submission {i}'] = {'message': error_message, 'status': error_status }
                errors.append(i)
                continue

            validated, message = validate_submission(highlighted_text, explanation, source_url=source_url)
            if not validated:
                error_status = Status.BAD_REQUEST
                results[f'Submission {i}'] = {'message': message, 'status': error_status}
                errors.append(i)
                continue

            # for logging a top-level submission
            status, doc = log_submission(ip, user_id, highlighted_text, source_url, explanation, community)

            if status.acknowledged:
                doc.id = status.inserted_id
                index_status = elastic_manager.add_to_index(doc)

                scraper = ScrapeWorker()
                if not scraper.is_scraped_before(source_url):
                    data = scraper.scrape(source_url)  # Triggering Scraper

                    # Check if the scrape was success or not
                    if data["scrape_status"]["code"] != 1:
                        data["webpage"] = {}
                        data["scrape_time"] = None

                    # insert in MongoDB
                    insert_status, webpage = log_webpage(data["url"],
                                                         data["webpage"],
                                                         data["scrape_status"],
                                                         data["scrape_time"]
                                                         )
                    if insert_status.acknowledged and data["scrape_status"]["code"] == 1:
                        # index in Openaseacrch
                        webpages_elastic_manager.add_to_index(webpage)
                    else:
                        print("Unable to insert webpage data in database.")

                results[f'Submission {i}'] = {
                    "message": "Context successfully submitted and indexed.",
                    "submission_id": str(status.inserted_id),
                    "status": Status.OK
                }

            else:
                error_message = "Unable to make submission. Please try again later."
                error_status = Status.INTERNAL_SERVER_ERROR
                results[f'Submission {i}'] = {'message': error_message, 'status': error_status }
                errors.append(i)
        except Exception as e:
            print(e)
            error_message = "Failed to create submission, please try again later."
            error_status = Status.INTERNAL_SERVER_ERROR
            results[f'Submission {i}'] = {'message': error_message, 'status': error_status }
            errors.append(i)
    if len(errors) == 0:
        return response.success(results, Status.OK)
    else:
        return response.error(results, Status.INTERNAL_SERVER_ERROR)

@functional.route("/api/redirect", methods=["GET"])
def click():
    """
	Endpoint for redirecting clicked search results (in both extension and website).
	Arguments:
		request args with:
			hash : (string) : the hash of the search result: "rank_submissionID_searchID"
			redirect_url : (string) : to redirect URL. 
			method: "search" or "recommendation"

	Returns:
		A Flask redirect object pointed to the redirect URL.
	"""
    try:
        ip = request.remote_addr
        result_hash = request.args.get("hash")
        redirect_url = request.args.get("redirect_url")
        method = request.args.get("method", "")
        # depending on where the redirect happens, log respective click
        # identifying that it is a rec click by checking if it has method as a param

        if (method != "search"):
            log_recommendation_click(ip, result_hash, redirect_url)
        else:
            # also handles submission page clicks (rank -1)
            log_click(ip, result_hash, redirect_url)

        return redirect(redirect_url)
    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Failed to redirect link, please try again later.", Status.INTERNAL_SERVER_ERROR)


@functional.route("/api/feedback/", methods=["POST"])
@token_required
def feedback(current_user):
    """
	Endpoint for recording user-provided feedback
	Arguments
		submission_id : str : the id of a submission, if applicable
		message : str : the feedback entered by the user
	"""
    try:
        ip = request.remote_addr

        user_feedback = UserFeedback(ip, current_user.id, request.get_json()["message"])
        try:
            # Changed request.form.get to request.get_json
            submission_id = request.get_json()["submission_id"]
            if submission_id != "":
                submission_id = ObjectId(submission_id)
                user_feedback.submission_id = submission_id
        except:
            return response.error("Error: unable to save feedback, invalid submission id", Status.INTERNAL_SERVER_ERROR)
        cdl_user_feedback = UserFeedbacks()
        insert = cdl_user_feedback.insert(user_feedback)
        if insert.acknowledged:
            return response.success({"message": "Feedback saved!"}, Status.OK)
        else:
            return response.error("Error: unable to save feedback, please try again later",
                                  Status.INTERNAL_SERVER_ERROR)
    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Failed to record feedback, please try again later.", Status.INTERNAL_SERVER_ERROR)


@functional.route("/api/submission/<id>", methods=["DELETE", "GET", "PATCH"])
@token_required
def submission(current_user, id):
    """
	Endpoint for viewing, deleting, or updating a submitted webpage.
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		id : (string) : the ID of the submission.

		For DELETE:
			An optional request form with
				community_id : (str) : the id of a community to delete a submission from.
			If community_id is provided, then the submission will be removed from that community. This can only be done by the 
			user who added the submission to that community.
			If community_id is not provided, then the submission will be completely deleted. This can only be done by the user
			who made the original submission.

			Response:
				200 : A JSON dictionary with "status" as "ok" and a "message" indicating success.
				500: A JSON dictionary with "status" as "error" and an error in the "message". 
		For GET:
			No arguments beyond the ID provided in the URL.
			Response:
				On error, a JSON dictionary with "status" as "error" and a message.
				On success, a JSON dictionary with "status" as "ok" and a "submission" field with a trimmed submission JSON
					that also includes a list of added connections.

		For PATCH:
			A required request form with (all optional)
				community_id : (str) : the id of a community to add a submission to.
				highlighted_text : (str) : the new highlighted text
				explanation : (str) : the new description
				url : (str) : the new url
			Response:
				On error, a JSON dictionary with "status" as "error" and a message.
				On success, a JSON dictionary with "status" as "ok" and a message.
	"""
    try:
        user_id = current_user.id
        ip = request.remote_addr
        cdl_logs = Logs()
        cdl_webpages = Webpages()


        if request.method == "DELETE":
            if request.data:
                request_data = json.loads(request.data.decode("utf-8"))
                community_id = request_data.get("community_id", None)
            else:
                community_id = None
            # deleting the entire submission
            if not community_id:
                # the user_id should guarantee that a submission can only be deleted by the user who submitted it.
                update = cdl_logs.update_one({"user_id": ObjectId(user_id), "_id": ObjectId(id)},
                                             {"$set": {"deleted": True}}, upsert=False)
                if update.acknowledged:
                    index_update = elastic_manager.delete_document(id)
                    return response.success({"message": "Deletion successful."}, Status.OK)
                else:
                    return response.error("Deletion not successful. Please try again later.",
                                          Status.INTERNAL_SERVER_ERROR)
            else:
                community_id = ObjectId(community_id)
                # removing from a community (NOT THREAD SAFE)
                current_submission = cdl_logs.find_one({"_id": ObjectId(id)})
                submission_communities = current_submission.communities
                user_id = str(user_id)
                if user_id in submission_communities:
                    submission_communities[user_id] = [x for x in submission_communities[user_id] if x != community_id]
                if submission_communities[user_id] == []:
                    del submission_communities[user_id]
                update = cdl_logs.update_one({"_id": ObjectId(id)}, {"$set": {"communities": submission_communities}})
                if update.acknowledged:
                    current_submission.communities = submission_communities
                    deleted_index_status = elastic_manager.delete_document(id)
                    added_index_status = elastic_manager.add_to_index(current_submission)
                    log_community_action(ip, user_id, community_id, "DELETE", submission_id=current_submission.id)
                    return response.success({"message": "Removed from community."}, Status.OK)
                else:
                    return response.error("Unable to remove from community.", Status.NOT_FOUND)

        elif request.method == "PATCH":

            request_json = request.get_json()

            community_id = request_json.get("community_id", None)
            highlighted_text = request_json.get("highlighted_text", None)
            explanation = request_json.get("explanation", None)
            source_url = request_json.get("url", None)

            user_id = str(user_id)

            insert_obj = {}

            if not community_id and not highlighted_text and not explanation:
                return response.error("Missing either community_id, highlighted_text, or explanation",
                                      Status.BAD_REQUEST)

            # updating a submission's communities
            if community_id:
                # return response.error("Must include a community_id.", Status.NOT_FOUND)

                community_id = ObjectId(community_id)
                # adding to a community (NOT THREAD SAFE)
                current_submission = cdl_logs.find_one({"_id": ObjectId(id)})
                submission_communities = current_submission.communities

                # need to check that user is a member of the community
                user_communities = current_user.communities
                if community_id not in user_communities:
                    return response.error("Must include a community_id.", Status.FORBIDDEN)

                # block web community
                if community_id == "63a4c21aee3be6ac5c533a55" and user_id != "63a4c201ee3be6ac5c533a54":
                    return response.error("Must include a community_id.", Status.FORBIDDEN)

                if user_id not in submission_communities:
                    submission_communities[user_id] = []
                if community_id not in submission_communities[user_id]:
                    submission_communities[user_id].append(community_id)

                insert_obj["communities"] = submission_communities

            if highlighted_text != None or explanation != None or source_url != None:

                # check to make sure user is owner
                submission = cdl_logs.find_one({"_id": ObjectId(id)})
                if str(submission.user_id) != user_id:
                    return response.error("You do not have permission to edit this submission.", Status.FORBIDDEN)

                # check highlighted text, explanation, and url to make sure proper formatting
                validated, message = validate_submission(highlighted_text, explanation, source_url=source_url)
                if not validated:
                    return response.error(message, Status.BAD_REQUEST)

                if highlighted_text != None:
                    insert_obj["highlighted_text"] = highlighted_text
                    current_submission.highlighted_text = highlighted_text
                if explanation != None:
                    insert_obj["explanation"] = explanation
                    current_submission.explanation = explanation
                if source_url != None:
                    insert_obj["source_url"] = source_url
                    current_submission.source_url = source_url

            update = cdl_logs.update_one({"_id": ObjectId(id)}, {"$set": insert_obj})
            if update.acknowledged:
                current_submission.communities = submission_communities
                deleted_index_status = elastic_manager.delete_document(id)
                added_index_status = elastic_manager.add_to_index(current_submission)
                if "communities" in insert_obj:
                    log_community_action(ip, user_id, community_id, "ADD", submission_id=current_submission.id)
                return response.success({"message": "Submission successfully edited."}, Status.OK)
            else:
                return response.error("Unable to edit submission.", Status.INTERNAL_SERVER_ERROR)

        elif request.method == "GET":
            communities = current_user.communities
            try:
                submission = cdl_logs.find_one({"_id": ObjectId(id)})
            except Exception as e:
                print(e)
                traceback.print_exc()
                return response.error("Invalid submission ID", Status.NOT_FOUND)

            try:
                is_deleted = submission.deleted
            except:
                is_deleted = False

            if submission and not is_deleted:
                community_submissions = {str(cid) for uid in submission.communities for cid in
                                         submission.communities[uid]}
                for community in communities:
                    if str(community) in community_submissions:
                        search_id = log_submission_view(ip, user_id, submission.id).inserted_id
                        submission = format_submission_for_display(submission, current_user, search_id)
                        submission["connections"] = find_connections(ObjectId(id), communities, current_user, search_id)
                        return response.success({"submission": submission}, Status.OK)

                # Case where user is the original submitter but it has been removed from all communities.
                if str(submission.user_id) == str(user_id):
                    search_id = log_submission_view(ip, user_id, submission.id).inserted_id
                    submission = format_submission_for_display(submission, current_user, search_id)
                    submission["connections"] = find_connections(ObjectId(id), communities, current_user, search_id)
                    return response.success({"submission": submission}, Status.OK)

                return response.error("You do not have access to this submission.", Status.FORBIDDEN)
            elif not submission:
                try:
                    webpage = cdl_webpages.find_one({"_id": ObjectId(id)})
                    if webpage:
                        search_id = log_submission_view(ip, user_id, webpage.id).inserted_id
                        submission = format_webpage_for_display(webpage, search_id)
                        return response.success({"submission": submission}, Status.OK)
                except Exception as e:
                    print(e)
                    traceback.print_exc()
                    pass

                return response.error("Cannot find submission.", Status.NOT_FOUND)
    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Failed to create submission, please try again later.", Status.INTERNAL_SERVER_ERROR)
    
def format_webpage_for_display(webpage, search_id):
    webpage = webpage.to_dict()
    submission = {}

    submission["submission_id"] = webpage["_id"]


    submission["stats"] = {
        "views": 0,
        "clicks": 0,
        "shares": 0
    }
    cdl_searches_clicks = SearchesClicks()
    num__search_clicks = cdl_searches_clicks.count({"submission_id": submission["submission_id"], "type": "click_search_result"})
    submission["stats"]["clicks"] = num__search_clicks

    cdl_recommendations_clicks = RecommendationsClicks()
    num_rec_clicks = cdl_recommendations_clicks.count({"submission_id": submission["submission_id"]})
    submission["stats"]["clicks"] += num_rec_clicks

    num_views = cdl_searches_clicks.count({"submission_id": submission["submission_id"], "type": "submission_view"})
    submission["stats"]["views"] = num_views

    submission["communities"] = {}
    submission["communities_part_of"] = {}
    submission["can_delete"] = False
    submission["hashtags"] = []
    submission["user_id"] = None
    submission["highlighted_text"] = webpage["webpage"]["metadata"].get("description", "No Preview Available")
    submission["explanation"] = webpage["webpage"]["metadata"].get("title")
        
    display_time = format_time_for_display(webpage["scrape_time"])
    submission["time"] = "Indexed " + display_time

    # make display url
    display_url = build_display_url(webpage["url"])
    submission["display_url"] = display_url
    submission["raw_source_url"] = webpage["url"]  # added for editing submission

    # make redirect url (need result hash)
    submission["submission_id"] = str(submission["submission_id"])
    result_hash = build_result_hash(-1, str(submission["submission_id"]), str(search_id))
    redirect_url = build_redirect_url(webpage["url"], result_hash, submission["highlighted_text"], "search")
    submission["redirect_url"] = redirect_url

    submission["connections"] = []

    submission["type"] = "webpage"

    return submission


def format_submission_for_display(submission, current_user, search_id):
    """
	Helper method to format a raw mongodb submission for frontend display.
	Mostly takes the original format, except removes any unnecessary information.
	Arguments:
		submission : dict : the submission object downloaded from mongodb.
		current_user : the User object of the current user.
		communities : list : list of communities that the user is a member of
		search_id : ObjectID : the id of the view submission log (for tracking clicks)
	Returns:
		submission : dict : a slightly-modified submission object.
	"""
    # get some stats

    submission = submission.to_dict()

    user_id = current_user.id

    submission["stats"] = {
        "views": 0,
        "clicks": 0,
        "shares": 0
    }
    num_shares = sum([len(submission["communities"][str(id)]) for id in submission["communities"]])
    submission["stats"]["shares"] = num_shares

    cdl_searches_clicks = SearchesClicks()
    num__search_clicks = cdl_searches_clicks.count({"submission_id": submission["_id"], "type": "click_search_result"})
    submission["stats"]["clicks"] = num__search_clicks

    cdl_recommendations_clicks = RecommendationsClicks()
    num_rec_clicks = cdl_recommendations_clicks.count({"submission_id": submission["_id"]})
    submission["stats"]["clicks"] += num_rec_clicks

    num_views = cdl_searches_clicks.count({"submission_id": submission["_id"], "type": "submission_view"})
    submission["stats"]["views"] = num_views

    # for deleting the entire submission
    if submission["user_id"] == user_id:
        submission["can_delete"] = True
    else:
        submission["can_delete"] = False

    if str(user_id) in submission["communities"]:
        user_contributed_communities = {str(x): True for x in submission["communities"][str(user_id)]}
    else:
        user_contributed_communities = {}
    all_added_communities = {str(x): True for all_user in submission["communities"] for x in
                             submission["communities"][all_user]}

    # need to reconstruct user , but username does not matter
    hydrated_user_communities = \
        get_communities_helper(current_user, return_dict=True)[
            "community_info"]

    for community_id in hydrated_user_communities:
        if community_id in user_contributed_communities:
            hydrated_user_communities[community_id]["valid_action"] = "remove"
        elif community_id in all_added_communities:
            hydrated_user_communities[community_id]["valid_action"] = "view"
        else:
            hydrated_user_communities[community_id]["valid_action"] = "save"

        del hydrated_user_communities[community_id]["is_admin"]
        del hydrated_user_communities[community_id]["join_key"]
        del hydrated_user_communities[community_id]["community_id"]

    submission["communities"] = hydrated_user_communities

    submission["communities_part_of"] = {str(x): hydrated_user_communities[x]["name"]
                                         for x in hydrated_user_communities
                                         if hydrated_user_communities[x]["valid_action"] != "save"}

    # convert some ObjectIDs to strings for serialization
    submission["submission_id"] = str(submission["_id"])
    submission["user_id"] = str(submission["user_id"])

    display_time = "Submitted" + format_time_for_display(submission["time"])

    submission["time"] = display_time

    # make display url
    display_url = build_display_url(submission["source_url"])
    submission["display_url"] = display_url
    submission["raw_source_url"] = submission["source_url"]  # added for editing submission

    # make redirect url (need result hash)
    result_hash = build_result_hash(-1, str(submission["_id"]), str(search_id))
    redirect_url = build_redirect_url(submission["source_url"], result_hash, submission["highlighted_text"], "search")
    submission["redirect_url"] = redirect_url

    # hydrate with hashtags
    submission = hydrate_with_hashtags([submission])[0]

    # delete unnecessary info
    del submission["source_url"]
    del submission["ip"]
    del submission["type"]
    del submission["_id"]

    submission["type"] = "user_submission"


    return submission


def find_connections(submission_id, user_communities, current_user, search_id):
    """
	Helper method for getting the connections given a submission from mongodb.
	A bit of work because we need to make sure that we only return connections that are
	in the communities accessible by the user requesting the connections.
	Arguments:
		submission_id : ObjectID : the ObjectID of the source submission.
		user_communities : list : a list of ObjectIDs, ids of communities accessible by user.
		current_user : the User object of the current user
		search_id : ObjectID : the id of the view submission log (for tracking clicks).

	Returns:
		filtered_connections : list : a list of submissions formatted according to format_submission_for_display
			each submission also contains a "connection_description" field
	"""

    cdl_connections = Connections()
    all_connections = cdl_connections.find({"source_id": submission_id})
    filtered_connections = []
    for connection in all_connections:
        cdl_logs = Logs()
        # todo: check this
        target_connection = cdl_logs.find_one({"_id": connection.target_id})

        if not target_connection or target_connection.deleted == True:
            continue
        connection_communities = {}

        # gets all communities that a submission is a part of
        for uid in target_connection.communities:
            for community in target_connection.communities[uid]:
                connection_communities[str(community)] = True
        # checks user's communities and only adds connection if user is in connection's community
        for community in user_communities:
            community = str(community)
            if community in connection_communities:
                formatted_connection = format_submission_for_display(target_connection, current_user, search_id)
                formatted_connection["connection_description"] = connection.description
                filtered_connections.append(formatted_connection)
                break
    return filtered_connections


@functional.route("/api/search", methods=["GET"])
@token_required
def search(current_user):
    """
	Endpoint for the webpage search functionality.
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		request args with:
			query : (string) : the typed query of the user.
			community: (string) : the community currently being searched.
			page : (int) : the page number of be returned (if not included, sets to 0)
	Returns:
		200 : output of search_helper, results and metadata.

	TODO: add error handling.
	"""
    try:
        return_obj = {
            "search_id": None,
            "query": None,
            "total_num_results": None,
            "current_page": None,
            "search_results_page": []
        }

        ip = request.remote_addr
        user_id = current_user.id
        user_communities = current_user.communities

        # flag for searching over webpage index
        toggle_webpage_results = True

        query = request.args.get("query", "")
        source = request.args.get("source", "webpage_search")

        # for when source == "extension_open" or source == "extension_search"
        highlighted_text = request.args.get("highlighted_text", "")
        url = request.args.get("url", "")

        # limit highlighted text and query to a reasonable length
        highlighted_text = highlighted_text[:1000]
        query = query[:1000]

        # for now, on extension_open, set the query to be the URL or highlighted text
        # also for note_automatic, no query passed in this case either
        if (not query and source == "extension_open") or (source == "note_automatic"):

            # remove any hashtags
            highlighted_text_nohash = re.sub("#", " ", highlighted_text)

            if not highlighted_text:
                query = url
            elif len(highlighted_text.split()) < 10:
                query = highlighted_text_nohash
            else:
                # here
                blob = TextBlob(highlighted_text_nohash)
                new_terms = " ".join(list(set([x for x in blob.noun_phrases])))
                query = new_terms

        requested_communities = request.args.get("community")

        own_submissions = request.args.get("own_submissions", False)

        page = request.args.get("page", 0)
        if page == "undefined":
            page = 0
        # handle if page is negative
        page = max(0, int(page))

        search_id = request.args.get("search_id", None)

        # if the search_id is not included, then user is requesting a new search
        if not search_id:
            if requested_communities == "all":
                # search over all communities of the user
                requested_communities = user_communities
            else:
                # Turn off webpages for single, specific community search
                toggle_webpage_results = False
                try:
                    requested_communities = [ObjectId(requested_communities)]  # assume only one for now
                except:
                    # need to return community_info for search bar option render
                    return response.error("Community ID is invalid.", Status.INTERNAL_SERVER_ERROR)
                if requested_communities[0] not in user_communities:
                    return response.error("You do not have access to this community.", Status.FORBIDDEN)
            # convert communities to str for elastic
            requested_communities = [str(x) for x in requested_communities]

            # Create a new search_id (as it is the first search by the user)
            search_id, _ = log_search(ip, user_id, source, query, requested_communities, own_submissions, url=url,
                                      highlighted_text=highlighted_text)
            search_id = str(search_id)  # for return

        # if the search_id is included, then the user is looking for a specific page of a previous search
        else:
            cdl_searches_clicks = SearchesClicks()
            prior_search = cdl_searches_clicks.find_one({"_id": ObjectId(search_id)})
            if prior_search:
                query = prior_search.query
                own_submissions = prior_search.own_submissions
                requested_communities = [str(x) for x in prior_search.community]
            else:
                return response.error("Cannot find search to page.", Status.NOT_FOUND)

        # make requested communities a dict containing the name too, for display
        communities = get_communities_helper(current_user, return_dict=True)["community_info"]
        rc_dict = {}
        for community_id in requested_communities:
            try:
                rc_dict[community_id] = communities[community_id]["name"]
            except Exception as e:
                print(e)
                print(f"Could not find community for community id: {community_id}")

        return_obj["query"] = query
        return_obj["search_id"] = search_id
        return_obj["current_page"] = page

        user_id_str = str(user_id)

        total_num_results, search_results_page = cache_search(query, search_id, page, rc_dict, user_id=user_id_str,
                                                              own_submissions=own_submissions, toggle_webpage_results=toggle_webpage_results)

        return_obj["total_num_results"] = total_num_results
        return_obj["search_results_page"] = search_results_page

        return response.success(return_obj, Status.OK)
    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Failed to search, please try again later.", Status.INTERNAL_SERVER_ERROR)


def cache_search(query, search_id, index, communities, user_id, own_submissions=False, toggle_webpage_results=True):
    """
	Helper function for pulling search results.
	Arguments:
		query : (string): raw user query
		search_id : (string) : the id of the current search
		index : (int) : the page
		communities : (dict) : the communities of the user
		user_id : (str) : the user id
		own_submissions: (boolean) : true if user is viewing their own submissions, false otherwise
	Returns:
		return_obj : (list) : a list of formatted submissions for frontned display
							Note that result_hash and redirect_url will be empty (need to hydrate)
	"""

    # Use elastic cache when we don't need to do any reranking or dedup
    if own_submissions or query == "":
        if own_submissions:
            # for getting own submissions (currently can't search them)
            number_of_hits, hits = elastic_manager.get_submissions(user_id, page=index)
        else:
            # assuming that there will be only one
            number_of_hits, hits = elastic_manager.get_community(list(communities.keys())[0], page=index)

        results = create_page(hits, communities)
        results = hydrate_with_hash_url(results, search_id, page=index)
        results = hydrate_with_hashtags(results)
        return number_of_hits, results

    else:
        page = []
        number_of_hits = 0
        try:
            cache = Cache()
        except Exception as e:
            print(e)
            cache = None
        if cache:
            number_of_hits, page = cache.search(user_id, search_id, index)

        # If we cannot find cache page, (re)do the search
        if not page:
            _, submissions_hits = elastic_manager.search(query, list(communities.keys()), page=0, page_size=1000)

            submissions_pages = create_page(submissions_hits, communities)

            if toggle_webpage_results:

                # Searching exactly a user's community from the webpages index
                _, webpages_hits = webpages_elastic_manager.search(query, [], page=0, page_size=1000)
                webpages_index_pages = create_page(webpages_hits, communities)

                submissions_pages = combine_pages(submissions_pages, webpages_index_pages)

            pages = deduplicate(submissions_pages)
            pages = neural_rerank(query, pages)
            pages = hydrate_with_hash_url(pages, search_id, page=index)
            pages = hydrate_with_hashtags(pages)
            number_of_hits = len(pages)
            page = cache.insert(user_id, search_id, pages, index)

    return number_of_hits, page


def create_page(hits, communities):
    """
	Helper function for formatting raw elastic results.
	Arguments:
		hits : (dict): json raw output from elastic
		communities : (dict) : the user's communities
	Returns:
		return_obj : (list) : a list of formatted submissions for frontend display
							Note that result_hash and redirect_url will be empty (need to hydrate)
	"""

    return_obj = []
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
            "communities_part_of": []
        }

        if "webpage" in hit["_source"]:
            result["highlighted_text"] = hit["_source"]["webpage"]["metadata"].get("description", "No Preview Available")
            result["explanation"] = hit["_source"]["webpage"]["metadata"].get("title", "No Title Available")
        else:
            result["highlighted_text"] = hit["_source"].get("highlighted_text", "No Preview Available")
            result["explanation"] = hit["_source"].get("explanation", "No Explanation Available")
        

        # possible that returns additional communities?
        result["communities_part_of"] = {community_id: communities[community_id] for community_id in
                                         hit["_source"].get("communities", []) if community_id in communities}

        result["submission_id"] = str(hit["_id"])

        if "time" in hit["_source"]:
            formatted_time = "Submitted " + format_time_for_display(hit["_source"]["time"])
            result["time"] = formatted_time
        elif "scrape_time" in hit["_source"]:
            formatted_time = "Indexed " + format_time_for_display(hit["_source"]["scrape_time"])
            result["time"] = formatted_time


        # Display URL
        url = hit["_source"].get("source_url", "")
        display_url = build_display_url(url)
        result["display_url"] = display_url
        result["orig_url"] = url

        return_obj.append(result)
    return return_obj


def neural_rerank(query, pages, topn=50):
    """
	Helper function for neural reranking.
	Arguments:
		query : (string): the original user query
		pages : (list) : an array of processed submissions
		topn : (int, default=50) : the number of results to rerank 
	Returns:
		pages : (list) : a reranked pages	
	"""
    if rerank_model and len(query.split()) > 2:
        model_input = []
        for hit in pages[:topn]:
            # limit of 200 words or 500 characters
            trunc_exp = " ".join(hit["explanation"].split()[:200])[:500]
            trunc_high = " ".join(hit["highlighted_text"].split()[:200])[:500]
            trunc_query = " ".join(query.split()[:200])[:500]
            model_input.append((trunc_query, trunc_exp + " | " + trunc_high))
        if model_input:
            scores = rerank_model.predict(model_input)
            for i, score in enumerate(scores):
                pages[i]["score"] = pages[i]["score"] + 10 * score
            pages = sorted(pages, reverse=True, key=lambda x: x["score"])
    return pages


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
        hashtags_explanation = [x for x in result["explanation"].split() if len(x) > 1 and x[0] == "#"]
        hashtags_ht = [x for x in result["highlighted_text"].split() if len(x) > 1 and x[0] == "#"]
        hashtags = list(set(hashtags_explanation + hashtags_ht))
        result["hashtags"] = hashtags
    return results


def deduplicate_by_ids(pages, id_dict):
    pages_dedup = []
    for page in pages:
        if page["submission_id"] not in id_dict:
            pages_dedup.append(page)
    return pages_dedup


def deduplicate(pages):
    map_pages = defaultdict(list)

    for page in pages:
        url = page["orig_url"].split("#")[0]
        map_pages[url].append(page)

    for key in map_pages.keys():
        # map_pages[key].sort(reverse=True, key=lambda x: x["score"])
        map_pages[key][0]["children"] = map_pages[key][1:11] if len(map_pages[key]) > 10 else map_pages[key][1:]

    return [p[0] for p in map_pages.values()]

def combine_pages(submissions_pages, webpages_index_pages):

    # Building an inverted index to map orig_url to index using the submissions_pages list
    subpgs_url_to_id = {}
    for i, submission_page in enumerate(submissions_pages):
        subpgs_url_to_id[submission_page["orig_url"]] = i

    # Using the orig_url_to_idx_map to see if there is an in entry in webpages_index_pages to update score
    for webpage in webpages_index_pages:
        if subpgs_url_to_id.get(webpage["orig_url"]):
            i = subpgs_url_to_id.get(webpage["orig_url"])
            submissions_pages[i]["score"] = submissions_pages[i]["score"] + webpage["score"]
    
    return submissions_pages + webpages_index_pages


# recommender
@functional.route("/api/recommend", methods=["GET"])
@token_required
def get_recommendations(current_user, toggle_webpage_results = True):
    """
	Endpoint for the webpage recommendation functionality.
	Arguments:
		current_user: (dictionary) : the user recovered from the JWT token.
        toggle_webpage_results: To add webpage index results in recommendation feed
		request args with:
			method : (string) : the typed query of the user.
				'recent' --> most recent submissions to user's communities
				'explore_user_submissions' --> similar to three most recent user submissions
			page: (int) : the page number of be returned (if not included, sets to 0)
			recommendation_id : (string) : the ID of the recommendation session, used for efficient paging.
	Returns:
		200 : return_obj : (dictionary) : recommendations for user
	"""
    try:
        # should contain similar return obj as search
        return_obj = {
            "recommendation_id": None,
            "total_num_results": None,
            "current_page": None,
            "recommendation_results_page": []
        }

        ip = request.remote_addr
        user_id = current_user.id
        user_communities = current_user.communities
        CDLweb_community_id = "63a4c21aee3be6ac5c533a55"

        # setting default method to 'explore_similar_extension'
        method = request.args.get("method", "explore_similar_extension")

        # paging
        page_number = request.args.get("page", 0)
        if page_number == "undefined":
            page_number = 0
        page_number = max(0, int(page_number))

        recommendation_id = request.args.get("recommendation_id", None)

        # convert communities to str for elastic
        requested_communities = [str(x) for x in user_communities]
        if CDLweb_community_id in requested_communities:
            requested_communities.remove(CDLweb_community_id)

        # set up cache
        try:
            cache = Cache()
        except Exception as e:
            print(e)
            traceback.print_exc()
            return response.error("Cannot provide recommendations, please try again later.",
                                  Status.INTERNAL_SERVER_ERROR)

        user_id_str = str(user_id)

        communities = get_communities_helper(current_user, return_dict=True)["community_info"]
        rc_dict = {}
        for community_id in requested_communities:
            try:
                rc_dict[community_id] = communities[community_id]["name"]
            except Exception as e:
                print(e)
                print(f"Could not find community for community id: {community_id}")

        # if the recommendation_id is not included, then this is first page/fresh request
        if not recommendation_id:

            # Create a new recommendation_id (first request by the user)
            recommendation_id, _ = log_recommendation_request(ip, user_id, requested_communities, method)

            recommendation_id = str(recommendation_id)  # for returning

            if method == "recent":
                number_of_hits, hits = elastic_manager.get_most_recent_submissions(user_id_str, requested_communities)
                pages = create_page(hits, rc_dict)
                # no score for recommendation?
                # pages = deduplicate(pages)
                pages = hydrate_with_hash_url(pages, recommendation_id, method=method)
                pages = hydrate_with_hashtags(pages)
                page = cache.insert(user_id_str, recommendation_id, pages, page_number)


            elif method == "explore_similar_extension":
                """
				Combines three most recent submissions with the three most recent extension opens
				"""

                # Combining user's latest 3 submissions with all 'extension open' searches
                search_text = ""
                full_text = ""

                # explore: user's submission data
                try:
                    cdl_logs = Logs()
                    user_latest_submissions = cdl_logs.find({"user_id": ObjectId(user_id_str)})
                    user_latest_submissions = sorted(user_latest_submissions, reverse=True, key=lambda x: x.time)[:3]
                    query_ids = {str(x.id) for x in user_latest_submissions}
                except Exception as e:
                    user_latest_submissions = []
                    query_ids = {}
                    print(e)
                    traceback.print_exc()

                for submission in user_latest_submissions:
                    highlighted_text_nohash = re.sub("#", " ", submission.highlighted_text)
                    title_text_nohash = re.sub("#", " ", submission.explanation)

                    full_text += " " + highlighted_text_nohash + " " + title_text_nohash

                # explore user's extension opens data
                try:
                    cdl_searches_clicks = SearchesClicks()
                    users_extension_opens = cdl_searches_clicks.find(
                        {"type": "extension_open", "user_id": ObjectId(user_id_str)})
                    users_extension_opens = sorted(users_extension_opens, reverse=True, key=lambda x: x.time)[:3]

                except Exception as e:
                    users_extension_opens = []
                    traceback.print_exc()
                    print(e)

                for extension_open in users_extension_opens:
                    if extension_open and extension_open.highlighted_text:
                        highlighted_text_nohash = re.sub("#", " ", extension_open.highlighted_text)
                        full_text += " " + highlighted_text_nohash

                if len(full_text) > 3:
                    blob = TextBlob(full_text)
                    new_terms = " ".join(list(set([x for x in blob.noun_phrases])))
                    search_text += " " + new_terms

                number_of_hits, submissions_hits = elastic_manager.search(search_text, list(communities.keys()), page=0,
                                                              page_size=1000)
                submissions_pages = create_page(submissions_hits, rc_dict)

                if toggle_webpage_results:
                    # Searching for recommendations from the webpages index
                    _, webpages_hits = webpages_elastic_manager.search(search_text, [], page=0, page_size=50)
                    webpages_index_pages = create_page(webpages_hits, rc_dict)

                    submissions_pages = combine_pages(submissions_pages, webpages_index_pages)

                # Sorting pages based on score, high to low
                pages = sorted(submissions_pages, reverse=True, key=lambda x: x["score"])
                pages = deduplicate_by_ids(pages, query_ids)

                pages = hydrate_with_hash_url(pages, recommendation_id, method=method)
                pages = hydrate_with_hashtags(pages)
                page = cache.insert(user_id_str, recommendation_id, pages, page_number)


        # if the recommendation_id is included, then the user is looking for a specific page of a previous request
        else:
            number_of_hits, page = cache.search(user_id_str, recommendation_id, page_number)

        return_obj["recommendation_id"] = recommendation_id
        return_obj["current_page"] = page_number
        return_obj["total_num_results"] = number_of_hits
        return_obj["recommendation_results_page"] = page

        return json.dumps(return_obj), 200

    except Exception as e:
        print(e)
        return response.error("Failed to get recommendation, please try again later.", Status.INTERNAL_SERVER_ERROR)