#!/bin/bash
set -e

pr_title="$1"

if [[ "$pr_title" == "chore:"* ]]; then
  echo "skip=true" >> $GITHUB_ENV
else
  echo "skip=false" >> $GITHUB_ENV
fi
