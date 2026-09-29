#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

printf '\n  Gap-driven course recommendations — pure functions, no server, no dataset\n'

STATUS=0
node scripts/recommend-test.mjs || STATUS=1

if [ "$STATUS" -eq 0 ]; then
  printf '  All recommendation checks passed.\n\n'
else
  printf '  Something failed — see above.\n\n'
fi

exit "$STATUS"
