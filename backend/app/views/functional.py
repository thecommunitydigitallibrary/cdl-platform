import json
import os
import re

from bson import ObjectId
from flask import Blueprint, request, redirect
from flask_cors import CORS
from textblob import TextBlob
import traceback
import time
import random
import requests

from app.helpers.helpers import token_required, build_display_url, build_result_hash, build_redirect_url, \
    format_time_for_display, validate_submission, hydrate_with_hash_url, create_page, hydrate_with_hashtags, \
    deduplicate, combine_pages, standardize_url, extract_hashtags, sanitize_input
from app.helpers import response
from app.helpers.status import Status
from app.helpers.scraper import ScrapeWorker
from app.helpers.topic_map import TopicMap
from app.models.community_core import CommunityCores
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
from app.models.users import Users


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


@functional.route("/api/connect/", methods=["POST"])
@token_required
def create_connection(current_user):
    """
	Endpoint for a user to create a directional connection between two submissions. Either connection_target is given or submission_X is given.
	Arguments:
		current_user: dictionary : the user recovered from the JWT token.
		request form with:
			connection_source : string : the id of the source of the connection.
			connection_description : string : optional text describing the connection, submitted by the user.

			connection_target : string : optional id of the target of the connection.
            source_url: string : optional, the URL of the new submission.
            title: string : the title of the new submission.
            description: string : the description of the new submission
            community: string : the community of the new submission


	Returns:
		200 : a dictionary with "status" = "ok and a note in the "message" field.
		500 : a dictionary with "status" = "error" and an error in the "message" field.
	"""
    try:
        ip = request.remote_addr
        user_id = current_user.id
        user_communities = current_user.communities


        request_json =  request.get_json()

        connection_source = request_json.get("connection_source", "")
        connection_target = request_json.get("connection_target", "")
        connection_description = request_json.get("connection_description", "")

        submission_url = request_json.get("source_url", None)
        submission_title = request_json.get("title", None)
        submission_description = request_json.get("description", None)
        submission_community = request_json.get("community", None)


        if submission_url or submission_title or submission_description or submission_community:
            if not submission_title or not submission_community:
                print("Error: Must include a submission title and community if creating a new submission.")
                return response.error("Error: Must include a submission title and community if creating a new submission.", Status.BAD_REQUEST)

            message, status, submission_id = create_submission_helper(ip=ip, user_id=user_id, user_communities=user_communities, highlighted_text=submission_description,
                    source_url=submission_url, explanation=submission_title, community=submission_community)
            
            if status != Status.OK:
                print(status, message)
                return response.error(message, status)
            else:
                connection_target = submission_id
        elif not connection_target:
            return response.error("Error: Must include either a submission title or connection ID.", Status.BAD_REQUEST)


        try:
            connection_source_id = ObjectId(connection_source)
            connection_target_id = ObjectId(connection_target)
        except Exception as e:
            print(e)
            traceback.print_exc()
            return response.error("Error: Invalid connection ID.", Status.BAD_REQUEST)
        ack = log_connection(ip, user_id, connection_source_id, connection_target_id, connection_description)
        if ack.acknowledged:
            return response.success({
                "message": "Connection successfully created",
                "connection_id": str(ack.inserted_id)
            }, Status.OK)
        else:
            return response.error("Failed to make connection, please try again later.", Status.INTERNAL_SERVER_ERROR)
    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Failed to create connection, please try again later.", Status.INTERNAL_SERVER_ERROR)



