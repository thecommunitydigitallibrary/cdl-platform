import time
from app.db import get_db
from app.models.mongo import Mongo

class SearchLogs(Mongo):
	def __init__(self):
		db = get_db()
		self.collection = db.search_logs

	def convert(self, sl_db):
		return SearchLog(
			sl_db["user_id"],
			source = sl_db["source"],
			scope = sl_db["scope"],
			filters = sl_db["filters"],
			context = sl_db["context"],
			intent = sl_db["intent"],
			id=sl_db["_id"],
			log_time = sl_db["time"],
		)

	def insert(self, searchlog):
		inserted = self.collection.insert_one({
			"user_id": searchlog.user_id,
			"source": searchlog.source,
			"time": searchlog.time,
			"scope": searchlog.scope,
			"filters": searchlog.filters,
			"context": searchlog.context,
			"intent": searchlog.intent
		})
		return inserted.inserted_id


class SearchLog:
	def __init__(self, user_id, source, scope={}, context={}, intent={}, filters={}, id=None, log_time=None):
		self.id = id
		self.user_id = user_id
		self.source = source
		self.time = time.time() if not log_time else log_time
		self.scope=scope
		self.filters=filters
		self.context=context
		self.intent=intent
