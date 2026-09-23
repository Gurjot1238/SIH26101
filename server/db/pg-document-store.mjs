/**
 * PostgreSQL backend for the document store, behind the same API as the JSON
 * document store (server/documents/json-store.mjs).
 *
 * Same shape as db/pg-store.mjs: document and job METADATA is small, read
 * synchronously by index.mjs (getDocument, listDocuments, getJob), so it is held
 * in an in-memory snapshot and written through to Postgres. Chunk text and staged
 * pages can be large and are only ever read/written through async methods, so they
 * are NOT cached — they live in Postgres and are fetched on demand, exactly as the
 * JSON store read them from per-document files.
 *
 * Ownership is enforced on every read and write: a lookup whose userId does not
 * match returns null rather than another account's data. Ids are server-generated.
 */

import { randomUUID } from 'node:crypto';
import { getDb, jsonb } from './pool.mjs';
import { sanitizeFilename } from '../documents/json-store.mjs';

export async function openPostgresDocumentStore() {
  const db = await getDb();

  const documents = (await db.query('SELECT data FROM documents ORDER BY seq')).rows.map((r) => r.data);
  const jobs = (await db.query('SELECT data FROM jobs ORDER BY id')).rows.map((r) => r.data);

  const byId = new Map(documents.map((d) => [d.id, d]));
  const jobById = new Map(jobs.map((j) => [j.id, j]));

  let queue = Promise.resolve();
  const enqueue = (task) => {
    const run = queue.then(task, task);
    queue = run.catch(() => {});
    return run;
  };

  const getOwned = (userId, id) => {
    const rec = byId.get(id);
    return rec && rec.userId === userId ? rec : null;
  };

  return {
    backend: 'postgresql',

    async createDocument({ userId, filename, documentType, confidence, mode, pageCount, sizeBytes }) {
      const id = randomUUID().replace(/-/g, '').slice(0, 24);
      const record = {
        id,
        userId,
        filename: sanitizeFilename(filename),
        title: sanitizeFilename(filename).replace(/\.[a-z0-9]+$/i, ''),
        documentType: documentType ?? 'UNKNOWN',
        confidence: confidence ?? 0,
        mode: mode ?? 'SMALL',
        pageCount: Number.isInteger(pageCount) ? pageCount : 0,
        sizeBytes: Number.isInteger(sizeBytes) ? sizeBytes : 0,
        chunkCount: 0,
        topicsIndexed: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      documents.push(record);
      byId.set(id, record);
      await enqueue(() =>
        db.query('INSERT INTO documents (id, user_id, data) VALUES ($1, $2, $3::jsonb)', [
          id,
          userId,
          jsonb(record),
        ]),
      );
      return record;
    },

    getDocument: (userId, id) => getOwned(userId, id),

    listDocuments: (userId) => documents.filter((d) => d.userId === userId),
    async renameDocument(userId, id, title) {
      const rec = getOwned(userId, id);
      if (!rec) return null;
      rec.title = sanitizeFilename(title);
      await enqueue(() => db.query('UPDATE documents SET data = $2::jsonb WHERE id = $1', [id, jsonb(rec)]));
      return rec;
    },

    async setDocumentStatus(userId, id, patch) {
      const rec = getOwned(userId, id);
      if (!rec) return null;
      Object.assign(rec, patch);
      await enqueue(() => db.query('UPDATE documents SET data = $2::jsonb WHERE id = $1', [id, jsonb(rec)]));
      return rec;
    },

    async deleteDocument(userId, id) {
      const rec = getOwned(userId, id);
      if (!rec) return false;
      const at = documents.indexOf(rec);
      if (at >= 0) documents.splice(at, 1);
      byId.delete(id);
      for (const [jid, job] of jobById) {
        if (job.documentId === id) {
          jobById.delete(jid);
          const j = jobs.indexOf(job);
          if (j >= 0) jobs.splice(j, 1);
        }
      }
      // ON DELETE CASCADE removes the chunk, pending-page and job rows for this document.
      await enqueue(() => db.query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [id, userId]));
      return true;
    },

    async saveChunks(userId, id, chunks) {
      const rec = getOwned(userId, id);
      if (!rec) return null;
      rec.chunkCount = chunks.length;
      rec.topicsIndexed = new Set(chunks.map((c) => c.section ?? c.chapter).filter(Boolean)).size;
      await enqueue(async () => {
        await db.query(
          `INSERT INTO document_chunks (document_id, chunks) VALUES ($1, $2::jsonb)
           ON CONFLICT (document_id) DO UPDATE SET chunks = EXCLUDED.chunks`,
          [id, jsonb(chunks)],
        );
        await db.query('UPDATE documents SET data = $2::jsonb WHERE id = $1', [id, jsonb(rec)]);
      });
      return rec;
    },

    async getChunks(userId, id) {
      const rec = getOwned(userId, id);
      if (!rec) return null;
      const result = await db.query('SELECT chunks FROM document_chunks WHERE document_id = $1', [id]);
      const chunks = result.rows[0]?.chunks;
      return Array.isArray(chunks) ? chunks : [];
    },
    /* ---- staged page upload (avoids one giant request for a large book) ---- */

    async appendPages(userId, id, pages) {
      const rec = getOwned(userId, id);
      if (!rec) return null;
      let mergedLength = 0;
      await enqueue(async () => {
        const existing = await db.query('SELECT pages FROM document_pages WHERE document_id = $1', [id]);
        const current = Array.isArray(existing.rows[0]?.pages) ? existing.rows[0].pages : [];
        const merged = current.concat(Array.isArray(pages) ? pages : []);
        mergedLength = merged.length;
        await db.query(
          `INSERT INTO document_pages (document_id, pages) VALUES ($1, $2::jsonb)
           ON CONFLICT (document_id) DO UPDATE SET pages = EXCLUDED.pages`,
          [id, jsonb(merged)],
        );
        rec.pageCount = merged.length;
        await db.query('UPDATE documents SET data = $2::jsonb WHERE id = $1', [id, jsonb(rec)]);
      });
      return mergedLength;
    },

    async takePendingPages(userId, id) {
      const rec = getOwned(userId, id);
      if (!rec) return null;
      let pages = [];
      await enqueue(async () => {
        const result = await db.query('DELETE FROM document_pages WHERE document_id = $1 RETURNING pages', [id]);
        pages = Array.isArray(result.rows[0]?.pages) ? result.rows[0].pages : [];
      });
      return pages;
    },

    /* ---- jobs ---- */

    async createJob({ userId, documentId, totalChunks = 0, stages = [] }) {
      const id = randomUUID().replace(/-/g, '').slice(0, 24);
      const job = {
        id,
        userId,
        documentId,
        status: 'pending',
        stages: stages.map((name) => ({ name, status: 'pending' })),
        totalChunks,
        chunkStatus: Array.from({ length: totalChunks }, () => 'pending'),
        error: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      jobs.push(job);
      jobById.set(id, job);
      await enqueue(() =>
        db.query('INSERT INTO jobs (id, user_id, document_id, data) VALUES ($1, $2, $3, $4::jsonb)', [
          id,
          userId,
          documentId,
          jsonb(job),
        ]),
      );
      return job;
    },

    getJob(userId, id) {
      const job = jobById.get(id);
      return job && job.userId === userId ? job : null;
    },

    async updateJob(userId, id, patch) {
      const job = jobById.get(id);
      if (!job || job.userId !== userId) return null;
      Object.assign(job, patch, { updatedAt: new Date().toISOString() });
      await enqueue(() => db.query('UPDATE jobs SET data = $2::jsonb WHERE id = $1 AND user_id = $3', [
        id,
        jsonb(job),
        userId,
      ]));
      return job;
    },
  };
}
