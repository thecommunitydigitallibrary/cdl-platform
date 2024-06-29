import os
import re
import traceback
import math
import json
import requests
import random

from flask import Blueprint, request, redirect
from flask_cors import CORS
from bson import ObjectId
from urllib.parse import urldefrag, quote
from collections import defaultdict

from app.helpers.helpers import token_required, token_required_public, response, Status, format_url, format_time_for_display, sanitize_input, build_display_url, hydrate_with_hashtags
from app.helpers.helper_constants import RE_URL_DESC
from app.helpers.prompts import llama3suffix_prompt, ics_query_prefix_prompt, ics_noquery_prefix_prompt, summarize_prefix_prompt

from app.models.cache import Cache
from app.models.search_logs import SearchLogs, SearchLog
from app.models.search_clicks import SearchClicks, SearchClick
from app.models.logs import Logs
from app.models.users import Users
from app.models.communities import Communities
from app.models.submission_stats import SubmissionStats



from elastic.manage_data import ElasticManager


search = Blueprint('search', __name__)
CORS(search)

# Connect to elastic for submissions index operations
elastic_manager = ElasticManager(
    os.environ["elastic_username"],
    os.environ["elastic_password"],
    os.environ["elastic_domain"],
    os.environ["elastic_index_name"],
    None,
    "submissions")

### Endpoints ###
@search.route("/api/search/summarize", methods=["GET"])
@token_required
def summarize(current_user):
    """Endpoint for summarizing a set of search results.
    TODO this only handles up to ten titles. Can improve by
        - Titles and descriptions
        - Figuring out how to pass more than 10 results without model length limitations

    Method Parameters
    ----------
    current_user : MongoDB Document, required
        The user making the request. This is automatically passed via the @token_required wrapper.

    Request Parameters
    ---------
        search_id: str, required
            The search ID corresponding to the clicked result.

    Returns
    ---------
    A response.success object with an "output" field in the dict, containing the generated summary.
    """
    search_id = request.args.get("search_id", "")
    user_id = current_user.id
    raw_search_results = export_helper(str(user_id), search_id)
    top_titles = [x["title"] for x in raw_search_results["data"][:10]]
    summary = generate(",".join(top_titles), summarize_prefix_prompt, llama3suffix_prompt, line_type="Summary: ")
    return response.success({"output": summary}, Status.OK)


@search.route("/api/search/redirect", methods=["GET"])
def click():
    """Endpoint for redirecting clicked search results (in both extension and website).

    Request Parameters
    ---------
        search_id: str, required
            The search ID corresponding to the clicked result.

        redirect_url : str, required
            The URL that the user is clicking.

    Returns
    ---------
    A Flask redirect object pointed to the redirect URL
	"""
    try:
        search_id = request.args.get("search_id")
        redirect_url = request.args.get("redirect_url")

        log_search_click(ObjectId(search_id), redirect_url)

        return redirect(redirect_url)
    except Exception as e:
        print(e)
        traceback.print_exc()
        return response.error("Failed to redirect, please try again later.", Status.INTERNAL_SERVER_ERROR)

