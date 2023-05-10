import json

from app.db import get_redis

from app.models.redis_wrapper import Redis


class Cache(Redis):
	NUMBER_OF_HITS = "number_of_hits"

	def __init__(self, time_to_live=60*60):
		self.rds = get_redis()
		# Time to live in seconds, default is one hour
		self.time_to_live = time_to_live
		self.seperator = "-"

	def get_key(self, user_id, search_id):
		return self.seperator.join([user_id, search_id])

	def search(self, user_id, search_id, page):
		key = self.get_key(user_id, search_id)
		# Subtract one to not count 'NUMBER_OF_HITS' page.
		pages_cached = len(self.hash_keys(key)) - 1
		# If the number of cached pages is less than the requested page number then return.
		if pages_cached <= page:
			return 0, []

		jsn = self.hash_get(key, page)
		number_of_hits = self.hash_get(key, self.NUMBER_OF_HITS)
		return number_of_hits, json.loads(jsn) if jsn else []

	def insert(self, user_id, search_id, pages, index):
		key = self.get_key(user_id, search_id)

		# Storing number of hits in the cache to be used in frontend.
		mappings = {
			self.NUMBER_OF_HITS: len(pages)
		}
		# Converting the list of results into pages and storing into the cache.
		batch = []
		page_size = 10
		for i, page in enumerate(pages):
			batch.append(page)
			if len(batch) == page_size:
				mappings[i // page_size] = json.dumps(batch)
				batch = []
		if len(batch) > 0:
			mappings[len(pages) // page_size] = json.dumps(batch)
		self.hash_set(key, mappings)
		return json.loads(mappings.get(index)) if mappings.get(index) else []
