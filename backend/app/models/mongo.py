from abc import ABC, abstractmethod


class Mongo(ABC):
	collection = None

	@abstractmethod
	def convert(self, document):
		pass

	def find(self, query):
		return [self.convert(document) for document in self.collection.find(query)]

	def find_one(self, query):
		document = self.collection.find_one(query)
		return self.convert(document) if document else None

	def update_one(self, query, user, upsert=True):
		return self.collection.update_one(query, user, upsert=upsert)

	def exists(self, query):
		return self.collection.count_documents(query) >= 1

	def count(self, query):
		return self.collection.count_documents(query)

	def delete_one(self, query):
		return self.collection.delete_one(query)

	# Inserting directly to MongoDB without Model
	def insert_one_db(self, document):
		return self.collection.insert_one(document)

	# Searching one directly to MongoDB without Model
	def find_one_db(self, query):
		return self.collection.find_one(query)

	# Searching all directly to MongoDB without Model
	def find_db(self, query):
		return self.collection.find(query)

	def aggregate(self,query):
		return self.collection.aggregate(query)
