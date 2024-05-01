import time
from app.db import get_db
from app.models.mongo import Mongo


class NotLoggedInUsers(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.not_logged_in_users

	def convert(self, user_db):
		return NotLoggedInUser(
			user_db["ip"],
			communities=user_db["communities"],
			followed_communities=user_db.get("followed_communities"),
			created=user_db.get("time"),
			id=user_db["_id"]
		)

	def insert(self, user):
		ack = self.collection.insert_one({
			"ip": user.ip,
			"communities": user.communities,
			"followed_communities": user.followed_communities,
			"time": user.created
		})
		return ack.inserted_id


class NotLoggedInUser:
	def __init__(self, ip, communities=[], followed_communities=[], created=time.time(), id=None):
		self.id = id
		self.ip = ip
		self.communities = communities
		self.followed_communities = followed_communities
		self.created = created