import { loadConfig } from './config.mjs';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with',
  'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'that', 'this', 'these',
  'those', 'it', 'its', 'their', 'they', 'them', 'which', 'who', 'what', 'when', 'where',
  'how', 'why', 'not', 'no', 'so', 'than', 'then', 'can', 'will', 'would', 'should', 'about',
  'into', 'over', 'under', 'i', 'we', 'you', 'he', 'she', 'me', 'my', 'want', 'learn',
  'teach', 'find', 'everything', 'help', 'generate', 'questions', 'topic', 'please',
]);

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

export function buildChunkIndex(chunks, { embedder = null } = {}) {
  const postings = new Map();
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

function nearDuplicate(a, b) {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  if (sa.size === 0 || sb.size === 0) return false;
  let shared = 0;
  for (const t of sa) if (sb.has(t)) shared += 1;
  const overlap = shared / Math.min(sa.size, sb.size);
  return overlap >= 0.85;
}

export function retrieveContext(index, query, { cfg = loadConfig(), maxChunks, maxContextChars } = {}) {
  const capChunks = maxChunks ?? cfg.retrieval.maxChunks;
  const capChars = maxContextChars ?? cfg.retrieval.maxContextChars;
  const ranked = scoreChunks(index, query).filter((r) => r.score >= cfg.retrieval.minScore);

  const used = [];
  let budget = capChars;
  for (const { index: ci, score } of ranked) {
    if (used.length >= capChunks || budget <= 0) break;
    const chunk = index.chunks[ci];
    if (used.some((u) => nearDuplicate(u.text, chunk.text))) continue;
    let text = chunk.text;
    if (text.length > budget) text = text.slice(0, Math.max(0, budget));
    used.push({
      chunkId: chunk.chunkId,
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
      chapter: chunk.chapter,
      section: chunk.section,
      extractionMethod: chunk.extractionMethod ?? 'native_text',
      ...(typeof chunk.ocrConfidence === 'number' ? { ocrConfidence: chunk.ocrConfidence } : {}),
      score: Number(score.toFixed(3)),
      text,
    });
    budget -= text.length;
  }

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
