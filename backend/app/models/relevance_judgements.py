from app.db import get_db
from app.models.mongo import Mongo


class Relevance_Judgements(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.relevant_judgement

	def convert(self, judgment_db):
		return Relevance(
			judgment_db["user_id"],
			judgment_db["submission_id"],
			judgment_db["relevance"],
			judgment_db["_id"],
		)

	def update_relevance(self, judgment):
		"""
        Updates the relevance judgment for a submission.

        Args:
        	- judgment (Judgement object): The relevance judgment to update.

        Returns:
        	Dictonary object of the updated document.
        """
		filter = {
			"user_id": judgment.user_id,
			"submission_id": judgment.submission_id
		}
		update = {"$set":{"relevance": judgment.relevance}}
		judgment = self.collection.update_one(filter, update, upsert=True)
		return judgment.raw_result


class Relevance:
	"""
    Represents the relevance judgment given by a user for a submission.

	Attr:
		- user_id (ObjectId): The ID of the user providing the judgment.
		- submission_id (ObjectId): The ID of the submission being judged.
		- relevance (int): The relevance judgment (0 or 1).
		- id (ObjectId, optional): The unique identifier of the relevance judgment record.
		
    """
	def __init__(self, user_id,submission_id, relevance,id=None):
		self.id = id
		self.user_id = user_id
		self.submission_id = submission_id
		self.relevance = relevance #0 or 1
	