import dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env', import.meta.url) });

import { getDb, closeDb } from './pool.mjs';

const TABLES = ['users', 'sessions', 'attempts', 'profiles', 'papers',
  'interactions', 'documents', 'document_chunks', 'document_pages', 'jobs'];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Example:\n' +
      '  DATABASE_URL=postgres://localhost:5432/nexora node server/db/verify.mjs');
    process.exit(1);
  }

  const db = await getDb();
  const failures = [];

  console.log('Row counts:');
  for (const table of TABLES) {
    const { rows } = await db.query(`SELECT count(*)::int AS count FROM ${table}`);
    console.log(`  ${table.padEnd(16)} ${rows[0].count}`);
  }

  const notHashed = await db.query(
    `SELECT id FROM users
     WHERE data->>'passwordHash' IS NULL OR data->>'passwordHash' NOT LIKE 'scrypt$%'`,
  );
  if (notHashed.rows.length > 0) {
    failures.push(`${notHashed.rows.length} user(s) without a scrypt passwordHash`);
  }

  const plaintext = await db.query(`SELECT id FROM users WHERE data ? 'password'`);
  if (plaintext.rows.length > 0) {
    failures.push(`${plaintext.rows.length} user(s) carry a plaintext 'password' field`);
  }

  const leaky = await db.query(
    `SELECT id FROM attempts WHERE data ?| array['text','questions','sentences','chunks','content']`,
  );
  if (leaky.rows.length > 0) {
    failures.push(`${leaky.rows.length} attempt(s) carry document/question text`);
  }

  console.log('\nSecurity assertions:');
  if (failures.length === 0) {
    console.log('  PASS — credentials hashed, no plaintext passwords, attempts carry no source text.');
  } else {
    for (const f of failures) console.log(`  FAIL — ${f}`);
  }

  await closeDb();
  if (failures.length > 0) process.exit(1);
  console.log('\nVerification complete.');
}

main().catch((error) => {
  console.error('\nVerification failed:', error.message);
  process.exit(1);
});
