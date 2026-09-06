#!/usr/bin/env bash
# Compiles src/ into plain JavaScript that plain Node can import.
#
# Usage:  ./scripts/compile-src.sh <work-dir>      -> writes <work-dir>/out
#
# The caller owns <work-dir> and is responsible for deleting it. Nothing is ever
# written inside the project. Two scripts need this — the render harness and the
# engine tests — so it lives in one place rather than being copied into both.

set -euo pipefail

cd "$(dirname "$0")/.."
APP="$PWD"

WORK="${1:?usage: compile-src.sh <work-dir>}"

if [ ! -d node_modules ]; then
  printf '\n  node_modules is missing. Run:  npm install\n\n'
  exit 1
fi

mkdir -p "$WORK"
[ -e "$WORK/node_modules" ] || ln -s "$APP/node_modules" "$WORK/node_modules"

# A standalone config rather than "extends": the real one sets noEmit, and the
# include/paths globs in it resolve relative to the file, which now lives in /tmp.
cat > "$WORK/tsconfig.json" <<EOF
{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["esnext", "dom", "dom.iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "types": ["node", "vite/client"],
    "typeRoots": ["$APP/node_modules/@types"],
    "paths": { "@/*": ["$APP/src/*"] },
    "outDir": "$WORK/out",
    "rootDir": "$APP/src",
    "skipLibCheck": true,
    "noEmit": false,
    "noEmitOnError": false,
    "strict": false
  },
  "include": ["$APP/src/**/*.ts", "$APP/src/**/*.tsx"]
}
EOF

printf '  Compiling src/ ...\n'
npx tsc -p "$WORK/tsconfig.json" >/dev/null 2>&1 || true

if [ ! -f "$WORK/out/App.js" ]; then
  printf '  Compile produced no output. Running again to show why:\n\n'
  npx tsc -p "$WORK/tsconfig.json" 2>&1 | head -20
  exit 1
fi

cat > "$WORK/fix-specifiers.mjs" <<'REWRITER'
/**
 * tsc leaves import specifiers exactly as written, so the emitted JavaScript
 * still says "@/components/shell" and "./session-provider" — neither of which
 * Node can resolve. Vite normally does this rewriting; here it happens once, in
 * place, on the throwaway compile output.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

const OUT = process.argv[2];

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) files.push(full);
  }
})(OUT);

/** Vite turns "pdf.worker.min.mjs?url" and "*.css" into an asset URL; Node cannot. */
const STUB = join(OUT, '__vite_asset_stub.js');
writeFileSync(STUB, 'export default "";\n');

const posix = (p) => p.split(sep).join('/');
const dotted = (p) => (p.startsWith('.') ? p : './' + p);

function retarget(spec, file) {
  const here = dirname(file);
  if (spec.includes('?') || spec.endsWith('.css')) return dotted(posix(relative(here, STUB)));
  if (spec.startsWith('@/')) return dotted(posix(relative(here, join(OUT, spec.slice(2)) + '.js')));
  if (spec.startsWith('.') && !/\.[a-zA-Z0-9]+$/.test(spec)) return spec + '.js';
  return spec;
}

let touched = 0;
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  const after = before
    .replace(/import\.meta\.env/g, '(globalThis.__VITE_ENV__||{})')
    .replace(
      /(from\s*|import\s*\(\s*|^\s*import\s+)(["'])([^"']+)\2/gm,
      (_match, lead, quote, spec) => lead + quote + retarget(spec, file) + quote,
    );
  if (after !== before) {
    writeFileSync(file, after);
    touched += 1;
  }
}

console.log(`  Rewrote imports in ${touched} of ${files.length} compiled files.`);
REWRITER

node "$WORK/fix-specifiers.mjs" "$WORK/out"
