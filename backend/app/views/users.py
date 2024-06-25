import os
import re
import traceback
import hashlib
import jwt
import json

from flask import request
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from flask import Blueprint
from flask_cors import CORS

from app.models.users import *
from app.models.resets import *
from app.helpers.status import Status

from app.helpers import response

users = Blueprint('users', __name__)
CORS(users)


@users.route("/api/users/createAccount", methods=["POST"])
def create_account():
	"""
	Endpoint to create an account.
	Arguments:
		Request data with
			email : (string) : the email of the user.
			username : (string) : the username of the user (must be unique)
			password : (string) : the password of the user
	Returns:
		On success:
			Status 200 and a dictionary with "status" = "ok", the username, the JWT token, and the user_id.
		On Failure
			Status number indicating failure and dictionary with "status" = "error" and an error description in the "message" field.
	"""
	try:
		fields = ["email", "username", "password"]
		payload = extract_payload(request, fields)
		# If okay with using payload['field'] remove this block
		if payload:
			email = payload["email"]
			username = payload["username"]
			password = payload["password"]
		else:
			return response.error(f"API needs the following fields: {fields}", Status.BAD_REQUEST)

		if len(password) < 6:
			return response.error("Unable to create account. Password cannot be shorter than 6 characters.",
			                      Status.FORBIDDEN)

		if len(username) < 2:
			return response.error("Unable to create account. Username cannot be shorter than 2 characters.",
			                      Status.FORBIDDEN)

		email_check_regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
		if not re.fullmatch(email_check_regex, email):
			return response.error("Unable to create account. Email must be valid.", Status.FORBIDDEN)

		users = Users()

		# no salt for now
		hashed_password = hashlib.sha256(password.encode("utf-8")).hexdigest()

		# manually scan since we have duplicate emails
		if users.exists({"email": email}):
			return response.error("Unable to create account. Email is already in use.", Status.FORBIDDEN)
	
		if users.exists({"username": username}):
			return response.error("Unable to create account. Username is already in use.", Status.FORBIDDEN)

		try:
			user = User(username, email, hashed_password)
			user_id = users.insert(user)
			# add user id to token
			token = jwt.encode({"id": str(user_id.inserted_id)}, os.environ["jwt_secret"], "HS256")
			return response.success({"username": username, "token": token, "userid": str(user_id.inserted_id)},
			                        Status.OK)
		except Exception as e:
			print(e)
			traceback.print_exc()
			return response.error("Internal server error.", Status.INTERNAL_SERVER_ERROR)
	except Exception as e:
		print(e)
		traceback.print_exc()
		return response.error("Failed to create user account, please try again later.", Status.INTERNAL_SERVER_ERROR)
	
def send_reset_email(username, token, email):
	"""
	Helper function for sending a password reset email.
	Uses SendGrid, and therefore, does not work locally.
	"""

	reset_url =  os.environ["api_url"] + ":" + os.environ["api_port"] + "/auth?reset=True&hash=" + token

	content = "<text>Hi " + username + ",<br/><br/> Here is your password reset link: " + \
	reset_url + "<br/><br/>" + \
	"This link will expire in 72 hours.<br/><br/> If you experience any problems, please contact:<br/> Kevin Ros at kjros2@illinois.edu<br/>TextData Developer<br/>https://textdata.org"

	message = Mail(
		from_email='no-reply@textdata.org',
		to_emails=email,
		subject='TextData Password Reset',
		html_content=content)
	try:
		sg = SendGridAPIClient(os.environ.get('sendgrid_api'))
		resp = sg.send(message)
		assert resp.status_code == 202
		return True
	except Exception as e:
		print(e)
		traceback.print_exc()
		return False



@users.route("/api/users/passwordReset", methods=["POST"])
def forgot_password():
	"""
	API for reset password request.
	Arguments:
		request data (website) with
			email : (string) : user email requesting reset (where reset link is sent) 
	Returns:
		On success:
			Status 200 and a dictionary with "status" = "ok" and message indicating success.
		On Failure
			Status number indicating failure and dictionary with "status" = "error" and an error description in the "message" field.
	"""
	try:
		fields = ["email"]
		payload = extract_payload(request, fields)
		if payload:
			email = payload["email"]
		else:
			return response.error(f"API needs the following fields: {fields}", Status.BAD_REQUEST)

		users = Users()
		resets = Resets()

		user_accounts = users.find({"email": email})

		if not user_accounts:
			return response.error("User does not exist.", Status.FORBIDDEN)

		# This loop is here because some emails are tied to multiple accounts.
		# So we sent a reset request for each one.
		for user_account in user_accounts:
			try:
				reset_reqs = resets.find({"email": email, "user_id": user_account.id})
				if reset_reqs:
					# Avoiding multiple reset tokens by updating the existing request. Also avoids multiple requests to
					# the db by updating existing record instead of deleting an existing record then recreating it.
					for reset_req in reset_reqs:
						reset_token = resets.update_token({"email": email, "user_id": reset_req.user_id}, reset_req)
						email_status = send_reset_email(user_account.username, reset_token, email)
						if not email_status:
							return response.error("Unable to send reset email for " + email, Status.INTERNAL_SERVER_ERROR)
				else:
					reset = Reset(user_account.id, email, user_account.username)
					reset_token = reset.token
					resets.insert(reset)
					email_status = send_reset_email(user_account.username, reset_token, email)
					if not email_status:
						return response.error("Unable to send reset email for " + email, Status.INTERNAL_SERVER_ERROR)

			except:
				traceback.print_exc()
				return response.error("Internal server error.", Status.INTERNAL_SERVER_ERROR)

		return response.success({"message": "Password reset request sent."}, Status.OK)
	except Exception as e:
		print(e)
		traceback.print_exc()
		return response.error("Failed to reset password, please try again later.", Status.INTERNAL_SERVER_ERROR)


