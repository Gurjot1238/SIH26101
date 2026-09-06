#!/usr/bin/env bash
# NEXORA AI Intelligence Platform — one-command local start (macOS)
#
# Usage:  ./start.sh              the app and the auth server together
#         ./start.sh --app-only   only the Vite dev server
#
# Installs dependencies on first run, makes sure the auth server has a session
# secret, starts it in the background, waits until it answers, then starts Vite
# in the foreground. Control-C stops both.

set -euo pipefail

cd "$(dirname "$0")"

APP_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --app-only) APP_ONLY=1 ;;
    -h|--help) sed -n '2,9p' "$0" | sed 's/^#\{1,\} \{0,1\}//'; exit 0 ;;
    *) printf '\n  Unknown option: %s\n  Try:  ./start.sh --help\n\n' "$arg"; exit 1 ;;
  esac
done

printf '\n  NEXORA AI Intelligence Platform — local start\n'
printf '  --------------------------------------------\n\n'

# ---------------------------------------------------------------- Node check
if ! command -v node >/dev/null 2>&1; then
  cat <<'EOF'
  Node.js is not installed.

  Install it one of these ways, then run ./start.sh again:

    Homebrew:   brew install node
    Installer:  https://nodejs.org/en/download   (pick the macOS LTS build)

EOF
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  printf '  Node %s found, but this project needs Node 20.19 or newer.\n' "$(node -v)"
  printf '  Upgrade with:  brew upgrade node\n\n'
  exit 1
fi

printf '  Node    %s\n' "$(node -v)"
printf '  npm     v%s\n\n' "$(npm -v)"

# ------------------------------------------------------------------- Install
if [ ! -d node_modules ]; then
  printf '  Installing dependencies (first run only, takes a few minutes)...\n\n'
  npm install
  printf '\n  Dependencies installed.\n\n'
else
  printf '  Dependencies already installed.\n\n'
fi

# --------------------------------------------------------------- Auth server
AUTH_PID=""
AUTH_LOG="server/auth-server.log"

# Stop the background server whatever way this script ends. This is also why the
# last line runs npm normally instead of exec-ing it: exec would replace this
# shell and the trap would never fire, leaving a stray node process on the port.
cleanup() {
  if [ -n "$AUTH_PID" ] && kill -0 "$AUTH_PID" 2>/dev/null; then
    kill "$AUTH_PID" 2>/dev/null || true
    wait "$AUTH_PID" 2>/dev/null || true
    printf '\n  Auth server stopped.\n'
  fi
}
trap cleanup EXIT INT TERM

if [ "$APP_ONLY" -eq 1 ]; then
  printf '  Skipping the auth server (--app-only).\n'
  printf '  Sign in will show "server not answering"; open the demo from that screen.\n\n'
else
  # server/.env holds the settings. It is gitignored, so it never exists on a
  # fresh clone — copy the documented example rather than inventing defaults.
  if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    chmod 600 server/.env
    printf '  Created server/.env from the example.\n'
  fi

  # A blank SESSION_SECRET makes the server invent a new one on every boot, which
  # signs everybody out each restart. Fill it in once, here, with a random value
  # that never leaves this machine. An existing value is left alone.
  if grep -qE '^SESSION_SECRET=[[:space:]]*$' server/.env; then
    SECRET="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(48).toString("base64url"))')"
    ENV_TMP="$(mktemp)"
    awk -v secret="$SECRET" '/^SESSION_SECRET=[[:space:]]*$/ { print "SESSION_SECRET=" secret; next } { print }' \
      server/.env > "$ENV_TMP"
    mv "$ENV_TMP" server/.env
    chmod 600 server/.env
    unset SECRET
    printf '  Generated a SESSION_SECRET in server/.env (stays on this machine).\n'
  fi

  AUTH_PORT="$(grep -E '^AUTH_PORT=' server/.env | tail -1 | cut -d= -f2- | tr -d '[:space:]' || true)"
  AUTH_PORT="${AUTH_PORT:-4000}"
  HEALTH="http://127.0.0.1:${AUTH_PORT}/api/health"

  if curl -fsS -m 2 "$HEALTH" >/dev/null 2>&1; then
    printf '  Auth server already running on port %s — leaving it alone.\n\n' "$AUTH_PORT"
  else
    printf '  Starting the auth server on port %s...\n' "$AUTH_PORT"
    node server/index.mjs >"$AUTH_LOG" 2>&1 &
    AUTH_PID=$!

    READY=0
    for _ in $(seq 1 40); do
      if curl -fsS -m 2 "$HEALTH" >/dev/null 2>&1; then READY=1; break; fi
      if ! kill -0 "$AUTH_PID" 2>/dev/null; then break; fi
      sleep 0.25
    done

    if [ "$READY" -eq 1 ]; then
      printf '  Auth server ready. Log: %s\n\n' "$AUTH_LOG"
    else
      AUTH_PID=""
      printf '\n  The auth server did not come up. Last lines of %s:\n\n' "$AUTH_LOG"
      tail -n 15 "$AUTH_LOG" 2>/dev/null | sed 's/^/    /'
      printf '\n  Continuing without it — the app will offer to open the demo anyway.\n\n'
    fi
  fi
fi

# --------------------------------------------------------------------- Start
printf '  Starting the dev server. Press Control-C to stop everything.\n\n'
npm run dev
