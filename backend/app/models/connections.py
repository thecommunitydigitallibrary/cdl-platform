import time
from app.db import get_db
from app.models.mongo import Mongo


class Connections(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.connections

	def convert(self, connection_db):
		return Connection(
			connection_db["ip"],
			connection_db["user_id"],
			connection_db["source_id"],
			connection_db["target_id"],
			connection_db["description"],
			connection_db["time"],
			connection_db["_id"]
		)

	def insert(self, connection):
		connection_db = {
			"ip": connection.ip,
			"user_id": connection.user_id,
			"source_id": connection.source_id,
			"target_id": connection.target_id,
			"description": connection.description,
			"time": connection.time
		}
		connection.id = self.collection.insert_one(connection_db)
		return connection.id


class Connection:
	def __init__(self, ip, user_id, source_id, target_id, description, log_time=None, id=None):
		self.id = id
		self.ip = ip
		self.user_id = user_id
		self.source_id = source_id
		self.target_id = target_id
		self.description = description
		self.time = time.time() if not log_time else log_time
