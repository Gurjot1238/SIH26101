/**
 * The one place that opens a PostgreSQL connection.
 *
 * `pg` is imported here and nowhere else, and this module is only ever imported
 * dynamically — by the Postgres stores, the migration and the verifier — and only
 * when DATABASE_URL is set. A machine without the driver installed, or without a
 * database, never loads this file, so the JSON fallback keeps working with nothing
 * to install. (That is why the import below cannot move to the top of a store file.)
 *
 * One pool is shared across the process. The schema is applied on first use, so a
 * fresh database is set up automatically and an existing one is left untouched
 * (every statement in schema.sql is IF NOT EXISTS).
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

let ready = null;

/**
 * TLS policy. A local database (the brew install, 127.0.0.1) speaks plain TCP and
 * must NOT be handed an ssl option or the connection hangs. A hosted database
 * (Neon, Supabase, RDS, Render) needs TLS, signalled by sslmode=require in the URL
 * or PGSSL=require in the environment. rejectUnauthorized:false accepts the managed
 * provider's certificate chain, which is the normal setting for those services.
 */
function sslOption(connectionString) {
  const url = String(connectionString);
  if (process.env.PGSSL === 'disable') return false;
  if (process.env.PGSSL === 'require' || /[?&]sslmode=require/.test(url)) {
    return { rejectUnauthorized: false };
  }
  return false;
}

/**
 * Returns the shared pool, applying the schema exactly once. Every caller awaits
 * this, so the schema is guaranteed to exist before the first query runs.
 */
export async function getDb() {
  if (ready) return ready;
  ready = (async () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set — the PostgreSQL backend cannot be used.');
    }

    // Dynamic import so `pg` is required only on a machine that has opted into Postgres.
    const pg = (await import('pg')).default;
    const { Pool } = pg;

    const pool = new Pool({
      connectionString,
      max: Number(process.env.PGPOOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: sslOption(connectionString),
    });

    // A dropped idle backend must not take the process down with it.
    pool.on('error', (error) => {
      console.error('[db] idle client error:', error.message);
    });

    const schema = await readFile(join(HERE, 'schema.sql'), 'utf8');
    await pool.query(schema);
    return pool;
  })();

  try {
    return await ready;
  } catch (error) {
    ready = null; // let the next caller retry rather than caching the failure forever
    throw error;
  }
}

/** Convenience: run one query against the shared pool. */
export async function query(text, params) {
  const pool = await getDb();
  return pool.query(text, params);
}

/** Close the pool. Used by short-lived scripts (migrate, verify) so they can exit. */
export async function closeDb() {
  if (!ready) return;
  const pool = await ready.catch(() => null);
  ready = null;
  if (pool) await pool.end();
}

/** A JS value bound to a JSONB parameter. Forced through JSON so arrays land as
 *  jsonb, not as a Postgres array literal. Pair with a `$n::jsonb` cast. */
export function jsonb(value) {
  return JSON.stringify(value ?? null);
}
