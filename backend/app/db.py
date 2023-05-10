import os

from flask import g
from pymongo import MongoClient
from werkzeug.local import LocalProxy
import redis


def get_db():
	"""
	Configuration method to return db instance
	"""
	db = getattr(g, "_database", None)

	if db is None:
		client = MongoClient(os.environ["cdl_uri"])
		db = g._database = client[os.environ["db_name"]]

	return db


def get_redis():
	rds = getattr(g, "_redis", None)

	if rds is None:
		rds = redis.Redis(
			host=os.environ["redis_host"],
			port=int(os.environ["redis_port"]),
			password=os.environ["redis_password"],
			charset="utf-8",
			decode_responses=True
		)
		g.__setattr__("_redis", rds)

	return rds


# Use LocalProxy to read the global db instance with just `db`
db = LocalProxy(get_db)
