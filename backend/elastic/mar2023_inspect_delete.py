
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
    


    ids = []

    for id in ids:
        print(elastic_manager.get_document(id))

    

# python elastic\mar2023_inspect_delete.py --env_path env_local.ini            