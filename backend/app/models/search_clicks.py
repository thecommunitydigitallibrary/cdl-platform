import time
from app.db import get_db
from app.models.mongo import Mongo

class SearchClicks(Mongo):
	def __init__(self):
		db = get_db()
		self.collection = db.search_clicks

	def convert(self, sc_db):
		return SearchClick(
			sc_db["search_id"],
			sc_db["clicked_url"],
			click_time=sc_db["time"],
			id=sc_db["_id"]
		)

	def insert(self, search_click):
		inserted = self.collection.insert_one({
			"time": search_click.time,
			"search_id": search_click.search_id,
			"clicked_url": search_click.clicked_url
		})
		return inserted.inserted_id


class SearchClick:
	def __init__(self, search_id, clicked_url, click_time=None, id=None):
		self.id = id
		self.time = time.time() if not click_time else click_time
		self.search_id=search_id
		self.clicked_url=clicked_url