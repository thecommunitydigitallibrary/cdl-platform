import json
import os
import re
import math

from bson import ObjectId, json_util
from flask import Blueprint, request, redirect
from flask_cors import CORS
from textblob import TextBlob
import traceback
import time
import random
import requests


from app.helpers.helpers import token_required, token_required_public, build_display_url, build_result_hash, build_redirect_url, \
    format_time_for_display, validate_submission, hydrate_with_hash_url, create_page, hydrate_with_hashtags, \
    deduplicate, combine_pages, standardize_url, extract_hashtags, format_url, build_display_url
from app.helpers import response
from app.helpers.helper_constants import RE_URL_DESC
from app.helpers.prompts import context_qgen_prompt, context_intent_qgen_prompt, contextquery_qgen_s1,\
    contextquery_qgen_s2, contextquery_qgen_s3, contextquery_qgen_prefix, context_qgen_prompt_beforesent,\
    context_qgen_prompt_aftersent
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
from app.models.submission_stats import SubmissionStats

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


def export_helper(user_id, search_id):
    all_results = []
    index = 0
    try:
        cache = Cache()
    except Exception as e:
        print(e)
        cache = None

    cdl_searches_clicks = SearchesClicks()
    cdl_logs = Logs()
    cdl_webpages = Webpages()
    prior_search = cdl_searches_clicks.find_one({"_id": ObjectId(search_id)})
    if prior_search:
        query = prior_search.query
        own_submissions = prior_search.own_submissions
        requested_communities = [str(x) for x in prior_search.community]
        search_time = prior_search.time
    else:
        query = None
        own_submissions = None
        requested_communities = None
        search_time = None
        print("Could not find prior search")

    if cache:
        number_of_hits, page = cache.search(user_id, search_id, index)
        all_results += page
        number_of_hits = int(number_of_hits)
        while number_of_hits > (index * 10) + 10:
            index += 1
            number_of_hits, page = cache.search(user_id, search_id, index)
            number_of_hits = int(number_of_hits)
            all_results += page

    # To query all the results in batch
    submission_ids_to_find = []
    webpages_ids_to_find = []
    for result in all_results:
        del result["redirect_url"]
        del result["display_url"]

        # submission_url is the textdata url to the submission
        # source_url is the external website (empty is there is none)
        result["submission_url"] = format_url("", result["submission_id"])
        if result["orig_url"] == result["submission_url"]:
            result["source_url"] = ""
        else:
            result["source_url"] = result["orig_url"]

        del result["orig_url"]

        del result["result_hash"]

        if result["type"] == "submission":
            submission_ids_to_find.append(ObjectId(result["submission_id"]))
        else:
            webpages_ids_to_find.append(ObjectId(result["submission_id"]))

        del result["highlighted_text"]

        result["title"] = result["explanation"]
        del result["explanation"]

        del result["username"]

        if "children" in result:
            del result["children"]

        del result["hashtags"]

    submissions = list(cdl_logs.find_db({'_id': {'$in': submission_ids_to_find}}))
    webpages = list(cdl_webpages.find_db({'_id': {'$in': webpages_ids_to_find}}))

    # Map to hold id -> result obj
    id_result_map = {}
    for sub in submissions:
        id_result_map[str(sub['_id'])] = sub

    for web in webpages:
        id_result_map[str(web['_id'])] = web

    for result in all_results:
        # Get the sub/web return from MongoDB
        curr = id_result_map[result["submission_id"]]
        if result["type"] == "submission":
            result["description"] = curr['highlighted_text']
        else:
            result["description"] = curr['webpage']["metadata"]["description"]

    return {
            "query": query,
            "own_submissions": own_submissions,
            "search_time": search_time,
            "requested_communities": requested_communities,
            "data": all_results,
        }

