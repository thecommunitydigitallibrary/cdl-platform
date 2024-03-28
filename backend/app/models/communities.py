import uuid

from app.db import get_db
from app.models.mongo import Mongo


class Communities(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.communities

	def convert(self, community_db):
		return Community(
			community_db["name"],
			community_db["description"],
			community_db["admins"],
			join_key=community_db["join_key"],
			id=community_db["_id"]
		)
	## TODO update here with community_homepage_url and is_public
	## just like is_deleted
	def insert(self, community):
		community_db = {
			"name": community.name,
			"description": community.description,
			"join_key": community.join_key,
			"admins": community.admins,
		}
		community.id = self.collection.insert_one(community_db)
		return community.id


class Community:
	def __init__(self, name, description, admins, join_key=None, id=None):
		self.id = id
		self.name = name
		self.description = description
		self.join_key = str(uuid.uuid4()) if not join_key else join_key
		self.admins = admins
