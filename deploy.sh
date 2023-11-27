#!/usr/bin/env sh

git pull

cat VERSION
perl -pe '/^version=/ and s/(\d+\.\d+\.\d+\.)(\d+)/$1 . ($2+1)/e' -i VERSION
cat VERSION

cd /var/docker

docker kill tms-vue-prod
docker rm tms-vue-prod

docker-compose up -d --build tms-vue-prod

docker kill tms-api-prod
docker rm tms-api-prod

docker-compose up -d --build tms-api-prod

