import argparse
import os
import sys
import json
from bson import ObjectId

current = os.path.dirname(os.path.realpath(__file__))
app_path = os.path.dirname(current)
backend_path = os.path.dirname(app_path)
sys.path.append(backend_path)

from app.helpers.scraper import ScrapeWorker
from app.models.webpages import Webpage
from pymongo import MongoClient, UpdateOne
from elastic.manage_data import ElasticManager
import traceback


class BackFill:
    def __init__(self, cdl_db, webpages_em):
        self.submissions_collection = cdl_db.logs
        self.webpages_collection = cdl_db.webpages
        self.webpages_elastic_manager = webpages_em

    def fetch_submissions_urls(self):
        """
        Fetched the Submissions URLs from MongoDB that have not been deleted.
        Returns:
            submissions_urls : (list) : Submission URLs to be scraped.
        """
        submissions_urls = self.submissions_collection.find({
            "type": "submit_context",
            "deleted": {
                "$exists": False
            }
        }).distinct("source_url")
        return submissions_urls

    def fetch_outgoing_webpages_urls(self):
        """
        Fetched the outgoing Webpages URLs from MongoDB that have not been scraped.
        Returns:
            outgoing_webpages_urls_dict : (dict) : Contains Webpage URL as key, and tuple of (_id, set of outgoing URLs)
            as value.
        """
        outgoing_webpages_urls_dict = {}
        # Fetching from MongoDB
        outgoing_webpages_documents = self.webpages_collection.find(
            {
                "outgoing_urls_scraped": {
                    "$exists": False
                }
            },
            {
                "_id": 1,
                "url": 1,
                "webpage.outgoing_urls": 1
            }
        )

        # Creating a dict of Webpage URL and a set of outgoing URLs as it's value
        for doc in outgoing_webpages_documents:
            if doc.get('webpage'):
                webpage = doc.get('webpage')
                if webpage.get('outgoing_urls'):
                    url_set = set()
                    outgoing_urls = webpage.get('outgoing_urls')
                    for outgoing_url in outgoing_urls:
                        url_set.add(outgoing_url['url'])
                    outgoing_webpages_urls_dict[doc['url']] = (doc['_id'], url_set)

        return outgoing_webpages_urls_dict

    def delete_webpage(self, _id):
        delete_status = self.webpages_collection.delete_one({"_id": _id})
        if not delete_status.acknowledged:
            print("Error: unable to delete scraped webpage")
            return False
        return True

    def log_webpage(self, url, webpage, scrape_status, scrape_time):
        webpage = Webpage(url,
                          webpage,
                          scrape_status,
                          scrape_time)

        insert_status = self.webpages_collection.insert_one({
            "url": webpage.url,
            "webpage": webpage.webpage,
            "scrape_status": webpage.scrape_status,
            "scrape_time": webpage.scrape_time,
        })

        if not insert_status.acknowledged:
            print("Error: unable to insert scraped webpage")
        else:
            webpage.id = insert_status.inserted_id
        return insert_status, webpage

    def runScraper(self, urls_to_process):
        scraper = ScrapeWorker(self.webpages_collection)

        response = {}
        for i, source_url in enumerate(urls_to_process):
            print(f'Processing URL: {source_url}')
            source_url, _ = scraper.format_url_to_path(source_url)
            response[source_url] = {"message": "Redirected to another URL"}

            if i > 1000:
                break

            webpage = scraper.is_scraped_before(source_url)

            if not webpage:
                try:
                    # Call scraper code
                    data = scraper.scrape(source_url)  # Triggering Scraper

                    # Check if the URL was already scraped via redirected URL
                    if data["scrape_status"]["code"] == -1:
                        response[source_url] = f'{data["url"]} was already scraped before'
                    else:
                        # To handle the case where source_url will be replaced with redirected URL
                        if source_url != data["url"]:
                            response[source_url] = f'Redirected to {data["url"]}'
                            source_url = data["url"]
                            response[source_url] = {}

                        # Check if the scrape was not successful
                        if data["scrape_status"]["code"] != 1:
                            data["webpage"] = {}

                        # Add it to webpages collections in MongoDB
                        insert_status, webpage = self.log_webpage(
                            data["url"],
                            data["webpage"],
                            data["scrape_status"],
                            data["scrape_time"],
                        )
                        response[source_url]["insert_status"] = str(insert_status.acknowledged)
                        response[source_url]["scrape_status-message"] = data["scrape_status"]["message"]

                        # Add it to webpages index in Opensearch if scrape is a success
                        if insert_status.acknowledged and data["scrape_status"]["code"] == 1:
                            delete_mongo_flag = False
                            try:
                                elastic_insert_status = self.webpages_elastic_manager.add_to_index(webpage)
                                eis_json = json.loads(elastic_insert_status)
                                if eis_json["_shards"]["failed"] > 0:
                                    delete_mongo_flag = True
                                    response[source_url]["message"] = "Elastic index not successful"
                            except Exception as e:
                                response[source_url]["message"] = "Elastic index not successful"
                                delete_mongo_flag = True

                            if delete_mongo_flag:
                                status = self.delete_webpage(webpage.id)
                                if not status:
                                    print(f"Issue with deleting webpage in MongoDB")
                                    exit()
                            else:
                                response[source_url]["message"] = "Successful scraped and added to index!"
                        else:
                            response[source_url]["message"] = "Scrape not successful"
                            print(f"Unable to insert webpage data in database.")
                except Exception as err:
                    print(err)
                    response[source_url] = str(err)
            else:
                response[source_url] = "Already scraped before"

        return response

    def executeSubmissions(self):
        """
        Performs the backfill operation. Scrapes every submission URL that is not already scraped and adds it to
        webpages index in Opensearch.
        Returns:
            response : (dict) : Contains the scrape/indexing status of each URL to be processed.
        """
        # Fetch all the non-deleted submission URLs from MongoDB
        submissions_urls = self.fetch_submissions_urls()
        print(f'>>> List of submissions_urls to process: {submissions_urls}')
        response = self.runScraper(submissions_urls)
        return response

    def executeWebpages(self):
        """
        Scrapes 1-hop outgoing URLs from webpages. Scrapes every outgoing URL that is not already scraped and adds it to
        webpages index in Opensearch.
        Returns:
            response : (dict) : Contains the scrape/indexing status of each URL to be processed.
        """
        # Fetch all outgoing URLs from Webpages collection that have `outgoing_urls_scraped` as False
        outgoing_webpages_urls = self.fetch_outgoing_webpages_urls()
        response = {}

        scraper = ScrapeWorker(self.webpages_collection)
        updates = []
        for webpage_url, tup in outgoing_webpages_urls.items():
            webpage_id = tup[0]
            outgoing_urls_set = tup[1]
            op = self.runScraper(outgoing_urls_set)
            response[webpage_url] = op
            updates.append(UpdateOne({"_id": ObjectId(webpage_id)}, {"$set": {"outgoing_urls_scraped": True}}, upsert=False))

        if len(updates) > 0:
            # Bulk update `outgoing_urls_scraped` attribute to True for all the Webpages
            update = self.webpages_collection.bulk_write(updates)
            if update.acknowledged:
                print(f"Updates done successfully")
                response['Updates'] = 'Updates done successfully'
            else:
                print(f"Error occurred while making updates")
                response['Updates'] = 'Error occurred while making updates'
        else:
            response['Updates'] = "There were no URLs to be updated"
        return response