@users.route("/api/users/createAccount", methods=["PATCH"])
def reset_password():
	"""
	API for reset password request.
	Arguments:
		request form (extension) or request data (website)
	Returns:
		On success:
			Status 200 and a dictionary with "status" = "ok" and message
		On Failure
			Status number indicating failure and dictionary with "status" = "error" and an error description in the "message" field
	"""
	try:
		fields = ["token", "password"]
		payload = extract_payload(request, fields)
		if payload:
			token = payload["token"]
			password = payload["password"]
		else:
			return response.error(f"API needs the following fields: {fields}", Status.BAD_REQUEST)

		users = Users()
		resets = Resets()

		reset_request = resets.find_one({"token": token})

		if not reset_request:
			return response.error("The provided URL is invalid. Please request a new reset link.", Status.BAD_REQUEST)
		try:
			if datetime.today() > reset_request.expiry:
				resets.delete_one({"_id": reset_request.id})
				return response.error("Reset link expired. Please request a new reset link.", Status.BAD_REQUEST)

			if len(password) < 6:
				return response.error("Unable to update password. Password cannot be shorter than 6 characters.",
				                      Status.FORBIDDEN)

			users.update_one({"_id": reset_request.user_id}, {"$set": {
				"hashed_password": hashlib.sha256(password.encode("utf-8")).hexdigest()
			}})

			resets.delete_one({"_id": reset_request.id})

			token = jwt.encode({"id": str(reset_request.user_id)}, os.environ["jwt_secret"], "HS256")
			return response.success(
				{"username": reset_request.username, "token": token, "userid": str(reset_request.user_id)}, Status.OK)
		except:
			return response.error("Internal server error.", Status.INTERNAL_SERVER_ERROR)
	except Exception as e:
		print(e)
		traceback.print_exc()
		return response.error("Failed to reset password, please try again later.", Status.INTERNAL_SERVER_ERROR)


@users.route("/api/users/login", methods=["POST"])
def login():
	"""
	Endpoint to login.
	Arguments:
		request form (extension) or request data (website)
			username : (string) : the username of the user (must be unique)
			password : (string) : the password of the user
	Returns:
		On success:
			Status 200 and a dictionary with "status" = "ok", the username, and the JWT token.
		On Failure
			Status number indicating failure and dictionary with "status" = "error" and an error description in the "message" field
	TODO: fix data transport method so that it is consistent between website and extension.
	"""
	try:
		fields = ["username", "password"]
		payload = extract_payload(request, fields)
		if payload:
			username = payload["username"]
			password = payload["password"]
		else:
			return response.error(f"API needs the following fields: {fields}", Status.BAD_REQUEST)

		users = Users()

		user_acct = users.find_one({"username": username})
		if not user_acct or username == "":
			# try logging in with email
			user_acct = users.find_one({"email": username})
			if not user_acct:
				return response.error("User not found. Please try again.", Status.UNAUTHORIZED)


		hashed_password = hashlib.sha256(password.encode("utf-8")).hexdigest()

		
		if user_acct and user_acct.hashed_password != hashed_password:
			return response.error("Password is incorrect. Please try again.", Status.UNAUTHORIZED)
		elif user_acct and user_acct.hashed_password == hashed_password:
			token = jwt.encode({"id": str(user_acct.id)}, os.environ["jwt_secret"], "HS256")
			return response.success({"username": username, "token": token}, Status.OK)
		else:
			return response.error("Internal server error. Please try again later.", Status.INTERNAL_SERVER_ERROR)
	except Exception as e:
		print(e)
		traceback.print_exc()
		return response.error("Failed to login, please try again later.", Status.INTERNAL_SERVER_ERROR)



def extract_payload(request, fields):
	try:
		payload = {field: request.form.get(field) for field in fields}
		if None in [value for value in payload.values()] and request.data:
			payload = {}
			request_data = json.loads(request.data.decode("utf-8"))
			for field in fields:
				payload[field] = request_data[field]
		return payload if None not in [value for value in payload.values()] else None
	except:
		return None