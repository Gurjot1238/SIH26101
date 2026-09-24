/**
 * The orchestrator: upload → route → chunk → index → (topic) → retrieve → generate.
 *
 * This is the seam the HTTP routes call. It ties the pure pieces together — the classifier,
 * the chunker, the index/retriever, the job machine, the store, and the existing AI provider
 * — into the three operations the feature needs:
 *
 *   ingestDocument      classify, pick a mode, chunk page-aware, persist, run the job.
 *   searchDocuments     build an index over the owner's chosen document(s) and retrieve the
 *                       bounded, relevant context for a topic (the "here's what I found").
 *   generateFromTopic   send ONLY that bounded context to MCQ generation (and optionally to
 *                       one-page material generation), then stamp each question with the real
 *                       document + page range it was grounded in — never an invented page.
 *
 * The whole-book text is never handed to the AI. generateFromTopic's input to the model is
 * `retrieval.contextText`, already capped by the retriever. That is the structural answer to
 * "Request body too large": the model request is bounded no matter how large the book.
 */

import { classifyDocument } from './classify.mjs';
import { chunkPages, pagesFromText } from './chunk.mjs';
import { buildChunkIndex, retrieveContext, tokenize } from './search.mjs';
import { loadConfig, modeFor, isLargeMode } from './config.mjs';
import { DEFAULT_STAGES, runJob, jobView } from './jobs.mjs';
import { generateMaterial } from './material.mjs';
import { generateMcqs } from '../ai/provider.mjs';

/**
 * Summarise how a document's pages were extracted, for the document record. All additive:
 * these fields ride along in the JSONB document row, so no schema migration is needed.
 *   ocrStatus       'not_required' | 'completed' | 'partial' | 'failed'
 *   pagesOcred      count of pages whose text came from OCR
 *   pagesOcrFailed  count of pages OCR was attempted on but could not read
 *   extractionMethod document-level 'native_text' | 'ocr' | 'mixed'
 */
function ocrSummary(pageList) {
  let ocred = 0;
  let failed = 0;
  let native = 0;
  for (const p of pageList) {
    if (p.source === 'ocr') ocred += 1;
    else if (p.source === 'ocr_failed') failed += 1;
    else if ((p.text ?? '').trim() !== '') native += 1;
  }
  let ocrStatus;
  if (ocred === 0 && failed === 0) ocrStatus = 'not_required';
  else if (failed === 0) ocrStatus = 'completed';
  else if (ocred === 0) ocrStatus = 'failed';
  else ocrStatus = 'partial';
  const extractionMethod = ocred > 0 && native > 0 ? 'mixed' : ocred > 0 ? 'ocr' : 'native_text';
  return { ocrStatus, pagesOcred: ocred, pagesOcrFailed: failed, extractionMethod };
}

/**
 * Ingest an uploaded document.
 *
 *   pages     [{page,text}] (preferred) OR omit and pass `text` for a single blob
 *   text      raw extracted text (used if `pages` absent); may carry \f / [[page:N]] marks
 *   filename, mimeType, sizeBytes  metadata
 *
 * Returns { ok, document, job, classification } or { ok:false, code, message }.
 */
export async function ingestDocument({ store, userId, filename = 'document', text = '', pages = null, mimeType = '', sizeBytes = 0, env = process.env } = {}) {
  const cfg = loadConfig(env);
  const pageList = Array.isArray(pages) && pages.length ? pages : pagesFromText(text);
  if (pageList.length === 0 || pageList.every((p) => (p.text ?? '').trim() === '')) {
    return { ok: false, code: 'empty_document', message: 'No extractable text was found in this document.' };
  }

  const pageCount = pageList.length;
  const totalChars = pageList.reduce((s, p) => s + (p.text ?? '').length, 0);
  const charsPerPage = pageCount ? totalChars / pageCount : totalChars;
  const sample = pageList.map((p) => p.text).join('\n').slice(0, 8000);

  const classification = classifyDocument({ text: sample, filename, pageCount, charsPerPage });
  const mode = modeFor(pageCount, { isScanned: classification.isScanned, documentType: classification.documentType }, cfg);

  const document = await store.createDocument({
    userId, filename, documentType: classification.documentType,
    confidence: classification.confidence, mode, pageCount, sizeBytes,
  });

  // Build chunks up front (page-aware). For a scanned doc with no text we stop here and
  // report it — OCR is an infrastructure dependency not present in this build.
  const chunks = chunkPages(pageList, { documentId: document.id, cfg });
  if (chunks.length === 0) {
    await store.setDocumentStatus(userId, document.id, { status: 'failed' });
    return { ok: false, code: 'no_chunks', message: 'The document produced no indexable chunks.', document, classification };
  }

  const job = await store.createJob({ userId, documentId: document.id, totalChunks: chunks.length, stages: [...DEFAULT_STAGES] });

  // Run the job. The per-chunk step here validates and admits each chunk; it is deliberately
  // where a heavier per-chunk operation (e.g. computing an embedding) would live, so the
  // retry/resume machinery is real and not decorative.
  await runJob(job, {
    maxChunkRetries: cfg.jobs.maxChunkRetries,
    processChunk: async (i) => {
      const c = chunks[i];
      if (!c || typeof c.text !== 'string' || c.text.trim() === '') throw new Error('empty chunk');
    },
    persist: async (j) => { await store.updateJob(userId, j.id, { status: j.status, stages: j.stages, chunkStatus: j.chunkStatus, error: j.error }); },
  });

  await store.saveChunks(userId, document.id, chunks);
  const ocr = ocrSummary(pageList);
  await store.setDocumentStatus(userId, document.id, { status: job.status === 'completed' ? 'ready' : 'failed', ...ocr });

  return { ok: true, document: store.getDocument(userId, document.id), job: jobView(job), classification, mode, isLargeMode: isLargeMode(mode) };
}