@functional.route("/api/submission/", methods=["POST"])
@token_required
def create_submission(current_user):
    """
	Endpoint for a user to submit a webpage. 
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		request form with
			highlighted_text/description : (string) : any highlighted text from the user's webpage (can be "").
			source_url : (string) : the full URL of the webpage being submitted. As of 11/8/2023, this is now optional, and default's to TextData's submission URL if left blank.
			explanation/title : (string) : the reason provided by the user for why the webpage is helpful.
			community : (string) : the ID of the community to add the result to
            anonymous : (bool) : true or false, to display the creator's username on the submission

	Returns:
		200 : a dictionary with "status" = "ok and a note in the "message" field.
		500 : a dictionary with "status" = "error" and an error in the "message" field.
	"""
    try:
        ip = request.remote_addr
        user_id = current_user.id
        user_communities = current_user.communities

        req = request.form
        if not request.form:
            req = request.get_json()

        highlighted_text = req.get("highlighted_text", "") or req.get("description")
        source_url = req.get("source_url")
        explanation = req.get("explanation") or req.get("title")
        community = req.get("community", "")
        anonymous = req.get("anonymous", True) # assume anonymous if not included
        # convert from extension
        if anonymous == "false":
            anonymous = False
        if anonymous == "true":
            anonymous = True

        

        message, status, submission_id = create_submission_helper(ip=ip, user_id=user_id, user_communities=user_communities, highlighted_text=highlighted_text,
                                 source_url=source_url, explanation=explanation, community=community, anonymous=anonymous)

        if status == Status.OK:
            return response.success({
            "message": message,
            "submission_id": str(submission_id)
        }, status)
            
        else:
            return response.error(message, status)
        
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
                anonymous : (bool) : if false, displays username on submission

	Returns:
		In all cases, a status code and a list containing the status/error message (if any) for each attempted submission.
		This is so that errors can be assessed individually and so you can re-send the submissions that failed.
	"""
    r = request.get_json()
    data = r['data']
    community = r['community']
    anonymous = r.get("anonymous", True)
    results = {}
    errors = []
    for i, submission in enumerate(data):
        try:
            ip = request.remote_addr
            user_id = current_user.id
            user_communities = current_user.communities
            highlighted_text = submission["description"]
            source_url = submission.get("source_url", "")
            explanation = submission["title"]
            message, status, submission_id = create_submission_helper(ip=ip, user_id=user_id, user_communities=user_communities, highlighted_text=highlighted_text,
                                source_url=source_url, explanation=explanation, community=community, anonymous=anonymous)
            
            if status == Status.OK:
                results[f'Submission {i}'] = {
                    "message": message,
                    "submission_id": str(submission_id),
                    "status": status
                }
            else:
                results[f'Submission {i}'] = {'message': message, 'status': status }
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
                anonymous : (bool) : the new anonymous setting
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
                community_id = request_data.get("community", None)
            else:
                community_id = None
            # deleting the entire submission
            if not community_id:
                # the user_id should guarantee that a submission can only be deleted by the user who submitted it.
                update = cdl_logs.update_one({"user_id": ObjectId(user_id), "_id": ObjectId(id)},
                                             {"$set": {"deleted": True}}, upsert=False)
                if update.acknowledged:
                    index_update = elastic_manager.delete_document(id)

                    print(index_update)

                    # if delete successful, remove it from community core if necessary
                    old_record = cdl_logs.find_one({"_id": ObjectId(id)})
                    if "#core" in list(set(extract_hashtags(old_record.explanation) + extract_hashtags(old_record.highlighted_text))):
                        community_core = CommunityCores()
                        hashtags = []
                        standardized_url = standardize_url(old_record.source_url)
                        for community in old_record.communities[str(user_id)]:
                            community_core.update(community, standardized_url, hashtags, ObjectId(id))
                            


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
                    if len(submission_communities) == 1 and len(submission_communities[user_id]) == 1:
                         return response.error("You cannot remove a submission from its last community.", Status.BAD_REQUEST)
                    submission_communities[user_id] = [x for x in submission_communities[user_id] if x != community_id]
                else:
                    return response.error("You are not able to remove the submission from this community.", Status.UNAUTHORIZED)
                if submission_communities[user_id] == []:
                    del submission_communities[user_id]
                update = cdl_logs.update_one({"_id": ObjectId(id)}, {"$set": {"communities": submission_communities}})
                if update.acknowledged:
                    current_submission.communities = submission_communities
                    deleted_index_status = elastic_manager.delete_document(id)
                    added_index_status, _ = elastic_manager.add_to_index(current_submission)
                    log_community_action(ip, user_id, community_id, "DELETE", submission_id=current_submission.id)


                    # if delete successful, remove it from community core if necessary
                    # removal from community, so hashtags set to empty
                    if "#core" in list(set(extract_hashtags(current_submission.explanation) + extract_hashtags(current_submission.highlighted_text))):
                        community_core = CommunityCores()
                        hashtags = []
                        standardized_url = standardize_url(current_submission.source_url)
                        community_core.update(community_id, standardized_url, hashtags, ObjectId(id))



                    return response.success({"message": "Removed from community."}, Status.OK)
                else:
                    return response.error("Unable to remove from community.", Status.NOT_FOUND)

        elif request.method == "PATCH":

            request_json = request.get_json()

            community_id = request_json.get("community", "")
            #highlighted_text = sanitize_input()
            highlighted_text = request_json.get("description", None)
            explanation = request_json.get("title", None)
            source_url = request_json.get("source_url", None)
            anonymous = request_json.get("anonymous", True)

            user_id = str(user_id)

            insert_obj = {}

            if not community_id and not highlighted_text and not explanation:
                return response.error("Missing either community, title, or description",
                                      Status.BAD_REQUEST)
            

            try:
                submission = cdl_logs.find_one({"_id": ObjectId(id)})
            except Exception as e:
                print(e)
                traceback.print_exc()
                return response.error("Invalid submission ID", Status.NOT_FOUND)
            
            if not submission:
                return response.error("Submission not found.", Status.NOT_FOUND)

            if str(submission.user_id) != user_id:
                return response.error("You do not have permission to edit this submission.", Status.FORBIDDEN)


            # updating a submission's communities
            if community_id:

                community_id = ObjectId(community_id)
                # adding to a community (NOT THREAD SAFE)
                submission_communities = submission.communities

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


            # TODO as written, one cannot make source_url empty with it now being optional
            if highlighted_text != None or explanation != None or source_url != None:

                # check highlighted text, explanation, and url to make sure proper formatting
                validated, message = validate_submission(highlighted_text, explanation, source_url=source_url)
                if not validated:
                    return response.error(message, Status.BAD_REQUEST)

                if highlighted_text != None:
                    insert_obj["highlighted_text"] = highlighted_text
                if explanation != None:
                    insert_obj["explanation"] = explanation
                if source_url != None:
                    insert_obj["source_url"] = source_url



            if submission.anonymous != anonymous:
                insert_obj["anonymous"] = anonymous


            update = cdl_logs.update_one({"_id": ObjectId(id)}, {"$set": insert_obj})

            if update.acknowledged:

                # a submission is added to a new community
                if community_id:
                    hashtags = list(set(extract_hashtags(submission.highlighted_text) + extract_hashtags(submission.explanation)))
                    if "#core" in hashtags:
                        community_core = CommunityCores()
                        hashtags = [x for x in hashtags if x != "#core"]
                        standardized_url = standardize_url(submission.source_url)
                        community_core.update(ObjectId(community_id), standardized_url, hashtags, ObjectId(id))

                # the url/text of a submission is changed
                    # the submission has the exact same hashtags
                    # the submission has different hashtags
                        # core was removed
                        # core was added
                        # others changed

                old_source_url = submission.source_url
                
                hashtags = []
                OLD_CORE_FLAG = False

                if "highlighted_text" in insert_obj: 
                    hashtags += extract_hashtags(highlighted_text)
                    old_hashtags = extract_hashtags(submission.highlighted_text)
                    submission.highlighted_text = highlighted_text
                    if "#core" in old_hashtags:
                        OLD_CORE_FLAG = True
                else:
                    hashtags += extract_hashtags(submission.highlighted_text)

                if "explanation" in insert_obj:
                    hashtags += extract_hashtags(explanation)
                    old_hashtags = extract_hashtags(submission.explanation)
                    submission.explanation = explanation
                    if "#core" in old_hashtags:
                        OLD_CORE_FLAG = True
                else:
                     hashtags += extract_hashtags(submission.explanation)


                if "source_url" in insert_obj:
                    submission.source_url = source_url

                if "anonymous" in insert_obj:
                    submission.anonymous = anonymous

                deleted_index_status = elastic_manager.delete_document(id)
                added_index_status, hashtags = elastic_manager.add_to_index(submission)


                # update community core content if necessary

                UPDATE_FLAG = False
                if OLD_CORE_FLAG and "#core" not in hashtags:
                    hashtags = []
                    UPDATE_FLAG = True
                if "#core" in hashtags:
                    hashtags = [x for x in hashtags if x != "#core"]
                    UPDATE_FLAG = True

                if UPDATE_FLAG:
                    community_core = CommunityCores()
                    all_communities = [x for user_id in submission.communities for x in submission.communities[user_id]]

                    standardized_new_url = standardize_url(submission.source_url)
                    standardized_old_url = standardize_url(old_source_url)

                    # need to update across all communities
                    for community_id in all_communities:
                        if standardized_new_url != standardized_old_url:
                            community_core.update(community_id, standardized_old_url, [], ObjectId(id))
                        community_core.update(community_id, standardized_new_url, hashtags, ObjectId(id))
                

                if "communities" in insert_obj:
                    log_community_action(ip, user_id, community_id, "ADD", submission_id=submission.id)
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
                        submission["connections"] = find_connections(ObjectId(id), communities, current_user, search_id)
                        return response.success({"submission": submission}, Status.OK)
                except Exception as e:
                    print(e)
                    traceback.print_exc()
                    pass
                return response.error("Cannot find submission.", Status.NOT_FOUND)
            else:
                 return response.error("Cannot find submission.", Status.NOT_FOUND)
    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Failed to create submission, please try again later.", Status.INTERNAL_SERVER_ERROR)


def graph_search(current_user, submission_id, toggle_webpage_results=True):
    try:
        cdl_logs = Logs()
        submission_data = cdl_logs.find_one({"_id": ObjectId(submission_id)})
        communities = current_user.communities
        accessible = False
        if submission_data:
            if not submission_data.deleted:
                community_submissions = {str(cid) for uid in submission_data.communities for cid in
                                         submission_data.communities[uid]}
                for community in communities:
                    if str(community) in community_submissions:
                        accessible = True

                if str(submission_data.user_id) == str(current_user.id):
                    accessible = True

            is_webpage = False
        else:
            webpages = Webpages()
            submission_data = webpages.find_one({"_id": ObjectId(submission_id)})
            accessible = True
            is_webpage = True

    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Invalid submission ID", Status.NOT_FOUND)

    if not submission_data:
        return response.error("Invalid submission ID", Status.NOT_FOUND)
    elif not accessible:
        return response.error("Access Forbidden", Status.FORBIDDEN)

    communities = current_user.communities
    explanation = submission_data.webpage.get("metadata", {}).get("title", "") if is_webpage else submission_data.explanation
    highlighted_text = submission_data.webpage.get("metadata", {}).get("description", "") if is_webpage else submission_data.highlighted_text

    query = f"{explanation}" # {highlighted_text}"[:1000]

    communities_list = [str(x) for x in communities]
    _, submissions_hits = elastic_manager.search(query, communities_list, page=0, page_size=10)
    submissions_pages = create_page(submissions_hits, communities)

    if toggle_webpage_results:
        # Searching exactly a user's community from the webpages index
        _, webpages_hits = webpages_elastic_manager.search(query, [], page=0, page_size=10)
        webpages_index_pages = create_page(webpages_hits, communities)
        submissions_pages = combine_pages(submissions_pages, webpages_index_pages)

    node = {
        "explanation": explanation,
        "highlighted_text": highlighted_text
    }
    return node, submissions_pages

@functional.route("/api/autocomplete", methods=["GET"])
@token_required
def autocomplete(current_user):
    query = request.args.get("query", "")
    topn = int(request.args.get("topn", 7))
    cutoff = int(request.args.get("cutoff", 60))

    user_communities = [str(x) for x in current_user.communities]

    try:
        _, submissions_hits = elastic_manager.auto_complete(query, user_communities, page=0, page_size=20)
        seen_titles = {}
        suggestions = []
        for x in submissions_hits:
            label = x["_source"]["explanation"]
            id = x["_id"]
            if label in seen_titles:
                continue
            else:
                seen_titles[label] = True
            suggestions.append({"label": label, "id": id})
            if len(suggestions) >= topn:
                break

        return response.success({"suggestions": suggestions}, Status.OK)

    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Failed to get autocomplete, please try again later.", Status.INTERNAL_SERVER_ERROR)


def process_keywords_hits(keywords, hits, seen_urls):
    used_keywords = []

    new_pages = []
    for result in hits:
        if result["orig_url"] not in seen_urls:
            seen_urls[result["orig_url"]] = True
            for keyword in keywords:
                if keyword in result["highlighted_text"].lower() or keyword in result["explanation"].lower():
                    used_keywords.append(keyword)
            new_pages.append(result)

    used_keywords = ", ".join(list(set(used_keywords)))

    remaining_keywords = [x for x in keywords if x not in used_keywords]
    return remaining_keywords, used_keywords, new_pages, seen_urls


@functional.route("/api/generate", methods=["POST"])
@token_required
def generate(current_user): 
    """
    Endpoint for generating text in the extension. Proxys to GPU server.
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		request args with:
			query : (string) : the typed query of the user.
			context: (string) : the highlighted text by the user.
			mode : (str) : one of
                qa : given a query, generate the answer
                contextual_qa : given a context and a portion of a query, generate the answer
                gen_questions: given a context, generate some questions
                summarize : given a context, summarize the selection
	Returns:
		200 : generated text.
    """
    ip = request.remote_addr
    user_id = current_user.id
    user_communities = current_user.communities
    requested_communities = [str(x) for x in user_communities]
    communities = get_communities_helper(current_user, return_dict=True)["community_info"]
    rc_dict = {}
    for community_id in requested_communities:
        try:
            rc_dict[community_id] = communities[community_id]["name"]
        except Exception as e:
            print(e)
            print(f"Could not find community for community id: {community_id}")

    req = request.form
    if not request.form:
        req = request.get_json()

    context = req.get("context", "")
    query = req.get("query", "")
    mode = req.get("mode", "")

    if not mode or mode not in ["qa", "summarize", "gen_questions", "contextual_qa"]:
        return response.error("Mode missing or unsupported.", Status.BAD_REQUEST)


    neural_api = os.environ.get("neural_api")
    if not neural_api:
        return response.error("Generation not currently supported.", Status.NOT_IMPLEMENTED)
    try:
        resp = requests.post(neural_api + "/neural/generate", json={"context": context, "query": query, "mode": mode})
        resp_json = resp.json()
        if resp.status_code == 200:
            output = resp_json["output"]
            log_recommendation_request(ip, user_id, user_communities, method=mode, metadata={"context": context, "query": query, "output": output, "version": "0"})
            return response.success({"output": output}, Status.OK)
        else:
            print(resp_json["message"])
            return response.error(resp_json["message"], Status.INTERNAL_SERVER_ERROR)
    except Exception as e:
        traceback.print_exc()



@functional.route("/api/compare", methods=["POST"])
@token_required
def context_analysis(current_user):
    ip = request.remote_addr
    user_id = current_user.id

    user_communities = current_user.communities
    requested_communities = [str(x) for x in user_communities]
    communities = get_communities_helper(current_user, return_dict=True)["community_info"]
    rc_dict = {}
    for community_id in requested_communities:
        try:
            rc_dict[community_id] = communities[community_id]["name"]
        except Exception as e:
            print(e)
            print(f"Could not find community for community id: {community_id}")

    req = request.form
    if not request.form:
        req = request.get_json()

    url = req.get("url")
    
    # will eventually need this for when we want to compare the ht
    # with the general context of the page
    #paragraphs = req.get("paragraphs").get("paragraphs")
    
    highlighted_text = req.get("highlighted_text")
    if highlighted_text:
        highlighted_text = re.sub("\<[^)]*\>", " ", highlighted_text)
        highlighted_text = re.sub("[^a-zA-Z0-9 ]", " ", highlighted_text)
        highlighted_text = " ".join(highlighted_text.split())


    """
    # scrape the webpage if public
    try:
        webpages = Webpages()
        scraper = ScrapeWorker(webpages.collection)
        data = scraper.is_scraped_before(url)
        if not data:
            data = scraper.scrape(url)  # Triggering Scraper
            # Check if the URL was already scraped
            if data['scrape_status']['code'] != -1:
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
    except Exception as e:
        traceback.print_exc()
        print("Scrape failed for annotate.")
    """


    ht_stats = {
        "submitted_you": {"keywords": [], "results": []},
        "submitted_community": {"keywords": [], "results": []},
        "indexed_cdl": {"keywords": [], "results": []}
    }

    blob = TextBlob(highlighted_text)
    keywords = [x for x in list(set(" ".join([x for x in blob.noun_phrases]).split())) if len(x) > 3]
    if keywords == []:
        keywords = highlighted_text.split()
    ht_stats["keywords"] = keywords

    metadata = {
        "url": url,
        "keywords": keywords,
        "algorithm": "blob_extract",
        "subset": "own_submissions"
    }

    
    if keywords:
        seen_urls = {}


        # first search over all of your submissions
        recommendation_id, _ = log_recommendation_request(ip, user_id, user_communities, "compare", metadata=metadata)
        recommendation_id = str(recommendation_id)
        _, hits = cache_search(" ".join(keywords), recommendation_id, 0, rc_dict, str(user_id), own_submissions=True, 
                               toggle_webpage_results=False, url_core_retrieve=url, method="recommendation")
        if hits:
            remaining_keywords, used_keywords, results, seen_urls = process_keywords_hits(keywords, hits, seen_urls)
            ht_stats["submitted_you"]["keywords"] = used_keywords
            ht_stats["submitted_you"]["results"] = results
            keywords = remaining_keywords
            

        # next search over all community submissions
        """
        There is an error here where if the keywords do not match in the top 10 from above,
        then they will be used to search here. But then there is a chance that you pull in your own submissions.
        so TODO filter this / restrict this to non your submissions
        """
        if keywords:
            metadata["subset"] = "community_submissions"
            recommendation_id, _ = log_recommendation_request(ip, user_id, user_communities, "compare", metadata=metadata)
            recommendation_id = str(recommendation_id)
            _, hits = cache_search(" ".join(keywords), recommendation_id, 0, rc_dict, str(user_id), own_submissions=False, 
                                    toggle_webpage_results=False, url_core_retrieve=url, method="recommendation")
            if hits:
                remaining_keywords, used_keywords, results, seen_urls = process_keywords_hits(keywords, hits, seen_urls)
                ht_stats["submitted_community"]["keywords"] = used_keywords
                ht_stats["submitted_community"]["results"] = results
                keywords = remaining_keywords


        # finally search over all webpages
        # removed for new, but will add back after extension refactoring to avoid typing lag
        if False:
            metadata["subset"] = "auto_indexed"
            recommendation_id, _ = log_recommendation_request(ip, user_id, user_communities, "compare", metadata=metadata)
            recommendation_id = str(recommendation_id)
            _, hits = cache_search(" ".join(keywords), recommendation_id, 0, rc_dict, str(user_id), own_submissions=False,
                                    toggle_webpage_results=True, url_core_retrieve=False, toggle_submission_results=False, method="recommendation")

            if hits:
                remaining_keywords, used_keywords, results, seen_urls= process_keywords_hits(keywords, hits, seen_urls)
                ht_stats["indexed_cdl"]["keywords"] = used_keywords
                ht_stats["indexed_cdl"]["results"] = results
                keywords = remaining_keywords

    return response.success({"analyzed_ht": ht_stats}, Status.OK)

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
        
        requested_communities = request.args.get("community")
        own_submissions = request.args.get("own_submissions", False)



        if query == "" and requested_communities == "all" and own_submissions == False and source in ["webpage_search", "extension_search", "visualize"]:
            return response.error("Query cannot be empty.", Status.BAD_REQUEST)


        # for when source == "extension_open" or source == "extension_search"
        highlighted_text = request.args.get("highlighted_text", "")
        url = request.args.get("url", "")

        # limit highlighted text and query to a reasonable length
        highlighted_text = highlighted_text[:1000]
        query = query[:1000]

        # create a flag for URL core retrieval
        URL_CORE_RETRIEVE = None

        # for now, on extension_open, set the query to be the URL or highlighted text
        # also for note_automatic, no query passed in this case either
        if (not query and source == "extension_open") or (source == "note_automatic"):

            if not query and source == "extension_open":
                URL_CORE_RETRIEVE = url

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


        # turn off webpages for searching via hashtag
        if query and "#" in query:
            toggle_webpage_results = False

        # make requested communities a dict containing the name too, for display
        communities = get_communities_helper(current_user, return_dict=True)["community_info"]
        rc_dict = {}
        for community_id in requested_communities:
            try:
                rc_dict[community_id] = communities[community_id]["name"]
            except Exception as e:
                print(e)
                print(f"Could not find community for community id: {community_id}")

        # issue: in the case where we get subsequent pages in a search (1+), we cannot tell whether a single community has been requested
        # or the user only has a single community
        if len(rc_dict) == 1 and len(user_communities) > 1:
            toggle_webpage_results = False


        return_obj["query"] = query
        return_obj["search_id"] = search_id
        return_obj["current_page"] = page

        user_id_str = str(user_id)

        total_num_results, search_results_page = cache_search(query, search_id, page, rc_dict, user_id=user_id_str,
                                                              own_submissions=own_submissions, toggle_webpage_results=toggle_webpage_results,
                                                              url_core_retrieve=URL_CORE_RETRIEVE)

        return_obj["total_num_results"] = total_num_results
        return_obj["search_results_page"] = search_results_page

        # Return nodes and links for community visualisation
        if source == "visualize":
            root_label = communities[community_id]['name'] if query == "" else query

            # Get levels filter info
            if request.args.get("levelfilter"):
                levels = request.args.get("levelfilter").split(";")
            else:
                levels = ["topics", "hashtags", "metadescs"]

            for i in range(10, total_num_results, 10):
                _, additional_results = cache_search(query, search_id, i/10, rc_dict, user_id=user_id_str,
                                                    own_submissions=own_submissions, toggle_webpage_results=toggle_webpage_results,
                                                    url_core_retrieve=URL_CORE_RETRIEVE)
                
                search_results_page = search_results_page + additional_results
                if i > 1000: break

            # If ownSubmissions requested, get user's submissions
            if "ownSubmissions" in levels:
                # Creating a new search_id to avoid retrieving cached results from previous search
                search_id, _ = log_search(ip, user_id, source, query, requested_communities, own_submissions=True, url=url,
                                          highlighted_text=highlighted_text)
                search_id = str(search_id)

                total_sub_num_results, sub_search_results_page = cache_search(query, search_id, page, rc_dict,
                                                                      user_id=user_id_str,
                                                                      own_submissions=True,
                                                                      toggle_webpage_results=False,
                                                                      url_core_retrieve=URL_CORE_RETRIEVE)

                for i in range(10, int(total_sub_num_results), 10):
                    _, additional_submissions_results = cache_search(query, search_id, i / 10, rc_dict, user_id=user_id_str,
                                                         own_submissions=True,
                                                         toggle_webpage_results=False,
                                                         url_core_retrieve=URL_CORE_RETRIEVE)

                    sub_search_results_page = sub_search_results_page + additional_submissions_results
                    if i > 1000: break

                own_submissions_ids = set()
                for sub_obj in sub_search_results_page:
                    own_submissions_ids.add(sub_obj["submission_id"])

                for sub_obj in search_results_page:
                    if sub_obj["submission_id"] in own_submissions_ids:
                        sub_obj["own_page"] = True

            # Call TopicMap
            data_ip = json.dumps(search_results_page)
            tm = TopicMap(data_ip, root_label, levels)
            tm.pre_process()
            op_dict = tm.generate_map(0)
            graphData = tm.generate_graph_json(op_dict)
            return response.success(graphData, Status.OK)
        return response.success(return_obj, Status.OK)
    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Failed to search, please try again later.", Status.INTERNAL_SERVER_ERROR)



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
                pages = create_page(hits, rc_dict, toggle_display="preview")
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
                    source_urls = {str(x.source_url) for x in user_latest_submissions} # potential change to urls
                except Exception as e:
                    user_latest_submissions = []
                    source_urls = {}
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
                    new_terms = " ".join(list(set([x for x in blob.noun_phrases if len(x) > 3])))
                    search_text += " " + new_terms

                # if empty, assign random
                if search_text == "":
                    search_text = "transformer natural language processing illinois machine learning startup neural network hack hacker technology future explanation application building coding search engine computer vision recurrent classification generation chatgpt gpt3 data"


                # randomize the search text to 10 query terms
                split_text = search_text.split()
                if len(split_text) > 10:
                    random.shuffle(split_text)
                    search_text = " ".join(split_text[:10])

                
                number_of_hits, submissions_hits = elastic_manager.search(search_text, list(communities.keys()), page=0,
                                                              page_size=50)
                submissions_pages = create_page(submissions_hits, rc_dict, toggle_display="preview")

                if toggle_webpage_results:
                    # Searching for recommendations from the webpages index
                    _, webpages_hits = webpages_elastic_manager.search(search_text, [], page=0, page_size=50)
                    webpages_index_pages = create_page(webpages_hits, rc_dict, toggle_display="preview")

                    submissions_pages = combine_pages(submissions_pages, webpages_index_pages)


                # remove all submissions that match the source URL
                submissions_pages = [x for x in submissions_pages if x["orig_url"] not in source_urls]

                # Sorting pages based on score, high to low
                pages = sorted(submissions_pages, reverse=True, key=lambda x: x["score"])
                pages = deduplicate(pages)
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
        traceback.print_exc()
        return response.error("Failed to get recommendation, please try again later.", Status.INTERNAL_SERVER_ERROR)

### HELPERS that cannot be removed (yet)###

def create_submission_helper(ip=None, user_id=None, user_communities=None, highlighted_text=None, source_url=None, explanation=None, community=None, anonymous=True):
    # assumed string, so check to make sure is not none
    if highlighted_text == None:
        highlighted_text = ""

    #if highlighted_text:
    #    highlighted_text = sanitize_input(highlighted_text)

    # hard-coded to prevent submissions to the web community
    if community == "63a4c21aee3be6ac5c533a55" and str(user_id) != "63a4c201ee3be6ac5c533a54":
        return "You cannot submit to this community.", Status.FORBIDDEN, None

    if community == "":
        return "Error: A community must be selected.", Status.BAD_REQUEST, None
    if not Communities().find_one({"_id": ObjectId(community)}):
        return "Error: Cannot find community.", Status.BAD_REQUEST, None
    if ObjectId(community) not in user_communities:
        return "Error: You do not have access to this community.", Status.FORBIDDEN, None

    # for some reason, in the case that there is no explanation
    if not explanation:
        return "Missing submission title.", Status.BAD_REQUEST, None

    validated, message = validate_submission(highlighted_text, explanation, source_url=source_url)
    if not validated:
        return message, Status.BAD_REQUEST, None

    # for logging a top-level submission
    status, doc = log_submission(ip, user_id, highlighted_text, source_url, explanation, community, anonymous)

    if status.acknowledged:
        doc.id = status.inserted_id
        index_status, hashtags = elastic_manager.add_to_index(doc)
        # update community core content if necessary
        # only consider when source url is included
        try:
            if "#core" in hashtags and source_url:
                hashtags = [x for x in hashtags if x != "#core"]
                standardized_url = standardize_url(source_url)
                community_core = CommunityCores()
                community_core.update(ObjectId(community), standardized_url, hashtags, ObjectId(doc.id))
        except Exception as e:
            print(e)
            traceback.print_exc()
            print("Failed to update Community Core Content")
        
        print("SUBMISSION_INDEX_STATUS", index_status)
        webpages = Webpages()
        scraper = ScrapeWorker(webpages.collection)

        if source_url and not scraper.is_scraped_before(source_url):
            try:
                data = scraper.scrape(source_url)  # Triggering Scraper
                

                # Check if the URL was already scraped
                if data['scrape_status']['code'] != -1:
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
                        index_status, _ = webpages_elastic_manager.add_to_index(webpage)
                        print("WEBPAGE_INDEX_STATUS", index_status)

                    else:
                        print("Unable to insert webpage data in database.")
            except Exception as e:
                traceback.print_exc()
                pass

        return "Context successfully submitted and indexed.", Status.OK, status.inserted_id
        
    else:
        return "Unable to make submission. Please try again later.", Status.INTERNAL_SERVER_ERROR, None

def cache_search(query, search_id, index, communities, user_id, own_submissions=False, toggle_webpage_results=True, url_core_retrieve=None, toggle_submission_results=True, method="search"):
    """
	Helper function for pulling search results.
	Arguments:
		query : (string): raw user query
		search_id : (string) : the id of the current search
		index : (int) : the page
		communities : (dict) : the communities of the user
		user_id : (str) : the user id
		own_submissions: (boolean) : true if user is viewing their own submissions, false otherwise
        toggle_webpage_results: (boolean) : to include webpage results
        url_core_retrieve : (None or URL str) : to include core results in a search (when extension is opened)
        toggle_submission_results: (boolean) : to include submission results
	Returns:
		return_obj : (list) : a list of formatted submissions for frontend display
	"""

    print("Search metrics")
    start_time = time.time()

    print("\tSearch start time: ", start_time)

    # Use elastic cache when we don't need to do any reranking or dedup
    if query == "":
        # Case where we are viewing own submissions
        if own_submissions:
            number_of_hits, hits = elastic_manager.get_submissions(user_id, page=index)
        
        # Case where we are viewing all submissions to a community
        else:
            number_of_hits, hits = elastic_manager.get_community(list(communities.keys())[0], page=index)
        
        results = create_page(hits, communities)
        results = hydrate_with_hash_url(results, search_id, page=index)
        results = hydrate_with_hashtags(results)
        return number_of_hits, results

    else:
        page = []
        number_of_hits = -1
        try:
            cache = Cache()
        except Exception as e:
            print(e)
            cache = None
        print("\tcache start time: ", time.time() - start_time)

        if cache:
            print("\t\tLooking in cache...")
            number_of_hits, page = cache.search(user_id, search_id, index)
        else:
            print("\t\tCannot find cache")
            
        print("\tcache end time: ", time.time() - start_time)

        print("\t\tCache page status: ", number_of_hits)


        # If we cannot find cache page, (re)do the search
        if number_of_hits == -1:
            if toggle_submission_results:
                # when query is not empty and own_submissions is true, send user id to search to scope it
                if own_submissions:
                    _, submissions_hits = elastic_manager.search(query, list(communities.keys()), user_id=str(user_id), page=0, page_size=1000)
                else:
                    _, submissions_hits = elastic_manager.search(query, list(communities.keys()), page=0, page_size=1000)
                

                if url_core_retrieve != None:
                    url = standardize_url(url_core_retrieve)
                    all_core_content = CommunityCores()
                    for community_id in communities.keys():
                        community_core = all_core_content.find_one({"community_id": ObjectId(community_id)})
                        if community_core:
                            if url in community_core.core_content:
                                core_hashtags = list(community_core.core_content[url].keys())
                                core_hashtags = list(set(core_hashtags))
                                _, core_hits = elastic_manager.search(" ".join(core_hashtags), [community_id], page=0, page_size=1000)


                                # to put on top (in slightly random order)
                                for hit in core_hits:
                                    rand_int = random.randint(0,10)
                                    hit["_score"] += 100 + rand_int

                                submissions_hits = submissions_hits + core_hits


                print("\tSubmission search: ", time.time() - start_time)

                submissions_pages = create_page(submissions_hits, communities)

                print("\tSubmission pages: ", time.time() - start_time)
            else:
                submissions_pages = []     

            if toggle_webpage_results:

                # Searching exactly a user's community from the webpages index
                _, webpages_hits = webpages_elastic_manager.search(query, [], page=0, page_size=1000)
                print("\tWebpage search: ", time.time() - start_time)

                webpages_index_pages = create_page(webpages_hits, communities)

                print("\tWebpage pages: ", time.time() - start_time)

                submissions_pages = combine_pages(submissions_pages, webpages_index_pages)

                print("\tCombined search: ", time.time() - start_time)


           
            # removing this for now because we are adding llama chat on neural, and it is a bit slow
            # will reinstate once we can run this independently as to not slow down main search
            if False: #"neural_api" in os.environ:
                try:
                    resp = requests.post(os.environ["neural_api"] + "neural/rerank/", json = {"pages": submissions_pages, "query": query})
                    if resp.status_code == 200:
                        resp_json = resp.json()
                        pages = resp_json["pages"]
                except Exception as e:
                    print(e)
                    traceback.print_exc()
                    print("Removing Neural API from environment")
                    del os.environ["neural_api"]

                print("\tNeural Rerank: ", time.time() - start_time)
            else:
                print("\t Neural Rerank not available")


            pages = sorted(submissions_pages, reverse=True, key=lambda x: x["score"])

            pages = deduplicate(pages)
            print("\tDedup: ", time.time() - start_time)

            pages = hydrate_with_hash_url(pages, search_id, page=index, method=method)
            print("\tURL: ", time.time() - start_time)

            pages = hydrate_with_hashtags(pages)
            print("\tHash: ", time.time() - start_time)

            number_of_hits = len(pages)
            page = cache.insert(user_id, search_id, pages, index)
            print("\tCache: ", time.time() - start_time)


    return number_of_hits, page


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
    if submission["explanation"] == "":
        submission["explanation"] = webpage["webpage"]["metadata"].get("h1")
        
    display_time = format_time_for_display(webpage["scrape_time"])
    submission["time"] = display_time

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

    

    # Old submissions may not have the anonymous field, default to true
    is_anonymous  = submission.get("anonymous", True)
    if not is_anonymous:
        cdl_users = Users()
        creator = cdl_users.find_one({"_id": ObjectId(submission["user_id"])})
        if creator:
            submission["username"] = creator.username

    # Now that we return usernames, need to delete this
    del submission["user_id"]

    display_time = format_time_for_display(submission["time"])

    submission["time"] = display_time

    # make display url
    # set to submission's own CDL URL if not included
    # used for text-only submissions now that source_url is optional
    text_only = False
    if submission["source_url"] == "":
        
        if "localhost" in os.environ["api_url"]:
            submission["source_url"] = os.environ["api_url"] + ":" + os.environ["api_port"] + "/submissions/" + submission["submission_id"]
        else:
            submission["source_url"] = os.environ["api_url"] + "/submissions/" + submission["submission_id"]
        text_only = True

    display_url = build_display_url(submission["source_url"])
    submission["display_url"] = display_url

    if text_only:
        submission["raw_source_url"] = ""
    else:
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

    all_connections = sorted(all_connections, reverse=True, key=lambda x: x.time)

    for connection in all_connections:
        cdl_logs = Logs()
        cdl_webpages = Webpages()

        target_connection = cdl_logs.find_one({"_id": connection.target_id})

        if not target_connection:
            target_connection = cdl_webpages.find_one({"_id": connection.target_id})

            if not target_connection:
                continue
            formatted_connection = format_webpage_for_display(target_connection, search_id)
            formatted_connection["connection_description"] = connection.description
            filtered_connections.append(formatted_connection)
            continue

        else:
            if target_connection.deleted == True:
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