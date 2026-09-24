#!/usr/bin/env python3
"""
Nexora AI — local OCR HTTP service.

Why this exists
---------------
Some PDFs are scans or photographs: their pages carry no selectable text, so the
browser-side extraction that powers the normal document pipeline comes back
essentially empty. This tiny service recognises text in those page images using
a LOCAL PaddleOCR model, so scanned pages can feed the SAME
chunk -> index -> retrieve -> AI flow as ordinary text. Nothing is sent to any
cloud: inference runs on this machine, and the process binds to loopback only.

Design constraints (deliberate)
--------------------------------
* Standard library only for the HTTP layer (http.server) — no web framework to
  install. PaddleOCR / Pillow / pypdfium2 come from the .venv-ocr the operator
  created; they are imported lazily so the process can still answer /health and
  report itself unavailable when they are missing.
* The PaddleOCR engine is built ONCE per process (first real request) and reused
  — model load is the expensive part, so we never pay it twice.
* A stub engine (OCR_ENGINE=stub) returns deterministic text WITHOUT importing
  paddle at all. That is what lets the automated test-suite exercise the whole
  Node<->Python<->pipeline contract on a machine that cannot run PaddlePaddle.
* Robust across PaddleOCR 3.x (.predict -> rec_texts/rec_scores) and the older
  2.x (.ocr -> [[ [box,(text,score)] ]]) result shapes.

Endpoints
---------
  GET  /health      liveness + whether OCR is actually available here.
  POST /ocr/image   { imageBase64, lang?, pageNumber?, stubText? } -> normalised text.
  POST /ocr/pdf     { pdfBase64, dpi?, maxPages? }                 -> per-page text.

All responses are normalised JSON — never a raw PaddleOCR object.
"""

import base64
import binascii
import json
import os
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# ---------------------------------------------------------------------------
# Configuration (env, with the same safe defaults as server/documents/config.mjs)
# ---------------------------------------------------------------------------

HOST = os.environ.get("OCR_HOST", "127.0.0.1").strip() or "127.0.0.1"
PORT = int(os.environ.get("OCR_PORT", "8091") or "8091")
LANG = os.environ.get("OCR_LANG", "en").strip() or "en"
# "stub" -> deterministic fixture text, no paddle import (used by the test suite).
# anything else -> real local PaddleOCR.
ENGINE_KIND = os.environ.get("OCR_ENGINE", "paddle").strip().lower() or "paddle"
MAX_IMAGE_BYTES = int(os.environ.get("OCR_MAX_IMAGE_BYTES", str(12 * 1024 * 1024)))
MAX_PDF_PAGES = int(os.environ.get("OCR_MAX_PAGES", "200") or "200")
DEFAULT_DPI = int(os.environ.get("OCR_DPI", "200") or "200")

DEFAULT_STUB_TEXT = (
    "NEXORA AI OCR TEST\n"
    "Competency Based Learning\n"
    "Artificial Intelligence\n"
    "Machine Learning\n"
    "Neural Networks\n"
    "Database Management\n"
    "TCP Congestion Control\n"
)


def log(event, **fields):
    """One structured line per event. Never logs image bytes or recognised text."""
    parts = [f"[ocr] {event}"]
    for k, v in fields.items():
        parts.append(f"{k}={v}")
    print(" ".join(parts), file=sys.stderr, flush=True)


# ---------------------------------------------------------------------------
# Engine — built once, reused. Two implementations behind one interface.
# ---------------------------------------------------------------------------

class OcrError(Exception):
    """Raised with a stable machine code so the Node adapter can branch cleanly."""

    def __init__(self, code, message):
        super().__init__(message)
        self.code = code
        self.message = message


def _normalise(lines):
    """lines: [(text, score)] -> the normalised response payload (text + mean score)."""
    clean = [(str(t).strip(), float(s)) for (t, s) in lines if str(t).strip() != ""]
    text = "\n".join(t for (t, _) in clean)
    confidence = round(sum(s for (_, s) in clean) / len(clean), 4) if clean else 0.0
    return {
        "text": text,
        "confidence": confidence,
        "lineCount": len(clean),
        "lines": [{"text": t, "score": round(s, 4)} for (t, s) in clean],
    }


class StubEngine:
    """Deterministic, paddle-free. Honours an optional `stubText` so tests can drive
    retrieval with known tokens; otherwise returns a fixed fixture string."""

    kind = "stub"
    available = True
    version = None

    def warmup(self):
        return True

    def image_bytes(self, _data, stub_text=None):
        text = (stub_text or DEFAULT_STUB_TEXT).strip()
        lines = [(ln.strip(), 0.95) for ln in text.splitlines() if ln.strip()]
        return _normalise(lines)