@search.route("/api/search/extension", methods=["GET"])
@token_required
def extension_search(current_user):
    """Handles the search for the TextData extension.
    Searches both webpages and submissions.
    TODO Eventually extend this to also include website description as broader context.

    Method Parameters
    ----------
    current_user : MongoDB Document, required
        The user making the request. This is automatically passed via the @token_required wrapper.
        Note that one of partial_intent/highlighted_text must be provided.

    Request Parameters
    ---------
        url: str, required
                The URL of the webpage where the extension was opened.

        partial_intent : str, optional
            What the user typed into the search bar. If it ends with a "?", then no question is generated.

        highlighted_text: str, optional
            The text highlighted by the user before opening the extension.

    Returns
    ---------
    On success, a response.success object with the results:
        web_results
        submission_results
        predicted_intent
        users_also_ask 
    """

    url = request.args.get("url", "")
    partial_intent = request.args.get("partial_intent", "")
    highlighted_text = request.args.get("highlighted_text", "")

    user_id = current_user.id
    user_communities = current_user.communities
    for x in current_user.followed_communities:
        if x not in user_communities:
            user_communities.append(x)

    if not url:
        return response.error("URL must be provided.", Status.BAD_REQUEST) 
    if not partial_intent and not highlighted_text:
        return response.error("One of partial_intent, highlighted_text must be provided.", Status.BAD_REQUEST)
    
    try:
        if partial_intent and partial_intent[-1] == "?":
            predicted_intent = partial_intent  
        elif partial_intent:
            input_text = str({"partial_intent": partial_intent, "highlighted_text": highlighted_text})
            predicted_intent = generate(input_text, ics_query_prefix_prompt, llama3suffix_prompt)[0]
        else:
            input_text = str({"highlighted_text": highlighted_text})
            predicted_intent = generate(input_text, ics_noquery_prefix_prompt, llama3suffix_prompt)[0]
    except Exception as e:
        traceback.print_exc()
        predicted_intent = partial_intent


    search_id = log_search_request(user_id, 
                                   "extension",
                                   scope=["webpages", "submissions"],
                                   context={
                                       "url": url,
                                       "highlighted_text": highlighted_text,
                                   },
                                   intent={
                                       "typed_query": partial_intent,
                                       "generated_question": predicted_intent
                                   },
                                   filters={
                                       "own_submissions": False,
                                       "communities": user_communities,
                                       "sort_by": "relevance"
                                   }
                                   )
    

    # Get the web results
    web_results = search_webpages(predicted_intent, search_id)

    # Get any really good matches to the community submissions
    str_user_comm = [str(x) for x in user_communities]
    num_results, submission_results = search_submissions(str(user_id), str_user_comm, predicted_intent, own_submissions=False, num_results=5)
    if num_results > 0:
        submission_results_pages = create_pages_submission_lite(submission_results, str(search_id))
        queries = [predicted_intent]
        documents = [x["title"] + " - " + x["description"] for x in submission_results_pages]
        reranked_submissions = rerank(queries, documents)
        if reranked_submissions:
            ## Assume a single query
            indices = reranked_submissions['0']["indices"]
            scores = reranked_submissions['0']["scores"]
            for i in range(len(indices)):
                if scores[i] > 40:
                    web_results = [submission_results_pages[indices[i]]] + web_results
                    # Only include one result from submission
                    break

    # Add Users Also Ask questions (only from a user's communities)
    sl_db = SearchLogs()
    searches_on_url = sl_db.find({"context.url": url, "filters.communities": {"$in": user_communities}})
    asked_questions = []
    for search_log in searches_on_url:
        genq = search_log.intent["generated_question"]
        if genq not in asked_questions and genq != predicted_intent and genq != "":
            asked_questions.append(genq)
    random.shuffle(asked_questions)
    asked_questions = asked_questions[:5]

    return response.success({"web_results": web_results[:5], "predicted_intent": predicted_intent, "users_also_ask": asked_questions}, Status.OK)    


