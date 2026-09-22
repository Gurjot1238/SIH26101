#!/usr/bin/env bash
# Runs the recommendation-service, fallback, and interaction-log privacy checks.
#
# Usage:  npm run recommend-service:test   (or ./scripts/recommend-service-test.sh)
#
# Everything under server/recommend/ is plain ESM over Node built-ins, so the checks import
# the real modules directly and run them — no server, no model.json on disk, no dataset.

set -euo pipefail

cd "$(dirname "$0")/.."

printf '\n  Recommendation service, fallback, and interaction-log privacy\n'

STATUS=0
node scripts/recommend-service-test.mjs || STATUS=1

if [ "$STATUS" -eq 0 ]; then
  printf '  All recommendation-service checks passed.\n\n'
else
  printf '  Something failed — see above.\n\n'
fi

exit "$STATUS"
