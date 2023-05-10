import requests
import json
import pytest
import os
import time
from pymongo import MongoClient


# Mention the API you want to test on 
URL='http://localhost:4002'

def pytest_namespace():
    return {'my_global_variable': 0}

@pytest.fixture
def data():
    pytest.token = ''
    pytest.userId=''
    pytest.communityId=''
    pytest.submissionId=''
    pytest.connectionId=''
    
#test for the signup route
def test_signup():
    url = URL+"/createAccount"
    
    headers = {'Content-Type': 'application/json' } 

    payload = {
    "email":"testuser@gmail.com",
    "username":"testuser",
    "password":"test"
    }

    resp = requests.post(url, headers=headers, data=json.dumps(payload,indent=4))       
    
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body['status'] == 'ok'
    assert resp_body['username']=='testuser'
    pytest.userId = resp_body["user_id"]

# Test for the login route
def test_login():
    url = URL+'/login'
    
    headers = {'Content-Type': 'application/json' } 

    payload = json.dumps({
    "username":"testuser",
    "password":"test"
    })
    
    resp = requests.post(url, headers=headers, data=payload)       
    
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body['status'] == 'ok'
    assert resp_body['username']=='testuser'
    pytest.token=resp_body['token']

def test_create_community():
    url = URL+"/api/createCommunity"

    payload = json.dumps({
    "community_name": "testcommunity"
    })
    headers = {
    'Authorization': pytest.token,
    'Content-Type': 'application/json'
    }

    resp = requests.post(url, headers=headers, data=payload)       
    
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body['status']=="ok"
    assert resp_body['message']=='Community created successfully!'