@search.route("/api/search/website", methods=["GET"])
@token_required_public
def website_search(current_user):
    """Handles the search for the TextData website.
    
    Two general cases: initiating a new search or paging a current search.


    Method Parameters
    ----------
    current_user : MongoDB Document, required
        The user making the request. This is automatically passed via the @token_required wrapper.


    Request Parameters (New Search)
    ---------
        query : str, optional
            What the user typed into the search bar. If excluded, results are ordered by time.

        community : str, required
            A list of community IDs to search. Each community should be separated by a comma.
            Can also be "all". Here, all joined and followed communities will be searched.

        source : str, required
            For logging where the search was made. One of
                website_visualize
                website_homepage_recs
                website_community_page
                website_searchbar

        own_submissions : bool, optional
            If true, only search results from one's own submissions will be returned.
            Defaults to True.

    Request Parameters (Paging)
    ---------
        search_id : str, required
            The ID of the search, must correspond to its log in SearchLogs

        page : int, >=0, required
            The requested page of search results. 

        sort_by : str, optional
            Reorganizes the cached search results. 
            Can be either "time", "relevance", or "popularity".

    Returns
    ---------
    On success, a response.success object with the results:
        search_id
        query
        total_num_results
        current_page
        search_results_page 
        requested_communities
    """
    # Parameters for new search
    query = request.args.get("query", "")
    user_requested_communities = request.args.get("community", None)
    own_submissions = request.args.get("own_submissions", True)
    if own_submissions == "False":
        own_submissions = False
    source = request.args.get("source", None)    

    # Parameters for paging
    search_id = request.args.get("search_id", None)
    page = request.args.get("page", 0)
    if page == "undefined":
        page = 0
    ## Handle if page is negative, convert to int
    page = max(0, int(page))
    sort_by = request.args.get("sort_by", None)

    user_id = current_user.id
    user_communities = current_user.communities
    for x in current_user.followed_communities:
        if x not in user_communities:
            user_communities.append(x)

    try:
        cache = Cache()
    except Exception as e:
        print(e)
        cache = None

    # Paging case
    if search_id:
        search_logs = SearchLogs()
        prior_search = search_logs.find_one({"_id": ObjectId(search_id)})
        if prior_search:

            # First reorganize if needed
            if sort_by != None and prior_search.filters["sort_by"] != sort_by:
                search_sort_by(str(user_id),search_id,sort_by)

            search_results = []
            number_of_hits = -1

            if cache and search_id != "":
                number_of_hits, search_results = cache.search(str(user_id), search_id, page)
                return_obj = {
                    "search_id": search_id,
                    "total_num_results": number_of_hits,
                    "current_page": page,
                    "search_results_page": search_results
                }
                return response.success(return_obj, Status.OK)
            print("Cannot find cache result, defaulting to new search")

    # New search case
    ## Standardize the user's requested communities
    if user_requested_communities == "all":
        requested_communities = user_communities
    else:
        try:
            requested_communities = [ObjectId(x) for x in user_requested_communities.split(",")]
        except Exception as e:
            traceback.print_exc()
            return response.error("Invalid requested community.", Status.BAD_REQUEST) 
                
    ## Validate access to requested communities and search
    if validate_community_access(user_communities, requested_communities):
        if source not in ["website_visualize", "website_homepage_recs", "website_community_page", "website_searchbar"]:
            return response.error("Invalid source.", Status.BAD_REQUEST) 

        num_search_results, search_results = search_submissions(str(user_id), [str(x) for x in requested_communities], query=query, own_submissions=own_submissions)
        community_names = find_community_names(requested_communities)
        search_id = log_search_request(user_id, 
                                   source,
                                   scope=["submissions"],
                                   intent={
                                       "typed_query": query,
                                   },
                                   filters={
                                       "own_submissions": own_submissions,
                                       "communities": requested_communities,
                                       "sort_by": "relevance"
                                   }
                                   )
        pages = create_pages_submission(search_results, str(search_id), community_names)
        number_of_hits = len(pages)
        result_page = cache.insert(str(user_id), str(search_id), pages, page)


        # Call export with this `search_id` -> list of submissions for that search -> exported_list
        if source == "website_visualize":
            submissions = export_helper(str(user_id), str(search_id))
            sl_db = SearchLogs()

            sub_mentions = {}
            questions_list = []
            docs = []
            urls_to_find = {}

            for obj in submissions['data']:
                mentions = re.finditer(RE_URL_DESC, obj['description'])
                for mention in mentions:
                    par_sub_id = mention.group(0)[-24:]
                    if sub_mentions.get(par_sub_id):
                        sub_mentions[par_sub_id].append(obj['submission_id'])
                    else:
                        sub_mentions[par_sub_id] = [obj['submission_id']]

                sub_url = obj["submission_url"]
                source_url = obj["source_url"]


                if sub_url not in urls_to_find:
                    urls_to_find[sub_url] = [obj["submission_id"]]
                else:
                    urls_to_find[sub_url].append(obj["submission_id"])

                if source_url:
                    if source_url not in urls_to_find:
                        urls_to_find[source_url] = [obj["submission_id"]]
                    else:
                        urls_to_find[source_url].append(obj["submission_id"])
                
                doc = obj["title"] + " - " + obj["description"]
                docs.append(doc)


            all_url_list = list(urls_to_find.keys())
            searches_on_urls = sl_db.find_db({"context.url" : {"$in": all_url_list}, "filters.communities": {"$in": requested_communities}})
            for search_log in searches_on_urls:
                genq = search_log["intent"]["generated_question"]
                if search_log["intent"].get("typed_query", "") != "":
                    url = search_log["context"]["url"]
                    sources = urls_to_find[url]
                    for source_id in sources:
                        q_obj = {"text": genq, "source_id": source_id}
                        if q_obj not in questions_list:
                            questions_list.append(q_obj)

            
            if docs and questions_list:
                scored_docs = rerank([x["text"] for x in questions_list], docs)
                if scored_docs:
                    for qidx in scored_docs:
                        indices = scored_docs[qidx]["indices"]
                        scores = scored_docs[qidx]["scores"]
                        qidx = int(qidx)
                        # Only check top question-doc pair, and only have a single target
                        if scores[0] > 40:
                            target_id  = submissions["data"][indices[0]]["submission_id"]
                            questions_list[qidx]["target_id"] = target_id

            # Using sub_mentions dict to create mentions
            for obj in submissions['data']:
                curr_id = obj['submission_id']
                obj["mentions"] = sub_mentions.get(curr_id, [])

            graph_data = prep_subs_viz_conns(submissions['data'], questions_list)
            return response.success(graph_data, Status.OK)
        else:
            # add the all community
            if user_requested_communities == "all":
                community_names = {"all": "all"}
            return_obj = {
                "search_id": str(search_id),
                "query": query,
                "total_num_results": number_of_hits,
                "current_page": page,
                "search_results_page": result_page,
                "requested_communities": community_names
            }
            return response.success(return_obj, Status.OK)
    else:
        return response.error("You do not have access to the requested communities.", Status.FORBIDDEN) 