class PaddleEngine:
    """Real local PaddleOCR. Lazily constructs the model on first use and reuses it.
    Tolerant of both the 3.x (.predict) and 2.x (.ocr) APIs and result shapes."""

    kind = "paddle"

    def __init__(self, lang):
        self._lang = lang
        self._engine = None
        self._lock = threading.Lock()
        self._mode = None  # "predict" (3.x) or "ocr" (2.x), decided at build time
        self.version = None
        try:
            import paddleocr  # noqa: F401
            self.version = getattr(paddleocr, "__version__", None)
            self.available = True
        except Exception as exc:  # import failure must not crash the process
            self.available = False
            self._import_error = str(exc)

    def _build(self):
        """Construct the PaddleOCR engine once. Kept behind a lock so two concurrent
        first-requests cannot both pay the model-load cost."""
        from paddleocr import PaddleOCR

        # Keep it light and fast: skip the doc-orientation / unwarping sub-models.
        # Newer (3.x) kwargs first; fall back progressively for older builds.
        attempts = [
            dict(lang=self._lang, use_doc_orientation_classify=False,
                 use_doc_unwarping=False, use_textline_orientation=False),
            dict(lang=self._lang, use_angle_cls=False, show_log=False),
            dict(lang=self._lang),
            dict(),
        ]
        last = None
        for kwargs in attempts:
            try:
                engine = PaddleOCR(**kwargs)
                self._mode = "predict" if hasattr(engine, "predict") else "ocr"
                return engine
            except (TypeError, ValueError) as exc:
                last = exc
                continue
        raise OcrError("engine_init_failed", f"PaddleOCR init failed: {last}")

    def warmup(self):
        if not self.available:
            return False
        with self._lock:
            if self._engine is None:
                t0 = time.time()
                self._engine = self._build()
                log("engine_ready", engine="paddle", mode=self._mode,
                    load_ms=int((time.time() - t0) * 1000))
        return True

    def _decode_to_ndarray(self, data):
        """Bytes -> RGB numpy array (PaddleOCR accepts a path or an ndarray)."""
        import io
        import numpy as np
        from PIL import Image

        try:
            img = Image.open(io.BytesIO(data))
            img.load()
        except Exception as exc:
            raise OcrError("bad_image", f"Could not decode image: {exc}")
        if img.mode != "RGB":
            img = img.convert("RGB")
        return np.asarray(img)

    def _parse_result(self, result):
        """Flatten either API's result into [(text, score)]."""
        lines = []
        if result is None:
            return lines

        # 3.x .predict(): iterable of dict-like OCRResult with rec_texts/rec_scores.
        if self._mode == "predict":
            for res in result:
                texts = None
                scores = None
                # OCRResult behaves like a dict; be defensive about access style.
                for getter in (
                    lambda r: (r["rec_texts"], r.get("rec_scores")),
                    lambda r: (r.get("rec_texts"), r.get("rec_scores")),
                    lambda r: (r["res"]["rec_texts"], r["res"].get("rec_scores")),
                ):
                    try:
                        texts, scores = getter(res)
                        if texts is not None:
                            break
                    except Exception:
                        continue
                if not texts:
                    continue
                scores = scores or [1.0] * len(texts)
                for i, t in enumerate(texts):
                    lines.append((t, scores[i] if i < len(scores) else 1.0))
            return lines

        # 2.x .ocr(): [[ [box, (text, score)], ... ]] (outer list is per-image).
        for page in result:
            if not page:
                continue
            for item in page:
                try:
                    _box, (text, score) = item
                    lines.append((text, score))
                except Exception:
                    # Some builds return [box, text, score] or a dict — handle loosely.
                    if isinstance(item, dict) and "text" in item:
                        lines.append((item.get("text"), item.get("score", 1.0)))
        return lines

    def _run(self, ndarray):
        engine = self._engine
        if self._mode == "predict":
            try:
                return engine.predict(ndarray)
            except Exception as exc:
                # Some 3.x builds still expose .ocr; try it before giving up.
                if hasattr(engine, "ocr"):
                    self._mode = "ocr"
                    return engine.ocr(ndarray)
                raise OcrError("ocr_failed", f"predict failed: {exc}")
        try:
            try:
                return engine.ocr(ndarray, cls=False)
            except TypeError:
                return engine.ocr(ndarray)
        except Exception as exc:
            raise OcrError("ocr_failed", f"ocr failed: {exc}")

    def image_bytes(self, data, stub_text=None):  # stub_text ignored by the real engine
        if not self.available:
            raise OcrError("ocr_unavailable", getattr(self, "_import_error", "paddleocr not importable"))
        self.warmup()
        ndarray = self._decode_to_ndarray(data)
        result = self._run(ndarray)
        return _normalise(self._parse_result(result))


# One engine per process.
_ENGINE = None
_ENGINE_LOCK = threading.Lock()


def get_engine():
    global _ENGINE
    if _ENGINE is None:
        with _ENGINE_LOCK:
            if _ENGINE is None:
                _ENGINE = StubEngine() if ENGINE_KIND == "stub" else PaddleEngine(LANG)
    return _ENGINE


