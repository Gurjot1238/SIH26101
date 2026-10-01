function envInt(name, fallback, env = process.env) {
  const raw = (env[name] ?? '').trim();
  if (raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function envBool(name, fallback, env = process.env) {
  const raw = (env[name] ?? '').trim().toLowerCase();
  if (raw === '') return fallback;
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  return fallback;
}

function envStr(name, fallback, env = process.env) {
  const raw = (env[name] ?? '').trim();
  return raw === '' ? fallback : raw;
}

function envList(name, fallback, env = process.env) {
  const raw = (env[name] ?? '').trim();
  if (raw === '') return fallback;
  const items = raw.split(',').map((s) => s.trim().toLowerCase()).filter((s) => s !== '');
  return items.length ? items : fallback;
}

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
    pages: {
      smallMax: envInt('DOC_SMALL_MAX_PAGES', 20, env),      // <= this → SMALL (fast path)
      mediumMax: envInt('DOC_MEDIUM_MAX_PAGES', 100, env),   // <= this → MEDIUM
      largeMin: envInt('DOC_LARGE_MIN_PAGES', 100, env),     // >= this → LARGE
      veryLargeMin: envInt('DOC_VERY_LARGE_MIN_PAGES', 500, env), // >= this → VERY_LARGE
      deepMin: envInt('DOC_DEEP_MIN_PAGES', 800, env),       // >= this → DEEP_DOCUMENT_MODE
    },

    chunk: {
      targetChars: envInt('DOC_CHUNK_CHARS', 3200, env),
      minChars: envInt('DOC_CHUNK_MIN_CHARS', 400, env),
      overlapChars: envInt('DOC_CHUNK_OVERLAP_CHARS', 240, env),
      charsPerToken: envInt('DOC_CHARS_PER_TOKEN', 4, env),
    },

    retrieval: {
      maxChunks: envInt('DOC_RETRIEVE_MAX_CHUNKS', 8, env),
      maxContextChars: envInt('DOC_RETRIEVE_MAX_CONTEXT_CHARS', 24_000, env),
      minScore: Number.parseFloat((env.DOC_RETRIEVE_MIN_SCORE ?? '').trim() || '0.05'),
    },

    upload: {
      maxBytes: envInt('DOC_UPLOAD_MAX_BYTES', 120 * 1024 * 1024, env), // 120 MB default
      maxPages: envInt('DOC_UPLOAD_MAX_PAGES', 2000, env),
      minCharsPerPage: envInt('DOC_MIN_CHARS_PER_PAGE', 60, env),
    },

    jobs: {
      maxChunkRetries: envInt('DOC_JOB_MAX_CHUNK_RETRIES', 3, env),
      concurrency: envInt('DOC_JOB_CONCURRENCY', 2, env),
    },

    ocr: {
      enabled: envBool('OCR_ENABLED', true, env),
      provider: (() => {
        const raw = envStr('OCR_PROVIDER', 'local', env).toLowerCase();
        return ['local', 'official_api', 'ocrspace', 'disabled'].includes(raw) ? raw : 'local';
      })(),
      host: envStr('OCR_HOST', '127.0.0.1', env),
      port: envInt('OCR_PORT', 8091, env),
      timeoutMs: envInt('OCR_TIMEOUT_MS', 30_000, env),
      python: envStr('OCR_PYTHON', '.venv-ocr/bin/python', env),
      lang: envStr('OCR_LANG', 'en', env),
      dpi: envInt('OCR_DPI', 200, env),
      maxPages: envInt('OCR_MAX_PAGES', 200, env),
      maxBatch: envInt('OCR_MAX_BATCH', 1, env),
      maxImageBytes: envInt('OCR_MAX_IMAGE_BYTES', 12 * 1024 * 1024, env),

      official: {
        apiUrl: envStr('PADDLEOCR_API_URL', 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs', env),
        resultHostAllowlist: envList('PADDLEOCR_RESULT_HOST_ALLOWLIST', [], env),
        token: envStr('PADDLEOCR_ACCESS_TOKEN', '', env),
        authScheme: envStr('PADDLEOCR_AUTH_SCHEME', 'bearer', env),
        model: envStr('PADDLEOCR_MODEL', 'PaddleOCR-VL-1.6', env),
        useChartRecognition: envBool('PADDLEOCR_USE_CHART_RECOGNITION', false, env),
        submitTimeoutMs: envInt('PADDLEOCR_SUBMIT_TIMEOUT_MS', 30_000, env), // POST /jobs
        pollTimeoutMs: envInt('PADDLEOCR_POLL_TIMEOUT_MS', 8_000, env),      // each status GET
        pollIntervalMs: envInt('PADDLEOCR_POLL_INTERVAL_MS', 1_500, env),    // base backoff step
        pollMaxMs: envInt('PADDLEOCR_POLL_MAX_MS', 90_000, env),             // total wait ceiling
        resultTimeoutMs: envInt('PADDLEOCR_RESULT_TIMEOUT_MS', 30_000, env), // JSONL download
        maxResultBytes: envInt('PADDLEOCR_MAX_RESULT_BYTES', 32 * 1024 * 1024, env),
        defaultConfidence: (() => {
          const raw = Number.parseFloat((env.PADDLEOCR_DEFAULT_CONFIDENCE ?? '').trim());
          return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 0.9;
        })(),
      },

      // OCR.space — free hosted OCR API (https://ocr.space/ocrapi). Synchronous:
      // one POST returns the recognised text. Key is server-side only.
      ocrspace: {
        apiKey: envStr('OCRSPACE_API_KEY', '', env),
        apiUrl: envStr('OCRSPACE_API_URL', 'https://api.ocr.space/parse/image', env),
        language: envStr('OCRSPACE_LANGUAGE', 'eng', env),
        engine: (() => {
          const raw = envInt('OCRSPACE_ENGINE', 2, env);
          return [1, 2, 3, 5].includes(raw) ? raw : 2;
        })(),
        timeoutMs: envInt('OCRSPACE_TIMEOUT_MS', 30_000, env),
        maxResultBytes: envInt('OCRSPACE_MAX_RESULT_BYTES', 8 * 1024 * 1024, env),
        defaultConfidence: (() => {
          const raw = Number.parseFloat((env.OCRSPACE_DEFAULT_CONFIDENCE ?? '').trim());
          return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 0.85;
        })(),
      },
    },

    // Multimodal vision: pages that are visual (charts, diagrams, figures) and carry
    // little machine-readable text can be sent as an image to a multimodal AI provider
    // to produce study-oriented descriptive text. The provider/model come from the shared
    // AI abstraction (AI_PROVIDER / AI_MODEL / provider key); this block only bounds it.
    vision: {
      enabled: envBool('VISION_ENABLED', true, env),
      maxImageBytes: envInt('VISION_MAX_IMAGE_BYTES', 12 * 1024 * 1024, env), // decoded image ceiling
      maxPages: envInt('VISION_MAX_PAGES', 40, env),        // never describe more than this per document
      minTextChars: envInt('VISION_MIN_TEXT_CHARS', 24, env), // a page under this is a vision candidate
      timeoutMs: envInt('VISION_TIMEOUT_MS', 45_000, env),
    },
  };
  return cfg;
}

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

export function isLargeMode(mode) {
  return mode === MODES.LARGE || mode === MODES.VERY_LARGE || mode === MODES.DEEP;
}
