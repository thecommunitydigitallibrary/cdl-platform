import json


def success(payload, status):
	response = {"status": str(status).lower()}
	response.update(payload)
	return json.dumps(response), int(status)


def error(message, status):
	response = {"status": "error", "message": message}
	return json.dumps(response), int(status)


def error_payload(payload, status):
	response = {"status": str(status).lower()}
	response.update(payload)
	return json.dumps(response), int(status)
