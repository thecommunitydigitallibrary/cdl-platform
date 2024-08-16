import time
from app.db import get_db
from app.models.mongo import Mongo


class Notifications(Mongo):
    def __init__(self):
        cdl_db = get_db()
        self.collection = cdl_db.notifications

    def convert(self, notifications_db):
        return Notifications(
            notifications_db["_id"],
            notifications_db["notify_to"],
            notifications_db["notify_msg"],
            notifications_db["notify_type"],
            notifications_db["notify_read"],
            notifications_db["notify_delivered"],
            notifications_db["notify_timestamp"]
        )

class Notification:
    def __init__(self, notify_to, notify_msg, notify_type, notify_read,notify_delivered,notify_timestamp,id=None):
        self.id = id
        self.notify_to = notify_to
        self.notify_msg = notify_msg
        self.notify_type = notify_type
        self.notify_read = notify_read
        self.notify_delivered = notify_delivered
        self.notify_timestamp = notify_timestamp