def render_pdf_pages(pdf_bytes, dpi, max_pages):
    """Render PDF pages to PNG bytes with pypdfium2 (present in .venv-ocr). Returns
    [(pageNumber, png_bytes)]. Raises OcrError('pdf_unsupported') if no renderer."""
    try:
        import pypdfium2 as pdfium
    except Exception:
        raise OcrError("pdf_unsupported", "No local PDF renderer (pypdfium2) is installed.")
    try:
        pdf = pdfium.PdfDocument(pdf_bytes)
    except Exception as exc:
        raise OcrError("bad_pdf", f"Could not open PDF: {exc}")
    scale = max(0.5, float(dpi) / 72.0)
    out = []
    n = min(len(pdf), max_pages)
    for i in range(n):
        page = pdf[i]
        bitmap = page.render(scale=scale)
        pil = bitmap.to_pil()
        import io
        buf = io.BytesIO()
        pil.save(buf, format="PNG")
        out.append((i + 1, buf.getvalue()))
    return out


# ---------------------------------------------------------------------------
# HTTP layer (stdlib only)
# ---------------------------------------------------------------------------

class Handler(BaseHTTPRequestHandler):
    server_version = "NexoraOCR/1.0"
    protocol_version = "HTTP/1.1"

    def log_message(self, *_args):
        pass  # our own structured log() is the only output; silence the default spam.

    def _send(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self, limit):
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            raise OcrError("empty_body", "Request body was empty.")
        if length > limit:
            raise OcrError("too_large", f"Body {length} exceeds limit {limit}.")
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception as exc:
            raise OcrError("bad_json", f"Invalid JSON body: {exc}")

    @staticmethod
    def _decode_b64(field, value, limit):
        if not isinstance(value, str) or value == "":
            raise OcrError("missing_field", f"Field '{field}' is required.")
        try:
            data = base64.b64decode(value, validate=False)
        except (binascii.Error, ValueError) as exc:
            raise OcrError("bad_base64", f"Field '{field}' is not valid base64: {exc}")
        if len(data) > limit:
            raise OcrError("too_large", f"Decoded '{field}' ({len(data)} bytes) exceeds limit {limit}.")
        return data

    def do_GET(self):
        if self.path.split("?")[0] != "/health":
            return self._send(404, {"ok": False, "code": "not_found"})
        engine = get_engine()
        self._send(200, {
            "status": "ok",
            "engine": engine.kind,
            "available": bool(getattr(engine, "available", False)),
            "lang": LANG,
            "paddleocrVersion": getattr(engine, "version", None),
        })

    def do_POST(self):
        route = self.path.split("?")[0]
        try:
            if route == "/ocr/image":
                return self._handle_image()
            if route == "/ocr/pdf":
                return self._handle_pdf()
            return self._send(404, {"ok": False, "code": "not_found"})
        except OcrError as err:
            log("request_failed", route=route, code=err.code)
            status = 503 if err.code in ("ocr_unavailable", "pdf_unsupported") else 400
            return self._send(status, {"ok": False, "code": err.code, "message": err.message})
        except Exception as exc:  # never let a handler crash the process
            log("request_error", route=route, error=type(exc).__name__)
            return self._send(500, {"ok": False, "code": "internal_error", "message": str(exc)})

    def _handle_image(self):
        body = self._read_json(MAX_IMAGE_BYTES * 2)  # base64 inflates ~4/3; allow headroom
        data = self._decode_b64("imageBase64", body.get("imageBase64"), MAX_IMAGE_BYTES)
        page_no = body.get("pageNumber")
        engine = get_engine()
        t0 = time.time()
        result = engine.image_bytes(data, stub_text=body.get("stubText"))
        dur = int((time.time() - t0) * 1000)
        log("page_ocr_completed", page=page_no, lines=result["lineCount"],
            confidence=result["confidence"], ms=dur, engine=engine.kind)
        result.update({"ok": True, "engine": engine.kind, "durationMs": dur})
        return self._send(200, result)

    def _handle_pdf(self):
        body = self._read_json(MAX_IMAGE_BYTES * MAX_PDF_PAGES)
        pdf_bytes = self._decode_b64("pdfBase64", body.get("pdfBase64"), MAX_IMAGE_BYTES * MAX_PDF_PAGES)
        dpi = int(body.get("dpi") or DEFAULT_DPI)
        max_pages = min(int(body.get("maxPages") or MAX_PDF_PAGES), MAX_PDF_PAGES)
        engine = get_engine()
        t0 = time.time()
        pages_out = []
        for (page_no, png) in render_pdf_pages(pdf_bytes, dpi, max_pages):
            res = engine.image_bytes(png)
            pages_out.append({"page": page_no, **res})
        dur = int((time.time() - t0) * 1000)
        log("pdf_ocr_completed", pages=len(pages_out), ms=dur, engine=engine.kind)
        return self._send(200, {"ok": True, "engine": engine.kind, "pageCount": len(pages_out),
                                "pages": pages_out, "durationMs": dur})


def main():
    engine = get_engine()  # constructs the engine object (does NOT load the model yet)
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    log("service_started", host=HOST, port=PORT, engine=engine.kind,
        available=bool(getattr(engine, "available", False)), lang=LANG)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
        log("service_stopped")


if __name__ == "__main__":
    main()



