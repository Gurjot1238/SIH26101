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

export async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export { dirname };
