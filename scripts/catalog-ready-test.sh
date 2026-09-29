#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
APP="$PWD"

WORK="$(mktemp -d)"
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT INT TERM

printf '\n'
"$APP/scripts/compile-src.sh" "$WORK"
OUT="$WORK/out"

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

export NEXORA_DATASET_DIR="$APP/server/course-fixtures"

node "$APP/scripts/catalog-ready-test.mjs" "$OUT"
