#!/bin/bash
set -e

tag="$1"
github_token="$2"
repo="$3"

git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Delete Git Tag
git tag -d $tag
git push origin :refs/tags/$tag

# Delete GitHub Release
release_id=$(curl -s -H "Authorization: token $github_token" \
                  -H "Accept: application/vnd.github.v3+json" \
                  "https://api.github.com/repos/$repo/releases/tags/$tag" \
                  | jq -r '.id')
curl -X DELETE -H "Authorization: token $github_token" \
                -H "Accept: application/vnd.github.v3+json" \
                "https://api.github.com/repos/$repo/releases/$release_id"
