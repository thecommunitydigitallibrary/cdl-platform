# TextData
TextData is an online platform to help you to discover the right information at the right place.

To use TextData, you have two options:

1. Full online version: Visit [textdata.org](https://textdata.org/), install the [Chrome extension](https://chrome.google.com/webstore/detail/the-community-digital-lib/didjjbenidcdopncjajdoeniaplicdee?hl=en&authuser=0), create an account, and begin using TextData.
2. Full offline version: Clone this repository, set up Docker, and run the services locally. This is described in the section below titled "Setting Up the Local Version".

<details>
<summary>Setting Up the Offline Version</summary>
<br>

## Setting Up the Offline Version
Note that the local version is still under development:

- No data is persisted; once the Docker containers stops, all data is lost.
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
- With all of the Docker containers, packages, and models, the total size is ~2GB.
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
cdl_test_uri=mongodb://localhost:27017
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
            context: ./reverseproxy
            dockerfile: Dockerfile-local
        ports:
            - 8080:8080
        restart: always

    mongodb:
        image: mongo
        ports:
            - 27017:27017
        restart: always
        command: mongod --bind_ip 0.0.0.0

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
        build: ./frontend/website
        env_file: ./frontend/website/.env.local
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
        build: ./backend
        restart: always
        env_file: ./backend/env_local.ini

```

Run the docker-compose file: ``docker-compose -f docker-compose.yml up -d --build``

To stop: ``docker-compose -f docker-compose.yml down``


If you would like to add the neural options (reranking, generation), add the following to ``backend\env_local.ini`` and restart docker-compose:

```
neural_api=http://host.docker.internal:9300/
```

Note that the slashes need to be reversed if running on Mac/Linux (above is written for windows).

To start the neural docker container (requires GPU), run the following from the ``neural`` folder: 

```
docker build -t .
docker run --gpus --env-file env_neural_prod.ini -p 9300:80 hash_of_above_image
```

#### Extension:
Navigate to ``frontend\extension`` and run ``npm ci`` and then run ``npm run build``. Then upload the ``build`` file to Chrome while using Development Mode. Once uploaded, open the extention, go to the setting section and chnage the backend source from textdata.org to other and click on Save. 


</details>


## Contributors
<details>
<summary>How can I contribute?</summary>
<br>
For any single bug fix or small feature: fork this repository, make a pull request, and describe the change in the request.

For a longer-term collaboration, big feature, or large change, please send an email to ``kjros2@illinois.edu``. 
</details>

- [Kevin Ros](https://kevinros.github.io/) is a 4th year Ph.D. student at the University of Illinois Urbana Champaign. This is the main component of his thesis project. He built the initial version of the platform and has led its development since its beginning (September 2022). 
- [ChengXiang Zhai](https://czhai.cs.illinois.edu/) is Kevin's advisor, and he has played a crucial role in shaping the vision. Moreover, he has provided the grant funding to support the infrastructure, the research, and the development.
- Current contributors: [Rakshana Jayaprakash](https://rakshanaj17.github.io/), Dhyey Pandya, Kedar Takwane, and Sharath Chandra.
- Past contributors: Ashwin Patil, Alvin Zhang, Nikhitha Reddeddy, Heth Gala




## Publications
- Kevin Ros and ChengXiang Zhai. 2023. The CDL: An Online Platform for Creating Community-based Digital Libraries. In Computer Supported Cooperative Work and Social Computing (CSCW ’23 Companion), October 14–18, 2023, Minneapolis, MN, USA. ACM, New York, NY, USA, 4 pages. https://doi.org/10.1145/3584931.3607495
- Kevin Ros, Matthew Jin, Jacob Levine, and ChengXiang Zhai. 2023. Retrieving Webpages Using Online Discussions. In Proceedings of the 2023 ACM SIGIR International Conference on the Theory of Information Retrieval (ICTIR ’23), July 23, 2023, Taipei, Taiwan. ACM, New York, NY, USA, 10 pages. https://doi.org/10.1145/3578337.3605139
