/**
 * Storage entry point — picks the backend from the environment and hides the choice
 * behind one API, so server/index.mjs (the only consumer) never changes.
 *
 *   DATABASE_URL set   → PostgreSQL (server/db/pg-store.mjs). All data lives in
 *                        Postgres; the in-memory snapshot is rebuilt from it on boot,
 *                        so data survives restarts and every write is ACID.
 *   DATABASE_URL unset → JSON files under the data dir (server/json-store.mjs): the
 *                        zero-dependency fallback for local dev and the test suite.
 *
 * The Postgres module — and the `pg` driver it needs — is imported DYNAMICALLY and
 * only when DATABASE_URL is set, so a machine without the driver installed still runs
 * on JSON with nothing to install.
 */

import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { dirname } from 'node:path';

import { openJsonStore } from './json-store.mjs';

export async function openStore(dataDir) {
  if (process.env.DATABASE_URL) {
    const { openPostgresStore } = await import('./db/pg-store.mjs');
    const store = await openPostgresStore();
    console.log('[store] backend: PostgreSQL (DATABASE_URL set)');
    return store;
  }
  const store = await openJsonStore(dataDir);
  console.log(`[store] backend: JSON files at ${dataDir} — set DATABASE_URL to use PostgreSQL`);
  return store;
}

/** True when a path already exists — used by the startup report only. */
export async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export { dirname };
