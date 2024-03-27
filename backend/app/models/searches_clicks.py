import time
from app.db import get_db
from app.models.mongo import Mongo
from bson.json_util import dumps


# TODO resolve the community and multiple models in db

class SearchesClicks(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.searches_clicks

	def convert(self, click_db):

		if click_db["type"] in ["webpage_search", "visualizeConnections"]:
			return SearchClickWebpageSearch(
				click_db["_id"],
				click_db["ip"],
				click_db["user_id"],
				click_db["type"],
				click_db["query"],
				click_db["community"],
				click_db["time"],
				own_submissions=click_db.get("own_submissions", False)
			)
		elif click_db["type"] == "extension_open":

				url = click_db.get("url","")
				source_url = click_db.get("source_url","")
				click_db['url'] = url or source_url
				
				return SearchClickExtension(
					click_db["ip"],
					click_db["user_id"],
					click_db["url"],
					click_db["highlighted_text"],
					click_db["type"],
					click_db["query"],
					id=click_db["_id"],
					time=click_db["time"],
					community=click_db.get("community", None)
				)

class SearchClickExtension:
	def __init__(self, ip, user_id, url, highlighted_text, type, query, id=None, time=None, community=None, own_submissions=False):
		self.id = id
		self.ip = ip
		self.user_id = user_id
		self.url = url
		self.highlighted_text = highlighted_text
		self.query = query
		self.type = type
		self.own_submissions = own_submissions
		self.community = community
		self.time = time.time() if not time else time

	def insert(self):
		click_db = {
			"ip": self.ip,
			"user_id": self.user_id,
			"highlighted_text": self.highlighted_text,
			"query": self.query,
			"type": self.type,
			"url": self.url,
			"time": self.time,
			"community": self.community,
			"own_submissions": self.own_submissions
		}
		self.id = self.collection.insert_one(click_db)
		return self.id


# TODO: Fix ID issue on creation
class SearchClickWebpageSearch:

	def __init__(self, id, ip, user_id, typ, query, community, time, own_submissions=False):
		self.id = id
		self.ip = ip
		self.user_id = user_id
		self.query = query
		self.type = typ
		self.community = community
		self.time = time.time() if not time else time
		self.own_submissions = own_submissions

	def insert(self):
		click_db = {
            "_id": self.id,
            "ip": self.ip,
            "user_id": self.user_id,
            "query": self.query,
            "type": self.type,
            "community": self.community,
            "time": self.time,
            "own_submissions": self.own_submissions
        }
		self.id = self.collection.insert_one(click_db)
		return self.id