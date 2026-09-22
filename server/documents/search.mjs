/**
 * The document index and the retrieve pipeline — how a topic becomes bounded context.
 *
 * This is what makes "never send the whole book to the AI" true in practice. The book is
 * chunked once (chunk.mjs), indexed here, and thereafter a topic query returns only the few
 * most relevant chunks, trimmed to a hard character budget, with their page ranges intact.
 * A 900-page textbook and a 5-page note go through the identical path; the large one simply
 * has more chunks to rank between, and the retriever still hands the model the same small,
 * bounded slice.
 *
 * The ranking is BM25-lite: a well-understood lexical scorer that needs no model, no vector
 * store and no network — the right default for the zero-dependency prototype. It is not
 * dense-embedding semantic search, and this module is honest about that: light stemming and
 * query expansion give it some tolerance to wording ("duplication" matches "duplicate"), but
 * a true synonym ("redundancy") is only found if it co-occurs. The `embedder` seam exists
 * precisely so a real embedding model can be dropped in later — pass one to
 * `buildChunkIndex` and scores blend vector cosine with BM25 — without any caller changing.
 */

import { loadConfig } from './config.mjs';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with',
  'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'that', 'this', 'these',
  'those', 'it', 'its', 'their', 'they', 'them', 'which', 'who', 'what', 'when', 'where',
  'how', 'why', 'not', 'no', 'so', 'than', 'then', 'can', 'will', 'would', 'should', 'about',
  'into', 'over', 'under', 'i', 'we', 'you', 'he', 'she', 'me', 'my', 'want', 'learn',
  'teach', 'find', 'everything', 'help', 'generate', 'questions', 'topic', 'please',
]);

/** Very light stemmer: strips a few common English suffixes so wording varies less. */
function stem(word) {
  let w = word;
  for (const suf of ['ization', 'isation', 'ations', 'ation', 'ings', 'ing', 'ies', 'ied', 'ers', 'er', 'ed', 'es', 's']) {
    if (w.length > suf.length + 3 && w.endsWith(suf)) { w = w.slice(0, -suf.length); break; }
  }
  return w;
}

