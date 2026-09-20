#!/usr/bin/env bash
# Runs the AI question-generation pipeline against a mock provider and asserts on
# what it returns.
#
# Usage:  npm run ai:test        (or ./scripts/ai-test.sh)
#
# No API key is needed and none is read. The provider is swapped for one that
# returns canned text from server/ai-fixtures, so the parser, the validator, the
# grounding check, the repair loop and the selection all run for real while the
# network is never touched.

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
