#!/usr/bin/env bash
# Runs the gap-driven course recommender for real and asserts on what it returns.
#
# Usage:  npm run recommend:test        (or ./scripts/recommend-test.sh)
#
# Nothing is compiled and nothing is written: server/course-recommendations.mjs and
# server/competency.mjs are plain ESM over Node built-ins, so the checks import them
# directly and feed them analytics summaries and a fixture catalogue.

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
