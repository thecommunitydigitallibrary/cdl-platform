import time
from app.db import get_db
from app.models.mongo import Mongo


class RecommendationsClicks(Mongo):
    def __init__(self):
        cdl_db = get_db()
        self.collection = cdl_db.recommendations_clicks

    def convert(self, recommendation_click_db):
        return RecommendationClicks(
            recommendation_click_db["_id"],
            recommendation_click_db["user_id"],
            recommendation_click_db["ip"],
            recommendation_click_db["rank"],
            recommendation_click_db["recommendation_id"],
            recommendation_click_db["submission_id"],
            recommendation_click_db["redirect_url"],
            recommendation_click_db["method"],
            recommendation_click_db["time"],
            recommendation_click_db["_id"],
        )

    def insert(self, click):
        recommendation_click_db = {
            "ip": click.ip,
            "user_id": click.user_id,
            "rank": click.rank,
            "recommendation_id": click.recommendation_id,
            "submission_id": click.submission_id,
            "redirect_url": click.redirect_url,
            "method": click.method,
            "time": click.time
        }

        click.id = self.collection.insert_one(recommendation_click_db)
        return click.id


class RecommendationClicks:
    def __init__(self, id, user_id, ip, recommendation_id, redirect_url, submission_id, rank, method=None, click_time=None):
        self.id = id
        self.user_id = user_id
        self.ip = ip
        self.recommendation_id = recommendation_id
        self.redirect_url = redirect_url
        self.rank = rank
        self.submission_id = submission_id
        self.method = method
        self.time = time.time() if not click_time else click_time
