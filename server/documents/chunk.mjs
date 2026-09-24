/**
 * Page-aware, structure-aware chunking.
 *
 * A chunk is the unit the index searches and the unit the retriever sends to the AI, so it
 * has to carry enough provenance to answer "which pages did this question come from?" — the
 * spec's trust requirement. Every chunk therefore records its page range, and the chapter
 * and section heading in force where it began.
 *
 * Boundaries matter. Splitting a book every N characters cuts definitions in half and
 * produces chunks that quote a sentence the document never finishes. So this splits on the
 * strongest boundary available in priority order — chapter, then section, then paragraph,
 * then page, and only then a hard character cap — and carries a small overlap between
 * consecutive chunks so a concept straddling a boundary survives in at least one of them.
 *
 * Input is page-tagged: an array of { page, text }. Real extraction is page-by-page
 * (pdf.js in the browser, one string per page), which is exactly this shape; a single
 * string with form-feed page breaks is accepted too via `pagesFromText`.
 */

import { loadConfig } from './config.mjs';

/** Turn a form-feed- or marker-delimited string into page records. */
export function pagesFromText(text, { firstPage = 1 } = {}) {
  const raw = String(text ?? '');
  // Prefer explicit [[page:N]] markers if present; else split on form feed; else one page.
  if (/\[\[page:\d+\]\]/.test(raw)) {
    const parts = raw.split(/\[\[page:(\d+)\]\]/).slice(1);
    const pages = [];
    for (let i = 0; i < parts.length; i += 2) {
      pages.push({ page: Number.parseInt(parts[i], 10), text: (parts[i + 1] ?? '').trim() });
    }
    return pages.filter((p) => p.text !== '');
  }
  const byFF = raw.split('\f');
  if (byFF.length > 1) {
    return byFF.map((t, i) => ({ page: firstPage + i, text: t.trim() })).filter((p) => p.text !== '');
  }
  return raw.trim() === '' ? [] : [{ page: firstPage, text: raw.trim() }];
}

const CHAPTER_RE = /^(chapter\s+\d+\b.*|part\s+[ivxlcdm\d]+\b.*|unit\s+[-\s]?[ivxlcdm\d]+\b.*)$/i;
// A numbered section heading like "8.2 Functional Dependencies" or "8.4.1 First Normal Form".
const SECTION_RE = /^(\d+(?:\.\d+){0,2})\s+([A-Z][\w].{2,80})$/;

/** Is this short line plausibly a heading (title-cased, not sentence-punctuated)? */
function looksLikeHeading(line) {
  const t = line.trim();
  if (t.length === 0 || t.length > 90) return false;
  if (/[.:;]$/.test(t)) return false;
  if (CHAPTER_RE.test(t)) return true;
  if (SECTION_RE.test(t)) return true;
  return false;
}

function headingKind(line) {
  const t = line.trim();
  if (CHAPTER_RE.test(t)) return { kind: 'chapter', label: t };
  const m = SECTION_RE.exec(t);
  if (m) return { kind: 'section', label: t };
  return null;
}

/**
 * Split pages into chunks.
 *
 *   pages       [{ page, text, source?, confidence? }]  — source is 'native_text' | 'ocr'
 *               | 'ocr_failed' (default 'native_text'); confidence is the OCR score if any.
 *   documentId  stamped into every chunk
 *   cfg         chunk sizing (targetChars, minChars, overlapChars)
 *
 * Returns [{ documentId, chunkId, index, pageStart, pageEnd, chapter, section, text, topics,
 *            extractionMethod, ocrConfidence }]. extractionMethod is 'native_text' | 'ocr' |
 * 'mixed', derived from the pages that fed the chunk — so a question grounded in a chunk can
 * honestly say whether its evidence was typed or recognised from a scan.
 */
function normaliseSource(source) {
  if (source === 'ocr') return 'ocr';
  if (source === 'ocr_failed') return 'ocr_failed';
  return 'native_text';
}

