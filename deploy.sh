#!/usr/bin/env sh
git pull

cd /var/docker

docker kill tms-vue-prod
docker rm tms-vue-prod
docker-compose up -d --build tms-vue-prod


