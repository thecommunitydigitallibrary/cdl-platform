#     community_id
# 	  parsed url (no fragment): {hashtag: [submission_ids]}}

from app.db import get_db
from app.models.mongo import Mongo


class CommunityCores(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.community_cores

	def convert(self, community_core_db):
		return CommunityCore(
			community_core_db["community_id"],
			community_core_db["core_content"],
			id=community_core_db["_id"]
		)

	def update(self, community_id, url, hashtags, submission_id):
		"""
		Wrapper to create/update a community core content link.

		Parameters:

			community_id : ObjectID : the ID of the community.
			url : str : the URL of the submission being made. Make sure that it is parsed (e.g., the fragment removed).
			hashtags : list : a list of string hashtags to link to the submission (e.g., ["L1.1", "1.1"]).
			submission_id : ObjectID : the ID of the submission to update.

		Returns:

			An ObjectID of the updated community core, otherwise throws an error
		"""

		# first, check if there is a entry for this community
		community_core = self.collection.find_one({"community_id": community_id})


		if not community_core:
			community_core = {"community_id": community_id, "core_content": {url: {hashtag: [submission_id] for hashtag in hashtags}}}
			community_core_id = self.collection.insert_one(community_core)
			return community_core_id
		
		# otherwise, update the existing entry
		else:
			community_core_id = community_core["_id"]
			if url not in community_core["core_content"]:
				community_core["core_content"][url] = {}

			"""
			get dict of all existing hashtags
			for each submitted hashtag:
				if in existing hashtags:
					add submission_id
				if not in existing hashtags:
					create submission list, and add submission
				delete hashtag from all existing hashtags
			for all existing hashtags:
				remove submission id from that list, if it is there

			"""
			existing_hashtags = {hashtag: True for hashtag in community_core["core_content"][url]}
			for hashtag in hashtags:
				if hashtag not in community_core["core_content"][url]:
					community_core["core_content"][url][hashtag] = [submission_id]
				else:
					del existing_hashtags[hashtag]
					if submission_id not in community_core["core_content"][url][hashtag]:
						community_core["core_content"][url][hashtag].append(submission_id)
			for hashtag in existing_hashtags:
				if submission_id in community_core["core_content"][url][hashtag]:
					community_core["core_content"][url][hashtag] = [x for x in community_core["core_content"][url][hashtag] if x != submission_id]

					if community_core["core_content"][url][hashtag] == []:
						del community_core["core_content"][url][hashtag]

			# check if empty url
			if community_core["core_content"][url] == {}:
				del community_core["core_content"][url]


			# check if empty community
			if community_core["core_content"] == {}:
				# delete completely
				delete_id = self.collection.delete_one({"_id": community_core_id})
				return delete_id
			else:
				# update with new community_core
				update_id = self.collection.update_one({"_id": community_core_id}, {"$set": {"core_content": community_core["core_content"]}})
				return update_id

			

			

class CommunityCore:
	def __init__(self, community_id, core_content, id=None):
		self.id = id
		self.community_id = community_id
		self.core_content = core_content
