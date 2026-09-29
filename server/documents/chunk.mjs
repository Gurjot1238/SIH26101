import { loadConfig } from './config.mjs';

export function pagesFromText(text, { firstPage = 1 } = {}) {
  const raw = String(text ?? '');
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
const SECTION_RE = /^(\d+(?:\.\d+){0,2})\s+([A-Z][\w].{2,80})$/;

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

function normaliseSource(source) {
  if (source === 'ocr') return 'ocr';
  if (source === 'ocr_failed') return 'ocr_failed';
  return 'native_text';
}

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
    const tail = overlapChars > 0 && text.length > overlapChars
      ? text.slice(text.length - overlapChars)
      : '';
    buf = tail ? `${tail} ${nextText}` : nextText;
    bufPageStart = null;
    bufPageEnd = null;
    chunkChapter = chapter;
    chunkSection = section;
    bufSources = tail ? new Set(bufSources) : new Set();
    if (!tail) { ocrConfSum = 0; ocrConfCount = 0; }
  };

  for (const { page, text, source, confidence } of pages) {
    const src = normaliseSource(source);
    const paras = String(text).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    for (const para of paras) {
      const firstLine = para.split(/\r?\n/)[0].trim();
      const heading = looksLikeHeading(firstLine) ? headingKind(firstLine) : null;
      if (heading) {
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
    if (bufPageStart === null) bufPageStart = pages[0]?.page ?? 1;
    if (bufPageEnd === null) bufPageEnd = pages[pages.length - 1]?.page ?? 1;
    finalizeChunk(buf.trim());
  }
  return chunks;
}

export function estimateTokens(text, cfg = loadConfig()) {
  return Math.ceil(String(text ?? '').length / Math.max(1, cfg.chunk.charsPerToken));
}
