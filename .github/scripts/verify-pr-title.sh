#!/bin/bash
set -e

pr_title="$1"
latest_tag="$2"

# Extract major, minor, and patch components from the latest tag
major=$(echo $latest_tag | cut -d. -f1 | sed 's/v//')
minor=$(echo $latest_tag | cut -d. -f2)
patch=$(echo $latest_tag | cut -d. -f3)

# Determine the increment type based on PR title
if [[ "$pr_title" == "major:"* ]]; then
  major=$((major + 1))
  minor=0
  patch=0
elif [[ "$pr_title" == "feat:"* ]]; then
  minor=$((minor + 1))
  patch=0
elif [[ "$pr_title" == "fix:"* ]]; then
  patch=$((patch + 1))
else
  echo "PR title must start with major:, feat:, or fix:."
  exit 1
fi

# Construct the new tag
new_tag="v${major}.${minor}.${patch}"
echo "new_tag=$new_tag" >> $GITHUB_ENV
