#!/usr/bin/env bash

JQ="jq --raw-output --exit-status"
APP_NAME=${APP_NAME:=central-ledger}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:=886403637725}
AWS_REGION=${AWS_REGION:=us-west-2}
VERSION=${CIRCLE_TAG:=$GIT_VERSION}
DOCKER_IMAGE=${DOCKER_IMAGE:=leveloneproject/$APP_NAME}
HOSTNAME=http://central-ledger-1139971789.us-west-2.elb.amazonaws.com
POSTGRES_USER=${DEV_POSTGRES_USER}
POSTGRES_PASSWORD=${DEV_POSTGRES_PASSWORD}
POSTGRES_HOST=${DEV_POSTGRES_HOST}
TASK_FAMILY=central-ledger
CLUSTER=central-services
SERVICE_NAME=$APP_NAME

configure_aws_cli() {
  aws --version
  aws configure set default.region $AWS_REGION
  aws configure set default.output json
}

deploy_cluster() {
  if [[ $(aws ecs update-service --cluster $CLUSTER --service $SERVICE_NAME --task-definition $revision | \
    $JQ '.service.taskDefinition') != $revision ]]; then
    echo "Error updating service."
    return 1
  fi

  # wait for older revisions to disappear, not really necessary
  for attempt in {1..30}; do
    if stale=$(aws ecs describe-services --cluster $CLUSTER --services $SERVICE_NAME | \
                    $JQ ".services[0].deployments | .[] | select(.taskDefinition != \"$revision\") | .taskDefinition"); then
      echo "Waiting for stale deployments:"
      echo "$stale"
      sleep 5
    else
      echo "Deployed!"
      return 0
    fi
  done
  echo "Service update took too long."
  return 1
}

make_task_def() {
  DATABASE_URI=postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:5432/central_ledger
  task_def=$(sed \
    -e "s|<APP_NAME>|$APP_NAME|" \
    -e "s|<DOCKER_IMAGE>|$ECR_IMAGE|" \
    -e "s|<DATABASE_URI>|$DATABASE_URI|" \
    -e "s|<HOSTNAME>|$HOSTNAME|" \
    < ./.deploy/task-definition.json)
  echo "Task Definition: $task_def"
}

push_image_to_ecr() {
  eval $(aws ecr get-login)
  ECR_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$DOCKER_IMAGE:$VERSION
  docker tag $DOCKER_IMAGE $ECR_IMAGE
  docker push $ECR_IMAGE
}

push_image_to_jfrog() {
  JFROG_REPO=modusbox-level1-docker-release.jfrog.io
  docker login -e $DOCKER_EMAIL -u $DOCKER_USER -p $DOCKER_PASS $JFROG_REPO
  JFROG_IMAGE=$JFROG_REPO/$DOCKER_IMAGE:$VERSION
  docker tag $DOCKER_IMAGE $JFROG_IMAGE
  docker push $JFROG_IMAGE
}

register_task_definition() {
  if revision=$(aws ecs register-task-definition --container-definitions "$task_def" --family $TASK_FAMILY | $JQ '.taskDefinition.taskDefinitionArn'); then
    echo "Revision: $revision"
  else
    echo "Failed to register task definition"
    return
  fi
}

configure_aws_cli
push_image_to_ecr
push_image_to_jfrog
make_task_def
register_task_definition
deploy_cluster
