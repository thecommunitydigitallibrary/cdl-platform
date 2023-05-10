import time

from app.db import get_db
from app.models.mongo import Mongo


class Logs(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.logs

	def convert(self, log_db):
		return Log(
			log_db["ip"],
			log_db["user_id"],
			log_db["highlighted_text"],
			log_db["source_url"],
			log_db["explanation"],
			log_db["communities"],
			deleted=log_db.get("deleted", False),
			submit_time=log_db["time"],
			type="submit_context",
			id=log_db["_id"]
		)

	def insert(self, log):
		inserted = self.collection.insert_one({
			"ip": log.ip,
			"user_id": log.user_id,
			"highlighted_text": log.highlighted_text,
			"source_url": log.source_url,
			"explanation": log.explanation,
			"type": "submit_context",
			"communities": log.communities,
			"time": log.time
		})
		return inserted

class Log:
	def __init__(self, ip, user_id, highlighted_text, source_url, explanation, communities, deleted=False,
				 submit_time=None, type="submit_context", id=None):
		self.id = id
		self.ip = ip
		self.user_id = user_id
		self.highlighted_text = highlighted_text
		self.source_url = source_url
		self.explanation = explanation
		self.communities = communities
		self.type = type,
		self.time = time.time() if not submit_time else submit_time
		self.deleted = deleted

	def to_dict(self):
		return {
			"_id": self.id,
			"ip": self.ip,
			"user_id": self.user_id,
			"highlighted_text": self.highlighted_text,
			"source_url": self.source_url,
			"explanation": self.explanation,
			"communities": self.communities,
			"type": self.type,
			"time": self.time,
			"deleted": self.deleted

		}
