import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

let ready = null;

function sslOption(connectionString) {
  const url = String(connectionString);
  if (process.env.PGSSL === 'disable') return false;
  const wantsTls = process.env.PGSSL === 'require'
    || process.env.PGSSL === 'no-verify'
    || /[?&]sslmode=require/.test(url);
  if (!wantsTls) return false;

  if (process.env.PGSSL_INSECURE === '1' || process.env.PGSSL === 'no-verify') {
    console.warn('[db] TLS certificate verification is DISABLED (PGSSL_INSECURE) — '
      + 'the app↔database link is encrypted but not authenticated. Do not use in production.');
    return { rejectUnauthorized: false };
  }

  const caPath = process.env.PGSSL_CA_FILE || process.env.PGSSLROOTCERT;
  if (caPath) {
    let ca;
    try { ca = readFileSync(caPath, 'utf8'); }
    catch (error) { throw new Error(`PGSSL CA file could not be read (${caPath}): ${error.message}`); }
    return { rejectUnauthorized: true, ca };
  }
  return { rejectUnauthorized: true };
}

export async function getDb() {
  if (ready) return ready;
  ready = (async () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set — the PostgreSQL backend cannot be used.');
    }

    const pg = (await import('pg')).default;
    const { Pool } = pg;

    const pool = new Pool({
      connectionString,
      max: Number(process.env.PGPOOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: sslOption(connectionString),
    });

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
    ready = null;
    throw error;
  }
}

export async function query(text, params) {
  const pool = await getDb();
  return pool.query(text, params);
}

export async function closeDb() {
  if (!ready) return;
  const pool = await ready.catch(() => null);
  ready = null;
  if (pool) await pool.end();
}

export function jsonb(value) {
  return JSON.stringify(value ?? null);
}
