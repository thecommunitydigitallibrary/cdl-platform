from enum import IntEnum


class Status(IntEnum):
	OK = 200
	CREATED = 201
	ACCEPTED = 202

	BAD_REQUEST = 400
	UNAUTHORIZED = 401
	FORBIDDEN = 403
	NOT_FOUND = 404

	INTERNAL_SERVER_ERROR = 500
	NOT_IMPLEMENTED = 501
	BAD_GATEWAY = 502

	def __str__(self):
		return self.name
