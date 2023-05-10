from app.db import get_db
from app.models.mongo import Mongo


class Notes(Mongo):
	def __init__(self):
		cdl_db = get_db()
		self.collection = cdl_db.notes

	def convert(self, notes_db):
		return Note(
			notes_db["user_id"],
			notes_db["notes"],
			notes_db["_id"]
		)

	def insert(self, note):
		notes_db = {
			"user_id": note.user_id
		}
		for key in note.notes.keys():
			notes_db["notes." + key] = note.notes[key]

		note.id = self.collection.insert_one(notes_db)
		return note.id


class Note:
	def __init__(self, user_id, notes, id=None):
		self.id = id
		self.user_id = user_id
		self.notes = {}
		for key in notes.keys():
			self.notes[key] = notes[key]
