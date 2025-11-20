#!/bin/bash

# Check if coverage-summary.json exists
if [ ! -f "coverage/coverage-summary.json" ]; then
  echo "❌ Coverage summary file not found!"
  exit 1
fi

# Read coverage data
coverage=$(cat coverage/coverage-summary.json)

# Extract coverage percentages
statements=$(echo "$coverage" | grep -o '"statements":{[^}]*}' | grep -o '"pct":[0-9.]*' | cut -d: -f2)
branches=$(echo "$coverage" | grep -o '"branches":{[^}]*}' | grep -o '"pct":[0-9.]*' | cut -d: -f2)
functions=$(echo "$coverage" | grep -o '"functions":{[^}]*}' | grep -o '"pct":[0-9.]*' | cut -d: -f2)
lines=$(echo "$coverage" | grep -o '"lines":{[^}]*}' | grep -o '"pct":[0-9.]*' | cut -d: -f2)

# Display coverage summary
echo "Coverage Summary:"
echo "  Statements: ${statements}%"
echo "  Branches: ${branches}%"
echo "  Functions: ${functions}%"
echo "  Lines: ${lines}%"

# Define threshold
THRESHOLD=95

# Check thresholds
failed=()

if (( $(echo "$statements < $THRESHOLD" | bc -l) )); then
  failed+=("Statements: ${statements}% (min: ${THRESHOLD}%)")
fi

if (( $(echo "$branches < $THRESHOLD" | bc -l) )); then
  failed+=("Branches: ${branches}% (min: ${THRESHOLD}%)")
fi

if (( $(echo "$functions < $THRESHOLD" | bc -l) )); then
  failed+=("Functions: ${functions}% (min: ${THRESHOLD}%)")
fi

if (( $(echo "$lines < $THRESHOLD" | bc -l) )); then
  failed+=("Lines: ${lines}% (min: ${THRESHOLD}%)")
fi

# Report results
if [ ${#failed[@]} -gt 0 ]; then
  echo ""
  echo "❌ Coverage below threshold:"
  for item in "${failed[@]}"; do
    echo "  $item"
  done
  exit 1
fi

echo ""
echo "✅ All coverage thresholds met"
exit 0
