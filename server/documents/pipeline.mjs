import { classifyDocument } from './classify.mjs';
import { guardDocument } from './document-type-guard.mjs';
import { chunkPages, pagesFromText } from './chunk.mjs';
import { buildChunkIndex, retrieveContext, tokenize } from './search.mjs';
import { loadConfig, modeFor, isLargeMode } from './config.mjs';
import { DEFAULT_STAGES, runJob, jobView } from './jobs.mjs';
import { generateMaterial } from './material.mjs';
import { generateMcqs } from '../ai/provider.mjs';

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

  const guard = guardDocument({ text: sample, filename, pageCount, charsPerPage });
  if (guard.decision === 'reject') {
    console.log(`doc.guard: rejected type=${guard.documentType} pages=${pageCount} conf=${guard.confidence}`);
    return { ok: false, code: 'document_rejected', documentType: guard.documentType, reason: guard.reason, message: guard.message, guard };
  }

  const mode = modeFor(pageCount, { isScanned: classification.isScanned, documentType: classification.documentType }, cfg);

  const document = await store.createDocument({
    userId, filename, documentType: classification.documentType,
    confidence: classification.confidence, mode, pageCount, sizeBytes,
  });

  const chunks = chunkPages(pageList, { documentId: document.id, cfg });
  if (chunks.length === 0) {
    await store.setDocumentStatus(userId, document.id, { status: 'failed' });
    return { ok: false, code: 'no_chunks', message: 'The document produced no indexable chunks.', document, classification };
  }

  const job = await store.createJob({ userId, documentId: document.id, totalChunks: chunks.length, stages: [...DEFAULT_STAGES] });

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

  const guard = guardDocument({ text: sample, filename: record.filename, pageCount, charsPerPage });
  if (guard.decision === 'reject') {
    console.log(`doc.guard: rejected type=${guard.documentType} pages=${pageCount} conf=${guard.confidence}`);
    await store.deleteDocument(userId, documentId);
    return { ok: false, code: 'document_rejected', documentType: guard.documentType, reason: guard.reason, message: guard.message, guard };
  }

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

export async function searchDocuments({ store, userId, documentIds = [], query = '', env = process.env } = {}) {
  const cfg = loadConfig(env);
  if (!query || tokenize(query).length === 0) {
    return { ok: false, code: 'empty_query', message: 'Enter a topic, concept, or chapter to search for.' };
  }
  const owned = documentIds.map((id) => store.getDocument(userId, id)).filter(Boolean);
  if (owned.length === 0) return { ok: false, code: 'no_documents', message: 'No matching document was found for your account.' };

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
