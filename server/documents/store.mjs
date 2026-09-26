/**
 * Document-store entry point. Same backend switch as server/store.mjs:
 *
 *   DATABASE_URL set   → PostgreSQL (server/db/pg-document-store.mjs)
 *   DATABASE_URL unset → JSON files (server/documents/json-store.mjs)
 *
 * The API is identical either way, so index.mjs and the ingestion pipeline never
 * learn which backend they got. The Postgres module is imported dynamically and only
 * when DATABASE_URL is set.
 */

import { openJsonDocumentStore, sanitizeFilename, exists, DocumentPageLimitError } from './json-store.mjs';

export { sanitizeFilename, exists, DocumentPageLimitError };

export async function openDocumentStore(dataDir) {
  if (process.env.DATABASE_URL) {
    const { openPostgresDocumentStore } = await import('../db/pg-document-store.mjs');
    return openPostgresDocumentStore();
  }
  return openJsonDocumentStore(dataDir);
}