@functional.route("/api/export", methods=["GET"])
@token_required
def export(current_user):
    search_id = request.args.get("search_id", "")
    user_id = str(current_user.id)

    return response.success(export_helper(user_id, search_id), Status.OK)

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
        anonymous = req.get("anonymous", True)  # assume anonymous if not included
        # convert from extension
        if anonymous == "false":
            anonymous = False
        if anonymous == "true":
            anonymous = True

        message, status, submission_id = create_submission_helper(ip=ip, user_id=user_id,
                                                                  user_communities=user_communities,
                                                                  highlighted_text=highlighted_text,
                                                                  source_url=source_url, explanation=explanation,
                                                                  community=community, anonymous=anonymous)

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
            message, status, submission_id = create_submission_helper(ip=ip, user_id=user_id,
                                                                      user_communities=user_communities,
                                                                      highlighted_text=highlighted_text,
                                                                      source_url=source_url, explanation=explanation,
                                                                      community=community, anonymous=anonymous)

            if status == Status.OK:
                results[f'Submission {i}'] = {
                    "message": message,
                    "submission_id": str(submission_id),
                    "status": status
                }
            else:
                results[f'Submission {i}'] = {'message': message, 'status': status}
                errors.append(i)

        except Exception as e:
            print(e)
            error_message = "Failed to create submission, please try again later."
            error_status = Status.INTERNAL_SERVER_ERROR
            results[f'Submission {i}'] = {'message': error_message, 'status': error_status}
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
#@token_required
@token_required_public
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
					that also includes a list of added mentions.

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
                    if "#core" in list(set(extract_hashtags(old_record.explanation) + extract_hashtags(
                            old_record.highlighted_text))):
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
                        return response.error("You cannot remove a submission from its last community.",
                                              Status.BAD_REQUEST)
                    submission_communities[user_id] = [x for x in submission_communities[user_id] if x != community_id]
                else:
                    return response.error("You are not able to remove the submission from this community.",
                                          Status.UNAUTHORIZED)
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
                    if "#core" in list(set(extract_hashtags(current_submission.explanation) + extract_hashtags(
                            current_submission.highlighted_text))):
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
            # highlighted_text = sanitize_input()
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

                    # (try to) scrape the URL if we change it
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

            if submission.anonymous != anonymous:
                insert_obj["anonymous"] = anonymous

            update = cdl_logs.update_one({"_id": ObjectId(id)}, {"$set": insert_obj})

            if update.acknowledged:

                # a submission is added to a new community
                if community_id:
                    hashtags = list(
                        set(extract_hashtags(submission.highlighted_text) + extract_hashtags(submission.explanation)))
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

                # format source url to display new on frontend
                formattted_url = format_url(submission.source_url, str(submission.id))
                display_url = build_display_url(formattted_url)
                submission_username = None

                # if submission PATCHed to non-anonymous, get username
                if not submission.anonymous:
                    cdl_users = Users()
                    creator = cdl_users.find_one({"_id": ObjectId(submission.user_id)})
                    if creator:
                        submission_username = creator.username

                return response.success(
                    {"message": "Submission successfully edited.", "display_url": display_url, "hashtags": hashtags,
                     "username": submission_username}, Status.OK)
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

            # make requested communities a dict containing the name too, for display
            communities = get_communities_helper(current_user, return_dict=True)["community_info"]
            rc_dict = {}
            for community_id in communities:
                try:
                    rc_dict[community_id] = communities[community_id]["name"]
                except Exception as e:
                    print(e)
                    print(f"Could not find community for community id: {community_id}")

            try:
                is_deleted = submission.deleted
            except:
                is_deleted = False

            if submission and not is_deleted:
                community_submissions = {str(cid) for uid in submission.communities for cid in
                                         submission.communities[uid]}


                user_str_communities = {str(x): True for x in communities}
                submission_communities_not_joined_by_user = [x for x in community_submissions if x not in user_str_communities]

                # need to do this all of the time now
                # then pass the desired formatted community object to format submission
                comm_db = Communities()
                all_public = {}
                for community in submission_communities_not_joined_by_user:
                   found_comm = comm_db.find_one({"_id": ObjectId(community)})
                   if found_comm.public:
                       all_public[community] = found_comm
                  
                # Case where user is a member of the community that the submission is in
                for community in communities:
                    if str(community) in community_submissions:
                        search_id = log_submission_view(ip, user_id, submission.id).inserted_id
                        submission = format_submission_for_display(submission, current_user, search_id, all_public)
                        submission["mentions"] = find_mentions(ObjectId(id), rc_dict, current_user, search_id)
                        return response.success({"submission": submission}, Status.OK)

                # Case where user is the original submitter but it has been removed from all communities.
                if str(submission.user_id) == str(user_id):
                    search_id = log_submission_view(ip, user_id, submission.id).inserted_id
                    submission = format_submission_for_display(submission, current_user, search_id, all_public)
                    submission["mentions"] = find_mentions(ObjectId(id), rc_dict, current_user, search_id)
                    return response.success({"submission": submission}, Status.OK)
                
                # case where the submission's communities are public. if so, break into log and format
                # and user is not a member of any and a user did not submit it
                if all_public:
                    search_id = log_submission_view(ip, user_id, submission.id).inserted_id
                    submission = format_submission_for_display(submission, current_user, search_id, all_public)
                    submission["mentions"] = find_mentions(ObjectId(id), rc_dict, current_user, search_id)
                    return response.success({"submission": submission}, Status.OK)



                
                return response.error("You do not have access to this submission.", Status.FORBIDDEN)
            elif not submission:
                try:
                    webpage = cdl_webpages.find_one({"_id": ObjectId(id)})
                    if webpage:
                        search_id = log_submission_view(ip, user_id, webpage.id).inserted_id
                        submission = format_webpage_for_display(webpage, search_id)
                        submission["mentions"] = find_mentions(ObjectId(id), rc_dict, current_user, search_id)
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
    explanation = submission_data.webpage.get("metadata", {}).get("title",
                                                                  "") if is_webpage else submission_data.explanation
    highlighted_text = submission_data.webpage.get("metadata", {}).get("description",
                                                                       "") if is_webpage else submission_data.highlighted_text

    query = f"{explanation}"  # {highlighted_text}"[:1000]

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
    for x in current_user.followed_communities:
        x = str(x)
        if x not in user_communities:
            user_communities.append(x)

    try:
        _, submissions_hits = elastic_manager.auto_complete(query, user_communities, page=0, page_size=20)
        seen_titles = {}
        suggestions = []
        for x in submissions_hits:
            label = x["_source"]["explanation"]
            id = x["_id"]
            url = format_url("", id)
            if label in seen_titles:
                continue
            else:
                seen_titles[label] = True
            suggestions.append({"label": label, "id": id, "url": url})
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
                contextual_qa : given a context and a portion of a query, generate some questions
                gen_questions: given a context, generate some questions
                summarize : given a context, summarize the selection
                web: given a question, open a tab and search the web
                summary_rag: given search results, summarize them all 
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

    # limit both to 100 characters
    context = req.get("context", "")[:1000]
    query = req.get("query", "")[:1000]
    mode = req.get("mode", "")
    url = req.get("url", "")
    search_id = req.get("search_id", "")

    if not mode or mode not in ["qa", "summarize", "gen_questions", "contextual_qa", "web", "summary_rag"]:
        return response.error("Mode missing or unsupported.", Status.BAD_REQUEST)

    if mode == "web":
        log_recommendation_request(ip, user_id, user_communities, method=mode,
                                   metadata={"context": context, "query": query, "output": "", "version": "0.1",
                                             "url": url})
        return response.success({"output": "https://www.google.com/search?q=" + query}, Status.OK)
    
    elif mode == "qa":
        if not query:
            return response.error("Query required for question-answer mode.", Status.BAD_REQUEST)
        prompt = "Answer the following question with fewer than 100 words. Question: " + query + ". Answer: "

    elif mode == "contextual_qa":
        if not context:
            return response.error("Context required for in-context question generation.", Status.BAD_REQUEST)
        if not query:
            return response.error("Query required for in-context question generation.", Status.BAD_REQUEST)
        
        prompt = context_intent_qgen_prompt + '"' + context + '" INTENT: ' + query + '" --> QUESTIONS:'        

    elif mode == "gen_questions":
        if not context:
            return response.error("Context required for question generation.", Status.BAD_REQUEST)

        prompt = context_qgen_prompt + '"' + context + '" --> QUESTIONS:'

    elif mode == "summarize":
        if not context:
            return response.error("Context required for summarization.", Status.BAD_REQUEST)
        prompt = context + "... Please summarize the previous text, and only reply with the summary. Summary: "

    elif mode == "summary_rag":
        if not search_id:
            return response.error("search_id is required for summarizing search results", Status.BAD_REQUEST)
        exported_results = export_helper(user_id=str(user_id), search_id=str(search_id))['data']
        if len(exported_results)==1:
            return response.error("Single Search Result cannot be summarized", Status.BAD_REQUEST)
        else:  
            all_results = [{"Title "+str(index+1): item['title'] + ". 'Description' - " +item['description'][:100]} for index, item in enumerate(exported_results[:10])]
            context='You are a helpful assistant that summarizes multiple notes about a given topic, clusters important themes, and provides a comprehensive summary of all notes across all the themes.'
            to_ask_1 = f"""\
            The following are a set of text notes known by me - 
            {all_results}
            Take these and distill it into a final summary of the main themes, without listing them. 
            Answer: 
            """
        prompt = context + to_ask_1

    neural_api = os.environ.get("neural_api")
    if not neural_api:
        return response.error("Generation not currently supported.", Status.NOT_IMPLEMENTED)
    try:
        resp = requests.post(neural_api + "/neural/generate", json={"input": prompt})
        resp_json = resp.json()

        if resp.status_code == 200:
            output = resp_json["output"]

            try:
                output = json.loads(output)
                q1 = output.get("1", "")
                q2 = output.get("2", "")
                q3 = output.get("3", "")
                output = "\n".join([x for x in [q1, q2, q3] if x])
            except:
                pass

            log_recommendation_request(ip, user_id, user_communities, method=mode,
                                       metadata={"context": context, "query": query, "output": output, "version": "0.1",
                                                 "url": url})
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
    # paragraphs = req.get("paragraphs").get("paragraphs")

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
        so we restrict results to max of ten. if not 10 own subs matching, the fill the rest with community
        """
        if keywords and len(ht_stats["submitted_you"]["results"]) < 10:
            metadata["subset"] = "community_submissions"
            recommendation_id, _ = log_recommendation_request(ip, user_id, user_communities, "compare",
                                                              metadata=metadata)
            recommendation_id = str(recommendation_id)
            _, hits = cache_search(" ".join(keywords), recommendation_id, 0, rc_dict, str(user_id),
                                   own_submissions=False,
                                   toggle_webpage_results=False, url_core_retrieve=url, method="recommendation")
            if hits:
                remaining_keywords, used_keywords, results, seen_urls = process_keywords_hits(keywords, hits, seen_urls)
                ht_stats["submitted_community"]["keywords"] = used_keywords
                ht_stats["submitted_community"]["results"] = results[:10 - len(ht_stats["submitted_you"]["results"])]
                keywords = remaining_keywords

        # finally search over all webpages
        # removed for new, but will add back after extension refactoring to avoid typing lag
        if False:
            metadata["subset"] = "auto_indexed"
            recommendation_id, _ = log_recommendation_request(ip, user_id, user_communities, "compare",
                                                              metadata=metadata)
            recommendation_id = str(recommendation_id)
            _, hits = cache_search(" ".join(keywords), recommendation_id, 0, rc_dict, str(user_id),
                                   own_submissions=False,
                                   toggle_webpage_results=True, url_core_retrieve=False,
                                   toggle_submission_results=False, method="recommendation")

            if hits:
                remaining_keywords, used_keywords, results, seen_urls = process_keywords_hits(keywords, hits, seen_urls)
                ht_stats["indexed_cdl"]["keywords"] = used_keywords
                ht_stats["indexed_cdl"]["results"] = results
                keywords = remaining_keywords

    return response.success({"analyzed_ht": ht_stats}, Status.OK)


def search_sort_by(user_id,search_id,sort_by):
    '''
    Function to sort cached search results by relevance, popularity, date 
    Arguments:
        user_id: Object Id of the user 
        search_id: search_id
        sort_by: relevant, popularity or date
    Returns:
		None
    '''
    user_id = user_id
    search_id = search_id
    sort_by = sort_by
    name = user_id + '-' + search_id
    sorted_submissions = []
    cache = Cache()
    all_values = cache.hash_vals(name)
    submissions = SubmissionStats()
  
    all_submissions = list()
    for pages in all_values:
        pages = json.loads(pages)
        if isinstance(pages,int):
            pass
        else:
            for submission in pages: 
                all_submissions.append(submission)
   
    if sort_by == 'date':
        sorted_submissions = sorted(all_submissions,reverse=True,key = lambda x :x['time'])
    elif sort_by == 'popularity': 
        for x in all_submissions:
            metrics = submissions.find_one({"submission_id":ObjectId(x["submission_id"])})
            # because we did not backfill
            if not metrics:
                clicks = metrics.search_clicks + metrics.recomm_clicks
                views = metrics.views
                upvotes = metrics.likes
                downvotes = metrics.dislikes if metrics.dislikes > 0 else 1
            else:
                clicks = 0
                views = 0
                upvotes = 0
                downvotes = 1
            penalize = 0.6*downvotes if downvotes > 1 else 1 # > 1 coz if 1, then penalize = 0.6, which would increase the score
            rewards = 0.6* upvotes + 0.1* views + 0.5* clicks
            metrics_score = 1 + math.log10(1 + (rewards /penalize)) #always greater than score
            x["popularity"] = x["score"] * metrics_score

           

        sorted_submissions = sorted(all_submissions,reverse=True,key = lambda x :float(x['popularity']))

    elif sort_by == 'relevance':
        sorted_submissions = sorted(all_submissions,reverse=True,key = lambda x :float(x['score']))

    all_page_keys = cache.hash_keys(name)
    all_page_keys.remove("number_of_hits")
    reranked_pages = list()
    for page_no in all_page_keys:
        page_no = int(page_no)
        start, end =  page_no*10, page_no*10 + 10
        reranked_page = hydrate_with_hash_url(sorted_submissions[start:end],search_id,page_no)
       
        reranked_pages.extend(reranked_page)
   
    def sort_by_hash_rank(x):
        result_hash = x['result_hash']
        rank = int(result_hash.split("_")[0])
        return rank
    reranked_pages.sort(key = sort_by_hash_rank)

    cache.insert(user_id,search_id,reranked_pages,page_no)
   

@functional.route("/api/search", methods=["GET"])
#@token_required
@token_required_public
def search(current_user):
    """
	Endpoint for the webpage search functionality.
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		request args with:
			query : (string) : the typed query of the user.
			community: (string) : the community currently being searched.
			page : (int) : the page number of be returned (if not included, sets to 0)
            own_submissions : (boolean) : true to search only over your own submissions
            source : (str) : indicates the type of search
                webpage_search
                extension_search
                visualize
                note_automatic
                extension_open
                sidebar

                
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
       

        # combine joined and followed communities
        user_communities = current_user.communities
        for x in current_user.followed_communities:
            if x not in user_communities:
                user_communities.append(x)

        # flag for searching over webpage index
        toggle_webpage_results = True

        query = request.args.get("query", "")
        source = request.args.get("source", "webpage_search")
        sort_by = request.args.get("sort_by") if "sort_by" in request.args else None
        requested_communities = request.args.get("community")

        if requested_communities == "all":
            ALL_COMM_FLAG = True
        else:
            ALL_COMM_FLAG = False

        own_submissions = request.args.get("own_submissions", False)

        if own_submissions:
            toggle_webpage_results = False

        if query == "" and requested_communities == "all" and own_submissions == False and source in ["webpage_search",
                                                                                                      "extension_search",
                                                                                                      "visualize"]:
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

        rc_dict_public = {}

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


                ## if community is public, allow search

                if requested_communities[0] not in user_communities:
                    comm_db = Communities()
                    found_comm = comm_db.find_one({"_id": requested_communities[0]})
                    if not found_comm or found_comm.public == False:
                        return response.error("You do not have access to this community.", Status.FORBIDDEN)
                    else:
                        rc_dict_public[str(requested_communities[0])] = found_comm.name
            # convert communities to str for elastic
            requested_communities = [str(x) for x in requested_communities]

            # Create a new search_id (as it is the first search by the user)
            search_id, _ = log_search(ip, user_id, source, query, requested_communities, own_submissions, url=url,
                                      highlighted_text=highlighted_text)
            search_id = str(search_id)  # for return
            

        # if the search_id is included, then the user is looking for a specific page of a previous search or sort_by field has changed
        else:
            if sort_by != None:
                search_sort_by(str(user_id),search_id,sort_by)
                
            cdl_searches_clicks = SearchesClicks()
            prior_search = cdl_searches_clicks.find_one({"_id": ObjectId(search_id)})
            if prior_search:
                query = prior_search.query
                own_submissions = prior_search.own_submissions
                requested_communities = [str(x) for x in prior_search.community]
                #prev_sort_by = prior_search.sort_by


                # case where user is paging a public, non-joined community
                if len(requested_communities) == 1:
                    obj_id_first_comm = ObjectId(requested_communities[0])
                    if  obj_id_first_comm not in user_communities:
                        comm_db = Communities()
                        found_comm = comm_db.find_one({"_id": obj_id_first_comm})
                        if found_comm and found_comm.public:
                            rc_dict_public[str(obj_id_first_comm)] = found_comm.name
                        else:
                            return response.error("You do not have access to this community.", Status.FORBIDDEN)
            else:
                return response.error("Cannot find search to page.", Status.NOT_FOUND)

        # turn off webpages for searching via hashtag
        if query and "#" in query:
            toggle_webpage_results = False

        # make requested communities a dict containing the name too, for display
        communities = get_communities_helper(current_user, return_dict=True)["community_info"]

        # add any public communities that the user requests
        rc_dict = {}
        if rc_dict_public:
            for x in rc_dict_public:
                rc_dict[x] = rc_dict_public[x]
        for community_id in requested_communities:
            if community_id in rc_dict_public: continue
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


        if ALL_COMM_FLAG:
            return_obj["requested_communities"] = {"all": "all"}
        else:
            return_obj["requested_communities"] = rc_dict

        user_id_str = str(user_id)

        total_num_results, search_results_page = cache_search(query, search_id, page, rc_dict, user_id=user_id_str,
                                                              own_submissions=own_submissions,
                                                              toggle_webpage_results=toggle_webpage_results,
                                                              url_core_retrieve=URL_CORE_RETRIEVE)

        return_obj["total_num_results"] = total_num_results
        return_obj["search_results_page"] = search_results_page

        # Return nodes and edges for Homepage visualisation
        if source == "visualizeConnections":
            # Call export with this `search_id` -> list of submissions for that search -> exported_list
            submissions = export_helper(user_id_str, search_id)

            # Prepare a dict to map where a submission is mentioned
            sub_mentions = {}
            for obj in submissions['data']:
                mentions = re.finditer(RE_URL_DESC, obj['description'])
                for mention in mentions:
                    par_sub_id = mention.group(0)[-24:]
                    if sub_mentions.get(par_sub_id):
                        sub_mentions[par_sub_id].append(obj['submission_id'])
                    else:
                        sub_mentions[par_sub_id] = [obj['submission_id']]

            # Using sub_mentions dict to create mentions
            for obj in submissions['data']:
                curr_id = obj['submission_id']
                obj["mentions"] = sub_mentions.get(curr_id, [])

            graph_data = prep_subs_viz_conns(submissions['data'])
            return response.success(graph_data, Status.OK)

        # Return nodes and links for community visualisation
        if source == "visualize":
            # assume single community when query is empty
            root_label = rc_dict[list(rc_dict.keys())[0]] if query == "" else query
            #root_label = communities[community_id]['name'] if query == "" else query

            # Get levels filter info
            if request.args.get("levelfilter"):
                levels = request.args.get("levelfilter").split(";")
            else:
                levels = ["topics", "hashtags", "metadescs"]

            for i in range(10, total_num_results, 10):
                _, additional_results = cache_search(query, search_id, i / 10, rc_dict, user_id=user_id_str,
                                                     own_submissions=own_submissions,
                                                     toggle_webpage_results=toggle_webpage_results,
                                                     url_core_retrieve=URL_CORE_RETRIEVE)

                search_results_page = search_results_page + additional_results
                if i > 1000: break

            # If ownSubmissions requested, get user's submissions
            if "ownSubmissions" in levels:
                # Creating a new search_id to avoid retrieving cached results from previous search
                search_id, _ = log_search(ip, user_id, source, query, requested_communities, own_submissions=True,
                                          url=url,
                                          highlighted_text=highlighted_text)
                search_id = str(search_id)

                total_sub_num_results, sub_search_results_page = cache_search(query, search_id, page, rc_dict,
                                                                              user_id=user_id_str,
                                                                              own_submissions=True,
                                                                              toggle_webpage_results=False,
                                                                              url_core_retrieve=URL_CORE_RETRIEVE)

                for i in range(10, int(total_sub_num_results), 10):
                    _, additional_submissions_results = cache_search(query, search_id, i / 10, rc_dict,
                                                                     user_id=user_id_str,
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
def get_recommendations(current_user, toggle_webpage_results=True):
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
        for x in current_user.followed_communities:
            x = str(x)
            if x not in requested_communities:
                requested_communities.append(x)
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

        communities = get_communities_helper(current_user, return_dict=True)
        combined_joined_followed = {}
        for x in communities["community_info"]:
            combined_joined_followed[x] = communities["community_info"][x]
        for x in communities["followed_community_info"]:
            combined_joined_followed[x] = communities["followed_community_info"][x]

        communities = combined_joined_followed
        
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
                    source_urls = {str(x.source_url) for x in user_latest_submissions}  # potential change to urls
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


@functional.route("/api/submission/recentlyaccessed", methods=["GET"])
@token_required
def get_recently_accessed_submissions(current_user):
    try:
        user_id = current_user.id
        query = [
            {
                '$match': {
                    'user_id': user_id,
                    'type': 'submission_view'
                }
            }, {
                '$group': {
                    '_id': '$submission_id',
                    'mostRecentTime': {
                        '$max': '$time'
                    }
                }
            }, {
                '$lookup': {
                    'from': 'logs',
                    'localField': '_id',
                    'foreignField': '_id',
                    'as': 'logs_info'
                }
            }, {
                '$match': {
                    'logs_info': {
                        '$not': {
                            '$elemMatch': {
                                'deleted': {
                                    '$exists': True
                                }
                            }
                        }
                    }
                }
            }, {
                '$sort': {
                    'mostRecentTime': -1
                }
            }, {
                '$project': {
                    '_id': 0,
                    'submission_id': '$_id',
                    'source_url': '$logs_info.source_url',
                    'explanation': '$logs_info.explanation',
                    'communities': '$logs_info.communities'
                }
            }, {
                '$unwind': {
                    'path': '$explanation',
                    'preserveNullAndEmptyArrays': True
                }
            }, {
                '$unwind': {
                    'path': '$source_url',
                    'preserveNullAndEmptyArrays': True
                }
            }, {
                '$unwind': {
                    'path': '$community',
                    'preserveNullAndEmptyArrays': True
                }
            }, {
                '$limit': 12
            }
        ]
        cdl_logs = SearchesClicks()
        user_recent_submissions = cdl_logs.aggregate(query)
        user_recent_submissions_list = list(user_recent_submissions)
        json_user_recent_submissions_list = json.loads(json_util.dumps(user_recent_submissions_list))
        updated_user_recent_submissions_list = []
        for item in json_user_recent_submissions_list:
            submission_id_value = item["submission_id"]["$oid"]
            submission_url = format_url("", submission_id_value)
            try:
                updated_item = {
                    "explanation": item["explanation"],
                    "submission_url": submission_url
                }
                updated_user_recent_submissions_list.append(updated_item)
            except Exception as e:
                print(e)
                traceback.print_exc()
        return updated_user_recent_submissions_list

    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Failed to get recently accessed submissions, please try again later.",
                              Status.INTERNAL_SERVER_ERROR)

