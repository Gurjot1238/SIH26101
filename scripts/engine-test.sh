#!/usr/bin/env bash
# Runs the question engine, the scorer and the recommender for real and asserts on
# what they return.
#
# Usage:  npm run engine:test        (or ./scripts/engine-test.sh)
#
# Nothing is written inside the project: src/ is compiled to a temporary directory
# that is deleted on exit.

set -euo pipefail

cd "$(dirname "$0")/.."
APP="$PWD"

WORK="$(mktemp -d)"
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT INT TERM

printf '\n'
"$APP/scripts/compile-src.sh" "$WORK"

STATUS=0
node "$APP/scripts/engine-test.mjs" "$WORK/out" || STATUS=1

if [ "$STATUS" -eq 0 ]; then
  printf '  All engine checks passed.\n\n'
else
  printf '  Something failed — see above.\n\n'
fi

exit "$STATUS"
