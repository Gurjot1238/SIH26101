-- NEXORA AI — PostgreSQL schema.
--
-- One table per JSON file the app used to keep on disk. Every table carries the
-- full record in a JSONB `data` column so the exact object the application wrote
-- round-trips back unchanged (numbers stay numbers, nested arrays stay intact),
-- while the columns lifted out beside it (ids, owner, timestamps, ordering) give
-- real primary keys, foreign keys and indexes so the data is queryable in psql
-- and referential integrity is enforced by the database, not just the app.
--
-- Every statement is IF NOT EXISTS / idempotent, so running it on an existing
-- database is a no-op and it doubles as the bootstrap the server runs on boot.

-- Accounts, including the scrypt hash (inside data). email is mirrored out for the
-- UNIQUE guarantee and so a human can query accounts without unpacking JSON.
CREATE TABLE IF NOT EXISTS users (
  id     TEXT  PRIMARY KEY,
  email  TEXT  NOT NULL UNIQUE,
  data   JSONB NOT NULL
);

-- Live sessions, addressed by the HMAC fingerprint of the token — never the token
-- itself. expires_at (epoch ms) is lifted out so expiry sweeps are index-driven.
CREATE TABLE IF NOT EXISTS sessions (
  fingerprint TEXT   PRIMARY KEY,
  user_id     TEXT   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  BIGINT NOT NULL,
  data        JSONB  NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

-- Quiz attempts: topic names and counts only, never document or question text.
-- seq preserves the chronological (insertion) order the app relies on for history.
CREATE TABLE IF NOT EXISTS attempts (
  id      TEXT      PRIMARY KEY,
  user_id TEXT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seq     BIGSERIAL NOT NULL,
  data    JSONB     NOT NULL
);
CREATE INDEX IF NOT EXISTS attempts_user_seq_idx ON attempts(user_id, seq);

-- Preferences and course progress/enrollment, exactly one row per account.
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT  PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data    JSONB NOT NULL
);

-- Saved MCQ sets: the learner's own questions, answers and explanations, kept by
-- choice and readable only by their account. seq preserves insertion order.
CREATE TABLE IF NOT EXISTS papers (
  id      TEXT      PRIMARY KEY,
  user_id TEXT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seq     BIGSERIAL NOT NULL,
  data    JSONB     NOT NULL
);
CREATE INDEX IF NOT EXISTS papers_user_seq_idx ON papers(user_id, seq);

-- Anonymised, append-only learning-interaction events (recommendation training
-- data). No user FK on purpose: the learner id inside data is already an HMAC,
-- not an account id, so this table holds learning signals and never PII.
CREATE TABLE IF NOT EXISTS interactions (
  seq  BIGSERIAL PRIMARY KEY,
  data JSONB     NOT NULL
);

-- Uploaded documents — metadata only (title, type, page/chunk counts, status).
-- The document store is its own subtree in the app, so user_id is a plain indexed
-- column here rather than a cross-store foreign key, matching the original design.
CREATE TABLE IF NOT EXISTS documents (
  id      TEXT      PRIMARY KEY,
  user_id TEXT      NOT NULL,
  seq     BIGSERIAL NOT NULL,
  data    JSONB     NOT NULL
);
CREATE INDEX IF NOT EXISTS documents_user_idx ON documents(user_id);

-- One row per document holding that document's chunks. Cascades with its document
-- so deleting a document cannot orphan its text.
CREATE TABLE IF NOT EXISTS document_chunks (
  document_id TEXT  PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  chunks      JSONB NOT NULL
);

-- Staged page batches for a large upload, held until ingestion drains them.
CREATE TABLE IF NOT EXISTS document_pages (
  document_id TEXT  PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  pages       JSONB NOT NULL
);

-- Processing jobs with per-chunk status, for progress + retry/resume. Cascades
-- off its document so a deleted document takes its job with it.
CREATE TABLE IF NOT EXISTS jobs (
  id          TEXT  PRIMARY KEY,
  user_id     TEXT  NOT NULL,
  document_id TEXT  REFERENCES documents(id) ON DELETE CASCADE,
  data        JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS jobs_document_idx ON jobs(document_id);
