# CDL Backend API Documentation

All endpoints are under the following base URL: ``https://textdata.org/``

## Account Management

### Account Creation and Deletion

Endpoint: ``/api/createAccount``

---

#### POST
Creates a new account for the CDL. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/users.py).

##### Requires
Requires the following in the request body:

- ``email``: Email for the account. Must be valid email format.
- ``username``: Username for the account. Must be >= 2 characters and unique.
- ``password``: Password for the account. Must be >= 6 characters.

##### Returns
On success, status ``200`` with the following JSON body fields:
- ``username``: Username provided by request.
- ``token``: Login JWT token for the session.
- ``userid``: The CDL-generated ID of the user. 

On failure, status code indicating respective error with body describing the error.

---

#### PATCH
Changes a user's password. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/users.py).

##### Requires
Requires the following in the request body:

- ``token``: The token provided in the reset password email link. Note that this token can expire (~3 days). If it does, then the user must request a new reset link.
- ``password``: The new password provided by the user. Must be >= 6 characters.

##### Returns
On success, status ``200`` with the following JSON body fields:
- ``username``: Username provided by request.
- ``token``: Login JWT token for the session.
- ``userid``: The CDL-generated ID of the user. 

On failure, status code indicating respective error with body describing the error.

---

### Account Login

Endpoint: ``/api/login``

---

#### POST
For a user to log into the CDL. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/users.py).

##### Requires
Requires the following in the request body:

- ``username``: The CDL username of the account.
- ``password``: The CDL password of the account.

##### Returns
On success, status ``200`` with the following JSON body fields:
- ``username``: Username provided by request.
- ``token``: Login JWT token for the session.

On failure, status code indicating respective error with body describing the error.

---

### Account Password Reset Request

Endpoint: ``/api/account/passwordReset``

---

#### POST
Requests a password reset link to be sent via email. Uses SendGrid and DOES NOT work locally. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/users.py).

##### Requires
Requires the following in the request body:

- ``email``: Email for the account requesting reset.

##### Returns
On success, status ``200`` with success message in body. User should also receive an email at the provided account.

On failure, status code indicating respective error with body describing the error.

---

## Submissions

### Submission Creation

Endpoint: ``/api/submission/``

Requires user token passed as "Authorization" in the header.

---

#### POST
Creates a new submission. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/functional.py).

##### Requires
Requires the following in the request body:

- ``explanation``: The now-called title of the submission (displayed as clickable hyperlink at top of submission).
- ``highlighted_text``: The now-called description of the submission (displayed as main body text of submission).
- ``source_url``: The URL of the webpage being submitted.
- ``community``: The ID of the community to which the submission is being submitted to.

##### Returns
On success, status ``200`` with the following JSON body fields:
- ``username``: Username provided by request.
- ``token``: Login JWT token for the session.
- ``userid``: The CDL-generated ID of the user. 

On failure, status code indicating respective error with body describing the error.

---

### Batch Submission Creation

Endpoint: ``/api/submission/batch/``

Requires user token passed as "Authorization" in the header.

---

#### POST
Creates multiple new submissions. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/functional.py).

##### Requires
Requires the following in the request body:

community : (string) : the ID of the community to add the result to
			data : (array) : array of JSON objects:
				highlighted_text/description : (string) : any highlighted text from the user's webpage (can be "").
				source_url : (string) : the full URL of the webpage where the extension is opened.
				explanation/title : (string) : the reason provided by the user for why the webpage is helpful.
- ``community``: The ID of the community to which the submissions are being added to.
- ``data``: A list of JSON objects, where each entry contains the following:
  - ``explanation``: The now-called title of the submission (displayed as clickable hyperlink at top of submission).
  - ``highlighted_text``: The now-called description of the submission (displayed as main body text of submission).
  - ``source_url``: The URL of the webpage being submitted.

##### Returns
On success, status ``200`` with a list that contains, for each submission sent in the data field:
- ``message``: A success message.
- ``submission_id``: The ID of the newly-indexed submission.
- ``status``: A ``200`` status.