/**
 * Finalize a document uploaded in page batches: read the accumulated pages, classify, pick a
 * mode, chunk, run the job, and update the EXISTING document record (created by the staged
 * upload). This is the large-document path — pages arrived in bounded batches, so no single
 * request was ever large, and only now (server-side, off the request that uploaded the last
 * batch if the caller wishes) is the heavier chunk/index work done.
 *
 * Returns the same shape as ingestDocument.
 */
export async function finalizeDocument({ store, userId, documentId, env = process.env } = {}) {
  const cfg = loadConfig(env);
  const record = store.getDocument(userId, documentId);
  if (!record) return { ok: false, code: 'not_found', message: 'No such document for your account.' };
  const pageList = await store.takePendingPages(userId, documentId);
  if (!pageList || pageList.length === 0 || pageList.every((p) => (p.text ?? '').trim() === '')) {
    await store.setDocumentStatus(userId, documentId, { status: 'failed' });
    return { ok: false, code: 'empty_document', message: 'No extractable text was uploaded for this document.' };
  }

  const pageCount = pageList.length;
  const totalChars = pageList.reduce((s, p) => s + (p.text ?? '').length, 0);
  const charsPerPage = pageCount ? totalChars / pageCount : totalChars;
  const sample = pageList.map((p) => p.text).join('\n').slice(0, 8000);
  const classification = classifyDocument({ text: sample, filename: record.filename, pageCount, charsPerPage });
  const mode = modeFor(pageCount, { isScanned: classification.isScanned, documentType: classification.documentType }, cfg);

  await store.setDocumentStatus(userId, documentId, {
    documentType: classification.documentType, confidence: classification.confidence, mode, pageCount, status: 'processing',
  });

  const chunks = chunkPages(pageList, { documentId, cfg });
  if (chunks.length === 0) {
    await store.setDocumentStatus(userId, documentId, { status: 'failed' });
    return { ok: false, code: 'no_chunks', message: 'The document produced no indexable chunks.', classification };
  }

  const job = await store.createJob({ userId, documentId, totalChunks: chunks.length, stages: [...DEFAULT_STAGES] });
  await runJob(job, {
    maxChunkRetries: cfg.jobs.maxChunkRetries,
    processChunk: async (i) => { const c = chunks[i]; if (!c || (c.text ?? '').trim() === '') throw new Error('empty chunk'); },
    persist: async (j) => { await store.updateJob(userId, j.id, { status: j.status, stages: j.stages, chunkStatus: j.chunkStatus, error: j.error }); },
  });
  await store.saveChunks(userId, documentId, chunks);
  const ocr = ocrSummary(pageList);
  await store.setDocumentStatus(userId, documentId, { status: job.status === 'completed' ? 'ready' : 'failed', ...ocr });

  return { ok: true, document: store.getDocument(userId, documentId), job: jobView(job), classification, mode, isLargeMode: isLargeMode(mode) };
}

/**
 * Search one or more of the user's documents for a topic and return the bounded, relevant
 * context plus a preview (sections + page ranges) — the "🔎 Found relevant material" screen.
 *
 *   documentIds   array of document ids to search (all must belong to the user)
 */
