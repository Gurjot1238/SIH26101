#!/usr/bin/env bash
# Runs the competency analytics engine and the explanation guard for real and asserts
# on what they return.
#
# Usage:  npm run competency:test        (or ./scripts/competency-test.sh)
#
# Nothing is compiled and nothing is written: server/competency.mjs and
# server/ai/explain.mjs are plain ESM over Node built-ins, so the checks import them
# directly and feed them attempt records shaped as the store returns them.

set -euo pipefail

cd "$(dirname "$0")/.."

printf '\n  Competency analytics — pure functions, no server, no key\n'

STATUS=0
node scripts/competency-test.mjs || STATUS=1

if [ "$STATUS" -eq 0 ]; then
  printf '  All competency checks passed.\n\n'
else
  printf '  Something failed — see above.\n\n'
fi

exit "$STATUS"
