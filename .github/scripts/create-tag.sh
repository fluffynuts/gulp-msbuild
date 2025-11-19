#!/bin/bash
set -e

new_tag="$1"

git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git tag $new_tag
git push origin $new_tag