export async function searchDocuments({ store, userId, documentIds = [], query = '', env = process.env } = {}) {
  const cfg = loadConfig(env);
  if (!query || tokenize(query).length === 0) {
    return { ok: false, code: 'empty_query', message: 'Enter a topic, concept, or chapter to search for.' };
  }
  const owned = documentIds.map((id) => store.getDocument(userId, id)).filter(Boolean);
  if (owned.length === 0) return { ok: false, code: 'no_documents', message: 'No matching document was found for your account.' };

  // Gather chunks across the chosen documents (ownership already enforced by getDocument).
  const allChunks = [];
  for (const doc of owned) {
    // eslint-disable-next-line no-await-in-loop
    const chunks = await store.getChunks(userId, doc.id);
    for (const c of chunks ?? []) allChunks.push({ ...c, _title: doc.title });
  }
  if (allChunks.length === 0) return { ok: false, code: 'not_indexed', message: 'These documents have not finished processing yet.' };

  const index = buildChunkIndex(allChunks);
  const retrieval = retrieveContext(index, query, { cfg });
  return {
    ok: true,
    query,
    documentIds: owned.map((d) => d.id),
    found: retrieval.usedChunks.length,
    sections: retrieval.sections,
    chapters: retrieval.chapters,
    pageRanges: retrieval.pageRanges,
    estimatedTokens: retrieval.estimatedTokens,
    retrieval,
  };
}

/** Locate the real page range a grounded source sentence came from, over the used chunks. */
function locatePages(sourceText, usedChunks) {
  const needle = new Set(tokenize(sourceText));
  if (needle.size === 0) return null;
  let best = null;
  let bestScore = 0;
  for (const c of usedChunks) {
    const hay = new Set(tokenize(c.text));
    let shared = 0;
    for (const t of needle) if (hay.has(t)) shared += 1;
    const score = shared / needle.size;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return bestScore >= 0.3 && best ? { pageStart: best.pageStart, pageEnd: best.pageEnd, section: best.section, chapter: best.chapter, extractionMethod: best.extractionMethod ?? null } : null;
}

/**
 * Generate MCQs (and optionally one-page material) for a topic, from bounded retrieved
 * context only. Each question is stamped with the document id and the real page range its
 * grounded source falls in — page refs come from actual chunks, never invented (spec §35).
 */
export async function generateFromTopic({ store, userId, documentIds = [], query = '', questionCount = 10, difficulty, wantMaterial = false, materialStyle = 'revision', env = process.env } = {}) {
  const search = await searchDocuments({ store, userId, documentIds, query, env });
  if (!search.ok) return search;
  const { retrieval } = search;
  if (retrieval.contextText.trim() === '') {
    return { ok: false, code: 'no_context', message: 'No relevant content was found for that topic in the selected documents.' };
  }

  const primaryDoc = store.getDocument(userId, search.documentIds[0]);
  const outcome = await generateMcqs(
    { text: retrieval.contextText, topics: [query], concepts: retrieval.sections ?? [], questionCount, difficulty },
    { env },
  );

  // Stamp real source references onto every question the generator returned.
  const stampSource = (q) => {
    const loc = locatePages(q.source ?? '', retrieval.usedChunks) ?? (retrieval.pageRanges[0]
      ? { pageStart: retrieval.pageRanges[0].start, pageEnd: retrieval.pageRanges[0].end, section: retrieval.sections[0] ?? null, chapter: retrieval.chapters[0] ?? null, extractionMethod: retrieval.usedChunks[0]?.extractionMethod ?? null }
      : null);
    return {
      ...q,
      source: {
        documentId: primaryDoc?.id ?? null,
        documentTitle: primaryDoc?.title ?? null,
        sourceSentence: typeof q.source === 'string' ? q.source : null,
        pageStart: loc?.pageStart ?? null,
        pageEnd: loc?.pageEnd ?? null,
        section: loc?.section ?? null,
        chapter: loc?.chapter ?? null,
        extractionMethod: loc?.extractionMethod ?? null,
      },
    };
  };

  const questions = (outcome.questions ?? []).map(stampSource);

  let material = null;
  if (wantMaterial) {
    material = await generateMaterial({ topic: query, retrieval, style: materialStyle, documentTitle: primaryDoc?.title, env });
  }

  return {
    ok: outcome.ok,
    code: outcome.ok ? undefined : outcome.code,
    message: outcome.ok ? undefined : outcome.message,
    query,
    questions,
    meta: outcome.meta,
    debug: outcome.debug,
    preview: { sections: search.sections, chapters: search.chapters, pageRanges: search.pageRanges, found: search.found },
    material,
  };
}
