from abc import ABC


class Redis(ABC):
	rds = None
	time_to_live = 60 * 60

	def set(self, key, value):
		"""
		Adds a key-value pair to the database

		Args:
			key: key string
			value: value string
		"""
		self.rds.set(key, value)
		self.rds.expire(key, self.time_to_live)

	def get(self, key):
		"""
		Returns the value using the key

		Args:
			key: key string

		Returns:
			value for the key
		"""
		return self.rds.get(key)

	def multi_set(self, mappings):
		"""
		Adds the content of hashmap as key-value pairs

		Args:
			mappings: hashmap with key-value pairs
		"""
		self.rds.mset(mappings)

	def multi_get(self, keys):
		"""
		Returns a list of values attached to the list of keys

		Args:
			keys: list of keys

		Returns:
			list of values using the list of keys
		"""
		return self.rds.mget(keys)

	def hash_set(self, name, mapping):
		"""
		Adds a hashmap to the hash name
		For instance,
		"name" : {
			"key1" : "value1", ...
		}

		Args:
			name: key of the maps
			mapping: hashmap that is to be added to a hash name

		Returns:
			all the hash values attached to a hash name
		"""
		self.rds.hset(name, mapping=mapping)
		self.rds.expire(name, self.time_to_live)

	def hash_get(self, name, key):
		"""
		Returns value attached to the key in the hash

		Args:
			name: name of the hash
			key: key in the hashmap

		Returns:
			value attached to the key in the hash
		"""
		return self.rds.hget(name, key)

	def hash_vals(self, name):
		"""
		Returns a list of values attached to a hash name

		Args:
			name: name of the hash

		Returns:
			all the hash values attached to a hash name
		"""
		return self.rds.hvals(name)

	def hash_keys(self, name):
		"""
		Returns a list of keys attached to a hash name

		Args:
			name: name of the hash

		Returns:
			all the hash keys attached to a hash name
		"""
		return self.rds.hkeys(name)

