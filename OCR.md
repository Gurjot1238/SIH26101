# Local OCR (PaddleOCR)

Nexora AI reads most PDFs entirely in the browser: `pdfjs-dist` pulls the selectable text
out of each page and only that text is uploaded. Some PDFs are **scans or photographs** —
their pages carry no selectable text, so that extraction comes back empty. Local OCR fills
that gap: a small **PaddleOCR** service running on your own machine recognises the text in
those page images so scanned pages feed the **same** retrieval → AI material → MCQ →
competency-gap flow as ordinary typed pages.

OCR is **local and optional**:

- **Local** — inference runs on this machine via `.venv-ocr`. Nothing is sent to any cloud;
  there is no API key, token, or external OCR service. The service binds to `127.0.0.1` only.
- **Optional** — if OCR is off or not installed, normal text PDFs work exactly as before.
  Only genuinely scanned pages are affected, and they get an honest "couldn't read" message
  rather than silently failing.

---

## Architecture

```
Browser (src/lib/materials.ts)
  1. Extract native text from every PDF page (pdfjs-dist).
  2. For each page whose text is below the low-text threshold, rasterise JUST that page
     to a PNG and POST it to the API — full-page images never touch the AI, only text does.
        │
        ▼  POST /api/documents/ocr-page   { imageBase64, pageNumber }
API server (server/index.mjs → server/documents/ocr.mjs)   ·   node server/index.mjs
  3. Node OCR adapter forwards the image bytes to the local OCR service. Never throws:
     a timeout / refused connection / bad reply becomes { ok:false, code } so one bad
     page is marked "OCR failed" instead of taking the request — or the server — down.
        │
        ▼  POST http://127.0.0.1:8091/ocr/image
Local OCR service (server/ocr/ocr_service.py)   ·   Python, stdlib HTTP + PaddleOCR
  4. PaddleOCR recognises the text and returns normalised JSON
     { text, confidence, lineCount } — never a raw PaddleOCR object.
        │
        ▼
Back in the browser the recognised text is merged into the page list (tagged source:'ocr')
and uploaded through the normal append → finalize → chunk → index path, so retrieval, AI
generation, MCQs, grading, competency gaps and course recommendations all work unchanged.
```

Three engines/pieces, one contract:

- **Browser extractor** — `src/lib/materials.ts`. Native-text first; rasterises only low-text
  pages; injectable OCR transport so it stays server-agnostic and testable.
- **Node adapter** — `server/documents/ocr.mjs`. Loopback HTTP client with a bounded timeout
  and size cap; classifies every transport failure into a stable `code`.
- **Python service** — `server/ocr/ocr_service.py`. Standard-library HTTP server. Builds the
  PaddleOCR model **once per process** and reuses it. A `stub` engine (no PaddlePaddle
  import) backs the automated tests so they run anywhere.

## End-to-end flow

```
PDF ─▶ native text extraction (pdfjs, in-browser)
        │
        ├─ page has enough text ──────────────▶ use it as-is (source: native_text)
        │
        └─ page is (near-)empty ─▶ PaddleOCR when available ─▶ recognised text (source: ocr)
                                                              └─ unreadable ─▶ source: ocr_failed
        ▼
   unified document text  ─▶  existing chunking + BM25 indexing
        ▼
   topic retrieval (bounded context)  ─▶  AI material + MCQs (exact count, validated)
        ▼
   assessment  ─▶  competency gaps  ─▶  course recommendations
```

The document as a whole is tagged `extractionMethod` = `native_text` | `ocr` | `mixed`, each
chunk carries its own `extractionMethod` + `ocrConfidence`, and the document tracks
`ocrStatus` (`not_required` | `completed` | `partial` | `failed`), `pagesOcred`, and
`pagesOcrFailed`. This metadata rides through the existing PostgreSQL/JSON document schema —
no second database, no schema fork — so a future Gemini Vision stage can be added without a
rewrite.

## Installation

OCR needs a Python virtual environment named `.venv-ocr` at the repo root with PaddleOCR (and
its Pillow / pypdfium2 dependencies) installed. **On this project it already exists** — do not
delete or recreate it. To create it from scratch on a new machine:

