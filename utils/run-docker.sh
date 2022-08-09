#!/usr/bin/env bash

# build library
npm run build
# pack library into ./starwards-node-red-<version>.tgz
npm pack
# install packed library into ./docker/node-red/data
npm -prefix ./docker/node-red/data install --no-save ./starwards-node-red-*.tgz
# fire up the Node-RED docker
docker compose -f ./docker/docker-compose.yml up