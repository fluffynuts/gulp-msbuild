#!/bin/bash
set -e

npm_token="$1"

echo "//registry.npmjs.org/:_authToken=$npm_token" > ~/.npmrc
echo "registry=https://registry.npmjs.org/" >> ~/.npmrc
