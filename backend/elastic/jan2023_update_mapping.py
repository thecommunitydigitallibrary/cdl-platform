# add hashtag as keyword, and backfill prior submissions

import argparse
import os
from manage_data import ElasticManager
from pymongo import MongoClient



if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    parser.add_argument("--env_path", required=True, help="path to env file")
    args = parser.parse_args()

    if args.env_path:
        with open(args.env_path, "r") as f:
            for line in f:
                split_line = line.split("=")
                name = split_line[0]
                value = "=".join(split_line[1:]).strip("\n")
                os.environ[name] = value

    elastic_manager = ElasticManager(os.environ["elastic_username"], 
                                     os.environ["elastic_password"],
                                     os.environ["elastic_domain"],
                                     os.environ["elastic_index_name"],
                                     None)

    hashtag_update = {
        "properties": {
            "hashtags": {
                "type": "keyword"
            }
        }
    }

    #print(elastic_manager.add_to_mapping(hashtag_update))
    #print(elastic_manager.list_indices())

    client = MongoClient(os.environ["cdl_uri"])
    cdl_db = client[os.environ["db_name"]]

    cdl_submissions = cdl_db.logs

    all_submissions = cdl_submissions.find()
    for submission in all_submissions:
        if submission.get("deleted", False): continue
        submission_description = submission["explanation"]
        id = str(submission["_id"])
                
        try:
            hashtags = [x for x in submission_description.split() if len(x) > 1 and x[0] == "#"]
        except:
            print("ERROR")
        if hashtags:
            print(id)
            deleted_index_status = elastic_manager.delete_document(id)
            print("\t", deleted_index_status)
            added_index_status = elastic_manager.add_to_index(submission)
            print("\t", added_index_status)
            