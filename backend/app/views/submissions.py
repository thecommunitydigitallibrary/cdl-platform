import json
import os

from bson import ObjectId, json_util
from flask import Blueprint, request
from flask_cors import CORS
import traceback
import time
import validators



from app.helpers.helpers import token_required, token_required_public, build_display_url,\
    format_time_for_display, hydrate_with_hashtags, \
    extract_hashtags, format_url, build_display_url, get_communities_helper, publish_to_queue
from app.helpers import response
from app.helpers.status import Status
from app.models.communities import Communities
from app.models.logs import Logs, Log
from app.models.community_logs import CommunityLogs, CommunityLog
from app.models.searches_clicks import SearchesClicks
from app.models.user_feedback import UserFeedbacks, UserFeedback
from elastic.manage_data import ElasticManager
from app.models.users import Users
from app.models.submission_stats import SubmissionStats
from app.models.judgment import *
from app.models.relevance_judgements import *
from app.views.search import get_mentions

submissions = Blueprint('submissions', __name__)
CORS(submissions)

# Connect to elastic for submissions index operations
elastic_manager = ElasticManager(
    os.environ["elastic_username"],
    os.environ["elastic_password"],
    os.environ["elastic_domain"],
    os.environ["elastic_index_name"],
    None,
    "submissions")

	
@submissions.route("/api/submission", methods=["POST"])
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
        community = Communities().find_one({"_id": ObjectId(community)})
        if status == Status.OK:
            publish_msg ={
                'notify_timestamp':time.time(),
                'notify_type':'new submission',
                'notify_read':False,
                'notify_delivered':False,
                'community':str(community.id), 
                'notify_src_email':current_user.email,
                'notify_msg': f'{current_user.username} has made a new submission titled {explanation} to the {community.name} community'
            }
            publish_to_queue('add_submission',publish_msg)
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


@submissions.route("/api/submission/batch", methods=["POST"])
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


@submissions.route("/api/feedback", methods=["POST"])
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


@submissions.route("/api/submission/<id>", methods=["DELETE", "GET", "PATCH"])
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

            if submission.anonymous != anonymous:
                insert_obj["anonymous"] = anonymous

            update = cdl_logs.update_one({"_id": ObjectId(id)}, {"$set": insert_obj})

            if update.acknowledged:
                # the url/text of a submission is changed
                # the submission has the exact same hashtags
                # the submission has different hashtags
                # others changed

                old_source_url = submission.source_url

                hashtags = []
                OLD_CORE_FLAG = False

                if "highlighted_text" in insert_obj:
                    hashtags += extract_hashtags(highlighted_text)
                    old_hashtags = extract_hashtags(submission.highlighted_text)
                    submission.highlighted_text = highlighted_text
                else:
                    hashtags += extract_hashtags(submission.highlighted_text)

                if "explanation" in insert_obj:
                    hashtags += extract_hashtags(explanation)
                    old_hashtags = extract_hashtags(submission.explanation)
                    submission.explanation = explanation
                else:
                    hashtags += extract_hashtags(submission.explanation)

                if "source_url" in insert_obj:
                    submission.source_url = source_url

                if "anonymous" in insert_obj:
                    submission.anonymous = anonymous

                deleted_index_status = elastic_manager.delete_document(id)
                added_index_status, hashtags = elastic_manager.add_to_index(submission)


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
            try:
                submission = cdl_logs.find_one({"_id": ObjectId(id)})
            except Exception as e:
                print(e)
                traceback.print_exc()
                return response.error("Invalid submission ID", Status.NOT_FOUND)
            
            communities = current_user.communities
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
                        #submission["mentions"] = find_mentions(ObjectId(id), rc_dict, current_user, search_id)
                        submission["mentions"] = get_mentions(str(user_id), id, list(rc_dict.keys()))
                        return response.success({"submission": submission}, Status.OK)

                # Case where user is the original submitter but it has been removed from all communities.
                if str(submission.user_id) == str(user_id):
                    search_id = log_submission_view(ip, user_id, submission.id).inserted_id
                    submission = format_submission_for_display(submission, current_user, search_id, all_public)
                    #submission["mentions"] = find_mentions(ObjectId(id), rc_dict, current_user, search_id)
                    submission["mentions"] = get_mentions(str(user_id), id, list(rc_dict.keys()))
                    return response.success({"submission": submission}, Status.OK)
                
                # case where the submission's communities are public. if so, break into log and format
                # and user is not a member of any and a user did not submit it
                if all_public:
                    search_id = log_submission_view(ip, user_id, submission.id).inserted_id
                    submission = format_submission_for_display(submission, current_user, search_id, all_public)
                    #submission["mentions"] = find_mentions(ObjectId(id), rc_dict, current_user, search_id)
                    submission["mentions"] = get_mentions(str(user_id), id, list(rc_dict.keys()))
                    return response.success({"submission": submission}, Status.OK)



                
                return response.error("Cannot find submission.", Status.NOT_FOUND)
            else:
                return response.error("Cannot find submission.", Status.NOT_FOUND)
    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Failed to create submission, please try again later.", Status.INTERNAL_SERVER_ERROR)



