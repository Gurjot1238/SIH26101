#!/usr/bin/env bash
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