# Test to get all list of communities
def test_getCommunities():
    url = URL+"/api/getCommunities"

    headers = {
    'authorization': pytest.token
    }

    resp = requests.request("GET", url, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body['username']=='testuser'
    assert resp_body['community_info'][0]['name'] == "Your personal community"
    pytest.communityId=resp_body['community_info'][1]['community_id']

# Adding item to community
def test_submit():
    url = URL + "/api/submission/"
    headers = {
        'authorization': pytest.token
    }
    payload = {
        "highlighted_text": "hello world",
        "source_url": "https://helloworld.com",
        "explanation": "A page about hello world",
        "community": pytest.communityId
    }
    resp = requests.post(url, headers=headers, data=payload)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Context successfully submitted and indexed."
    pytest.submissionId = resp_body["submission_id"]


def test_submit2():
    url = URL + "/api/submission/"
    headers = {
        'authorization': pytest.token
    }
    payload = {
        "highlighted_text": "connect",
        "source_url": "https://connect.com",
        "explanation": "connect connect",
        "community": pytest.communityId,
    }
    resp = requests.post(url, headers=headers, data=payload)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Context successfully submitted and indexed."
    pytest.connectionId = resp_body["submission_id"]

def test_community_submission_wrong_community():
    url = URL + "/api/submission/"
    headers = {
        'authorization': pytest.token
    }
    payload = {
        "highlighted_text": "connect",
        "source_url": "https://connect.com",
        "explanation": "connect connect",
        "community": "634b3b5f6358cac1a4c076c1",
    }
    resp = requests.post(url, headers=headers, data=payload)
    assert resp.status_code == 403
    resp_body = resp.json()
    assert resp_body["status"] == "error"
    assert resp_body["message"] == "Error: You do not have access to this community."

def test_api_search():
    url = URL+"/api/search"
    time.sleep(2)

    headers = {
    'Authorization': pytest.token,
    'Content-Type': 'application/json'
    }

    params = {
        "community": pytest.communityId,
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
    pytest.submissionId = first_result["submission_id"]

def test_connection():
    url = URL + "/api/connect/"
    headers = {
        'Authorization': pytest.token,
    }
    payload = {
        "connection_source": pytest.submissionId,
        "connection_target": pytest.connectionId,
        "connection_description": "hello connect"
    }
    resp = requests.request("POST", url, data=payload, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Connection successfully created"

def test_submission_get():
    url = URL + "/api/submission/" + pytest.submissionId
    headers = {
        'Authorization': pytest.token,
    }
    resp = requests.request("GET", url, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["submission"]["highlighted_text"] == "hello world"
    assert resp_body["submission"]["communities"] == {pytest.communityId: {"name": "testcommunity", "valid_action": "remove"},
                                                      pytest.userId: {"name": "Your personal community", "valid_action": "save"}}
    assert len(resp_body["submission"]["connections"]) == 1
    assert resp_body["submission"]["connections"][0]["connection_description"] == "hello connect"

def test_submission_save():
    url = URL + "/api/submission/" + pytest.submissionId
    headers = {
        'Authorization': pytest.token,
    }
    payload = {
        "community_id": pytest.userId
    }
    resp = requests.request("PATCH", url, data=payload, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"

def test_submission_community_delete():
    url = URL + "/api/submission/" + pytest.submissionId
    headers = {
        'Authorization': pytest.token,
    }
    payload = {
        "community_id": pytest.userId
    }
    resp = requests.request("DELETE", url, data=payload, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Removed from community."


def test_submission_delete():
    url = URL + "/api/submission/" + pytest.submissionId
    headers = {
        'Authorization': pytest.token,
    }
    resp = requests.request("DELETE", url, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Deletion successful."

def test_connection_invalid_source():
    url = URL + "/api/connect/"
    headers = {
        'Authorization': pytest.token,
    }
    payload = {
        "connection_source": "fikjr32kjr32",
        "connection_target": pytest.connectionId
    }
    resp = requests.request("POST", url, data=payload, headers=headers)
    assert resp.status_code == 500
    resp_body = resp.json()
    assert resp_body["status"] == "error"
    assert resp_body["message"] == "Error: Invalid source or target id."


def test_connection_delete():
    url = URL + "/api/submission/" + pytest.connectionId
    headers = {
        'Authorization': pytest.token,
    }
    resp = requests.request("DELETE", url, headers=headers)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Deletion successful."

def test_feedback():
    url = URL + "/api/feedback/"
    headers = {
        'Authorization': pytest.token,
    }
    payload = {
        "message": "this is a feedback test",
        "submission_id": pytest.submissionId
    }
    resp = requests.post(url, headers=headers, data=payload)
    assert resp.status_code == 200
    resp_body = resp.json()
    assert resp_body["status"] == "ok"
    assert resp_body["message"] == "Feedback saved!"

def test_leave_community_admin_fail():
    url = URL+"/api/leaveCommunity"

    payload = json.dumps({
    "community_id": pytest.communityId
    })
    headers = {
    'Authorization': pytest.token,
    'Content-Type': 'application/json'
    }

    resp = requests.post(url, headers=headers, data=payload)       
    
    assert resp.status_code == 403
    resp_body = resp.json()
    assert resp_body['status']=="error"
    assert resp_body['message']=='Community admins cannot leave the community.'


def test_clean_up():
    
    with open("../env_local.ini", "r") as f:
        for line in f:
            split_line = line.split("=")
            name = split_line[0]
            value = "=".join(split_line[1:]).strip("\n")
            os.environ[name] = value

    client = MongoClient(os.environ["cdl_uri"])
    cdl_db = client[os.environ["db_name"]]

    cdl_users = cdl_db.users
    cdl_logs = cdl_db.logs
    cdl_communities = cdl_db.communities
    cdl_user_feedback = cdl_db.user_feedback

    user_deleted = cdl_users.delete_one({"username": "testuser"})
    assert user_deleted.acknowledged == True

    submission_deleted = cdl_logs.delete_one({"_id": pytest.submissionId})
    assert submission_deleted.acknowledged == True

    connection_deleted = cdl_logs.delete_one({"_id": pytest.connectionId})
    assert connection_deleted.acknowledged == True

    community_deleted = cdl_communities.delete_one({"_id": pytest.communityId})
    assert community_deleted.acknowledged == True

    feedback_deleted = cdl_user_feedback.delete_one({"submission_id": pytest.submissionId})
    assert feedback_deleted.acknowledged == True

 