@submissions.route("/api/submission/recentlyAccessed", methods=["GET"])
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



@submissions.route("/api/submitRelJudgments", methods=["POST"])
@token_required
def submit_rel_judgments(current_user):
	"""
	Endpoint for submitting a relevance judgment
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
		request data (website) with a mapping between result IDs and 1/0 labels.
			Example:
				{"63094100d999b482814f371c: "1"}
				where
				63094100d999b482814f371c is the submission id

				This result ID should be included in the search result items.
	Returns:
		200 : JSON with "status" as "ok" and a success "message".
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
		traceback.print_exc()
		return response.error("Failed to submit relevant judgement, please try again later.",
		                      Status.INTERNAL_SERVER_ERROR)


@submissions.route("/api/submission/fetchSubmissionStats", methods=["GET"])
#@token_required
@token_required_public
def fetch_submission_stats(current_user):
	"""
	Endpoint for submitting a relevance judgment
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
	Returns
		200 : JSON with "status" as "ok" and a success "data" that has like and dislike counts for a particular submission.
	"""
	try:
		submission_id = request.args.get("submissionId")
		if not submission_id:
			return response.error("Submission ID is missing", Status.BAD_REQUEST)
		stats = SubmissionStats()
		submission_stats = stats.find_one({"submission_id":ObjectId(submission_id)})
		if submission_stats:
			submission_stats_dict = {
				"likes": submission_stats.likes,
				"dislikes": submission_stats.dislikes 
			}	
			return response.success({"data": submission_stats_dict}, Status.OK)
	
		return response.error("Something went wrong. Please try again later", Status.INTERNAL_SERVER_ERROR)
	except Exception as e:
		print(e)
		traceback.print_exc()
		return response.error("Failed to retrieve submission stats, please try again later.",
		                      Status.INTERNAL_SERVER_ERROR)


@submissions.route("/api/fetchSubmissionJudgement", methods=["GET"])
#@token_required
@token_required_public
def fetch_submission_judgement(current_user):
	"""
	Endpoint for submitting a relevance judgment
	Arguments:
		current_user : (dictionary): the user recovered from the JWT token.
	Returns
		200 : JSON with "status" as "ok" and a success "data" with user's choice for a particular submission.
	"""
	try:
		user_id = ObjectId(current_user.id)
		submission_id = request.args.get("submissionId")
		if not submission_id:
			return response.error("Submission ID is missing", Status.BAD_REQUEST)
		
		judgements = Relevance_Judgements()
		user_judgement = judgements.find_one({"submission_id":ObjectId(submission_id),"user_id":user_id})
		
		if user_judgement:
			return response.success({"data": str(user_judgement.relevance)}, Status.OK)
		else:
			return response.success({"data": str(-1)}, Status.OK)
	
	except Exception as e:
		print(e)
		traceback.print_exc()
		return response.error("Failed to retrieve user-submission judgement, please try again later.",
		                      Status.INTERNAL_SERVER_ERROR)


### Helpers ###

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


        return "Context successfully submitted and indexed.", Status.OK, status.inserted_id

    else:
        return "Unable to make submission. Please try again later.", Status.INTERNAL_SERVER_ERROR, None



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
    # set to submission's own URL if not included
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

    redirect_url = submission["source_url"]
    submission["redirect_url"] = redirect_url

    # hydrate with hashtags
    hashtags = hydrate_with_hashtags(submission["explanation"], submission["highlighted_text"])
    submission["hashtags"] = hashtags

    # delete unnecessary info
    del submission["source_url"]
    del submission["ip"]
    del submission["type"]
    del submission["_id"]

    submission["type"] = "user_submission"

    return submission

def log_submission(ip, user_id, highlighted_text, source_url, explanation, community, anonymous):
	"""
	Logs when a user submits a webpage to a community.
	Arguments:
		ip : (string) : the IP address of the request sent by the user.
		user_id : (ObjectID) : the ID of the user saving the context.
		highlighted_text : (string) : any highlighted text from the user's webpage (can be "").
		source_url : (string) : the full URL of the webpage where the extension is opened.
		explanation : (string) : the reason provided by the user for why the webpage is helpful.
		community : (string) : the ObjectID of the community to add the result to.
		anonymous : (bool) : if true, do not display username of creator
	Returns:
		insert : Pymongo object with property .acknowledged (should be true on success).
		log : (dictionary) the final saved log
	"""

	# the user id: [communities] is to represent who added the submission to which community
	# this will allow a user to add/remove it at will from the places they've added/removed it from/to
	communities = {
		str(user_id): [ObjectId(community)]
	}
	log = Log(ip, user_id, highlighted_text, source_url, explanation, communities, anonymous=anonymous)
	cdl_logs = Logs()
	inserted_status = cdl_logs.insert(log)
	return inserted_status, log



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
	cdl_submit_stats = SubmissionStats()
	update_clicks = cdl_submit_stats.update_stats(submission_id,"submission_view")
	cdl_searches_clicks = SearchesClicks()
	insert = cdl_searches_clicks.insert_one_db(log)
	return insert


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







def update_relevance_stats(stats, submission_id, relevance):
	'''
	Updates the judgement of the user for the submission if it exists else creates a new record
	Args:
		- stats: submission_stats db instance
		- submission_id: submission_id of the submission for which the user submits the judgement
		- relevance: like or dislike (1/0)
		- judgement_exists: indicates if it's the user's first judgement for the submission or not
	
	Return:
		Boolean value indicating if the update was successful

	'''
	if relevance == 1:
		likes_result = stats.update_stats(submission_id, "likes", 1)
		if likes_result['nModified'] == 1:
			dislikes_result = stats.update_stats(submission_id, "dislikes", -1)
			return dislikes_result['nModified'] == 1
		
	elif relevance == 0:
		dislikes_result = stats.update_stats(submission_id, "dislikes", 1)
		if dislikes_result['nModified'] == 1:
			likes_result = stats.update_stats(submission_id, "likes", -1)
			return likes_result['nModified'] == 1
		
	return False


def update_stats_for_new_relevance(stats,submission_id, relevance):
	'''
	Creates a new document in the submission_stats db to record the user's judgement for the submission
	Args:
		- stats: submission_stats db instance
		- submission_id: submission_id of the submission for which the user submits the judgement
		- relevance: like or dislike (1/0)	
	Return:
		Boolean value indicating if the insertion was successful

	'''
	result = {}
	if relevance == 1:
		result = stats.update_stats(submission_id, "likes", 1)
	elif relevance == 0:
		result= stats.update_stats(submission_id, "dislikes", 1)
	
	return result['nModified'] == 1
	
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
		submission_id, relevance = None, None
		for k,v in judgments.items():
			submission_id = ObjectId(k)
			relevance = v 
		relevance_judgement = Relevance(user_id,submission_id,relevance)
		submission_judgements = Relevance_Judgements()
		judgement_exists = submission_judgements.find_one({"submission_id":submission_id,"user_id":user_id})
		submission_judgements.update_relevance(relevance_judgement)

		stats = SubmissionStats()
		stats_result = None
		if not judgement_exists: 
			stats_result = update_stats_for_new_relevance(stats, submission_id, relevance)
		else:
			if judgement_exists.relevance != relevance:
				stats_result = update_relevance_stats(stats,submission_id,relevance)

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