import time
from app.db import get_db
from app.models.mongo import Mongo


class Users(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.users

	"""
	Some users were created prior to "time" being added to creation account.
	So for now, just set time equal to 0 if that is the case.
	"""

	def convert(self, user_db):
		return User(
			user_db["username"],
			user_db["email"],
			user_db["hashed_password"],
			user_db["communities"],
			user_db.get("time", 0),
			user_db["_id"]
		)

	def insert(self, user):
		user.id = self.collection.insert_one({
			"username": user.username,
			"email": user.email,
			"communities": user.communities,
			"hashed_password": user.hashed_password,
			"time": user.created
		})
		return user.id


class User:
	def __init__(self, username, email, hashed_password, communities=[], created=time.time(), id=None):
		self.id = id
		self.username = username
		self.email = email
		self.hashed_password = hashed_password
		self.communities = communities
		self.created = created
