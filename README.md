# The Community Digital Library 
The Community Digital Library (CDL) is an open-source platform for users to save, search, and discover online content. Our long-term vision is to anticipate the information needs of a user and proactively provide them with helpful information while minimizing user effort.


To use the CDL, you have three options:

1. Full online version: Visit [the CDL website](https://textdata.org/), install the [Chrome extension](https://chrome.google.com/webstore/detail/the-community-digital-lib/didjjbenidcdopncjajdoeniaplicdee?hl=en&authuser=0), create an account, and begin using the CDL.
2. Full offline version: Clone this repository, set up Docker, and run the services locally. This is described in the section below titled "Setting Up the Local Version".
3. Hosted backend, local frontend: You can leverage the APIs for the backend of the CDL, and create or extend your own frontend (website or browser extension). The API documentation is [here](https://github.com/thecommunitydigitallibrary/cdl-platform/tree/dev/backend).

<details>
<summary>Setting Up the Offline Version</summary>
<br>

## Setting Up the Offline Version
Note that the local version is still under development:

- No data is persisted; once the Docker containers stops, all data is lost.
- The Chrome extension (from the Web store) is not compatible with the local version (yet).
- However, you can build and load the extension locally.
- "Reset Password" will not work due to no access to SendGrid.

### Requirements for running locally
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) for Windows
- [Configuring Docker for OpenSearch](https://opensearch.org/docs/latest/install-and-configure/install-opensearch/docker/). If you are running on Windows (and thus using WSL for Docker), then follow [these directions](https://github.com/docker/for-win/issues/5202) for increasing vm.max_map_count.
```
open powershell
wsl -d docker-desktop
sysctl -w vm.max_map_count=262144
```
- With all of the Docker containers, packages, and models, the total size is ~10GB.

### Configuring the env files
Copy the following to ``backend\env_local.ini``:

```
api_url=http://localhost
api_port=8080
webpage_port=8080
jwt_secret=0047fa567bbddf121b23d1deaa7ff2af
redis_host=redis
redis_port=6379
redis_password=admin
cdl_uri=mongodb://mongodb:27017/?retryWrites=true&w=majority
db_name=cdl-local
elastic_username=admin
elastic_password=admin
elastic_index_name=submissions
elastic_webpages_index_name=webpages
elastic_domain=http://host.docker.internal:9200/
```

Copy the following to ``frontend\website\.env.local``":
```
NEXT_PUBLIC_FROM_SERVER=http://host.docker.internal:8080/
NEXT_PUBLIC_FROM_CLIENT=http://localhost:8080/
```
Copy the following to ``frontend\extension\.env.local`` ":
```
REACT_APP_URL=http://localhost:8080/
REACT_APP_WEBSITE=http://localhost:8080/
```

### Starting the services

#### Website, backend API, MongoDB, and OpenSearch:

Add the following to ``docker-compose.yml``:

```
services:
    redis:
        image: redis:alpine
        command: redis-server --requirepass admin
        restart: always
        ports:
            - '6379:6379'

    reverseproxy:
        image: reverseproxy
        build:
            context: .\reverseproxy
            dockerfile: Dockerfile-local
        ports:
            - 8080:8080
        restart: always

    mongodb:
        image: mongo
        ports:
        - 27017:27017
        restart: always

    opensearch-node1:
        image: opensearchproject/opensearch:latest
        container_name: opensearch-node1
        environment:
            - cluster.name=opensearch-cluster
            - node.name=opensearch-node1
            - discovery.seed_hosts=opensearch-node1
            - cluster.initial_cluster_manager_nodes=opensearch-node1
            - bootstrap.memory_lock=true
            - DISABLE_SECURITY_PLUGIN=true
            - "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m"
        ulimits:
            memlock:
                soft: -1
                hard: -1
            nofile:
                soft: 65536 # Maximum number of open files for the opensearch user - set to at least 65536
                hard: 65536
        ports:
        - 9200:9200 # REST API

    website:
        depends_on:
            - reverseproxy
        image: website
        build: .\frontend\website
        env_file: .\frontend\website\.env.local
        restart: always
        extra_hosts:
            - "host.docker.internal:host-gateway"

    api:
        depends_on:
            - reverseproxy
            - redis
            - mongodb
            - opensearch-node1
        image: api
        build: .\backend
        restart: always
        env_file: .\backend\env_local.ini

```

Note that the slashes need to be reversed if running on Mac/Linux (above is written for windows).

Run the docker-compose file: ``docker-compose -f docker-compose.yml up -d --build``

To stop: ``docker-compose -f docker-compose.yml down``

#### Extension:
Navigate to ``frontend\extension`` and run ``npm run build``. Then upload the ``build`` file to Chome while using Development Mode.

</details>

<details>
<summary>Building on Top of the Hosted CDL</summary>
<br>

## Building on Top of the Hosted CDL
See the API documentation [here](https://github.com/thecommunitydigitallibrary/cdl-platform/tree/dev/backend). Please be courteous regarding the amount of API calls so that the backend servers do not get overwhelmed.

</details>

<details>
<summary>Roadmap</summary>
<br>


## Development Roadmap
- [ ] UNIT TESTING / AUTOMATIC BUILDS. Can do this all locally since data is not persisted, no need to worry about cleanups.
### Frontend
#### Search Results
- [ ] Don't cut off words, split at spaces
- [ ] Extend title length to match width
#### Notes Page
- [ ] Extend length of notes (dynamic per window size?)
- [ ] Notes scroll goes over header, should go under header
### Backend
#### General
- [ ] Add traceback.print_exc() for all print(e) calls for more helpful debugging
#### User Accounts API
- [ ] Place account API endpoints under common structure.
- [ ] Rename "token" to "hash" in password change request to avoid confusion with JWT.
- [ ] Extract username/password validation and move to helpers to avoid duplication.
- [ ] Change 202 status to 200 under password change request
#### Submissions API
- [ ] Pull out from functional to separate file (like users, notes) --> search, submission, and misc
- [ ] Change highlighted to description and explanation to title (requires front-end API change)
- [ ] Add error handling for not indexing doc successfully in elastic (get, patch, delete)
- [ ] Change highlighted text and explanation in return object to description and title
- [ ] Double-check if user id is needed in submission get return. If not, remove it.
- [ ] Move validate_submission to helpers
- [ ] Change batch call to loop over existing POST endpoint
#### Notes API
- [ ] On PATCH, make title and content optional, just like submission PATCH
#### Communities API
- [ ] Place get_communities_helper in try-catch block
- [ ] Remove "message" from success (need to update frontend community page + components)
- [ ] Move out relevance judgments to separate view
- [ ] Rename createCommunity endpoint to reflect that it can also be edited using this endpoint
#### Recommendations API
- [x] Merge new recommendation method from old repo, remove old method

</details>


## Contributors
<details>
<summary>How can I contribute?</summary>
<br>
For any single bug fix or small feature: fork this repository, make a pull request, and describe the change in the request.

For a longer-term collaboration, big feature, or large change, please send an email to ``kjros2@illinois.edu``. 
</details>

- [Kevin Ros](https://kevinros.github.io/) is a 4th year Ph.D. student at the University of Illinois Urbana Champaign. This is the main component of his thesis project. He built the initial version of the CDL platform and has led its development since its beginning (September 2022). 
- [ChengXiang Zhai](https://czhai.cs.illinois.edu/) is Kevin's advisor, and he has played a crucial role in shaping the vision of the CDL. Moreover, he has provided the grant funding to support the CDL infrastructure, the research, and the development.



## Publications
...TBD...
