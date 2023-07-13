import requests
import json
import pytest
import os
import time
from bson import ObjectId
from pymongo import MongoClient
from app.db import get_db
from flask import Flask

app = Flask(__name__)

class Setup():
    def __init__(self) -> None:
        self.token = '',
        self.userId =  '',
        self.communityId=  '',
        self.submissionId = '',
        self.connectionId = ''
        self.db_client, self.cdl_db = self.get_db()

    def get_db(self):
        env_file_path = os.path.join(os.path.dirname(__file__),"..","env_local.ini")
        with open(env_file_path, "r") as f:
            for line in f:
                split_line = line.split("=")
                name = split_line[0]
                value = "=".join(split_line[1:]).strip("\n")
                os.environ[name] = value

        client = MongoClient("mongodb://0.0.0.0:27017/?retryWrites=true&w=majority")
        cdl_db = client[os.environ["db_name"]]
        return client, cdl_db

    def clear_db(self):
        return self.db_client.drop_database(os.environ["db_name"])

cred = Setup()

# Mention the API you want to test on 
URL='http://localhost:8080'

def pytest_namespace():
    return {'my_global_variable': 0}

@pytest.fixture
def data():
    return cred
    
#test for the signup route
def test_signup(data):
    url = URL+"/api/createAccount"
    
    headers = {'Content-Type': 'application/json' } 

    payload = {
    "email":"testuser@gmail.com",
    "username":"testuser",
    "password":"testpassword"
    }

    resp = requests.post(url, headers=headers, data=json.dumps(payload,indent=4))       

    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body['status'] == 'ok'
    assert resp_body['username']=='testuser'
    data.userId = resp_body["userid"]

# Test for the login route
def test_login(data):
    url = URL+'/api/login'
    
    headers = {'Content-Type': 'application/json' } 

    payload = json.dumps({
    "username":"testuser",
    "password":"testpassword"
    })
    
    resp = requests.post(url, headers=headers, data=payload)
    
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body['status'] == 'ok'
    assert resp_body['username']=='testuser'
    data.token=resp_body['token']

def test_create_community(data):
    url = URL+"/api/createCommunity"

    payload = json.dumps({
    "community_name": "testcommunity"
    })
    headers = {
    'Authorization': data.token,
    'Content-Type': 'application/json'
    }

    resp = requests.post(url, headers=headers, data=payload)       
    
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body['status']=="ok"
    assert resp_body['message']=='Community created successfully!'