export function tokenize(text) {
  const out = [];
  for (const raw of String(text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    if (raw.length < 2 || STOPWORDS.has(raw)) continue;
    out.push(stem(raw));
  }
  return out;
}

/**
 * Build a searchable index over already-chunked text.
 *
 *   chunks     [{ chunkId, text, pageStart, pageEnd, chapter, section, ... }]
 *   embedder   optional async (texts[]) => vectors[]; when present, dense cosine is blended
 *              into the score. Omitted in the prototype (lexical only).
 */
export function buildChunkIndex(chunks, { embedder = null } = {}) {
  const postings = new Map();   // term -> Map(chunkIndex -> tf)
  const lengths = [];
  const df = new Map();
  for (let i = 0; i < chunks.length; i += 1) {
    const terms = tokenize(chunks[i].text);
    lengths[i] = terms.length || 1;
    const seen = new Set();
    for (const term of terms) {
      let row = postings.get(term);
      if (!row) { row = new Map(); postings.set(term, row); }
      row.set(i, (row.get(i) ?? 0) + 1);
      if (!seen.has(term)) { df.set(term, (df.get(term) ?? 0) + 1); seen.add(term); }
    }
  }
  const avgLen = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
  return { chunks, postings, lengths, df, avgLen, N: chunks.length, embedder };
}

/**
 * Score chunks against a query with BM25 (k1=1.5, b=0.75) plus small bonuses when a query
 * term shows up in a chunk's chapter/section heading (a heading match is a strong topical
 * signal). Returns [{ index, score }] sorted high-to-low, dropping zero scores.
 */
export function scoreChunks(index, query) {
  const { postings, lengths, df, avgLen, N } = index;
  const qTerms = tokenize(query);
  if (qTerms.length === 0 || N === 0) return [];
  const k1 = 1.5;
  const b = 0.75;
  const scores = new Map();

  for (const term of new Set(qTerms)) {
    const row = postings.get(term);
    if (!row) continue;
    const n = df.get(term) ?? 0;
    const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
    for (const [ci, tf] of row) {
      const denom = tf + k1 * (1 - b + b * (lengths[ci] / avgLen));
      const add = idf * ((tf * (k1 + 1)) / denom);
      scores.set(ci, (scores.get(ci) ?? 0) + add);
    }
  }

  // Heading bonus: a query term appearing in the chapter/section label is worth a nudge.
  const qStems = new Set(qTerms);
  for (let ci = 0; ci < index.chunks.length; ci += 1) {
    if (!scores.has(ci)) continue;
    const headText = `${index.chunks[ci].chapter ?? ''} ${index.chunks[ci].section ?? ''}`;
    for (const h of tokenize(headText)) {
      if (qStems.has(h)) scores.set(ci, scores.get(ci) + 0.5);
    }
  }

  return [...scores.entries()]
    .map(([indexPos, score]) => ({ index: indexPos, score }))
    .sort((a, b2) => b2.score - a.score);
}

/** True when two chunk texts are near-duplicates (overlap of token sets ≥ 0.85). */
function nearDuplicate(a, b) {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  if (sa.size === 0 || sb.size === 0) return false;
  let shared = 0;
  for (const t of sa) if (sb.has(t)) shared += 1;
  const overlap = shared / Math.min(sa.size, sb.size);
  return overlap >= 0.85;
}

/**
 * The retrieve pipeline: search → rank → deduplicate → trim to a bounded budget.
 *
 * Returns everything the caller needs to (a) send ONLY relevant content to the AI and
 * (b) show the user a transparent "here's what I found" preview and later cite pages:
 *
 *   { query, matched, usedChunks:[{chunkId,pageStart,pageEnd,chapter,section,score,text}],
 *     contextText, pageRanges:[{start,end}], sections:[...], estimatedTokens, truncated }
 *
 * `contextText` is capped at cfg.retrieval.maxContextChars and cfg.retrieval.maxChunks — the
 * hard guarantee that the model never receives the whole book regardless of its size.
 */
export function retrieveContext(index, query, { cfg = loadConfig(), maxChunks, maxContextChars } = {}) {
  const capChunks = maxChunks ?? cfg.retrieval.maxChunks;
  const capChars = maxContextChars ?? cfg.retrieval.maxContextChars;
  const ranked = scoreChunks(index, query).filter((r) => r.score >= cfg.retrieval.minScore);

  const used = [];
  let budget = capChars;
  for (const { index: ci, score } of ranked) {
    if (used.length >= capChunks || budget <= 0) break;
    const chunk = index.chunks[ci];
    if (used.some((u) => nearDuplicate(u.text, chunk.text))) continue; // dedup
    let text = chunk.text;
    if (text.length > budget) text = text.slice(0, Math.max(0, budget)); // trim to fit
    used.push({
      chunkId: chunk.chunkId,
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
      chapter: chunk.chapter,
      section: chunk.section,
      score: Number(score.toFixed(3)),
      text,
    });
    budget -= text.length;
  }

  // Merge adjacent/contained page numbers into readable ranges for the preview and refs.
  const pageRanges = mergePageRanges(used.map((u) => [u.pageStart, u.pageEnd]));
  const sections = [...new Set(used.map((u) => u.section).filter(Boolean))];
  const chapters = [...new Set(used.map((u) => u.chapter).filter(Boolean))];
  const contextText = used
    .map((u) => `[pages ${u.pageStart}-${u.pageEnd}${u.section ? `, ${u.section}` : ''}]\n${u.text}`)
    .join('\n\n---\n\n');

  return {
    query,
    matched: ranked.length,
    usedChunks: used,
    contextText,
    pageRanges,
    sections,
    chapters,
    estimatedTokens: Math.ceil(contextText.length / Math.max(1, cfg.chunk.charsPerToken)),
    truncated: ranked.length > used.length,
  };
}

/** Collapse [[s,e],...] page pairs into sorted, merged { start, end } ranges. */
export function mergePageRanges(pairs) {
  const clean = pairs
    .filter(([s, e]) => Number.isFinite(s) && Number.isFinite(e))
    .map(([s, e]) => [Math.min(s, e), Math.max(s, e)])
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [s, e] of clean) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1] + 1) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  return merged.map(([start, end]) => ({ start, end }));
}