### HELPERS that cannot be removed (yet)###

def create_submission_helper(ip=None, user_id=None, user_communities=None, highlighted_text=None, source_url=None,
                             explanation=None, community=None, anonymous=True):
    # assumed string, so check to make sure is not none
    if highlighted_text == None:
        highlighted_text = ""

    # if highlighted_text:
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

        # not used on create from webpage, so copy-pasted to
        # PATCH if URL is updated
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


def cache_search(query, search_id, index, communities, user_id, own_submissions=False, toggle_webpage_results=True,
                 url_core_retrieve=None, toggle_submission_results=True, method="search"):
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

    page = []
    number_of_hits = -1
    try:
        cache = Cache()
    except Exception as e:
        print(e)
        cache = None
    print("\tcache start time: ", time.time() - start_time)

    if cache and search_id != "":
        print("\t\tLooking in cache...")
        number_of_hits, page = cache.search(user_id, search_id, index)
    else:
        print("\t\tCannot find cache")

    print("\tcache end time: ", time.time() - start_time)

    print("\t\tCache page status: ", number_of_hits)

    # If we cannot find cache page, (re)do the search
    if number_of_hits == -1:

        if query == "":
            # Case where we are viewing own submissions
            """
            If the length of requested communities is 1, then add the additional filter of the community id
            Used for finding all submissions in a community that are submitted by the user
            """
            if own_submissions:
                req_communities = list(communities.keys())
                if len(req_communities) == 1:
                    number_of_hits, hits = elastic_manager.get_submissions(user_id, community_id=req_communities[0],
                                                                           page=0, page_size=10000)
                else:
                    number_of_hits, hits = elastic_manager.get_submissions(user_id, page=0, page_size=10000)

            # Case where we are viewing all submissions to a community
            else:
                number_of_hits, hits = elastic_manager.get_community(list(communities.keys())[0], page=0, page_size=10000)
            submission_pages = create_page(hits, communities)
        else:
            if toggle_submission_results:
                # when query is not empty and own_submissions is true, send user id to search to scope it
                if own_submissions:
                    _, submissions_hits = elastic_manager.search(query, list(communities.keys()), user_id=str(user_id),
                                                                 page=0, page_size=1000)
                else:
                    _, submissions_hits = elastic_manager.search(query, list(communities.keys()), page=0,
                                                                 page_size=1000)

                if url_core_retrieve != None:
                    url = standardize_url(url_core_retrieve)
                    all_core_content = CommunityCores()
                    for community_id in communities.keys():
                        community_core = all_core_content.find_one({"community_id": ObjectId(community_id)})
                        if community_core:
                            if url in community_core.core_content:
                                core_hashtags = list(community_core.core_content[url].keys())
                                core_hashtags = list(set(core_hashtags))
                                _, core_hits = elastic_manager.search(" ".join(core_hashtags), [community_id], page=0,
                                                                      page_size=1000)

                                # to put on top (in slightly random order)
                                for hit in core_hits:
                                    rand_int = random.randint(0, 10)
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
            if False:  # "neural_api" in os.environ:
                try:
                    resp = requests.post(os.environ["neural_api"] + "neural/rerank/",
                                         json={"pages": submissions_pages, "query": query})
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

            submission_pages = sorted(submissions_pages, reverse=True, key=lambda x: x["score"])

            # issue is now that note pages can have same source url but different content
            # moved inside search
            submission_pages = deduplicate(submission_pages)
            print("\tDedup: ", time.time() - start_time)

        pages = hydrate_with_hash_url(submission_pages, search_id, page=index, method=method)
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
        "shares": 0,
        "likes": 0,
        "dislikes":0
    }
    cdl_submission_stats = SubmissionStats()
    submission_stats = cdl_submission_stats.find_one({"submission_id": submission["submission_id"]})
    submission["stats"]["clicks"] = submission_stats.search_clicks +  submission_stats.recomm_clicks
    submission["stats"]["views"] = submission_stats.views
    submission["stats"]["likes"] = submission_stats.likes
    submission["stats"]["dislikes"] = submission_stats.dislikes
    # cdl_searches_clicks = SearchesClicks()
    # num__search_clicks = cdl_searches_clicks.count({"submission_id": submission["submission_id"], "type": "click_search_result"})
    # submission["stats"]["clicks"] = num__search_clicks

    # cdl_recommendations_clicks = RecommendationsClicks()
    # num_rec_clicks = cdl_recommendations_clicks.count({"submission_id": submission["submission_id"]})
    # submission["stats"]["clicks"] += num_rec_clicks

    # num_views = cdl_searches_clicks.count({"submission_id": submission["submission_id"], "type": "submission_view"})
    # submission["stats"]["views"] = num_views

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

    submission["mentions"] = []

    submission["type"] = "webpage"

    return submission


