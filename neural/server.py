from flask import Flask
import argparse
from flask_cors import CORS
import os

from app.views.neural import neural

app = Flask(__name__)
CORS(app)

app.register_blueprint(neural)

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

# start app
app.run("0.0.0.0", 80)
