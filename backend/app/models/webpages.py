import time

from app.db import get_db
from app.models.mongo import Mongo


class Webpages(Mongo):
    def __init__(self):
        cdl_db = get_db()
        self.collection = cdl_db.webpages

    def convert(self, webpage_db):
        return Webpage(
            webpage_db["url"],
            webpage_db["webpage"],
            webpage_db["communities"],
            webpage_db["scrape_status"],
            webpage_db["scrape_time"],
            id=webpage_db["_id"],
        )

    def insert(self, webpage):
        inserted = self.collection.insert_one(
            {
                "url": webpage.url,
                "webpage": webpage.webpage,
                "communities": webpage.communities,
                "scrape_status": webpage.scrape_status,
                "scrape_time": webpage.scrape_time,
            }
        )
        return inserted


class Webpage:
    def __init__(
        self,
        url,
        webpage,
        communities,
        scrape_status,
        scrape_time,
        id=None,
    ):
        self.id = id
        self.scrape_status = scrape_status
        self.webpage = webpage
        self.url = url
        self.communities = communities
        self.scrape_time = scrape_time

    def to_dict(self):
        return {
            "_id": self.id,
            "url": self.url,
            "webpage": self.webpage,
            "communities": self.communities,
            "scrape_time": self.scrape_time,
            "scrape_status": self.scrape_status,
        }