@search.route("/api/search/autocomplete", methods=["GET"])
@token_required
def autocomplete(current_user):
    """Handles the autocomplete for the user on the website.
    Only displays submissions that match according to their titles.

    Method Parameters
    ----------
    current_user : MongoDB Document, required
        The user making the request. This is automatically passed via the @token_required wrapper.

    Request Parameters
    ---------
        query: str, required
            What was typed in by the user in the search bar.

        topn: int, optional
            How many results to return, default 7.

    Returns
    ---------
    On success, a response.success object with the dict containing a "suggestions" field,
    which maps to a list dict
        "labels": the title of the submission
        "id": the ID of the submission
        "url" the URL of the submission
    """

    query = request.args.get("query", "")
    topn = int(request.args.get("topn", 7))

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

@search.route("/api/search/export", methods=["GET"])
@token_required
def export(current_user):
    """Handles the export of search results.

    Method Parameters
    ----------
    current_user : MongoDB Document, required
        The user making the request. This is automatically passed via the @token_required wrapper.

    Request Parameters
    ---------
        search_id: str, required
            The ID of the search to export.

    Returns
    ---------
    On success, a response.success object with the output of export_helper.
    """
    search_id = request.args.get("search_id", "")
    user_id = str(current_user.id)
    return response.success(export_helper(user_id, search_id), Status.OK)

### Helpers ###

def create_pages_submission_lite(search_results, search_id):
    """Helps format submission results for the extension. No need to include
    communities, submission times, etc.

    Method Parameters
    ----------
    search_results : list of dict, required
        The hits from the OpenSearch search.
    
    search_id : str, required
        The ID of the search.
    
    Returns
    ---------
    list of dict
        A list of search results, formatted to "result" below.
    """
    all_results = []
    for hit in search_results:
        sub_id = str(hit["_id"])
        url = format_url("", sub_id)
        description = hit["_source"].get("highlighted_text", "")
        if not description:
            description = "No Preview Available."
        result = {
            "redirect_url": create_redirect_url(url, search_id),
            "display_url": build_display_url(url),
            "orig_url": url,
            "submission_id": sub_id,
            "title": hit["_source"].get("explanation", "No Title Available"),
            "description": description,
            "score": hit.get("_score", 0),
            "time": "",
            "type": "submission",
            "communities_part_of": [],
            "username": ""
        }
        all_results.append(result)
    return all_results
        

def create_pages_submission(search_results, search_id, community_names, toggle_display="highlight"):
    """Formats raw OpenSearch search results for display on the website.

    Method Parameters
    ----------
    search_results : list, required
        The output from the elastic search.

    search_id : str, required
        The ID of the current search.

    community_names : dict, required
        A dict mapping {community_id : community_name}, both are str.

    toggle_display : str, optional
        Can either be "highlight" which will add markers for highlighting matching text of query, and not otherwise.

    Returns
    ---------
    list of dict
        A list of search results.
    """
    return_obj = []
    cdl_users = Users()

    for hit in search_results:
        result = {
            "redirect_url": None,
            "display_url": None,
            "orig_url": None,
            "submission_id": None,
            "title": None,
            "description": None,
            "score": hit.get("_score", 0),
            "time": "",
            "type": "submission",
            "communities_part_of": [],
            "username": ""
        }

        if not result["score"]: 
            result["score"] = 0

        result["title"] = hit["_source"].get("explanation", "No Title Available")


        # Old submissions may not have the anonymous field, default to true
        is_anonymous  = hit["_source"].get("anonymous", True)
        if not is_anonymous:
            creator = cdl_users.find_one({"_id": ObjectId(hit["_source"]["user_id"])})
            if creator:
                    result["username"] = creator.username


        description = " .... ".join(hit["highlight"].get("highlighted_text", [])) if hit.get("highlight", None) and toggle_display == "highlight" else hit["_source"].get("highlighted_text", None)
        if not description:
            description ="No Preview Available"

        
        
        result["description"] = description

        # So that we can (1) mitigate XSS and (2) keep the highlighted match text
        # AND (3) properly render markdown pages on submission view (quote, code, etc.)
        result["description"] = re.sub("<mark>", "@startmark@", result["description"])
        result["description"] = re.sub("<\/mark>", "@endmark@", result["description"])
        result["description"] = sanitize_input(result["description"])
        result["description"] = re.sub("@startmark@", "<mark>", result["description"])
        result["description"] = re.sub("@endmark@", "</mark>", result["description"])



        # possible that returns additional communities?
        result["communities_part_of"] = {community_id: community_names[community_id] for community_id in
                                         hit["_source"].get("communities", []) if community_id in community_names}

        result["submission_id"] = str(hit["_id"])

        if "time" in hit["_source"]:
            formatted_time = format_time_for_display(hit["_source"]["time"])
            result["time"] = formatted_time
        elif "scrape_time" in hit["_source"]:
            formatted_time = format_time_for_display(hit["_source"]["scrape_time"])
            result["time"] = formatted_time


        # Display URL
        url = hit["_source"].get("source_url", "")

        url_for_display = format_url(url, str(result["submission_id"]))
        url_for_redirect = format_url("", str(result["submission_id"]))

        display_url = build_display_url(url_for_display)
        result["display_url"] = display_url
        result["orig_url"] = url
        result["redirect_url"] = create_redirect_url(url_for_redirect, search_id)

        result["hashtags"] = hydrate_with_hashtags(result["title"], result["description"])          
        return_obj.append(result)

    return return_obj


