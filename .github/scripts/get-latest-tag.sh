#!/bin/bash
set -e

latest_tag=$(git describe --tags $(git rev-list --tags --max-count=1) 2>/dev/null)
if [ -z "$latest_tag" ]; then
  latest_tag="v0.0.0"
fi
echo "latest_tag=$latest_tag" >> $GITHUB_ENV
