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
- ``title``: The title to update the note page with.
- ``content``: The content to update the note page with.

##### Returns
On success, status code indicating success and a message in body.

On failure, status code indicating respective error with message describing the error.

---

#### Delte
Deletes a note page according to the specified ``<id>`` path. [Implementation File](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/dev/backend/app/views/notes.py).

##### Requires
Nothing required in the request body.

##### Returns
On success, status code indicating success and a message in body.

On failure, status code indicating respective error with message describing the error.


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
