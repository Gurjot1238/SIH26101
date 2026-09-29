#!/usr/bin/env bash
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
