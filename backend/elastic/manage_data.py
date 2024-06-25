import os
import requests
from requests.auth import HTTPBasicAuth
import json
import traceback
import validators

import sys
sys.path.append("..")
from app.helpers.helpers import extract_hashtags


class ElasticManager:
    def __init__(self, elastic_username, elastic_password, elastic_domain, elastic_index_name, cdl_logs, index_mapping):
        """
    Initializes the ElasticManager.

    Arguments:
        elastic_config : (dict) : connection information for Elastic index
        cdl_logs : (MongoDB connection) : the logs for MongoDB. Only needed for backfilling.
    
    """
        self.auth = HTTPBasicAuth(elastic_username, elastic_password)
        self.domain = elastic_domain
        self.index_name = elastic_index_name
        self.cdl_logs = cdl_logs
        self.stopwords = {}

        # comment this out for updating elastic mapping
        with open("stopwords.txt", "r", encoding="utf8") as f:
            for line in f:
                self.stopwords[line.strip("\n")] = True

        # check if index exists, if not make it (primarily for local)

        resp = requests.head(self.domain + self.index_name, auth=self.auth)
        if resp.status_code != 200:
            self.create_index_with_mapping(index_mapping)
            print(f"Index not found, created with {index_mapping} mapping.")
        else:
            print("Index already exists!")

    def process_query(self, query):
        """
        Cleans up query for stopwords.
        Also checks if query is URL, and returns flag accordingly
        """
        query_obj = {
            "query": query,
            "isURL": False,
            "hashtags": []
        }
        if validators.url(query):
            query_obj["isURL"] = True
            return query_obj

        query_split = query.split()
        new_query = []

        hashtags = extract_hashtags(query)
        query_obj["hashtags"] = hashtags

        for word in query_split:
            if word.lower() not in self.stopwords:
                new_query.append(word)
        new_query = " ".join(new_query)

        if new_query == "" or new_query == " ":
            new_query = query
        query_obj["query"] = new_query
        return query_obj

    def get_community(self, community, page=0, page_size=10):
        """
        Get the community submissions.

        Arguments:
            community : (string) : the community ID.
            page : (int) : the page number to return (default 0).
            page_size : (int) : the number of results per page (default 10).
        
        Returns:
            The JSON hits for the community.
        """
        query = {
            "from": page * page_size,
            "size": page_size,
            "sort": [{"time": "desc"}],
            "query": {
                "match": {
                    "communities": community
                }
            }
        }

        r = requests.get(self.domain + self.index_name + "/_search", json=query, auth=self.auth)
        hits_total_value, hits = self.postprocess(r.text)
        return hits_total_value, hits

    def get_submissions(self, user_id, community_id=None, page=0, page_size=10):
        """
        Get the community submissions.

        Arguments:
            user_id : (string) : the user_id.
            community_id: (string): id of a community for finding a user's submissions in a particular community
            page : (int) : the page number to return (default 0).
            page_size : (int) : the number of results per page (default 10).
        
        Returns:
            The JSON hits for the community.
        """
        
        query = {
            "from": page * page_size,
            "size": page_size,
            "sort": [{"time": "desc"}],
            "query": {
                "bool": {
                    "must": [
                        {
                            "match": {
                                "user_id": user_id
                            }
                        }
                    ]
                }
            }
        }

        if community_id:
            query["query"]["bool"]["must"].append({"match": {"communities": community_id}})

        r = requests.get(self.domain + self.index_name + "/_search", json=query, auth=self.auth)

        hits_total_value, hits = self.postprocess(r.text)
        return hits_total_value, hits

    
    def auto_complete(self, query, communities, page=0, page_size=10):
        """
        Do a basic search over submission titles for autocomplete.

        Arguments:
            query : (string) : the search query.
            communities : list : the communities to search over.
            page : (int) : the page to return (default 0)
            page_size : (int) : the number of results per page (default 10).
        
        Returns:
            The JSON hits search.
        """
        query_obj = self.process_query(query)
        fields = ["explanation"]
        query_comm = {
            "query": {
                "bool": {
                    "should": [
                        {
                            "multi_match": {
                                "query": query_obj["query"],
                                "fields": fields
                            }
                        },
                    ]
                }
            },
            "_source": {"exclude": ["highlighted_text"]},
            "from": page * page_size,
            "size": page_size,
            "min_score": 0.1
        }
        filter = {
                "bool": {
                    "must": [
                        {"terms": {"communities": communities}}
                    ]
                }
            }
        query_comm["query"]["bool"]["filter"] = filter
        r = requests.get(self.domain + self.index_name + "/_search", json=query_comm, auth=self.auth)
        hits_total_value, hits = self.postprocess(r.text)
        return hits_total_value, hits

    def search(self, query, communities, user_id=None, page=0, page_size=10):

        """
        The method for searching a query over all of the saved webpage submissions.

        Arguments: 
            query : (string) : the submitted query by the user.
            communities : (list) : the communities to condition the search.
            page : (int) : the page number to return (default 0).
            page_size : (int) : the number of results per page (default 10).
        Returns:
            The JSON hits for the query.
        """

        query_obj = self.process_query(query)
        print("new query: ", query_obj["query"])
        print("hashtags", query_obj["hashtags"])
        print("is url?", query_obj["isURL"])

        if self.index_name == os.environ["elastic_webpages_index_name"]:
            fields = ["webpage.metadata.title", "webpage.metadata.h1", "webpage.metadata.description",
                      "webpage.all_paragraphs"]
        elif self.index_name == os.environ["elastic_index_name"]:
            if query_obj["isURL"]:
                fields = ["source_url"]
            else:
                fields = ["explanation", "highlighted_text", "source_url"]
        else:
            fields = []

        query_comm = {
            "query": {
                "bool": {
                    "should": [
                        {
                            "multi_match": {
                                "query": query_obj["query"],
                                "fields": fields
                            }
                        },
                    ]
                }
            },
            "highlight": {
                "tags_schema": "styled",
                "fields": {}
            },
            "from": page * page_size,
            "size": page_size,
            "min_score": 0.1
        }

        if self.index_name != os.environ["elastic_webpages_index_name"]:
            filter = {
                "bool": {
                    "must": [
                        {"terms": {"communities": communities}}
                    ]
                }
            }

            # for filtering submissions by hashtag
            if query_obj["hashtags"]:
                filter["bool"]["must"].append({"terms": {"hashtags": query_obj["hashtags"]}})

            # for searching submissions by a specific user
            if user_id:
                filter["bool"]["must"].append({"term": {"user_id": user_id}})

            query_comm["query"]["bool"]["filter"] = filter
            query_comm["highlight"]["fields"] = {
                "highlighted_text": {
                    "pre_tags": ['<mark>'],
                    "post_tags": ['</mark>']
                }
            }
        else:
            # Exclude paragraphs to test latency
            query_comm["_source"] = {"exclude": ["webpage.all_paragraphs"]}
            query_comm["highlight"]["fields"] = {
                "webpage.metadata.h1": {
                    "pre_tags": ['<mark>'],
                    "post_tags": ['</mark>']
                },
                "webpage.metadata.description": {
                    "pre_tags": ['<mark>'],
                    "post_tags": ['</mark>']
                },
                "webpage.all_paragraphs": {
                    "pre_tags": ['<mark>'],
                    "post_tags": ['</mark>']
                },
            }

        r = requests.get(self.domain + self.index_name + "/_search", json=query_comm, auth=self.auth)
        hits_total_value, hits = self.postprocess(r.text)
        return hits_total_value, hits


    def add_to_index(self, doc):
        """
        Method to index a submission in Elastic. Simply saves the raw highlighted text, explanation, and source URL as searchable text.
        Also saves community and user id as communities to match terms.

        Arguments: 
            doc : (dictionary) : user submission with highlighted_text, communities, explanation, and source_url.

        Returns:
            The response string from elastic, and the hashtags, if any
        """

        if self.index_name == os.environ["elastic_index_name"]:
            highlighted_text = doc.highlighted_text
            doc_id = str(doc.id)

            # saved content will be when a user id appears in communities
            # submittted content will be pulled from mongodb (can't search it easily)
            communities = doc.communities

            flat_communities = self.flatten_communities(communities)

            # for recovering submissions
            user_id = str(doc.user_id)

            # for ordering by time
            time = int(float(doc.time))

            anonymous = doc.anonymous

            explanation = doc.explanation
            source_url = doc.source_url

            # extract hashtags for elastic from both fields
            hashtags_explanation = extract_hashtags(explanation)
            hashtags_ht = extract_hashtags(highlighted_text)
            hashtags = list(set(hashtags_explanation + hashtags_ht))


            inserted_doc = {
                "source_url": source_url,
                "highlighted_text": highlighted_text,
                "explanation": explanation,
                "communities": flat_communities,
                "user_id": user_id,
                "hashtags": hashtags,
                "time": time,
                "anonymous": anonymous
            }

        elif self.index_name == os.environ["elastic_webpages_index_name"]:
            doc_id = str(doc.id)
            paragraphs = doc.webpage.get("paragraphs")
            scrape_time = int(float(doc.scrape_time))
            inserted_doc = {
                "source_url": doc.url,
                "scrape_time": scrape_time,
                "webpage": {
                    "metadata": doc.webpage.get("metadata"),
                    "all_paragraphs": " ".join(paragraphs) if paragraphs is not None else ""
                }
            }
            hashtags = []

        r = requests.put(self.domain + self.index_name + "/_doc/" + doc_id, json=inserted_doc, auth=self.auth)
        return r.text, hashtags

    def create_index_with_mapping(self, index_mapping):
        """
    Method to create a new elastic index with mapping. Uses the config information. 
    """
        mapping_file = os.path.join(os.path.dirname(__file__), "mappings", f"{index_mapping}.json")
        with open(mapping_file) as f:
            mapping = json.load(f)

        r = requests.put(self.domain + self.index_name, json=mapping, auth=self.auth)
        return r.text

    def delete_index(self):
        r = requests.delete(self.domain + self.index_name, auth=self.auth)
        return r.text

    def delete_document(self, id):
        r = requests.delete(self.domain + self.index_name + "/_doc/" + id, auth=self.auth)
        return r.text

    def get_document(self, id):
        r = requests.get(self.domain + self.index_name + "/_doc/" + id, auth=self.auth)
        return r.text

    def update_document(self, id, body):
        r = requests.post(self.domain + self.index_name + "/_doc/" + id, auth=self.auth, json=body)
        return r.text

    def list_indices(self):
        r = requests.get(self.domain + "_cat/indices", auth=self.auth)
        r2 = requests.get(self.domain + self.index_name + "/_mapping", auth=self.auth)
        return r2.text

    def add_to_mapping(self, map_update):
        r = requests.put(self.domain + self.index_name + "/_mapping", json=map_update, auth=self.auth)
        return r.text

    # recs
    def get_most_recent_submissions(self, user_id, communities, topn=50):
        """
    The method for retrieving most recent submissions over all of the saved webpage submissions.
    No page of page size because we use redis cache

    Arguments: 
        communities : (list) : the communities to condition the search. 
    Returns:
        The JSON hits for the query.
    """

        query_comm = {
            "query": {
                "bool": {
                    "filter": {
                        "bool": {
                            "must": [
                                {"terms":
                                     {"communities":
                                          communities
                                      }
                                 }
                            ],
                            "must_not": [
                                {
                                    "term":
                                        {"user_id": user_id}
                                }
                            ]
                        }
                    }
                }
            },
            "from": 0,
            "size": topn,
            "sort": [{"time": "desc"}],
        }

        r = requests.get(self.domain + self.index_name + "/_search", json=query_comm, auth=self.auth)
        hits_total_value, hits = self.postprocess(r.text)
        return hits_total_value, hits

    def flatten_communities(self, communities) -> list:
        flat_communities = []
        for user_id in communities:
            for community_id in communities[user_id]:
                flat_communities.append(str(community_id))

        return flat_communities


    def postprocess(self, text):

        try:
            text = text.encode("latin1", errors="strict").decode("utf8", errors="strict")
        except Exception as e:
            text = text.encode("utf8", errors="ignore").decode("utf8", errors="ignore")
        
        try:
            hits = json.loads(text)["hits"]
            resp = json.loads(text)
            hits = resp["hits"]
            print("\tTook: ", resp["took"])
        except Exception as e:
            print(e)
            print(json.loads(text))
            traceback.print_exc()
            return 0, []

        return hits["total"]["value"], hits["hits"]