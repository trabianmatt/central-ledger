#!/bin/bash
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
docker_compose_file=$1
docker_functional_compose_file=$2

if [ $# -ne 2 ]; then
    echo "Usage: $0 docker-compose-file docker-functional-compose-file"
    exit 1
fi

is_psql_up() {
    docker run --rm -i \
    --net centralledger_back \
    --entrypoint psql \
    -e PGPASSWORD=$POSTGRES_PASSWORD \
    "postgres:9.3" \
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
		"postgres:9.3" \
        --host postgres \
		--username $POSTGRES_USER \
		--quiet --no-align --tuples-only \
		"$@"
}

>&2 echo "Stopping any running containers"
docker-compose -f $docker_compose_file -f $docker_functional_compose_file stop

>&2 echo "Postgres is starting"
docker-compose -f $docker_compose_file up -d postgres

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
docker-compose -f $docker_compose_file -f $docker_functional_compose_file up --build -d central-ledger

until is_central_ledger_up; do
  >&2 echo "Central-ledger is unavailable - sleeping"
  sleep 1
done

>&2 echo "Central-ledger is up - running functional tests"
while read event
do
    event_type=`echo $event | awk '{print $3}'`

    if [[ $event_type == 'start' ]]; then
        log_since=`echo $event | awk '{print $1}'`
    elif [[ $event_type == 'die' ]]; then
        exit_code=`echo $event | grep -Eow "exitCode=(\d*)" | cut -d"=" -f2`
        docker logs --since=$log_since centralledger_functional_1
        exit $exit_code
    fi
done < <(docker events --filter 'event=start' --filter 'event=die' --filter 'container=centralledger_functional_1') &

event_monitoring_pid=$!

>&2 echo "Functional tests are starting"
docker-compose -f $docker_compose_file -f $docker_functional_compose_file up --build -d functional

wait $event_monitoring_pid
exit $?
