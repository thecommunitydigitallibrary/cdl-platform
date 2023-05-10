import time
from app.db import get_db
from app.models.mongo import Mongo


class Judgments(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.judgments

	def convert(self, judgment_db):
		return Judgment(
			judgment_db["ip"],
			judgment_db["user_id"],
			judgment_db["time"],
			judgment_db["judgments"],
			judgment_db["_id"],
		)

	def insert(self, judgment):
		judgment_db = {
			"ip": judgment.ip,
			"user_id": judgment.user_id,
			"time": judgment.time,
			"judgments": judgment.judgments
		}
		judgment.id = self.collection.insert_one(judgment_db)
		return judgment.id


class Judgment:
	def __init__(self, ip, user_id, judgments, judgment_time=None, id=None):
		self.id = id
		self.ip = ip
		self.user_id = user_id
		self.judgments = judgments
		self.time = time.time() if not judgment_time else judgment_time