If any of the submissions fail to be indexed, then the respective list entry will contain the following fields:
- ``message``: A message describing the error.
- ``status``: A status code for the error.

---

### Submission Get, Edit, and Delete
Endpoint: ``/api/submission/<id>``

Requires user token passed as "Authorization" in the header.

---

#### Get
Gets a submission according to the provided submission ID. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/functional.py).

##### Requires
Nothing beyond the submission ID in the URL.

##### Returns
On success, status ``200`` with the following JSON body field:
- ``submission``: the formatted submission corresponding to the provided ID. For the fields, see the "Submission" in the bottom section of this document titled "Data Models".

On failure, status code indicating respective error with body describing the error.

---

#### Patch
Edits a submission corresponding to the provided submission ID. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/functional.py).

##### Requires
All fields provided in the request body are optional. If one is not included, then that field will stay the same:
- ``community_id``: The ID of a community to add the submission to.
- ``highlighted_text``: The new highlighted text (description) for the submission.
- ``explanation``:  The new explanation (title) for the submission.
` ``url``: The new URL for the submission.
##### Returns
On success, status ``200`` and a message describing the success. To get the updated submission, call the GET endpoint with the submission ID.

On failure, status code indicating respective error with body describing the error.

---

#### Delete
Deletes a submission corresponding to the provided submission ID. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/functional.py).

The API can handle two types of delete:
1. Deleting the submission from a provided community. 
2. Deleting the submission from all communities.

The functionality depends on the arguments provided in the request body.

##### Requires
If no arguments are provided in the body, then the API removes the submission from all communities. Otherwise, it removes the submission from the provided communtiy:
- ``community_id``: The ID of a community to remove the submission from.

##### Returns
On success, status ``200`` and a message describing the success. To get the updated submission, call the GET endpoint with the submission ID.

On failure, status code indicating respective error with body describing the error.

---

### Connections
Endpoint: ``/api/connect/``

Requires user token passed as "Authorization" in the header.

---

#### POST
Connects two submissions with a provided description. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/functional.py).

##### Requires
Requires the following in the request body. Note that ``connection_description`` is optional.

- ``connection_source``: The ID of the source submission source.
- ``connection_target``: The ID of the target submission.
- ``connection_description``: Text describing the connection (e.g., why someone may want to go from source to target).
##### Returns
On success, status ``200`` and a message describing the success. 

On failure, status code indicating respective error with body describing the error.

---

## Notes

### Note Get, Create, Edit, and Delete

Endpoint: ``/api/notes/<id>/<id>/<id>``

Requires user token passed as "Authorization" in the header.

Notes are arranged by a hierarchy of ``<id>``'s (up to three), and certain requests do not require any ``<id>``'s.

---

#### Get
Gets a note given some ID path. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/notes.py).

##### Requires
Nothing in the request body. 

##### Returns
On success, status code indicating success and a body with the following fields:
- ``titles``: A list containing nested dictionaries of the following:
  - ``title``: The title of the note page.
  - ``id``: The ID of the note page.
  - ``notes``: The children of the note page (list of more titles, ids, and notes).
- ``note``: The raw markdown of the requested note (only when the ``<id>`` path is provided).

On failure, status code indicating respective error with body describing the error.

---

#### POST
Creates a new note page according to the specified ``<id>`` path. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/notes.py).

##### Requires
- ``title``: The title of the new note page.

##### Returns
On success, status code indicating success and a body with the following field:
- ``id``: The ID of the new note page. This ID is the provided ``<id>`` path with an additional UUID hash appended to the end. Each ``<id>`` is separated by a "|".  

On failure, status code indicating respective error with body describing the error.

---

#### PATCH
Updates a note page according to the specified ``<id>`` path. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/notes.py).

##### Requires
Requires the following in the request body:

- ``title``: The title to update the note page with.
- ``content``: The content to update the note page with.

##### Returns
On success, status code indicating success and a message in body.

On failure, status code indicating respective error with message describing the error.

---

#### Delete
Deletes a note page according to the specified ``<id>`` path. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/notes.py).

##### Requires
Nothing required in the request body.

##### Returns
On success, status code indicating success and a message in body.

On failure, status code indicating respective error with message describing the error.

---

## Communities

### Get Communities

Endpoint: ``/api/getCommunities``

Requires user token passed as "Authorization" in the header.

---

#### GET
Gets all of a user's communities. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/communities.py).

##### Requires
Nothing in the request body. 

##### Returns
On success, status code indicating success and a body with the following fields:
- ``username``: The username of the user
- ``community_info``: A list of the following entries:
  - ``community_id``: The ID of the community.
  - ``name``: The name of the community.
  - ``description``: The description of the community.
  - ``join_key``: The join key for the community.
  - ``is_admin``: True if the user is a community admin, and false otherwise.

On failure, status code indicating respective error with body describing the error.

---

### Create and Edit a Community

Endpoint: ``/api/createCommunity``

Requires user token passed as "Authorization" in the header.

---

#### POST
Create a new community. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/communities.py).

##### Requires
Requires the following in the request body:

- ``community_name``: The name of the new community (limit 100 characters).
- ``description``: The description of the new community (limit 500 characters, optional).


##### Returns
On success, status code indicating success and a body with the success message.

On failure, status code indicating respective error with body describing the error.

---

#### PATCH
Edits a community. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/communities.py).

##### Requires
Requires at least one of the following in the request body:

- ``community_name``: The name of the new community (limit 100 characters).
- ``description``: The description of the new community (limit 500 characters).


##### Returns
On success, status code indicating success and a body with the success message.

On failure, status code indicating respective error with body describing the error.

---

### Join a Community

Endpoint: ``/api/joinCommunity``

Requires user token passed as "Authorization" in the header.

---

#### POST
Join a community. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/communities.py).

##### Requires
Requires the following in the request body:

- ``join_key``: The join key of the community that the user requests to join.


##### Returns
On success, status code indicating success and a body with the success message.

On failure, status code indicating respective error with body describing the error.

---

### Leave a Community

Endpoint: ``/api/leaveCommunity``

Requires user token passed as "Authorization" in the header.

---

#### POST
Leave a community. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/communities.py).

##### Requires
Requires the following in the request body:

- ``community_id``: The ID of the community that the user requests to leave.


##### Returns
On success, status code indicating success and a body with the success message.

On failure, status code indicating respective error with body describing the error.

---

### Community History

Endpoint: ``/api/communityHistory``

Requires user token passed as "Authorization" in the header.

---

#### GET
Get all communities that have been left by a user. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/communities.py).

##### Requires
Nothing in the request body. 

##### Returns
On success, status code indicating success and a body with the following field:
- ``left_communities``: A list of the following entries:
  - ``community_id``: The ID of the community.
  - ``name``: The name of the community.
  - ``description``: The description of the community.
  - ``join_key``: The join key for the community.
  - ``is_admin``: True if the user is a community admin, and false otherwise.
  - ``time``: The time that the user left the community.

On failure, status code indicating respective error with body describing the error.

---

## Search

### Search over Submissions

Endpoint: ``/api/search``

Requires user token passed as "Authorization" in the header.

---

#### GET
Search over submissions. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/functional.py).

##### Requires
This API endpoint handles multiple types of searches and paging. 

Requires the following in the request body (on a new query):

- ``query``: The query to search.
- ``community``: The community ID to search over. If "all", then the query will be searched over all communities joined by the user.
- ``page``: The page of the search to be returned. If not included, then defaults to 0. Pages are returned in batches of 10.
- ``source``: The type of query to perform. This can be one of the following (defaults to ``webpage_search``):
  - ``webpage_search``: The search performed by a user entering a query on the main CDL website in the search bar.
  - ``note_automatic``: The search performed automatically when a user edits a notes page.
  - ``extension_open``: The search performed automatically when a user opens the extension.

In the case of ``extension_open``, two additional, contextual fields can be passed:
- ``highlighted_text``: The highlighted text when the user opens the extension, if any.
` ``url``: The URL of the website when the user opens the extension.