def search_webpages(query, search_id, format_for_frontend=True):
    """Calls the external search API to search webpages.
    Previously, we indexed, but now we rely on an external service.

    Method Parameters
    ----------
    query : str, required
        What would be entered into the search bar.

    search_id: str, required
        The search ID of the session.

    format_for_frontend: bool, optional
        If True, the data is hydrated for display.
        Otherwise the raw results are returned.

    Returns
    ---------
    list of dict
        A list of formatted search results.
    """

    subscription_key = os.environ.get('SEARCH_V7_SUBSCRIPTION_KEY', "")
    endpoint = os.environ.get('SEARCH_V7_ENDPOINT', "")

    if subscription_key == "" or endpoint == "":
        return []

    # Construct a request
    mkt = 'en-US'
    params = { 'q': query, 'mkt': mkt }
    headers = { 'Ocp-Apim-Subscription-Key': subscription_key }

    # Call the API
    try:
        response = requests.get(endpoint, headers=headers, params=params)
        response.raise_for_status()
        response = response.json()
        if format_for_frontend:
            results = response.get("webPages", {})

            formatted_results = []

            for value in results.get("value", [])[:10]:
                result = {
                    "redirect_url": create_redirect_url(value["url"], str(search_id)),
                    "display_url": build_display_url(value["url"]),
                    "orig_url": value["url"],
                    "submission_id": None,
                    "result_hash": None,
                    "description": value["snippet"],
                    "title": value["name"],
                    "score": 0,
                    "time": 0,
                    "type": "webpage",
                    "communities_part_of": [],
                    "username": ""
                }

                formatted_results.append(result)

            return formatted_results
        return response
    except Exception as ex:
        traceback.print_exc()
        return []

def search_submissions(user_id, requested_communities, query="", own_submissions=True, num_results=2000):
    """Communicates with Elastic to search submissions. Handles 4 cases:
    1. Viewing one's own submissions
    2. Viewing all submissions to a community
    3. Querying one's own submissions
    4. Querying all requested communities

    Method Parameters
    ----------
    user_id : str, required
        The ID of the user performing the search.
    requested_communities: list of str, required
        The community IDs to search.
    query : str, optional
        The query to search, defaults to "".
    own_submissions : bool, optional
        If true, then search is scoped over user's submissions. Defaults to true.
    num_results : int, optional
        The number of results to return (via the single page), default is 2000

    Returns
    ---------
    int, list
        The number of hits, the list of the search results from Elastic.
    """
    if query == "":
        # Case - viewing all of one's submissions
        if own_submissions:
            if len(requested_communities) == 1:
                number_of_hits, hits = elastic_manager.get_submissions(user_id, community_id=requested_communities[0], page_size=num_results)
            else:
                number_of_hits, hits = elastic_manager.get_submissions(user_id, page_size=num_results)
        # Case - viewing all of the submissions from a community
        elif len(requested_communities) == 1:
            number_of_hits, hits = elastic_manager.get_community(requested_communities[0], page_size=num_results)
        else:
            print("Not supported")
            return 0, []
    else:
        # Case - querying own submissions
        if own_submissions:
            number_of_hits, hits = elastic_manager.search(query, requested_communities, user_id=str(user_id), page_size=num_results)
        # Case - querying all submissions
        else:
            number_of_hits, hits = elastic_manager.search(query, requested_communities, page_size=num_results)
            
    return number_of_hits, hits


