import uuid
from datetime import datetime, timedelta

from app.db import get_db
from app.models.mongo import Mongo


class Resets(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.password_reset

	def convert(self, reset_db):
		return Reset(
			reset_db["user_id"],
			reset_db["email"],
			reset_db["username"],
			reset_db["token"],
			reset_db["expiry"],
			reset_db["_id"]
		)

	def insert(self, reset):
		reset.id = self.collection.insert_one({
			"user_id": reset.user_id,
			"email": reset.email,
			"username": reset.username,
			"token": reset.token,
			"expiry": reset.expiry
		})
		return reset.id

	def update_token(self, query, reset):
		self.refresh_expiry(reset)
		self.refresh_token(reset)
		self.collection.update_one(query, {"$set": {
			"token": reset.token,
			"expiry": reset.expiry
		}})
		return reset.token

	def refresh_expiry(self, reset):
		reset.expiry = datetime.now() + timedelta(hours=72)

	def refresh_token(self, reset):
		reset.token = str(uuid.uuid4())


class Reset:
	def __init__(self, user_id, email, username, token=None, expiry=None, id=None):
		self.id = id
		self.user_id = user_id
		self.email = email
		self.username = username
		self.token = str(uuid.uuid4()) if not token else token
		self.expiry = datetime.now() + timedelta(hours=24) if not expiry else expiry
