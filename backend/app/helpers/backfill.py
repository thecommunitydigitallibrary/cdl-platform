import argparse
import os
import sys
import json

current = os.path.dirname(os.path.realpath(__file__))
app_path = os.path.dirname(current)
backend_path = os.path.dirname(app_path)
sys.path.append(backend_path)

from app.helpers.scraper import ScrapeWorker
from app.models.webpages import Webpage
from pymongo import MongoClient
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

    def fetch_webpages_urls(self):
        """
        Fetched the Webpages URLs from MongoDB that have already been scraped.
        Returns:
            webpages_urls : dict : Webpages URLs to be skipped, mapping to the respective full webpage. Needed for filling elastic
        """
        #webpages_urls = self.webpages_collection.distinct("url")
        webpage_urls = {}
        webpages = self.webpages_collection.find({})
        for webpage in webpages:
            webpage_urls[webpage["url"]] = webpage
        return webpage_urls
    
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

    def execute(self):
        """
        Performs the backfill operation. Scrapes every submission URL that is not already scraped and adds it to
        webpages index in Opensearch.
        Returns:
            response : (dict) : Contains the scrape/indexing status of each URL to be processed.
        """
        # Fetch all the non-deleted submission URLs from MongoDB
        submissions_urls = self.fetch_submissions_urls()
        # Fetch all the webpage URLs from MongoDB
        webpages_urls = self.fetch_webpages_urls()

        print(f">>> List of submissions_urls to process: {len(submissions_urls)}")
        print(f">>> List of webpages_urls to be skipped: {len(webpages_urls)}")

        scraper = ScrapeWorker(webpages_urls)

        response = {}
        for i,source_url in enumerate(submissions_urls):
            source_url, _ = scraper.format_url_to_path(source_url)
            response[source_url] = {"message": "Redirected to another URL"}

            if i > 5000: break

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
                                    print("Something is very wrong")
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


# python app/helpers/backfill.py
if __name__ == "__main__":
    #env_file_path = os.path.join(os.path.dirname(__file__), "..", "..", "env_local.ini")

    #if env_file_path:
    #    with open(env_file_path, "r") as f:
    #        for line in f:
    #            split_line = line.split("=")
    #            name = split_line[0]
    #            value = "=".join(split_line[1:]).strip("\n")
    #            

    try:
        # From env_local.ini file fetch cdl_test_uri and elastic_domain_backfill if present
        # else fetch cdl_uri and elastic_domain
        file = {}
        cdl_uri = None
        elastic_domain = None

        # Keeping --env_path as an optional argument
        parser = argparse.ArgumentParser()
        parser.add_argument("--env_path", required=False, help="Path to env file")
        args = parser.parse_args()

        # If env_path is provided as an argument then pull data from this file
        if args.env_path:
            print(f"Reading from provided env file in --env_path argument")
            with open(args.env_path, "r") as f:
                for line in f:
                    split_line = line.split("=")
                    name = split_line[0]
                    value = "=".join(split_line[1:]).strip("\n")
                    file[name] = value
                    os.environ[name] = value
            cdl_uri = file.get("cdl_test_uri", file.get("cdl_uri"))
            elastic_domain = file.get("elastic_domain_backfill", file.get("elastic_domain"))
        # Else pull data from the current env_file
        else:
            print(f"Reading from current env file")
            cdl_uri = os.environ.get("cdl_test_uri", os.environ.get("cdl_uri"))
            elastic_domain = os.environ.get("elastic_domain_backfill", os.environ.get("elastic_domain"))

        print(f"Connecting to MongoDB at: {cdl_uri} and Opensearch at: {elastic_domain}")

        # MongoDB conn Info
        client = MongoClient(cdl_uri)
        cdl_db = client[file["db_name"]]

        # Connect to elastic for Webpages index operations
        webpages_elastic_manager = ElasticManager(
            file["elastic_username"],
            file["elastic_password"],
            elastic_domain,
            file["elastic_webpages_index_name"],
            None,
            "webpages")

        print(f">>> Starting the Back-fill operation...")

        bf = BackFill(cdl_db, webpages_elastic_manager)
        resp = bf.execute()

        print(f">>> Back-fill operation completed. \n{json.dumps(resp)}\n")
    except Exception as e:
        print(e)
        traceback.print_exc()

# python .\app\helpers\backfill.py --env_path ..\..\cdl-secrets\production\env_prod.ini > tmp.json
# python .\app\helpers\backfill.py --env_path ..\..\cdl-secrets\local_cloud_opensearch_mongodb\env_local.ini > tmp.json