def export_helper(user_id, search_id):
    """Helper function to export search results. Note that the entire submission is included, not just the matching search text.

    Method Parameters
    ----------
    user_id : str, required
        The ID of the user performing the search.
    search_id: str, required
        The ID of the search.

    Returns
    ---------
    dict
        With the following fields:
            query
            own_submissions
            search_time
            requested_communities
            data (the formatted search results)
    """
    all_results = []
    index = 0
    try:
        cache = Cache()
    except Exception as e:
        print(e)
        cache = None

    search_logs = SearchLogs()
    submissions = Logs()
    prior_search = search_logs.find_one({"_id": ObjectId(search_id)})
    if prior_search:
        intent = prior_search.intent
        if "query" in intent:
            query = intent["query"]
        else:
            query = ""
        own_submissions = prior_search.filters["own_submissions"]
        search_time = prior_search.time
        requested_communities = [str(x) for x in prior_search.filters["communities"]]
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

        if result["type"] == "submission":
            submission_ids_to_find.append(ObjectId(result["submission_id"]))
        else:
            webpages_ids_to_find.append(ObjectId(result["submission_id"]))

        del result["description"]


        del result["username"]

        if "children" in result:
            del result["children"]

        del result["hashtags"]

    submissions = list(submissions.find_db({'_id': {'$in': submission_ids_to_find}}))

    # Map to hold id -> result obj
    id_result_map = {}
    for sub in submissions:
        id_result_map[str(sub['_id'])] = sub

    for result in all_results:
        # Get the sub/web return from MongoDB
        curr = id_result_map[result["submission_id"]]
        result["description"] = curr['highlighted_text']


    return {
            "query": query,
            "own_submissions": own_submissions,
            "search_time": search_time,
            "requested_communities": requested_communities,
            "data": all_results,
        }

def create_redirect_url(url, search_id):
    """Create the redirect URL for logging clicks.

    Method Parameters
    ----------
    url : str, required
        The target URL page to visit.

    search_id : str, required
        The search event ID.

    Returns
    ---------
    str
        The redirect URL that includes the target URL and the search ID.
    """

    redirect_url = os.environ["api_url"] + ":" + os.environ["api_port"] + "/api/search/redirect?"
    redirect_url += "search_id=" + search_id
    url, fragment = urldefrag(url)
    # handling edge cases
    if "pdf" in url or "smartdiff" in url and fragment != "":  # for proxies
        redirect_url += "&redirect_url=" + url + "#" + fragment
    elif "youtube" in url:
        redirect_url += "&redirect_url=" + quote(url)
    else:
        redirect_url += "&redirect_url=" + url
    return redirect_url

def validate_community_access(user_communities, requested_communities):
    """Ensures that a user has access to the communities that they are requesting.

    Method Parameters
    ----------
    user_communities : list of ObjectIds, required
        The communities followed or joined by the user.

    requested_communities : list of ObjectIds, required
        The communities requested by the user.

    Returns
    ---------
    bool
        True if a user has access to all, false otherwise. 
    """

    comm_db = Communities()
    for rc_id in requested_communities:
        if rc_id not in user_communities:
            # Can be a public community
            found_comm = comm_db.find_one({"_id": rc_id})
            if found_comm and not found_comm.public:
                return False
    return True


def find_community_names(communities):
    """Ensures that a user has access to the communities that they are requesting.

    Method Parameters
    ----------
    communities : list of ObjectIds, required
        The communities to name.

    Returns
    ---------
    dict {str:str}
        {<community id> : <community name>}
    """
    return_obj = {}
    comm_db = Communities()
    for community_id in communities:
        found_comm = comm_db.find_one({"_id": community_id})
        return_obj[str(community_id)] = found_comm.name
    return return_obj


