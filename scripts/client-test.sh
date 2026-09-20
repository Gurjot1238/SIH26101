#!/usr/bin/env bash
# Runs the compiled browser progress client against a real server.
#
# Usage:  npm run client:test        (or ./scripts/client-test.sh)
#
# Starts its own server on a spare port against a throwaway data directory, so it
# never touches server/data. Nothing is written inside the project.

set -uo pipefail

cd "$(dirname "$0")/.."
APP="$PWD"

PORT="${CLIENT_TEST_PORT:-4401}"
BASE="http://127.0.0.1:${PORT}"
WORK="$(mktemp -d)"
DATA_DIR="$(mktemp -d)"

cleanup() {
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null
  wait "${SERVER_PID:-}" 2>/dev/null
  rm -rf "$WORK" "$DATA_DIR"
}
trap cleanup EXIT INT TERM

printf '\n'
"$APP/scripts/compile-src.sh" "$WORK"

AUTH_PORT="$PORT" \
AUTH_DATA_DIR="$DATA_DIR" \
SESSION_SECRET="client_test_secret_not_used_anywhere_real_0123456789" \
NEXORA_DATASET_DIR="$APP/server/course-fixtures" \
node server/index.mjs > "${DATA_DIR}/server.log" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 40); do
  curl -sS -o /dev/null "${BASE}/api/health" 2>/dev/null && break
  sleep 0.25
done

if ! curl -sS -o /dev/null "${BASE}/api/health" 2>/dev/null; then
  printf '\n  Server did not start. Log:\n\n'
  sed 's/^/    /' "${DATA_DIR}/server.log"
  exit 1
fi

STATUS=0
node "$APP/scripts/client-test.mjs" "$WORK/out" "$BASE" || STATUS=1

# The privacy claim, checked from the storage side as well: the harness graded a
# real generated paper, so if any question text could leak this is where it lands.
if [ -f "${DATA_DIR}/attempts.json" ]; then
  if grep -qE '"(text|questions|sentences|stem)"' "${DATA_DIR}/attempts.json"; then
    printf '  FAIL  attempts.json holds a field that can carry document text\n'
    STATUS=1
  else
    printf '  ok    attempts.json holds no document or question text\n'
  fi
fi

if [ "$STATUS" -eq 0 ]; then
  printf '\n  The progress client and the server agree.\n\n'
else
  printf '\n  Something failed — see above.\n\n'
fi

exit "$STATUS"
