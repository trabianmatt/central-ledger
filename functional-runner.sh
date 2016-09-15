#!/bin/bash
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
docker_compose_file=$1
docker_functional_compose_file=$2
env_file=$3

if [ $# -ne 3 ]; then
    echo "Usage: $0 docker-compose-file docker-functional-compose-file env-file"
    exit 1
fi

is_psql_up() {
    docker run --rm -i \
    --net centralledger_back \
    --entrypoint psql \
    -e PGPASSWORD=$POSTGRES_PASSWORD \
    "postgres:9.4" \
    --host postgres \
    --username $POSTGRES_USER \
    --quiet \
    -c '\l' > /dev/null 2>&1
}

is_central_ledger_up() {
    docker run --rm -i \
    --net centralledger_front \
    --entrypoint curl \
    "byrnedo/alpine-curl" \
    --output /dev/null --silent --head --fail http://central-ledger:3000/documentation
}

psql() {
	docker run --rm -i \
		--net centralledger_back \
		--entrypoint psql \
		-e PGPASSWORD=$POSTGRES_PASSWORD \
		"postgres:9.4" \
        --host postgres \
		--username $POSTGRES_USER \
		--quiet --no-align --tuples-only \
		"$@"
}

>&2 echo "Loading environment variables"
source $env_file

>&2 echo "Postgres is starting"
docker-compose -f $docker_compose_file up -d postgres > /dev/null 2>&1

until is_psql_up; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - creating functional database"
psql <<'EOSQL'
    DROP DATABASE IF EXISTS "central_ledger_functional";
	  CREATE DATABASE "central_ledger_functional";
EOSQL

>&2 echo "Central-ledger is starting"
docker-compose -f $docker_compose_file -f $docker_functional_compose_file up --build -d central-ledger > /dev/null 2>&1

until is_central_ledger_up; do
  >&2 echo "Central-ledger is unavailable - sleeping"
  sleep 1
done

>&2 echo "Functional tests are starting"
docker-compose -f $docker_compose_file -f $docker_functional_compose_file build functional
docker-compose -f $docker_compose_file -f $docker_functional_compose_file run functional
