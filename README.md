# The CDL 
The Community Digital Library (CDL) is a platform for users to save, search, and discover online content. 

To use the CDL, you have two options:

1. Online version: Visit [the CDL website](https://textdata.org/), install the Chrome extension, create an account, and begin saving websites.
2. Offline version: Clone this repository, set up Docker, and run the services locally.

## Setting up the local version
Note that the local version is still under development:

- No data is persisted; once the Docker containers stops, all data is lost.
- The Chrome extension (from the Web store) is not compatible with the local version (yet).
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
elastic_domain_old=http://localhost:9200/
elastic_domain=http://host.docker.internal:9200/
```

Copy the following to ``frontend\website\.env.local``":

```
NEXT_PUBLIC_FROM_SERVER=http://host.docker.internal:8080/
NEXT_PUBLIC_FROM_CLIENT=http://localhost:8080/
```
 
### Starting the services

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

    opensearch-node1: # This is also the hostname of the container within the Docker network (i.e. https://opensearch-node1/)
        image: opensearchproject/opensearch:latest # Specifying the latest available image - modify if you want a specific version
        container_name: opensearch-node1
        environment:
            - cluster.name=opensearch-cluster # Name the cluster
            - node.name=opensearch-node1 # Name the node that will run in this container
            - discovery.seed_hosts=opensearch-node1 # Nodes to look for when discovering the cluster
            - cluster.initial_cluster_manager_nodes=opensearch-node1 # Nodes eligible to serve as cluster manager
            - bootstrap.memory_lock=true # Disable JVM heap memory swapping
            - DISABLE_SECURITY_PLUGIN=true
            - "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m" # Set min and max JVM heap sizes to at least 50% of system RAM
        ulimits:
            memlock:
                soft: -1 # Set memlock to unlimited (no soft or hard limit)
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

## Building on top of the online version
See the API documentation [here](https://github.com/thecommunitydigitallibrary/cdl-platform/tree/dev/backend).
