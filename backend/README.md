# CDL Backend API Documentation

All endpoints are under the following base URL: ``https://textdata.org/``

## Account Management

### Account Creation and Deletion

Endpoint: ``/api/createAccount``

---

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
- ``token``: Login JWT token for the session.
- ``userid``: The CDL-generated ID of the user. 

On failure, status code indicating respective error with body describing the error.

---

#### PATCH
Changes a user's password. [Implementation](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/98b2bcbfa59b45e172621648032e9d05b46c6775/backend/app/views/users.py#L168).

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
For a user to log into the CDL. [Implementation](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/2918f2928cb90a1a0db2cb0524a3d252deae6b81/backend/app/views/users.py#L219).

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
Requests a password reset link to be sent via email. Uses SendGrid and DOES NOT work locally. [Implementation](https://github.com/thecommunitydigitallibrary/cdl-platform/blob/2918f2928cb90a1a0db2cb0524a3d252deae6b81/backend/app/views/users.py#L112).

##### Requires
Requires the following in the request body:

- ``email``: Email for the account requesting reset.

##### Returns
On success, status ``200`` with success message in body. User should also receive an email at the provided account.

On failure, status code indicating respective error with body describing the error.

---






