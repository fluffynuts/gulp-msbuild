#!/bin/bash
set -e

mkdir temp_package
cp -r dist/. temp_package/
cp package.json temp_package/
cp README.md temp_package/
cp LICENSE temp_package/
cd temp_package
npm pack