def format_submission_for_display(submission, current_user, search_id, submission_public_communities):
    """
	Helper method to format a raw mongodb submission for frontend display.
	Mostly takes the original format, except removes any unnecessary information.
	Arguments:
		submission : dict : the submission object downloaded from mongodb.
		current_user : the User object of the current user.
		communities : list : list of communities that the user is a member of
		search_id : ObjectID : the id of the view submission log (for tracking clicks)
        submission_public_communities : dict : a dict of the submission's communities that are public
	Returns:
		submission : dict : a slightly-modified submission object.
	"""
    # get some stats
    submission = submission.to_dict()

    user_id = current_user.id

    submission["stats"] = {
        "views": 0,
        "clicks": 0,
        "shares": 0,
        "likes": 0,
        "dislikes":0
    }
    num_shares = sum([len(submission["communities"][str(id)]) for id in submission["communities"]])
    submission["stats"]["shares"] = num_shares
    
    cdl_submission_stats = SubmissionStats()
    submission_stats = cdl_submission_stats.find_one({"submission_id": submission["_id"]})
    #print("Submission stats function.py",submission_stats)
    submission["stats"]["clicks"] = submission_stats.search_clicks +  submission_stats.recomm_clicks
    submission["stats"]["views"] = submission_stats.views
    submission["stats"]["likes"] = submission_stats.likes
    submission["stats"]["dislikes"] = submission_stats.dislikes

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
    hydrated_user_communities = get_communities_helper(current_user, return_dict=True)["community_info"]

    for community_id in hydrated_user_communities:
        if community_id in user_contributed_communities:
            hydrated_user_communities[community_id]["valid_action"] = "remove"
        elif community_id in all_added_communities:
            hydrated_user_communities[community_id]["valid_action"] = "view"
        else:
            hydrated_user_communities[community_id]["valid_action"] = "save"

        del hydrated_user_communities[community_id]["is_admin"]
        if "join_key" in hydrated_user_communities[community_id]:
            del hydrated_user_communities[community_id]["join_key"]
        del hydrated_user_communities[community_id]["community_id"]

    submission["communities"] = hydrated_user_communities

    submission["communities_part_of"] = {str(x): hydrated_user_communities[x]["name"]
                                         for x in hydrated_user_communities
                                         if hydrated_user_communities[x]["valid_action"] != "save"}
    
    submission["public_communities_part_of"] = {x: submission_public_communities[x].name for x in submission_public_communities}

    # TODO can only add and remove from community when it is your own submission?

    # TODO remove and make this a different UI
    # for now, just add to communities part of
    for x in submission["public_communities_part_of"]:
        submission["communities_part_of"][x] = submission["public_communities_part_of"][x]

    # convert some ObjectIDs to strings for serialization
    submission["submission_id"] = str(submission["_id"])

    # Old submissions may not have the anonymous field, default to true
    is_anonymous = submission.get("anonymous", True)
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
            submission["source_url"] = os.environ["api_url"] + ":" + os.environ["api_port"] + "/submissions/" + \
                                       submission["submission_id"]
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


