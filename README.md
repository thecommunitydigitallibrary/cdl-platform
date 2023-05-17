# The CDL 
The Community Digital Library (CDL) is a platform for users to save, search, and discover online content. 

To use the CDL, you have two options:

1. Online version: Visit [the CDL website](https://textdata.org/), install the Chrome extension, create an account, and begin saving websites.
2. Local version: Clone this repository, set up Docker, and run the services locally.

## Setting up the local version
Note that the local version is still under development:

- No data is persisted; once the Docker containers stops, all data is lost.
- The Chrome extension (from the Web store) is not compatible with the local version (yet).

### Requirements for running locally
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Configuring Docker for OpenSearch](https://opensearch.org/docs/latest/install-and-configure/install-opensearch/docker/). If you are running on Windows (and thus using WSL for Docker), then follow [these directions](https://github.com/docker/for-win/issues/5202) for increasing vm.max_map_count.
- With all of the Docker containers, packages, and models, the total size is ~10GB.

### Configuring the env files
Copy the following to ``\backend\env_local.ini``

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

Copy the following to ``\frontend\website\.env.local``

```
NEXT_PUBLIC_FROM_SERVER=http://host.docker.internal:8080/
NEXT_PUBLIC_FROM_CLIENT=http://localhost:8080/
```
 
### Starting the services
Run the docker-compose file: ``docker-compose -f docker-compose-offline.yml up -d --build``
