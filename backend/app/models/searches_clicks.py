import time
from app.db import get_db
from app.models.mongo import Mongo


# TODO resolve the community and multiple models in db


class SearchesClicks(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.searches_clicks

	def convert(self, click_db):

		if click_db["type"] == "webpage_search":
			return SearchClick(
				click_db["_id"],
				click_db["ip"],
				click_db["user_id"],
				click_db["type"],
				click_db["query"],
				click_db["community"],
				click_db["time"],
				own_submissions=click_db.get("own_submissions", False)
			)
		else:
			try:
				hash = click_db["hash"]
			except:
				hash = None
			return SearchClick(
				click_db["_id"],
				click_db["ip"],
				click_db["user_id"],
				click_db["url"],
				click_db["highlighted_text"],
				click_db["query"],
				click_db["type"],
				hash=hash,
				search_time=click_db["time"],
				community=click_db["community"]
			)

	def insert(self, click):
		click_db = {
			"ip": click.ip,
			"user_id": click.user_id,
			"url": click.url,
			"highlighted_text": click.highlighted_text,
			"query": click.query,
			"type": click.type,
			"time": click.time,
			"community": click.community
		}
		if click.hash:
			click_db['hash'] = click.hash
		click.id = self.collection.insert_one(click_db)
		return click.id


class SearchClick:
	def __init__(self, id, ip, user_id, url, highlighted_text, query, typ, hash=None, community=None, search_time=None):
		self.id = id
		self.ip = ip
		self.user_id = user_id
		self.url = url
		self.highlighted_text = highlighted_text
		self.query = query
		self.type = typ
		self.hash = hash
		# self.community = community
		self.time = time.time() if not search_time else search_time

	def __init__(self, id, ip, user_id, typ, query, community, search_time, own_submissions=False):
		self.id = id
		self.ip = ip
		self.user_id = user_id
		self.query = query
		self.type = typ
		self.community = community
		self.time = time.time() if not search_time else search_time
		self.own_submissions = own_submissions
