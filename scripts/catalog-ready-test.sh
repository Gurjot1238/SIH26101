#!/usr/bin/env bash
# Renders the CatalogCourse *ready* branch and proves no object is handed to React
# as a child — the class of bug render-test.sh cannot see, because that harness only
# ever reaches the loading state (useEffect does not run server-side).
#
# Usage:  npm run catalog:test      (or ./scripts/catalog-ready-test.sh)
#
# Nothing is written inside the project. src/ is compiled to a temporary directory
# that is deleted on exit; a tiny hook shim is dropped in beside the output so the
# component can be seeded straight into its ready state. The course data is the
# committed fixture, so this needs no live dataset and no network.

set -euo pipefail

cd "$(dirname "$0")/.."
APP="$PWD"

WORK="$(mktemp -d)"
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT INT TERM

printf '\n'
"$APP/scripts/compile-src.sh" "$WORK"
OUT="$WORK/out"

# The shim re-exports the real React unchanged, then overrides useState so the first
# render of CatalogCourse is already its ready state: the seeded course replaces the
# `useState(null)` course, and `useState('loading')` becomes 'ready'. Every other
# component's hooks fall through to real React, so nothing else is disturbed.
cat > "$OUT/react-hooks-shim.js" <<'SHIM'
import * as React from 'react';
export * from 'react';
import ReactDefault from 'react';
export default ReactDefault;

let seed = null;
let consumed = false;

/** Called by the harness before each render to seed the next CatalogCourse. */
export function __seed(course) {
  seed = course;
  consumed = false;
}

export function useState(initial) {
  // CatalogCourse's first useState is the course (initial null); the next null is
  // `pending`, so only the first null is replaced.
  if (initial === null && seed && !consumed) {
    consumed = true;
    return [seed, () => {}];
  }
  // CatalogCourse's status starts 'loading'; force it to the ready branch.
  if (initial === 'loading') return ['ready', () => {}];
  return React.useState(initial);
}
SHIM

# tsc leaves the specifier as written, so the emitted demo-pages.js still imports its
# hooks from bare 'react'. Point just that one import at the shim; react/jsx-runtime
# and react-dom are untouched, so there is still a single React instance.
node - "$OUT/pages/demo-pages.js" <<'PATCH'
import { readFileSync, writeFileSync } from 'node:fs';
const file = process.argv[2];
const before = readFileSync(file, 'utf8');
const after = before.replace(
  /^(import\s*\{[^}]*\}\s*from\s*)(['"])react\2/m,
  '$1$2../react-hooks-shim.js$2',
);
if (after === before) { console.error('  FAIL  could not find the react hooks import to patch'); process.exit(3); }
writeFileSync(file, after);
console.log('  Pointed demo-pages hooks at the ready-state shim.');
PATCH

# The fixture course lives here; the reader resolves it through NEXORA_DATASET_DIR.
export NEXORA_DATASET_DIR="$APP/server/course-fixtures"

node "$APP/scripts/catalog-ready-test.mjs" "$OUT"
