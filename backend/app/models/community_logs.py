import time
from app.db import get_db
from app.models.mongo import Mongo


class CommunityLogs(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.community_logs

	def convert(self, log_db):
		# submission id handle
		return CommunityLog(
			log_db["ip"],
			log_db["user_id"],
			log_db["community_id"],
			log_db["action"],
			log_time=log_db["time"],
			submission_id=log_db.get("submission_id", None),
			id=log_db["_id"]
		)

	def insert(self, log):
		log_db = {
			"ip": log.ip,
			"user_id": log.user_id,
			"community_id": log.community_id,
			"action": log.action,
			"time": log.time
		}
		if log.submission_id:
			log_db['submission_id'] = log.submission_id
		log.id = self.collection.insert_one(log_db)
		return log.id


class CommunityLog:
	def __init__(self, ip, user_id, community_id, action, log_time=None, submission_id=None, id=None):
		self.id = id
		self.ip = ip
		self.user_id = user_id
		self.community_id = community_id
		self.action = action
		self.time = time.time() if not log_time else log_time
		self.submission_id = submission_id