/** Collapse a set of page sources into one chunk-level extraction method. */
function methodFromSources(sources) {
  const hasNative = sources.has('native_text');
  const hasOcr = sources.has('ocr');
  if (hasNative && hasOcr) return 'mixed';
  if (hasOcr) return 'ocr';
  return 'native_text';
}

export function chunkPages(pages, { documentId = 'doc', cfg = loadConfig() } = {}) {
  const { targetChars, minChars, overlapChars } = cfg.chunk;
  const chunks = [];
  let buf = '';
  let bufPageStart = null;
  let bufPageEnd = null;
  let chapter = null;
  let section = null;
  let chunkChapter = null;
  let chunkSection = null;
  // Provenance for the current buffer: which extraction sources fed it, and the running
  // mean of any OCR confidences, so each chunk can report how its text was obtained.
  let bufSources = new Set();
  let ocrConfSum = 0;
  let ocrConfCount = 0;

  const finalizeChunk = (text) => {
    const method = methodFromSources(bufSources);
    const chunk = {
      documentId,
      chunkId: `${documentId}::c${chunks.length}`,
      index: chunks.length,
      pageStart: bufPageStart,
      pageEnd: bufPageEnd,
      chapter: chunkChapter,
      section: chunkSection,
      text,
      topics: [],
      extractionMethod: method,
    };
    if (method !== 'native_text' && ocrConfCount > 0) {
      chunk.ocrConfidence = Math.round((ocrConfSum / ocrConfCount) * 1000) / 1000;
    }
    chunks.push(chunk);
  };

  const flush = (nextText = '') => {
    const text = buf.trim();
    if (text.length >= Math.min(minChars, 1)) {
      finalizeChunk(text);
    }
    // Carry a small overlap tail into the next buffer so a concept cut at the boundary
    // still appears at the head of the following chunk.
    const tail = overlapChars > 0 && text.length > overlapChars
      ? text.slice(text.length - overlapChars)
      : '';
    buf = tail ? `${tail} ${nextText}` : nextText;
    bufPageStart = null;
    bufPageEnd = null;
    chunkChapter = chapter;
    chunkSection = section;
    // The overlap tail belongs to the chunk just flushed, so its sources carry forward;
    // with no tail the next chunk starts with a clean provenance slate.
    bufSources = tail ? new Set(bufSources) : new Set();
    if (!tail) { ocrConfSum = 0; ocrConfCount = 0; }
  };

  for (const { page, text, source, confidence } of pages) {
    const src = normaliseSource(source);
    const paras = String(text).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    for (const para of paras) {
      // Update the running chapter/section when a paragraph is actually a heading line.
      const firstLine = para.split(/\r?\n/)[0].trim();
      const heading = looksLikeHeading(firstLine) ? headingKind(firstLine) : null;
      if (heading) {
        // A chapter/section boundary is the strongest split point: flush what we have so a
        // chunk never spans two chapters, then set the new heading context.
        if (buf.trim().length >= minChars) flush('');
        if (heading.kind === 'chapter') { chapter = heading.label; section = null; }
        else { section = heading.label; }
        if (chunkChapter === null) chunkChapter = chapter;
        if (chunkSection === null) chunkSection = section;
      }

      if (bufPageStart === null) { bufPageStart = page; chunkChapter = chapter; chunkSection = section; }
      bufPageEnd = page;
      bufSources.add(src);
      if (src === 'ocr' && typeof confidence === 'number') { ocrConfSum += confidence; ocrConfCount += 1; }
      buf = buf === '' ? para : `${buf}\n\n${para}`;

      if (buf.length >= targetChars) flush('');
    }
  }
  if (buf.trim().length > 0) {
    // Final flush without overlap handling (nothing follows).
    if (bufPageStart === null) bufPageStart = pages[0]?.page ?? 1;
    if (bufPageEnd === null) bufPageEnd = pages[pages.length - 1]?.page ?? 1;
    finalizeChunk(buf.trim());
  }
  return chunks;
}

/** Estimated token budget for a piece of text, for logging/guardrails. */
export function estimateTokens(text, cfg = loadConfig()) {
  return Math.ceil(String(text ?? '').length / Math.max(1, cfg.chunk.charsPerToken));
}