# python ./app/helpers/backfill.py --env_path="<PATH_TO_ENV_FILE>" --type=<"submissions" or "webpages">
if __name__ == "__main__":
    env_file_path = os.path.join(os.path.dirname(__file__), "..", "..", "env_local.ini")

    if env_file_path:
        with open(env_file_path, "r") as f:
            for line in f:
                split_line = line.split("=")
                name = split_line[0]
                value = "=".join(split_line[1:]).strip("\n")
                os.environ[name] = value

    try:
        # From env_local.ini file fetch cdl_test_uri and elastic_domain_backfill if present
        # else fetch cdl_uri and elastic_domain
        cdl_uri = None
        elastic_domain = None
        type_arg = None
        db_name = None
        elastic_username = None
        elastic_password = None
        elastic_webpages_index_name = None

        # Keeping --env_path as an optional argument
        parser = argparse.ArgumentParser()
        parser.add_argument("--env_path", required=False, help="Path to env file")
        parser.add_argument("--type", required=False, help="Pass `submissions` or `webpages` to be scraped")
        args = parser.parse_args()

        # If env_path is provided as an argument then pull data from this file
        if args.env_path:
            print(f"Reading from provided env file in --env_path argument")
            with open(args.env_path, "r") as f:
                for line in f:
                    split_line = line.split("=")
                    name = split_line[0]
                    value = "=".join(split_line[1:]).strip("\n")
                    os.environ[name] = value

        cdl_uri = os.environ.get("cdl_test_uri", os.environ.get("cdl_uri"))
        elastic_domain = os.environ.get("elastic_domain_backfill", os.environ.get("elastic_domain"))
        db_name = os.environ.get("db_name")
        elastic_username = os.environ.get("elastic_username")
        elastic_password = os.environ.get("elastic_password")
        elastic_webpages_index_name = os.environ.get("elastic_webpages_index_name")

        # If the type argument is passed
        if args.type:
            type_arg = args.type.lower()
        else:
            type_arg = 'submissions'

        print(f"\nRunning Backfill for type: {type_arg}")
        print(f"\nConnecting to MongoDB at: {cdl_uri} and Opensearch at: {elastic_domain}")

        # MongoDB conn Info
        client = MongoClient(cdl_uri)
        cdl_db = client[db_name]

        # Connect to elastic for Webpages index operations
        webpages_elastic_manager = ElasticManager(
            elastic_username,
            elastic_password,
            elastic_domain,
            elastic_webpages_index_name,
            None,
            "webpages")

        print(f"\n>>> Starting the Back-fill operation...")

        bf = BackFill(cdl_db, webpages_elastic_manager)
        if type_arg == 'submissions':
            resp = bf.executeSubmissions()
        elif type_arg == 'webpages':
            resp = bf.executeWebpages()
        else:
            raise Exception("Invalid type passed")

        print(f"\n>>> Back-fill operation completed for {type_arg}. \n\nResponse is as follows:\n{resp}")
    except Exception as e:
        print(e)
        traceback.print_exc()

# python .\app\helpers\backfill.py --env_path ..\..\cdl-secrets\production\env_prod.ini > tmp.json
# python .\app\helpers\backfill.py --env_path ..\..\cdl-secrets\local_cloud_opensearch_mongodb\env_local.ini > tmp.json