For paging, one can pass the following in the request body:
- ``search_id``: The ID of the search, returned by the first new query request.
- ``page``: The page of the search to be returned. Pages are returned in batches of 10. 


##### Returns
On success, status ``200`` with the JSON body fields corresponding to the "Search" data model, located at the bottom of this document.

On failure, status code indicating respective error with body describing the error.

---

## Recommendation

### Get Recommendations

Endpoint: ``/api/recommend``

Requires user token passed as "Authorization" in the header.

---

#### GET
Get Recommendations. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/functional.py).

##### Requires
This API endpoint handles multiple types of recommendation for a user. 

Requires the following in the request body (on a new recommendation request):

- ``method``: The type of recommendation to return. Can either be:
  - ``recent``: Which will return the most recent submissions to the user's communities (not including CDLWeb or own submissions).
  - ``explore_user_submissions``: Which will return most similar submissions to user's communities according to their most recent three submissions.
- ``page``: The page of the search to be returned. If not included, then defaults to 0. Pages are returned in batches of 10.

For paging, one can pass the following in the request body:
- ``recommendation_id``: The ID of the recommendation, returned by the first new recommendation request.
- ``page``: The page of the recommendation to be returned. Pages are returned in batches of 10. 


##### Returns
On success, status ``200`` with the JSON body fields corresponding to the "Recommendation" data model, located at the bottom of this document.

