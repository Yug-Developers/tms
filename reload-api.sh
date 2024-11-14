#!/usr/bin/env sh
cd /var/docker

docker kill tms-api-prod
docker rm tms-api-prod
docker-compose up -d --build tms-api-prod

