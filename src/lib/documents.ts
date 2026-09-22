/**
 * Browser client for the Smart Document Intelligence (large-PDF) backend.
 *
 * This is the counterpart to ai-questions.ts, for documents too large to send as one
 * request. The whole point is that a 900-page book is NEVER posted in a single body: it is
 * uploaded as bounded page batches, chunked and indexed once on the server, and thereafter a
 * topic search returns only the relevant pages. The heavy text stays server-side; the
 * browser holds page text just long enough to upload it in pieces.
 *
 * No key, no prompt, no provider logic here — same as the rest of the client. Everything
 * goes through the session cookie to the API origin.
 */

import { API_URL } from './auth';
import type { MaterialQuestion, QuestionKind } from './materials';

/** Keep each upload request comfortably under the server's 256 KB JSON cap. */
const BATCH_CHAR_BUDGET = 120_000;

export type DocumentRecord = {
  id: string;
  title: string;
  filename: string;
  documentType: string;
  confidence: number;
  mode: string;
  pageCount: number;
  chunkCount: number;
  topicsIndexed: number;
  status: string;
  createdAt: string;
};

export type SearchPreview = {
  topicFound: boolean;
  found: number;
  sections?: string[];
  chapters?: string[];
  pageRanges?: { start: number; end: number }[];
  estimatedTokens?: number;
  preview?: { pageStart: number; pageEnd: number; section: string | null; snippet: string }[];
  suggestions?: string[];
};

export class DocumentError extends Error {
  code: string;
  constructor(message: string, code = 'document_error') { super(message); this.name = 'DocumentError'; this.code = code; }
}

async function post(path: string, body: unknown): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new DocumentError(`Cannot reach the NEXORA AI server at ${API_URL}. Start it with: node server/index.mjs`, 'network_error');
  }
  let payload: any = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok || payload?.ok !== true) {
    const code = payload?.error?.code ?? 'document_error';
    const message = payload?.error?.message ?? 'The request failed. Please try again.';
    const err = new DocumentError(message, code);
    (err as any).payload = payload;
    throw err;
  }
  return payload;
}

/**
 * Upload a document as bounded page batches, then finalize (chunk + index once).
 * `onProgress` reports upload progress (pages sent / total) so the UI reflects real work.
 * Returns the finalized document record + mode.
 */
export async function ingestLargeDocument(
  { filename, sizeBytes, pages }: { filename: string; sizeBytes: number; pages: { page: number; text: string }[] },
  onProgress?: (sent: number, total: number, stage: 'uploading' | 'indexing') => void,
): Promise<{ document: DocumentRecord; mode: string; isLargeMode: boolean; classification: any }> {
  const created = await post('/api/documents/upload', { filename, sizeBytes });
  const documentId: string = created.documentId;

  // Send pages in char-bounded batches so no single request approaches the body limit.
  let batch: { page: number; text: string }[] = [];
  let batchChars = 0;
  let sent = 0;
  const flush = async () => {
    if (batch.length === 0) return;
    await post('/api/documents/append', { documentId, pages: batch });
    sent += batch.length;
    onProgress?.(sent, pages.length, 'uploading');
    batch = [];
    batchChars = 0;
  };
  for (const p of pages) {
    batch.push(p);
    batchChars += p.text.length + 16;
    if (batchChars >= BATCH_CHAR_BUDGET || batch.length >= 300) await flush();
  }
  await flush();

  onProgress?.(pages.length, pages.length, 'indexing');
  const finalized = await post('/api/documents/finalize', { documentId });
  return { document: finalized.document, mode: finalized.mode, isLargeMode: finalized.isLargeMode, classification: finalized.classification };
}

/** Search one document for a topic; returns the relevant pages/sections (or not-found). */
export async function searchDocument(documentId: string, query: string): Promise<SearchPreview> {
  const r = await post('/api/documents/search', { documentId, query });
  return {
    topicFound: r.topicFound ?? (r.found > 0),
    found: r.found ?? 0,
    sections: r.sections ?? [],
    chapters: r.chapters ?? [],
    pageRanges: r.pageRanges ?? [],
    estimatedTokens: r.estimatedTokens,
    preview: r.preview ?? [],
    suggestions: r.suggestions ?? [],
  };
}

const KINDS: readonly string[] = ['statement', 'cloze', 'numeric', 'identify', 'scenario'];

/** Render a source object from the server into the display string the quiz expects. */
function sourceLabel(src: any, documentTitle: string): string {
  if (!src || typeof src !== 'object') return documentTitle;
  const pages = Number.isFinite(src.pageStart) && Number.isFinite(src.pageEnd)
    ? (src.pageStart === src.pageEnd ? `p.${src.pageStart}` : `pp.${src.pageStart}–${src.pageEnd}`)
    : '';
  const sec = src.section ? ` · ${src.section}` : '';
  return `${documentTitle}${pages ? ` (${pages})` : ''}${sec}`;
}

/**
 * Generate MCQs from a topic in an indexed document. Converts the server's wire questions
 * into the MaterialQuestion shape the existing quiz/grader already runs on, keeping the
 * per-question page source visible.
 */
export async function generateFromTopic(
  { documentId, query, questionCount, difficulty, documentTitle }:
  { documentId: string; query: string; questionCount: number; difficulty?: 'easy' | 'medium' | 'hard'; documentTitle: string },
): Promise<{ questions: MaterialQuestion[]; topics: string[]; preview: SearchPreview }> {
  const r = await post('/api/documents/generate', {
    documentId, query, questionCount, ...(difficulty ? { difficulty } : {}),
  });
  const questions: MaterialQuestion[] = (Array.isArray(r.questions) ? r.questions : []).map((q: any) => ({
    q: String(q.question ?? '').trim(),
    a: Array.isArray(q.options) ? q.options.map((o: any) => String(o)) : [],
    correct: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
    source: sourceLabel(q.source, documentTitle),
    topic: String(q.topic ?? query),
    kind: (KINDS.includes(q.kind) ? q.kind : 'statement') as QuestionKind,
    explanation: String(q.explanation ?? ''),
    sourceIndex: 0,
  }));
  const topics = Array.from(new Set(questions.map((x) => x.topic)));
  return { questions, topics, preview: r.preview ?? { topicFound: true, found: questions.length } };
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  let response: Response;
  try { response = await fetch(`${API_URL}/api/documents`, { credentials: 'include' }); }
  catch { throw new DocumentError(`Cannot reach the NEXORA AI server at ${API_URL}.`, 'network_error'); }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok !== true) throw new DocumentError('Could not list your documents.', 'document_error');
  return payload.documents ?? [];
}