On failure, status code indicating respective error with body describing the error.

---


# Data Models

## Submission
```
{
  stats: {
    views: the number of times that this submission has been viewed
    clicks: the number of times that this submission has been clicked in search results
    shares: the number of communities that this submission has been added to
  }
  commnuities: { //note all user communities are included here
     <community_id> : {
        name: the name of the community
        valid_action: either "remove" if the user can delete this submission from this community, 
                      "save" if the user can add it to the community,
                      or "view" if it was added to a user's community by another user.
     }
  }
  communities_part_of {
        <community_id> : <community_name>,
        ...
  },
  can_delete: true if user created submission, false otherwise
  submission_id: the string submisison Object Id
  user_id : the string Object Id of the user who made the original submission
  highlighted_text : the highlighted text of the submission (actually the description)
  explanation : the explanation of the submission (actually the title)
  time : the string indicating how long ago the submission was made (e.g., "5 days ago", "10 minutes ago")
  redirect_url : the full URL + metadata so when the user clicks, it redirects through the CDL server to log
  display_url : the URL displayed to the user (with ">")
  connections : [
      A list of api/submission/<id> GET return objects EXCEPT for the connections field
  ]
  hashtags : list of hashtags present in highlighted_text or explanation
}
```

## Search

```
{
  search_id : the string ObjectId of the search log
  total_num_results : the total number of search results
  query : the query entered by the user
  current_page : the current page being requested by the user
  search_results_page [
    {
      redirect_url : the full URL + metadata so when the user clicks, it redirects through the CDL server to log
      display_url : the URL displayed to the user (with ">")
      raw_source_url : the full URL as submitted for editing
      submission_id: the string ObjectId of the submission
      result_hash : the rank_searchId_resultId, identifying the result in the context of search
      highlighted_text : the highlighted text of the submission
      explanation : the explanation of the submission
      communities_part_of {
        <community_id> : <community_name>,
        ...
      },
      children : list of search results that share the same URL, but are not the highest-scoring
      hashtags : list of hashtags present in highlighted_text or explanation
    },
    ...
  ]
}
```

## Recommendation
```
{
  recommendation_id : the string ObjectID of the recommendation log
  total_num_results: the total number of recommendations for this request (capped at 50)
  current_page: the current page of results being requested by the user
  recommendation_results_page: same as "search_result_page" in Search above
}
```

