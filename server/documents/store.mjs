import { openJsonDocumentStore, sanitizeFilename, exists, DocumentPageLimitError } from './json-store.mjs';

export { sanitizeFilename, exists, DocumentPageLimitError };

export async function openDocumentStore(dataDir) {
  if (process.env.DATABASE_URL) {
    const { openPostgresDocumentStore } = await import('../db/pg-document-store.mjs');
    return openPostgresDocumentStore();
  }
  return openJsonDocumentStore(dataDir);
}