def search_sort_by(user_id, search_id, sort_by):
    """Sort cached search results by relevance, popularity, or date.

    Method Parameters
    ----------
    user_id : ObjectId, required
        The ID of the user.
    search_id : ObjectId, required
        The search ID that needs to be sorted.
    sort_by : str, required
        Can be one of
            relevant : sort by match to query
            popularity : sort by likes, dislikes, and clicks
            date : sort by submission time

    Returns
    ---------
    None
    """
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
        # Limit to top 50 for now for efficiency
        for x in all_submissions[:50]:
            metrics = submissions.find_one({"submission_id":ObjectId(x["submission_id"])})
            # because we did not backfill
            if metrics:
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
            x["popularity"] = x["score"] + metrics_score

        sorted_submissions = sorted(all_submissions,reverse=True,key = lambda x :float(x['popularity']))

    elif sort_by == 'relevance':
        sorted_submissions = sorted(all_submissions,reverse=True,key = lambda x :float(x['score']))

    cache.insert(user_id,search_id,sorted_submissions,0)

def rerank(queries, documents):
    """Calls neural rerank to rank documents given queries.

    Method Parameters
    ----------
    queries : list, required
        A list of queries, each str.
    documents : list, required
        A list of documents to score against the queries, each str.

    Returns
    ---------
    dict
        A dictionary of 
            {<query_idx>: {"scores": <list of document scores>, "indices", <list of corresponding document indices>}}
    """

    # First, chunk documents to make sure to handle long descriptions
    chunked_docs = []
    chunked_doc_index = [] # maps index of this to index of documents for rebuilding when scores are returned
    for i,doc in enumerate(documents):
        split_docs = doc.split("\n")
        split_docs = [x for x in split_docs if len(x) > 10 and len(x) < 500] # precaution to make sure we don't get any super long one lines
        for sd in split_docs:
            chunked_docs.append(sd)
            chunked_doc_index.append(i)

    neural_api = os.environ.get("neural_api")
    if not neural_api:
        print("Rerank not currently supported.")
        return {}
    try:
        resp = requests.post(neural_api + "/neural/rerank/", json={"queries": queries, "documents": chunked_docs})
        resp_json = resp.json()

        if resp.status_code == 200:
            scored_docs = resp_json["ranks"] 

            # Now, replace to original indices from chunks
            for query_idx in scored_docs:
                indices = scored_docs[query_idx]["indices"]
                for i in range(len(indices)):
                    indices[i] = chunked_doc_index[indices[i]]
            return scored_docs  
        else:
            print(resp_json)
            return {}
    except Exception as e:
        traceback.print_exc()
        return {}

def generate(input_text, prefix, suffix, line_type="Question: "):
    """Call the Neural API to generate text from a language model.

    Input to the model is concatenated as a string:
        prefix  + input_text + suffix
    Output is filtered by line_type beginning of line.


    Method Parameters
    ----------
    input_text : str, required
        The main body of the prompt.
    prefix : str, required
        The prefix of the prompt.
    suffix : str, required
        The suffix of the prompt.
    line_type : str, optional
        The beginning of the target line(s), defaults to "Question: "

    Returns
    ---------
    list of str
        A list of responses (i.e., all lines that begin with the line_type)
    """
    neural_api = os.environ.get("neural_api")
    if not neural_api:
        print("Generation not currently supported.")
        return []
    try:
        resp = requests.post(neural_api + "/neural/generate", json={"input": prefix + input_text + suffix})
        resp_json = resp.json()

        if resp.status_code == 200:
            output = resp_json["output"]            
            extracted = []

            try:
                output = output.split("\n")
                for line in output:
                    if line[:len(line_type)] == line_type:
                        content = line[len(line_type):]
                        extracted.append(content)
            except Exception as e:
                print(output, e)
        else:
            print(resp_json["message"])
    except Exception as e:
        traceback.print_exc()
        return []

    return extracted


def log_search_click(search_id, clicked_url):
    """Handles the clicking of a search result.
    Also updates SubmissionStats if the URL is a TextData submission ID.

    Method Parameters
    ----------
    search_id : ObjectId, required
        The ID of the corresponding search.
    clicked_url : str, required
        The clicked URL.
    Returns
    ---------
    None
    """
    sl_db = SearchClicks()
    search_click_log = SearchClick(search_id, clicked_url)
    sl_db.insert(search_click_log)

    if "/submissions/" in clicked_url:
        sub_idx = clicked_url.index("/submissions/") + len("/submissions/")
        submission_id = clicked_url[sub_idx:]
        try:
            stats = SubmissionStats()
            update_search = stats.update_stats(submission_id,"click_search_result")
        except Exception as e:
            traceback.print_exc()
    return




