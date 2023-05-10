import time
from app.db import get_db
from app.models.mongo import Mongo

class RecommendationsRequests(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.recommendations_requests

	def convert(self, recommendation_request_db):
		return RecommendationRequests(
				recommendation_request_db["_id"],
				recommendation_request_db["ip"],
				recommendation_request_db["user_id"],
				recommendation_request_db["method"],
				request_time=recommendation_request_db["time"],
				community=recommendation_request_db["community"]
		)


	def insert(self, req):
		recommendation_request_db = {
			"ip": req.ip,
			"user_id": req.user_id,
			"method": req.method,
			"time": req.time,
			"community": req.community
		}

		req.id = self.collection.insert_one(recommendation_request_db)
		return req.id


class RecommendationRequests:
    def __init__(self, ip, user_id, method,id=None, community=None, request_time=None):
        self.id = id
        self.ip = ip
        self.user_id = user_id
        self.community = community
        self.time = time.time() if not request_time else request_time
        self.method = method
