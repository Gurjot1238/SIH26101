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

/** Read a boolean flag (1/true/yes/on vs 0/false/no/off). Falls back when unset or unknown. */
function envBool(name, fallback, env = process.env) {
  const raw = (env[name] ?? '').trim().toLowerCase();
  if (raw === '') return fallback;
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  return fallback;
}

/** Read a non-empty trimmed string from the environment, falling back when unset. */
function envStr(name, fallback, env = process.env) {
  const raw = (env[name] ?? '').trim();
  return raw === '' ? fallback : raw;
}

/** Read a comma-separated list of trimmed, lowercased, non-empty tokens (else the fallback). */
function envList(name, fallback, env = process.env) {
  const raw = (env[name] ?? '').trim();
  if (raw === '') return fallback;
  const items = raw.split(',').map((s) => s.trim().toLowerCase()).filter((s) => s !== '');
  return items.length ? items : fallback;
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

    // Local OCR (optional). When a PDF page carries too little selectable text (see
    // upload.minCharsPerPage) the browser rasterises just that page and posts the PNG to
    // /api/documents/ocr-page, which forwards to a local PaddleOCR HTTP service. Everything
    // here is a knob so an operator can retune without a code change, and the feature is
    // strictly optional: with OCR disabled or the service down, native-text PDFs are
    // unaffected and only genuinely scanned pages get an honest "OCR unavailable" result.
    ocr: {
      // Master switch. Off → the server behaves exactly as it did before OCR existed.
      enabled: envBool('OCR_ENABLED', true, env),
      // Which OCR engine backs a scanned page:
      //   'local'        → the loopback PaddleOCR Python service (dev default, needs .venv-ocr)
      //   'official_api' → the hosted PaddleOCR Official API (production; no local Python)
      //   'disabled'     → skip OCR entirely (identical to enabled:false)
      // An unrecognised value falls back to 'local' so a typo can never silently turn a
      // scanned page into a blind call to the cloud.
      provider: (() => {
        const raw = envStr('OCR_PROVIDER', 'local', env).toLowerCase();
        return ['local', 'official_api', 'disabled'].includes(raw) ? raw : 'local';
      })(),
      // The service binds to loopback ONLY; a public bind is never a supported configuration.
      host: envStr('OCR_HOST', '127.0.0.1', env),
      port: envInt('OCR_PORT', 8091, env),
      // Per-request ceiling for a single page image / small PDF. PaddleOCR's first call also
      // pays a one-time model-load cost, so this is generous rather than tight.
      timeoutMs: envInt('OCR_TIMEOUT_MS', 30_000, env),
      // Interpreter that has paddleocr installed. Default matches the venv the user created;
      // relative paths resolve from the repo root (resolved by the dev launcher / adapter).
      python: envStr('OCR_PYTHON', '.venv-ocr/bin/python', env),
      // Recognition language passed to PaddleOCR (`en`, `ch`, ...).
      lang: envStr('OCR_LANG', 'en', env),
      // Rasterisation resolution for scanned pages. ~200 DPI is a good text/latency trade.
      dpi: envInt('OCR_DPI', 200, env),
      // Safety caps so a scanned book can never OCR itself into an unbounded job: at most
      // this many pages are OCR'd per document, in batches of this size (one page per HTTP
      // request from the browser, so the server never receives many pages at once).
      maxPages: envInt('OCR_MAX_PAGES', 200, env),
      maxBatch: envInt('OCR_MAX_BATCH', 1, env),
      // Largest page image the /ocr-page route will accept (defends the service from a
      // pathologically large PNG). 12 MB comfortably holds a 200-DPI A4 page.
      maxImageBytes: envInt('OCR_MAX_IMAGE_BYTES', 12 * 1024 * 1024, env),

      // ---- Hosted PaddleOCR Official API (used when provider === 'official_api') --------
      // The production OCR path: no local Python, no .venv-ocr. A single scanned-page image
      // is submitted to the hosted asynchronous jobs API, polled until the job is done, and
      // its JSONL result parsed into the SAME normalised { text, confidence, lineCount } the
      // local engine returns — so chunk → index → retrieve → AI is identical no matter which
      // provider read the page. The token is read from the server environment ONLY: it is
      // never sent to the browser, written to a log, or included in an API response.
      official: {
        // Async jobs endpoint. Submit = POST here; polling = GET <apiUrl>/<jobId>.
        apiUrl: envStr('PADDLEOCR_API_URL', 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs', env),
        // SSRF allow-list for the result-download host. The jobs API returns a pre-signed result
        // URL on a DIFFERENT object-storage host that we then GET server-side, so a compromised or
        // rogue API response could otherwise steer that fetch at an internal address. Independent
        // of this list the adapter ALWAYS requires https for the result URL and blocks
        // loopback/private/link-local/reserved IPs (incl. the cloud-metadata address); a non-empty
        // comma-separated host list narrows it further to just those hosts (suffix match). Empty by
        // default so the real provider keeps working; set it to lock the download host down.
        resultHostAllowlist: envList('PADDLEOCR_RESULT_HOST_ALLOWLIST', [], env),
        // Server-side secret. Empty → provider answers ocr_not_configured (never a blind call).
        token: envStr('PADDLEOCR_ACCESS_TOKEN', '', env),
        // The hosted example authorises with `bearer <token>`; kept configurable so an operator
        // can switch to `token`/`Bearer` without a code change if the service expects it.
        authScheme: envStr('PADDLEOCR_AUTH_SCHEME', 'bearer', env),
        // Model label sent with the job (the hosted example uses PaddleOCR-VL-1.6).
        model: envStr('PADDLEOCR_MODEL', 'PaddleOCR-VL-1.6', env),
        // Chart recognition is OFF by default: it is slower and unnecessary for text pages, and
        // the spec is explicit not to enable it globally. Set PADDLEOCR_USE_CHART_RECOGNITION=1
        // only where a deployment genuinely wants chart-structure extraction.
        useChartRecognition: envBool('PADDLEOCR_USE_CHART_RECOGNITION', false, env),
        // Timeouts / poll budget — all bounded so a single page can never hang forever.
        submitTimeoutMs: envInt('PADDLEOCR_SUBMIT_TIMEOUT_MS', 30_000, env), // POST /jobs
        pollTimeoutMs: envInt('PADDLEOCR_POLL_TIMEOUT_MS', 8_000, env),      // each status GET
        pollIntervalMs: envInt('PADDLEOCR_POLL_INTERVAL_MS', 1_500, env),    // base backoff step
        pollMaxMs: envInt('PADDLEOCR_POLL_MAX_MS', 90_000, env),             // total wait ceiling
        resultTimeoutMs: envInt('PADDLEOCR_RESULT_TIMEOUT_MS', 30_000, env), // JSONL download
        // Cap the JSONL download so a pathological result can never exhaust memory.
        maxResultBytes: envInt('PADDLEOCR_MAX_RESULT_BYTES', 32 * 1024 * 1024, env),
        // Reported when the hosted result carries no per-page confidence (VL parsing often
        // omits a scalar score); kept in [0,1] so the existing confidence plumbing is unchanged.
        defaultConfidence: (() => {
          const raw = Number.parseFloat((env.PADDLEOCR_DEFAULT_CONFIDENCE ?? '').trim());
          return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 0.9;
        })(),
      },
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
