import argparse
import os
from pymongo import MongoClient
from bson.objectid import ObjectId

def parse_env_file(env_file):
    env_vars = {}
    with open(env_file, 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                env_vars[key] = value
    return env_vars

def connect_to_mongodb(env_vars):
    #mongo_host = env_vars.get('cdl_uri', 'mongodb://localhost:27017') #in prod
    mongo_host = env_vars.get('cdl_test_uri', 'localhost')
    mongo_client = MongoClient(mongo_host)
    return mongo_client

def insert_stats(submission_id, mongo_client, database_name):
    submission_id = ObjectId(submission_id)
    db = mongo_client[database_name]
    searches_clicks_collection = db.searches_clicks
    recommendations_clicks_collection = db.recommendations_clicks
    stats_collection = db.submission_stats

    cdl_searches_clicks = searches_clicks_collection
    cdl_recommendations_clicks = recommendations_clicks_collection
    submission_exists = cdl_searches_clicks.count_documents({"submission_id": submission_id})

    if submission_exists > 0:
        num_search_clicks = cdl_searches_clicks.count_documents({"submission_id": submission_id, "type": "click_search_result"})
        num_rec_clicks = cdl_recommendations_clicks.count_documents({"submission_id": submission_id})
        num_views = cdl_searches_clicks.count_documents({"submission_id": submission_id, "type": "submission_view"})

        stats_data = {
            "submission_id": submission_id,
            "search_clicks": num_search_clicks,
            "recomm_clicks": num_rec_clicks,
            "views": num_views,
            "likes":0,
            "dislikes":0
        }
        return

        try:
            stats_collection.insert_one(stats_data)
            #print(f"Stats inserted for submission: {submission_id}")
        except Exception as e:
            print(f"Error occurred while inserting stats for submission {submission_id}: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--env_file", required=True, help="Path to the environment file")
    args = parser.parse_args()

    env_vars = parse_env_file(args.env_file)
    mongo_client = connect_to_mongodb(env_vars)
    database_name = env_vars.get('db_name', 'cdl-local')

    searches_clicks_collection = mongo_client[database_name].searches_clicks
    submission_ids = searches_clicks_collection.distinct("submission_id")

    for i,submission_id in enumerate(submission_ids):
        insert_stats(str(submission_id), mongo_client, database_name)
        print(i)
        if i % 100 == 0: print(i / len(submission_ids))

    print("Backfill completed.")


# python backend\elastic\mar2024_stats_fill.py --env_file backend\env_local_offline.ini      