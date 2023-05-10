# =======================================
# (DONE) test saving something new with extension to pc

# (DONE) update template to store user_id and time
# (DONE) update elastic to save user_id and time
# (DONE) two lines of deleting and re-adding result

"""
community permissions?
1. user states (toggle on/off in "all" search, "can_submit")

2. community types --> users states
"""


from pymongo import MongoClient
import argparse
import os
from manage_data import ElasticManager


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
    
    # Mongodb conn information 
    client = MongoClient(os.environ["cdl_uri"])
    cdl_db = client[os.environ["db_name"]]

    cdl_submissions = cdl_db.logs

    elastic_manager = ElasticManager(os.environ["elastic_username"], 
                                     os.environ["elastic_password"],
                                     os.environ["elastic_domain"],
                                     os.environ["elastic_index_name"],
                                     None)


    date_update = {
        "properties": {
            "time": {
                "type": "date"
            }
        }
    }

    user_id_update = {
        "properties": {
            "user_id": {
                "type": "keyword"
            }
        }
    }

    #print(elastic_manager.add_to_mapping(date_update))
    #print(elastic_manager.add_to_mapping(user_id_update))
    print(elastic_manager.list_indices())

    all_submissions = cdl_submissions.find()
    for submission in all_submissions:
        if "deleted" not in submission:
            id = str(submission["_id"])
            print(id)
            deleted_index_status = elastic_manager.delete_document(id)
            print("\t", deleted_index_status)
            added_index_status = elastic_manager.add_to_index(submission)
            print("\t", added_index_status)

