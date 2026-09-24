#!/usr/bin/env python3
"""
Generate the small, deterministic OCR fixtures used by scripts/ocr-real-test.mjs.

Why these are committed, pre-rendered files
-------------------------------------------
The real-inference test needs an image (and a scanned-style PDF) whose recognised
text is stable. If the test rendered text at run time, the glyphs — and therefore
what PaddleOCR reads — would depend on whichever font happens to be installed on
the operator's machine. By freezing the fixtures as small PNG/PDF bitmaps here,
the real test reads the SAME pixels everywhere, so its token assertions are
reproducible on any Mac.

Both fixtures are image-only (no selectable text layer) — i.e. exactly what a
scan or photograph of a page looks like — which is the whole point of OCR. The
tokens are drawn large and high-contrast so recognition is reliable, and they are
the spec's fixture vocabulary (NEXORA AI, Artificial Intelligence, Machine
Learning, Neural Networks, Database Management, TCP Congestion Control,
Competency Based Learning) so the same words can be searched for downstream.

    python3 scripts/make-ocr-fixtures.py            # writes tests/fixtures/ocr/*
    python3 scripts/make-ocr-fixtures.py --check     # just verify they load

Kept tiny and dependency-light: PIL only (it ships inside the .venv-ocr that
PaddleOCR itself needs, so no extra install).
"""

import os
import re
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT_DIR = os.path.join(REPO, "tests", "fixtures", "ocr")

PNG_PATH = os.path.join(OUT_DIR, "sample-scan.png")
PDF_PATH = os.path.join(OUT_DIR, "sample-scan.pdf")

# Distinct, high-contrast pages. Every required fixture token appears at least once.
PNG_LINES = [
    "NEXORA AI",
    "Artificial Intelligence",
    "Machine Learning",
    "Neural Networks",
]
PDF_PAGE_1 = [
    "NEXORA AI",
    "Database Management",
    "TCP Congestion Control",
]
PDF_PAGE_2 = [
    "Competency Based Learning",
    "Neural Networks",
    "Machine Learning",
]

# Candidate sans-serif fonts across macOS (operator) and Linux (CI). First hit wins;
# a clean TrueType/OpenType face makes recognition far more reliable than PIL's tiny
# built-in bitmap font.
FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf",
]


def load_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()  # last resort; recognition will be weaker


def render_page(lines, width=1000, font_size=52, margin=70, line_gap=44):
    """A white page with black, generously spaced lines — a clean 'scanned' look."""
    font = load_font(font_size)
    # Measure line heights so the page is sized to its content (deterministic).
    probe = Image.new("RGB", (width, 10), "white")
    draw = ImageDraw.Draw(probe)
    heights = []
    for line in lines:
        box = draw.textbbox((0, 0), line, font=font)
        heights.append(box[3] - box[1])
    total = margin * 2 + sum(heights) + line_gap * (len(lines) - 1)
    img = Image.new("RGB", (width, total), "white")
    draw = ImageDraw.Draw(img)
    y = margin
    for line, h in zip(lines, heights):
        draw.text((margin, y), line, fill="black", font=font)
        y += h + line_gap
    return img


def _freeze_pdf_dates(path):
    """PIL stamps the current time into /CreationDate and /ModDate, which would make the
    committed fixture churn on every regenerate. Replace both with one fixed timestamp of
    identical length, so byte offsets (and the xref table) stay valid and the file is
    byte-for-byte reproducible."""
    with open(path, "rb") as fh:
        data = fh.read()
    frozen = re.sub(rb"D:\d{14}Z", b"D:20240101000000Z", data)
    if frozen != data:
        with open(path, "wb") as fh:
            fh.write(frozen)


def build():
    os.makedirs(OUT_DIR, exist_ok=True)
    render_page(PNG_LINES).save(PNG_PATH, format="PNG", optimize=True)
    p1 = render_page(PDF_PAGE_1)
    p2 = render_page(PDF_PAGE_2)
    # Image-only, multi-page PDF == a scan. No text layer, so OCR is the only way in.
    p1.save(PDF_PATH, format="PDF", save_all=True, append_images=[p2], resolution=150.0)
    _freeze_pdf_dates(PDF_PATH)
    print(f"[fixtures] wrote {os.path.relpath(PNG_PATH, REPO)} ({os.path.getsize(PNG_PATH)} bytes)")
    print(f"[fixtures] wrote {os.path.relpath(PDF_PATH, REPO)} ({os.path.getsize(PDF_PATH)} bytes)")


def check():
    ok = True
    # PNG: PIL can verify it directly.
    if os.path.exists(PNG_PATH):
        try:
            Image.open(PNG_PATH).verify()
            print(f"[fixtures] ok {os.path.relpath(PNG_PATH, REPO)} ({os.path.getsize(PNG_PATH)} bytes)")
        except Exception as exc:
            print(f"[fixtures] CORRUPT {PNG_PATH}: {exc}")
            ok = False
    else:
        print(f"[fixtures] MISSING {PNG_PATH}")
        ok = False
    # PDF: PIL cannot read PDFs back; verify via pypdfium2 if present, else the %PDF magic.
    if os.path.exists(PDF_PATH):
        try:
            import pypdfium2 as pdfium
            pages = len(pdfium.PdfDocument(open(PDF_PATH, "rb").read()))
            print(f"[fixtures] ok {os.path.relpath(PDF_PATH, REPO)} ({os.path.getsize(PDF_PATH)} bytes, {pages} pages)")
        except ImportError:
            head = open(PDF_PATH, "rb").read(5)
            if head == b"%PDF-":
                print(f"[fixtures] ok {os.path.relpath(PDF_PATH, REPO)} ({os.path.getsize(PDF_PATH)} bytes, %PDF header)")
            else:
                print(f"[fixtures] CORRUPT {PDF_PATH}: not a PDF")
                ok = False
        except Exception as exc:
            print(f"[fixtures] CORRUPT {PDF_PATH}: {exc}")
            ok = False
    else:
        print(f"[fixtures] MISSING {PDF_PATH}")
        ok = False
    return ok


if __name__ == "__main__":
    if "--check" in sys.argv:
        sys.exit(0 if check() else 1)
    build()