def log_search_request(user_id, source, scope=[], context={}, intent={}, filters={}):
    """Handles the creation of a search request log.

    Method Parameters
    ----------
    user_id : ObjectId, required
        The ID of the user making the request.
    source : str, required
        Where in TextData the search is being performed. One of
            website_visualize
            website_homepage_recs
            website_community_page
            website_mentions
            website_searchbar
            extension
    scope : list of str, required
        What the search is over, can contain
            "webpages": which indicates a search over webpages.
            "submissions": which indicates a search over submissions.
    context : dict , optional
        Indicates the context of where the search was performed.
        Not needed when the search happens on the website.
        Should look something like
            {
                "url": <the url of the website where the extension was opened>,
                "highlighted_text": <the text highlighted by the user, if any>,
            }
    intent : dict, optional
        Indicates what was typed or asked by the user for the search.
        Not required when viewing submissions or communities.
        Should look something like
            {
                "typed_query": <what was entered into the search bar by the user>,
                "generated_question": <what the predicted intent was>
            }
    filters : dict, required
        How the results should be filtered. Need the following:
            {
                "own_submissions": <True or False>,
                "communities": <list of ObjectIDs>,
                "sort_by": <one of "relevance", "popularity", or "time">
            }
    Returns
    ---------
    ObjectId
        The search ID log after being saved.
    """
    sl = SearchLogs()
    new_search_log = SearchLog(
        user_id,
        source,
        scope=scope,
        context=context,
        intent=intent,
        filters=filters
    )
    search_id = sl.insert(new_search_log)
    return search_id


def prep_subs_viz_conns(result_list, question_list):
    """Function to convert the submissions and questions to nodes and edges for connection viz.

    Method Parameters
    ----------
    result_list: list, required
        A list of submissions in JSON format (JSON obtained from export_helper).

    question_list: list, required
        A list of questions, formatted as
            {"text": text of question, "source_id": sub id where q was asked, "target_id": id of answer, or None}.

    Returns
    ---------
    dict
        A dict of "nodes", "edges", and "options" formatted for react-graph-vis.
    """
    nodes = []
    edges = []

    for id,question in enumerate(question_list):
        if "target_id" in question:
            edges.append({
                "from": id,
                "to": question["target_id"]
            })
            color = "#FFFFFF"
        else:
            color = "#FF9D9D"
        
        edges.append({
                "from": question["source_id"],
                "to": id
            })

        node = {
            "id": id, 
            "label": question["text"],
            "title": question["text"],
            "shape": "box",
            "color": color,
            "value": 8,
            "url": "https://www.google.com/search?q=" + question["text"]
        }
        nodes.append(node)

    for result in result_list:
        node = {
            "id": result['submission_id'],
            "label": result['title'][:50]+"..." if len(result['title']) > 50 else result['title'],
            "title": result['title'],
            "shape": "ellipse",
            "color": "#9DE6FF",
            "value": 8,
            "url": result['submission_url'],
        }
        nodes.append(node)

        for child_id in result["mentions"]:
            edge = {
                "from": child_id, 
                "to": result['submission_id']
            }
            edges.append(edge)

    options = {
        "autoResize": True,
        "physics": {
            "forceAtlas2Based": {
                "gravitationalConstant": -100,
                "centralGravity": 0.04,
                "avoidOverlap": 1.0,
                "springLength": 500,
                "springConstant": 0.04
            }
        },
        "interaction": {
            "hover": True,
            },
        "layout": {
            "hierarchical": False,
        },
        "nodes": {
            "shape": "dot",
            "scaling": {
                "min": 1,
                "max": 14,
                "label": {
                    "enabled": False,
                    "min": 10,
                    "max": 20,
                    "maxVisible": 26,
                    "drawThreshold": 8,
                }
            },
        },
        "edges": {
            "width": 1,
            "hoverWidth": 3
            },
    }

    return {"nodes": nodes, "edges": edges, "options": options}


def get_mentions(user_id, submission_id, user_communities):
    """Function to find every time a submission ID is mentioned.

    Method Parameters
    ----------
    user_id: str, required
        The ID of the user making the request.
    submission_id: str, required
        The ID of the submission to use a query.
    user_communities: list of str, required
        The IDs of the communities to be searched over.

    Returns
    ---------
    list
        The output from submission_results_pages.
    """
    _, results = search_submissions(user_id, user_communities, query=submission_id)
    user_communities = [ObjectId(x) for x in user_communities]
    community_names = find_community_names(user_communities)
    search_id = log_search_request(user_id, 
                                   "website_mentions",
                                   scope=["submissions"],
                                   intent={
                                       "typed_query": submission_id
                                   },
                                   filters={
                                       "own_submissions": False,
                                       "communities": user_communities,
                                       "sort_by": "relevance"
                                   }
                                   )
    submission_results_pages = create_pages_submission(results, str(search_id), community_names)
    return submission_results_pages