# Test to get all list of communities
def test_getCommunities(data):
    url = URL+"/api/getCommunities"

    headers = {
    'authorization': data.token
    }

    resp = requests.request("GET", url, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body['username']=='testuser'
    assert resp_body['community_info'][0]['name'] == "testcommunity"
    data.communityId=resp_body['community_info'][0]['community_id']


def test_community_db_data(data):
    cdl_communities = data.cdl_db.get_collection("communities")
    res = cdl_communities.find_one({"_id": ObjectId(data.communityId)})
    assert res["name"] == "testcommunity"


# Adding item to community
def test_submit(data):
    url = URL + "/api/submission/"
    headers = {
        'authorization': data.token
    }
    payload = {
        "highlighted_text": "hello world",
        "source_url": "https://helloworld.com",
        "explanation": "A page about hello world",
        "community": data.communityId
    }
    resp = requests.post(url, headers=headers, data=payload)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Context successfully submitted and indexed."
    data.submissionId = resp_body["submission_id"]


def test_submit2(data):
    url = URL + "/api/submission/"
    headers = {
        'authorization': data.token
    }
    payload = {
        "highlighted_text": "connect",
        "source_url": "https://connect.com",
        "explanation": "connect connect",
        "community": data.communityId,
    }
    resp = requests.post(url, headers=headers, data=payload)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Context successfully submitted and indexed."
    data.connectionId = resp_body["submission_id"]

def test_community_submission_invalid_community(data):
    url = URL + "/api/submission/"
    headers = {
        'authorization': data.token
    }
    payload = {
        "highlighted_text": "connect",
        "source_url": "https://connect.com",
        "explanation": "connect connect",
        "community": "634b3b5f6358cac1a4c076c1",
    }
    resp = requests.post(url, headers=headers, data=payload)
    assert resp.status_code == 400
    resp_body = resp.json()
    assert resp_body["status"] == "error"
    assert resp_body["message"] == "Error: Cannot find community."
    
def test_community_submission_wrong_community(data):
    #create a new user session
    url = URL+"/api/createAccount"
    
    headers = {'Content-Type': 'application/json' } 

    payload = {
        "email":"testuser1@gmail.com",
        "username":"testuser1",
        "password":"testpassword"
    }

    resp = requests.post(url, headers=headers, data=json.dumps(payload,indent=4))
    resp_body = resp.json()
    url = URL + "/api/submission/"
    headers = {
        'authorization': resp_body['token']
    }

    payload = {
        "highlighted_text": "connect",
        "source_url": "https://connect.com",
        "explanation": "connect connect",
        "community": data.communityId,
    }
    resp = requests.post(url, headers=headers, data=payload)

    assert resp.status_code == 403
    resp_body = resp.json()
    assert resp_body["status"] == "error"
    assert resp_body["message"] == "Error: You do not have access to this community." 

def test_api_search(data):
    url = URL+"/api/search"
    time.sleep(2)

    headers = {
    'Authorization': data.token,
    'Content-Type': 'application/json'
    }

    params = {
        "community": data.communityId,
        "page": 0,
        "query": "hello world"
    }

    resp = requests.request("GET", url, params=params, headers=headers)
    assert resp.status_code == 200

    resp_body = resp.json()
    results = resp_body["search_results_page"]
    assert len(results) > 0
    first_result = results[0]
    assert first_result["explanation"] == "A page about hello world"
    data.submissionId = first_result["submission_id"]

def test_connection(data):
    url = URL + "/api/connect/"
    headers = {
        'Authorization': data.token,
        'Content-Type': 'application/json'
    }
    payload = json.dumps({
        "connection_source": data.submissionId,
        "connection_target": data.connectionId,
        "connection_description": "hello connect"
    })
    resp = requests.request("POST", url, data=payload, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Connection successfully created"

def test_submission_get(data):
    url = URL + "/api/submission/" + data.submissionId
    headers = {
        'Authorization': data.token,
        'Content-Type': 'application/json'
    }
    resp = requests.request("GET", url, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["submission"]["highlighted_text"] == "hello world"
    assert resp_body["submission"]["communities_part_of"] == {data.communityId: "testcommunity"}
    assert len(resp_body["submission"]["connections"]) == 1
    assert resp_body["submission"]["connections"][0]["connection_description"] == ""

def test_submission_save(data):
    url = URL + "/api/submission/" + data.submissionId
    headers = {
        'Authorization': data.token,
        'Content-Type': 'application/json'
    }
    payload = json.dumps({
        "community_id": data.communityId
    })
    resp = requests.request("PATCH", url, data=payload, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"

def test_submission_community_delete(data):
    url = URL + "/api/submission/" + data.submissionId
    headers = {
        'Authorization': data.token,
        'Content-Type': 'application/json'
    }
    payload = json.dumps({
        "community_id": data.communityId
    })
    resp = requests.request("DELETE", url, data=payload, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Removed from community."


def test_submission_delete(data):
    url = URL + "/api/submission/" + data.submissionId
    headers = {
        'Authorization': data.token,
    }
    resp = requests.request("DELETE", url, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Deletion successful."

def test_submission_batch(data):
    url = URL + "/api/submission/batch/"
    headers = {
        'Authorization': data.token,
        'Content-Type': 'application/json'
    }
    payload = json.dumps({
        "community": data.communityId,
        "data": [ {
            "highlighted_text": "test",
            "source_url": "https://test.com",
            "explanation": "test connect",
        },{
            "highlighted_text": "second test",
            "source_url": "https://test.com",
            "explanation": "second test",
        }
        ]
    })
    resp = requests.post(url, headers=headers, data=payload)
    assert resp.status_code == 200
    resp_body  = resp.json()

    assert resp_body["Submission 0"]['message'] ==  "Context successfully submitted and indexed."
    assert resp_body["Submission 1"]['message'] ==  "Context successfully submitted and indexed."


def test_connection_invalid_source(data):
    url = URL + "/api/connect/"
    headers = {
        'Authorization': data.token,
        'Content-Type': 'application/json'
    }
    payload = json.dumps({
        "connection_source": "fikjr32kjr32",
        "connection_target": data.connectionId
    })
    resp = requests.request("POST", url, data=payload, headers=headers)
    assert resp.status_code == 400
    resp_body = resp.json()
    assert resp_body["status"] == "error"
    assert resp_body["message"] == "Error: Invalid source or target id."


def test_connection_delete(data):
    url = URL + "/api/submission/" + data.connectionId
    headers = {
        'Authorization': data.token,
    }
    resp = requests.request("DELETE", url, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Deletion successful."

def test_feedback(data):
    url = URL + "/api/feedback/"
    headers = {
        'Authorization': data.token,
        'Content-Type': 'application/json'
        
    }
    payload = json.dumps({
        "message": "this is a feedback test",
        "submission_id": data.submissionId
    })
    resp = requests.post(url, headers=headers, data=payload)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Feedback saved!"

#function to clean up test data for successful multi test runs
def test_data_format(data):
    data.clear_db()