#!/bin/bash
set -e

new_tag="$1"

if git rev-parse "refs/tags/$new_tag" >/dev/null 2>&1; then
  echo "Tag $new_tag already exists."
  exit 0
fi
