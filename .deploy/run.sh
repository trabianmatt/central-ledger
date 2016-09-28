#! /bin/bash

GIT_VERSION=$(git describe)
DOCKER_VERSION=${CIRCLE_TAG:=$GIT_VERSION}
DOCKER_CFG_FILE=.dockercfg
DOCKER_CFG_KEY=$EB_ENV/$DOCKER_CFG_FILE
AWS_RUN_FILE=Dockerrun.aws.json
AWS_RUN_KEY=$EB_ENV/$AWS_RUN_FILE
HOSTNAME=http://$EB_ENV.$EB_REGION.elasticbeanstalk.com

docker login -e $DOCKER_EMAIL -u $DOCKER_USER -p $DOCKER_PASS $DOCKER_REPO
docker tag $DOCKER_IMAGE $DOCKER_IMAGE:$DOCKER_VERSION
docker push $DOCKER_IMAGE:latest
docker push $DOCKER_IMAGE:$DOCKER_VERSION

DOCKER_CONFIG_FILE=docker-config.json
sed -e "s|<DOCKER_REPO>|$DOCKER_REPO|" \
    -e "s|<DOCKER_AUTH>|$DOCKER_AUTH|" \
    -e "s|<DOCKER_EMAIL>|$DOCKER_EMAIL|" \
    < ./.deploy/dockerconfig.json.template > $DOCKER_CFG_FILE

aws s3 cp $DOCKER_CFG_FILE s3://$BUCKET/$DOCKER_CFG_KEY

sed -e "s|<BUCKET>|$BUCKET|" \
    -e "s|<DOCKER_CFG_KEY>|$DOCKER_CFG_KEY|" \
    -e "s|<POSTGRES_USER>|$DEV_POSTGRES_USER|" \
    -e "s|<POSTGRES_PASSWORD>|$DEV_POSTGRES_PASSWORD|" \
    -e "s|<APP_NAME>|$APP_NAME|" \
    -e "s|<DOCKER_IMAGE>|$DOCKER_IMAGE|" \
    -e "s|<DOCKER_VERSION>|$DOCKER_VERSION|" \
    -e "s|<HOSTNAME>|$HOSTNAME|" \
    < ./.deploy/Dockerrun.aws.json.template > $AWS_RUN_FILE

aws s3 cp $AWS_RUN_FILE s3://$BUCKET/$AWS_RUN_KEY

aws elasticbeanstalk create-application-version --application-name $APP_NAME \
  --version-label $DOCKER_VERSION --source-bundle S3Bucket=$BUCKET,S3Key=$AWS_RUN_KEY \
  --region $EB_REGION

aws elasticbeanstalk update-environment --environment-name $EB_ENV \
  --version-label $DOCKER_VERSION --region $EB_REGION
