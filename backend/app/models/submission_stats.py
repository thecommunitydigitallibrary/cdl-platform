from app.db import get_db
from app.models.mongo import Mongo
from app.models.searches_clicks import *
from app.models.recommendations_clicks import *
from bson import ObjectId

class SubmissionStats(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.submission_stats

	def convert(self, stats_db):
		return Stats(
			stats_db["submission_id"],
			stats_db["search_clicks"],
			stats_db["recomm_clicks"],
			stats_db["views"],
			stats_db["likes"],
			stats_db["dislikes"],
			stats_db["_id"]
		)
		
	def update_stats(self, submission_id, request_type, val=0):
		'''
		Creates and/or Updates the metrics in submission_stats db

		Args: 
			- submission_id (str) : submission_id of the submission
			- request_type (str): possible values are [submission_view, click_search_result, click_recommendation_result, likes, dislikes]
			- val (int): value to increment or decrement for likes and dislikes field (1/-1)

		Returns:
			Dictonary object of the updated document

		
		'''
		submission_id = ObjectId(submission_id)
		filter_criteria = {"submission_id": submission_id}
		insert_fields = {
			"submission_id" : submission_id,
			"search_clicks" : 0,
			"recomm_clicks" : 0,
			"views" : 0,
			"likes" : 0,
			"dislikes" : 0

		}
		if self.collection.find_one(filter_criteria) == None:
			self.collection.insert_one(insert_fields)

		update_operation  = {}
		if request_type == "submission_view":
			update_operation["$inc"] = {"views": 1}
		elif request_type == "click_search_result":
			update_operation["$inc"] = {"search_clicks": 1}
		elif request_type == "click_recommendation_result":
			update_operation["$inc"] = {"recomm_clicks": 1}
		elif request_type == "likes":
			update_operation["$inc"] = {"likes": val}
		elif request_type == "dislikes":
			update_operation["$inc"] = {"dislikes": val}

		updated_document = self.collection.update_one(
			filter=filter_criteria,
			update=update_operation,
		)
		return updated_document.raw_result


class Stats:
	"""
    Represents statistics for a submission.

    Args:
		- submission_id (ObjectId): The ID of the submission.
		- search_clicks (int): The number of clicks from search results.
		- recomm_clicks (int): The number of clicks from recommendations.
		- views (int): The number of views.
		- likes (int): The number of likes.
		- dislikes (int): The number of dislikes.
		- id (ObjectId, optional): The unique identifier of the stats record.
    """
	def __init__(self,submission_id,search_clicks=0, recomm_clicks=0, views=0, likes=0,dislikes=0,id=None):
		self.id = id
		self.submission_id = submission_id
		self.search_clicks = search_clicks
		self.recomm_clicks = recomm_clicks
		self.views = views
		self.likes = likes
		self.dislikes = dislikes
		
