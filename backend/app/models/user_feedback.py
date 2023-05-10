import time

from app.db import get_db
from app.models.mongo import Mongo


class UserFeedbacks(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.user_feedback

	def convert(self, log_db):
		return UserFeedback(
			log_db["ip"],
			log_db["user_id"],
			log_db["message"],
			log_db["submission_id"],
			log_db["time"],
			log_db["_id"]
		)

	def insert(self, log):
		log.id = self.collection.insert_one({
			"ip": log.ip,
			"user_id": log.user_id,
			"message": log.message,
			"submission_id": log.submission_id,
			"time": log.time
		})
		return log.id


class UserFeedback:
	def __init__(self, ip, user_id, message, submission_id=None, log_time=None, id=None):
		self.id = id
		self.ip = ip
		self.user_id = user_id
		self.message = message
		self.submission_id = submission_id
		self.time = time.time() if not log_time else log_time
