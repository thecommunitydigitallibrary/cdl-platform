# CDL Backend API Documentation

## Account Management

### Account Creation and Deletion

Endpoint: ``/api/createAccount``

#### POST
Creates a new account for the CDL. [Implementation](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/ba23a0e1bb23edb71dfe7fb41eae5cf87096fc85/backend/app/views/users.py#L25).

##### Requires
Requires the following in the request body:

- ``email``: Email for the account. Must be valid email format.
- ``username``: Username for the account. Must be >= 2 characters and unique.
- ``password``: Password for the account. Must be >= 6 characters.

##### Returns
On success, status ``200`` with the following JSON body fields:
- ``username``: Username provided by request.
- ``token``: Login token for user session.
- ``userid``: The CDL-generated ID of the user. 

On failure, status code indicating respective error with body describing the error.


