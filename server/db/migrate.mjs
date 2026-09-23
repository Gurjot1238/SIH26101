/**
 * One-time (idempotent) importer: JSON files under server/data → PostgreSQL.
 *
 *   DATABASE_URL=postgres://user:pass@localhost:5432/nexora  node server/db/migrate.mjs
 *   # optional: pass a data dir as the first arg (defaults to server/data)
 *
 * Safe to run more than once: every row is upserted by primary key, so re-running
 * reconciles rather than duplicates. Interactions are the one exception — they have
 * no natural key, so they are imported only when the table is still empty. The whole
 * import runs in a single transaction: any failure rolls the database back untouched.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getDb, closeDb, jsonb } from './pool.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw new Error(`Cannot read ${path}: ${error.message}`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Example:\n' +
      '  DATABASE_URL=postgres://localhost:5432/nexora node server/db/migrate.mjs');
    process.exit(1);
  }

  const dataDir = process.argv[2] || process.env.AUTH_DATA_DIR || join(HERE, '..', 'data');
  const docsDir = join(dataDir, 'documents');
  console.log(`Importing JSON from ${dataDir} into PostgreSQL...`);

  const users = (await readJson(join(dataDir, 'users.json'), { users: [] })).users ?? [];
  const sessions = (await readJson(join(dataDir, 'sessions.json'), { sessions: [] })).sessions ?? [];
  const attempts = (await readJson(join(dataDir, 'attempts.json'), { attempts: [] })).attempts ?? [];
  const profilesObj = (await readJson(join(dataDir, 'profiles.json'), { profiles: {} })).profiles ?? {};
  const papers = (await readJson(join(dataDir, 'papers.json'), { papers: [] })).papers ?? [];
  const interactions = (await readJson(join(dataDir, 'interactions.json'), { interactions: [] })).interactions ?? [];
  const documents = (await readJson(join(docsDir, 'documents.json'), { documents: [] })).documents ?? [];
  const jobs = (await readJson(join(docsDir, 'jobs.json'), { jobs: [] })).jobs ?? [];
  const documentIds = new Set(documents.map((d) => d.id));

  const pool = await getDb(); // also applies schema.sql
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Parents first so foreign keys always resolve.
    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, email, data) VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, data = EXCLUDED.data`,
        [u.id, u.email, jsonb(u)],
      );
    }

    for (const s of sessions) {
      await client.query(
        `INSERT INTO sessions (fingerprint, user_id, expires_at, data) VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (fingerprint) DO UPDATE
           SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at, data = EXCLUDED.data`,
        [s.fingerprint, s.userId, s.expiresAt, jsonb(s)],
      );
    }

    for (const a of attempts) {
      await client.query(
        `INSERT INTO attempts (id, user_id, data) VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, data = EXCLUDED.data`,
        [a.id, a.userId, jsonb(a)],
      );
    }

    for (const [userId, profile] of Object.entries(profilesObj)) {
      await client.query(
        `INSERT INTO profiles (user_id, data) VALUES ($1, $2::jsonb)
         ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data`,
        [userId, jsonb(profile)],
      );
    }

    for (const p of papers) {
      await client.query(
        `INSERT INTO papers (id, user_id, data) VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, data = EXCLUDED.data`,
        [p.id, p.userId, jsonb(p)],
      );
    }

    // Interactions have no natural key; only import when the table is still empty
    // so a second run cannot duplicate the anonymised learning log.
    const existing = await client.query('SELECT count(*)::int AS count FROM interactions');
    if (existing.rows[0].count === 0) {
      for (const ev of interactions) {
        await client.query('INSERT INTO interactions (data) VALUES ($1::jsonb)', [jsonb(ev)]);
      }
    }

    for (const d of documents) {
      await client.query(
        `INSERT INTO documents (id, user_id, data) VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, data = EXCLUDED.data`,
        [d.id, d.userId, jsonb(d)],
      );

      // Per-document chunk text and staged pages live in their own files.
      const chunkFile = await readJson(join(docsDir, 'docs', `${d.id}.json`), null);
      if (chunkFile && Array.isArray(chunkFile.chunks)) {
        await client.query(
          `INSERT INTO document_chunks (document_id, chunks) VALUES ($1, $2::jsonb)
           ON CONFLICT (document_id) DO UPDATE SET chunks = EXCLUDED.chunks`,
          [d.id, jsonb(chunkFile.chunks)],
        );
      }
      const pendFile = await readJson(join(docsDir, 'docs', `${d.id}.pending.json`), null);
      if (pendFile && Array.isArray(pendFile.pages) && pendFile.pages.length > 0) {
        await client.query(
          `INSERT INTO document_pages (document_id, pages) VALUES ($1, $2::jsonb)
           ON CONFLICT (document_id) DO UPDATE SET pages = EXCLUDED.pages`,
          [d.id, jsonb(pendFile.pages)],
        );
      }
    }

    for (const j of jobs) {
      // Keep the original documentId inside data, but null the FK column if the parent
      // document is missing so an orphan job cannot abort the whole import.
      const docId = documentIds.has(j.documentId) ? j.documentId : null;
      await client.query(
        `INSERT INTO jobs (id, user_id, document_id, data) VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (id) DO UPDATE
           SET user_id = EXCLUDED.user_id, document_id = EXCLUDED.document_id, data = EXCLUDED.data`,
        [j.id, j.userId, docId, jsonb(j)],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // Report what now lives in each table so the import is self-verifying.
  const tables = ['users', 'sessions', 'attempts', 'profiles', 'papers',
    'interactions', 'documents', 'document_chunks', 'document_pages', 'jobs'];
  console.log('\nImported. Row counts now in PostgreSQL:');
  for (const table of tables) {
    const { rows } = await pool.query(`SELECT count(*)::int AS count FROM ${table}`);
    console.log(`  ${table.padEnd(16)} ${rows[0].count}`);
  }
  await closeDb();
  console.log('\nMigration complete.');
}

main().catch((error) => {
  console.error('\nMigration failed:', error.message);
  process.exit(1);
});
