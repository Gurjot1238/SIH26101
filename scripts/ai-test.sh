#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

printf '\n  AI question generation — mock provider, no key required\n'

STATUS=0
node scripts/ai-test.mjs || STATUS=1

if [ "$STATUS" -eq 0 ]; then
  printf '  All AI checks passed.\n\n'
else
  printf '  Something failed — see above.\n\n'
fi

exit "$STATUS"
