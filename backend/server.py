from flask import Flask
import argparse
from flask_cors import CORS
import os
import nltk

from app.views.users import users
from app.views.communities import communities
from app.views.search import search
from app.views.submissions import submissions

from app.db import get_db, get_redis

app = Flask(__name__)
CORS(app)

app.register_blueprint(users)
app.register_blueprint(communities)
app.register_blueprint(search)
app.register_blueprint(submissions)


parser = argparse.ArgumentParser()

# if empty, assumes values are in environment (via Docker)
parser.add_argument("--env_path", required=False, help="path to env file")
args = parser.parse_args()

if args.env_path:
	with open(args.env_path, "r") as f:
		for line in f:
			split_line = line.split("=")
			name = split_line[0]
			value = "=".join(split_line[1:]).strip("\n")
			os.environ[name] = value

app.config['SECRET_KEY'] = os.environ["jwt_secret"]

with app.app_context():
	get_db()
	get_redis()

# for nltk data, used for parsing queries
nltk.download("brown")
nltk.download("punkt")

# start app
# app.run("0.0.0.0", port=os.environ["api_port"])
app.run("0.0.0.0", 80)
