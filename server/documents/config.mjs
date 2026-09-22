/**
 * Every knob the Smart Document Intelligence pipeline turns, in one place.
 *
 * The spec is emphatic that nothing here may be hard-coded around "exactly 800 pages":
 * the thresholds that decide how a document is handled, the chunk sizes, the overlap, the
 * retrieval caps and the upload limits are all read from here, and every one can be
 * overridden by an environment variable so an operator can retune behaviour without a code
 * change. The defaults are chosen for the zero-dependency prototype; a deployment with a
 * real vector store or OCR service raises the caps rather than rewrites the module.
 *
 * Why a module and not scattered constants: the router, chunker, indexer, retriever and
 * the job runner all need to agree on the same numbers (a chunk the indexer built must be
 * the chunk the retriever trims), and one source removes the drift that appears the moment
 * two files each keep their own copy of "how big is a chunk".
 */

/** Read a positive integer from the environment, falling back when unset or malformed. */
function envInt(name, fallback, env = process.env) {
  const raw = (env[name] ?? '').trim();
  if (raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/**
 * Processing modes, chosen automatically from page count (and, for SCANNED /
 * STRUCTURED_RESULT / QUESTION_PAPER, from the classifier — those are set elsewhere and
 * listed here so every mode name lives in one enum). The user never picks the mode.
 */
export const MODES = Object.freeze({
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
  VERY_LARGE: 'VERY_LARGE',
  DEEP: 'DEEP',
  SCANNED: 'SCANNED',
  STRUCTURED_RESULT: 'STRUCTURED_RESULT',
  QUESTION_PAPER: 'QUESTION_PAPER',
});

export function loadConfig(env = process.env) {
  const cfg = {
    // Page-count thresholds. A doc with fewer pages than SMALL_MAX_PAGES takes the fast
    // path (extract → AI → MCQs) unchanged; at or above each higher threshold the
    // heavier index-then-retrieve path kicks in. All configurable, none load-bearing on
    // the literal number 800.
    pages: {
      smallMax: envInt('DOC_SMALL_MAX_PAGES', 20, env),      // <= this → SMALL (fast path)
      mediumMax: envInt('DOC_MEDIUM_MAX_PAGES', 100, env),   // <= this → MEDIUM
      largeMin: envInt('DOC_LARGE_MIN_PAGES', 100, env),     // >= this → LARGE
      veryLargeMin: envInt('DOC_VERY_LARGE_MIN_PAGES', 500, env), // >= this → VERY_LARGE
      deepMin: envInt('DOC_DEEP_MIN_PAGES', 800, env),       // >= this → DEEP_DOCUMENT_MODE
    },

    // Chunking. Sizes are in characters (a token-aware refinement can divide by ~4 without
    // changing callers). Overlap keeps a concept from being sliced in half at a boundary.
    chunk: {
      targetChars: envInt('DOC_CHUNK_CHARS', 3200, env),
      minChars: envInt('DOC_CHUNK_MIN_CHARS', 400, env),
      overlapChars: envInt('DOC_CHUNK_OVERLAP_CHARS', 240, env),
      // Roughly chars-per-token, used only to report an estimated token budget.
      charsPerToken: envInt('DOC_CHARS_PER_TOKEN', 4, env),
    },

    // Retrieval — the bounded context that is actually sent to the AI. maxChunks and
    // maxContextChars are the guardrails that make "never send the whole book" true: no
    // matter how large the document, the model sees at most this much retrieved material.
    retrieval: {
      maxChunks: envInt('DOC_RETRIEVE_MAX_CHUNKS', 8, env),
      maxContextChars: envInt('DOC_RETRIEVE_MAX_CONTEXT_CHARS', 24_000, env),
      minScore: Number.parseFloat((env.DOC_RETRIEVE_MIN_SCORE ?? '').trim() || '0.05'),
    },

    // Upload / storage limits. The ceiling is deliberately generous (a 1000-page PDF is
    // large) but finite, and expressed in bytes so it can be tuned per deployment.
    upload: {
      maxBytes: envInt('DOC_UPLOAD_MAX_BYTES', 120 * 1024 * 1024, env), // 120 MB default
      maxPages: envInt('DOC_UPLOAD_MAX_PAGES', 2000, env),
      // Below this ratio of extractable characters per page, the doc is treated as SCANNED
      // and routed to OCR rather than the text pipeline.
      minCharsPerPage: envInt('DOC_MIN_CHARS_PER_PAGE', 60, env),
    },

    // Background job runner.
    jobs: {
      maxChunkRetries: envInt('DOC_JOB_MAX_CHUNK_RETRIES', 3, env),
      concurrency: envInt('DOC_JOB_CONCURRENCY', 2, env),
    },
  };
  return cfg;
}

/**
 * The processing mode for a document, from its page count and a couple of classifier
 * signals. Kept pure (no I/O) so the router and the tests can call it directly.
 *
 *   pageCount       integer, best estimate of pages
 *   isScanned       text extraction came back essentially empty for a page-bearing PDF
 *   documentType    the classifier's label, so MARKSHEET/QUESTION_PAPER route to their own
 *                   modes regardless of length
 */
export function modeFor(pageCount, { isScanned = false, documentType = null } = {}, cfg = loadConfig()) {
  if (documentType === 'MARKSHEET' || documentType === 'CERTIFICATE') return MODES.STRUCTURED_RESULT;
  if (documentType === 'QUESTION_PAPER') return MODES.QUESTION_PAPER;
  if (isScanned) return MODES.SCANNED;

  const pages = Number.isInteger(pageCount) && pageCount > 0 ? pageCount : 1;
  if (pages >= cfg.pages.deepMin) return MODES.DEEP;
  if (pages >= cfg.pages.veryLargeMin) return MODES.VERY_LARGE;
  if (pages >= cfg.pages.largeMin) return MODES.LARGE;
  if (pages <= cfg.pages.smallMax) return MODES.SMALL;
  return MODES.MEDIUM;
}

/** Does this mode take the heavy index-then-retrieve path rather than the fast path? */
export function isLargeMode(mode) {
  return mode === MODES.LARGE || mode === MODES.VERY_LARGE || mode === MODES.DEEP;
}
