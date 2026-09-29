import { API_URL } from './auth';
import type { MaterialQuestion, QuestionKind, OcrPageFn, OcrPageResult, VisionPageFn, VisionPageResult, PageText } from './materials';

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

export async function ingestLargeDocument(
  { filename, sizeBytes, pages }: { filename: string; sizeBytes: number; pages: PageText[] },
  onProgress?: (sent: number, total: number, stage: 'uploading' | 'indexing') => void,
): Promise<{ document: DocumentRecord; mode: string; isLargeMode: boolean; classification: any }> {
  const created = await post('/api/documents/upload', { filename, sizeBytes });
  const documentId: string = created.documentId;

  let batch: PageText[] = [];
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

function sourceLabel(src: any, documentTitle: string): string {
  if (!src || typeof src !== 'object') return documentTitle;
  const pages = Number.isFinite(src.pageStart) && Number.isFinite(src.pageEnd)
    ? (src.pageStart === src.pageEnd ? `p.${src.pageStart}` : `pp.${src.pageStart}–${src.pageEnd}`)
    : '';
  const sec = src.section ? ` · ${src.section}` : '';
  return `${documentTitle}${pages ? ` (${pages})` : ''}${sec}`;
}

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

export type GuardDecision = {
  decision: 'accept' | 'reject';
  accepted: boolean;
  documentType: string;
  confidence: number;
  reason: string;
  message: string | null;
};

export async function guardMaterial(
  { text, filename, pageCount }: { text: string; filename?: string; pageCount?: number },
): Promise<GuardDecision> {
  const r = await post('/api/documents/guard', {
    text: typeof text === 'string' ? text.slice(0, 8000) : '',
    ...(filename ? { filename: filename.slice(0, 256) } : {}),
    ...(Number.isFinite(pageCount) ? { pageCount } : {}),
  });
  const rejected = r.decision === 'reject';
  return {
    decision: rejected ? 'reject' : 'accept',
    accepted: !rejected,
    documentType: String(r.documentType ?? 'unknown'),
    confidence: typeof r.confidence === 'number' ? r.confidence : 0,
    reason: String(r.reason ?? ''),
    message: typeof r.message === 'string' ? r.message : null,
  };
}

export async function checkOcrAvailable(): Promise<{ enabled: boolean; available: boolean }> {
  try {
    const response = await fetch(`${API_URL}/api/documents/ocr-health`, { credentials: 'include' });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok !== true) return { enabled: false, available: false };
    return { enabled: Boolean(payload.enabled), available: Boolean(payload.available) };
  } catch {
    return { enabled: false, available: false };
  }
}

export function createOcrTransport(documentId?: string): OcrPageFn {
  return async ({ imageBase64, pageNumber }): Promise<OcrPageResult> => {
    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/documents/ocr-page`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(documentId ? { documentId } : {}), pageNumber, imageBase64 }),
      });
    } catch {
      return null;
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok !== true || typeof payload.text !== 'string') return null;
    const confidence = typeof payload.confidence === 'number' ? payload.confidence : 0;
    return { text: payload.text, confidence };
  };
}

export async function checkVisionAvailable(): Promise<{ enabled: boolean; available: boolean }> {
  try {
    const response = await fetch(`${API_URL}/api/documents/vision-health`, { credentials: 'include' });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok !== true) return { enabled: false, available: false };
    return { enabled: Boolean(payload.enabled), available: Boolean(payload.available) };
  } catch {
    return { enabled: false, available: false };
  }
}

export function createVisionTransport(documentId?: string): VisionPageFn {
  return async ({ imageBase64, pageNumber }): Promise<VisionPageResult> => {
    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/documents/vision-page`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(documentId ? { documentId } : {}), pageNumber, imageBase64, mimeType: 'image/png' }),
      });
    } catch {
      return null;
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok !== true || typeof payload.text !== 'string') return null;
    return { text: payload.text };
  };
}