def find_mentions(submission_id, user_communities, current_user, search_id):
    """
	Helper method for getting the mentions. Searches and matches the submission ID
	Arguments:
		submission_id : ObjectID : the ObjectID of the source submission.
		user_communities : list : a list of ObjectIDs, ids of communities accessible by user.
		current_user : the User object of the current user
		search_id : ObjectID : the id of the view submission log (for tracking clicks).

	Returns:
		hits : list : a list of submissions formatted according to format_submission_for_display
	"""

    user_id = current_user.id

    _, hits = cache_search(str(submission_id), str(search_id), 0, user_communities, str(user_id), method="search")

    return hits


def prep_subs_viz_conns(result_list):
    '''
    Function to convert the submissions to nodes and edges for connection viz.

    Arguments:
        result_list: List: A list of submissions in JSON format (JSON obtained from export_helper).

    Returns:
        graph_data: Dict: A dict containing nodes and edges.
    '''
    nodes = []
    edges = []

    for result in result_list:
        node = {
            "id": result['submission_id'],
            "label": result['title'][:20]+"..." if len(result['title']) > 20 else result['title'],
            "title": result['title'],
            "shape": "dot",
            "color": "#1876d2",
            "value": 8,
            "url": result['submission_url'],
        }
        nodes.append(node)

        if len(result["mentions"]) > 0:
            for child_id in result["mentions"]:
                edge = {
                    "from": result['submission_id'],
                    "to": child_id
                }
                edges.append(edge)

    return {"nodes": nodes, "edges": edges}
    