```bash
python3 -m venv .venv-ocr
./.venv-ocr/bin/pip install --upgrade pip
./.venv-ocr/bin/pip install paddlepaddle paddleocr pillow pypdfium2 numpy
# First run downloads the detection/recognition models to ~/.paddleocr (one time).
./.venv-ocr/bin/python -c "from paddleocr import PaddleOCR; print('paddleocr ok')"
```

`.venv-ocr/`, the downloaded models, `__pycache__`, `*.pyc`, and any OCR logs are all
git-ignored — they are never committed.

## Running it

One command starts the web dev server **and** the local OCR service together:

```bash
npm run dev          # Vite (web) + local OCR service, health-gated, one Ctrl-C stops both
```

`scripts/dev-with-ocr.mjs` (pure Node, no extra dependency) launches Vite and
`server/ocr/ocr_service.py` side by side, auto-selecting the `.venv-ocr` interpreter, polling
`/health`, and reporting whether OCR came up. OCR is optional: if it fails to start, Vite
keeps running and text PDFs are unaffected. `Ctrl-C` terminates both cleanly.

The **API/auth server is separate** and is *not* started by `npm run dev` (that avoids a port
clash with a long-lived instance). Run it in its own terminal:

```bash
npm run auth         # API server (auth, documents, AI) on 127.0.0.1:4000
```

So the usual two-terminal setup is `npm run auth` in one and `npm run dev` in the other.

Other scripts:

```bash
npm run dev:web      # web dev server only (plain vite)
npm run dev:ocr      # OCR service only (waits for /health, then stays up)
npm run ocr:serve    # alias of dev:ocr
```

## Environment variables

Safe defaults ship in `.env.example`; set overrides in `server/.env` (never committed). No
production URLs or secrets are hard-coded, and nothing OCR-related is exposed to the frontend.

| Variable | Default | Purpose |
| --- | --- | --- |
| `OCR_ENABLED` | `true` | Master switch. `false` → OCR is skipped; text PDFs still work. |
| `OCR_HOST` | `127.0.0.1` | Bind/host address. **Loopback only** — do not expose publicly. |
| `OCR_PORT` | `8091` | Local OCR service port. |
| `OCR_TIMEOUT_MS` | `30000` | Per-page request timeout in the Node adapter. |
| `OCR_PYTHON` | `.venv-ocr/bin/python` | Interpreter used to launch the service. |
| `OCR_LANG` | `en` | PaddleOCR recognition language. |
| `OCR_DPI` | `200` | Render DPI for the server-side `/ocr/pdf` path. |
| `OCR_MAX_PAGES` | `200` | Page ceiling for a single `/ocr/pdf` request. |
| `OCR_MAX_IMAGE_BYTES` | `12582912` (12 MB) | Max decoded page-image size; larger is rejected pre-wire. |
| `OCR_ENGINE` | `paddle` | `paddle` = real inference; `stub` = deterministic text for tests. |
| `DOC_MIN_CHARS_PER_PAGE` | `60` | Below this, a page is treated as low-text and sent to OCR. |

## Health check

```bash
curl -s http://127.0.0.1:8091/health
# {"status":"ok","engine":"paddle","available":true,"lang":"en","paddleocrVersion":"3.x.x"}
```

`available:true` means PaddleOCR is importable and ready here. The browser calls the
equivalent `GET /api/documents/ocr-health` before rasterising anything, and only attempts OCR
when the engine is genuinely available.

<!-- __APPEND_3__ -->

## Manual test

1. Start `npm run auth` and `npm run dev`, then open the app and sign in.
2. Upload a **scanned** PDF (or a photo-of-text PDF) on the materials/upload screen.
3. While the scanned pages are read you'll see a professional processing state —
   *"Reading scanned content"* — with no mention of Python or PaddleOCR. Normal text PDFs
   show the usual states and never trigger this.
4. Generate a quiz on a topic that appears only on the scanned pages: the questions come back
   grounded in that content, with the page range cited — proof the OCR text reached retrieval
   and generation.

Quick service-only sanity check without the UI:

```bash
npm run dev:ocr
curl -s http://127.0.0.1:8091/health
```

## Automated tests

```bash
npm run ocr:test        # stub engine — full Node↔Python↔pipeline contract, runs anywhere
npm run startup:test    # proves `npm run dev` starts BOTH web + OCR and Ctrl-C stops both
npm run ocr:test:real   # REAL PaddleOCR on .venv-ocr (Mac); skips cleanly if paddle absent
```

`ocr:test` and `startup:test` use the paddle-free stub, so they are safe in CI and are part
of the broader suite where applicable. `ocr:test:real` is deliberately **excluded** from
`npm test` because it is heavy and platform-specific; it launches the real engine against the
committed fixtures in `tests/fixtures/ocr/` (`sample-scan.png`, `sample-scan.pdf`, regenerated
by `scripts/make-ocr-fixtures.py` if missing) and asserts real recognition plus retrieval of
the OCR'd topic. Run it on the Mac to confirm end-to-end OCR.

## Scanned-PDF flow, in detail

- **Native first, OCR only when needed.** Every page is read for selectable text first. Only
  pages under the low-text threshold are rasterised and OCR'd, so ordinary PDFs never pay the
  OCR cost and a *mixed* PDF (some typed, some scanned pages) OCRs just the scanned ones.
- **Page-scoped, never bulk.** Large PDFs are already uploaded as bounded page batches; OCR
  is one page image per request. An 800–1000-page book is never sent in a single request, and
  only bounded, retrieved context ever reaches the AI — the exact-question-count, validation,
  and repair behaviour is unchanged.
- **Honest failure.** A page PaddleOCR can't read is tagged `ocr_failed` and simply omitted
  from the text — never faked. If OCR is down, text pages still work; only the scanned pages
  report that they couldn't be read.

## Security

- **Loopback only.** The service binds to `127.0.0.1`; it is not reachable off the machine and
  is not exposed through the public frontend.
- **Bytes, not paths.** The contract carries image **bytes** (base64), never a filesystem
  path — there is no arbitrary-file-read surface. A request that tries to pass a `path` is
  rejected as `image_required`.
- **Bounded.** Per-request timeout and a decoded-size ceiling (`OCR_MAX_IMAGE_BYTES`); the
  `/ocr/pdf` path caps pages at `OCR_MAX_PAGES`.
- **No temp images on disk.** Page images are passed in memory (base64 in JSON; PDF pages
  rendered in-memory via pypdfium2). Nothing is written to a temp directory, so there is
  nothing to leak or clean up. `server/data/ocr-tmp/` is git-ignored defensively but unused.
- **Clean logs.** The service logs one structured line per event and never logs image bytes,
  recognised text, full PDFs, or secrets.

## What PaddleOCR does and doesn't handle

**Does:** recognise printed/typed text in scanned pages and photos of documents, in the
configured language, returning text + a confidence score per line. That text becomes ordinary
searchable document content.

**Doesn't:** understand the *meaning* of charts, diagrams, tables, or figures — it reads text,
it does not interpret visuals. Handwriting and very low-quality/rotated scans are unreliable.
The metadata is structured so a future **Gemini Vision** stage could add chart/diagram
understanding without reworking the pipeline; that is explicitly out of scope here.

## Troubleshooting

- **`available:false` from `/health`** — PaddleOCR isn't importable under `OCR_PYTHON`.
  Confirm `.venv-ocr` exists and `./.venv-ocr/bin/python -c "import paddleocr"` succeeds.
- **`npm run dev` says OCR isn't reachable** — the service may still be building the model on
  first use, or `.venv-ocr` is missing so it fell back to `python3` (which lacks paddle). Text
  PDFs keep working; fix the venv to enable scanned-PDF reading.
- **Scanned upload shows "appears to be scanned…"** — OCR was unavailable or every page came
  back empty. Check `/health`, then that `OCR_ENABLED` isn't `false`.
- **First real OCR is slow** — the model loads once per process (and downloads once to
  `~/.paddleocr`). Subsequent pages reuse the in-memory model.
- **Port already in use** — change `OCR_PORT` in `server/.env` (keep host `127.0.0.1`).



