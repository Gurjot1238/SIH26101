#!/usr/bin/env python3
"""Shared helpers for Nexora genuine-course ingest."""
from __future__ import annotations

import json
import re
import ssl
import time
import urllib.error
import urllib.request
from datetime import date
from html import unescape
from pathlib import Path

import html2text
from bs4 import BeautifulSoup

CTX = ssl.create_default_context()
UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NexoraOERBot/1.0"
)
ROOT = Path("/workspace/Nexora-Course-Dataset")
COURSES = ROOT / "courses"
COLLECTED = date.today().isoformat()

H2T = html2text.HTML2Text()
H2T.body_width = 0
H2T.ignore_images = False
H2T.ignore_links = False
H2T.protect_links = True


def fetch_bytes(url: str, timeout: int = 20, retries: int = 2) -> bytes:
    last = None
    for attempt in range(retries):
        req = urllib.request.Request(
            url,
            headers={"User-Agent": UA, "Accept": "*/*"},
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=CTX) as resp:
                return resp.read()
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(0.8 * (attempt + 1))
    raise last  # type: ignore[misc]


def fetch_text(url: str, timeout: int = 30) -> str:
    return fetch_bytes(url, timeout=timeout).decode("utf-8", "replace")


def fetch_json(url: str, timeout: int = 30):
    return json.loads(fetch_text(url, timeout=timeout))


def html_to_markdown(html: str) -> str:
    md = H2T.handle(html or "")
    md = re.sub(r"\n{3,}", "\n\n", md).strip()
    return md + "\n"


def soup(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "lxml")


def clean_text(s: str) -> str:
    s = unescape(re.sub(r"<[^>]+>", " ", s or ""))
    return re.sub(r"\s+", " ", s).strip()


def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:80] or "item"


def word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text or ""))


def minutes_from_words(words: int, floor: int = 12) -> int:
    return max(floor, int(round(words / 180.0)))


def minutes_from_pdf_bytes(n: int) -> int:
    # Rough academic-note heuristic: ~40KB of lecture PDF ~ 10 minutes of study.
    est = max(20, int(n / 8000))
    return min(est, 80)


def attribution_block(title: str, provider: str, url: str, license_name: str) -> str:
    return (
        f"> Source: {title}. {provider}.\n"
        f"> Official URL: {url}\n"
        f"> License: {license_name}\n"
        f"> Reused without endorsement. Original copyright notices retained.\n\n"
    )


def write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def make_generated_mcqs(lesson_title: str, excerpt: str, competency: str, topic: str, n: int = 3) -> list[dict]:
    excerpt = re.sub(r"\s+", " ", excerpt or "").strip()
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", excerpt) if len(s.strip()) > 40]
    stem_src = sentences[0] if sentences else f"the core ideas in {lesson_title}"
    items = []
    templates = [
        (
            f"According to the source lesson '{lesson_title}', which statement is most accurate?",
            stem_src[:240],
            "This option restates a claim made in the lesson text.",
        ),
        (
            f"What is a reasonable learning takeaway from '{lesson_title}'?",
            f"Study the definitions, worked examples, and explanations presented in {lesson_title}.",
            "The lesson is built around those explanations rather than memorizing unrelated trivia.",
        ),
        (
            f"When applying concepts from '{lesson_title}', what should a learner do first?",
            "Identify the defined terms and follow the method shown in the source material.",
            "The source material introduces terms and methods before later applications.",
        ),
        (
            f"Which practice is inconsistent with '{lesson_title}'?",
            "Ignoring the defined terms and skipping the worked examples.",
            "The distractor is the inconsistent practice; the correct choice names that inconsistency.",
            True,
        ),
    ]
    for i, tpl in enumerate(templates[:n], start=1):
        if len(tpl) == 4:
            q, correct, expl, invert = tpl
            options = [
                correct,
                "Memorize unrelated brand names instead of the method.",
                "Skip checking units, assumptions, and defined terms.",
                "Treat missing data as if it were proven fact.",
            ]
            # question already asks for inconsistent practice
            correct_letter = "A"
        else:
            q, correct, expl = tpl
            options = [
                correct,
                "Ignore the source definitions and invent unrelated rules.",
                "Assume results without checking the worked examples.",
                "Replace the method with random trial and error.",
            ]
            correct_letter = "A"
        items.append(
            {
                "question_id": f"q{i:02d}",
                "question": q,
                "options": options,
                "correct_answer": correct_letter,
                "competency": competency,
                "topic": topic,
                "difficulty": "easy" if i == 1 else "medium",
                "explanation": expl,
                "generated_by": "Nexora AI",
            }
        )
    return items


def extract_objectives(text: str) -> list[str]:
    objs = []
    m = re.search(
        r"(?:learning objectives|objectives|by the end of this (?:section|chapter|lesson)[^\n]*)\n(.+?)(?:\n\n|\n# )",
        text,
        flags=re.I | re.S,
    )
    block = m.group(1) if m else ""
    for line in (block or text[:1500]).splitlines():
        line = line.strip(" -*\t")
        if 20 <= len(line) <= 220 and not line.lower().startswith("source:"):
            if line[:1].isupper() or line.startswith("Compare") or line.startswith("Describe"):
                objs.append(line.rstrip("."))
        if len(objs) >= 6:
            break
    return objs[:6]


def write_course_package(
    dest: Path,
    course: dict,
    modules_payload: list[dict],
    source_info: dict,
    readme_extra: str = "",
) -> dict:
    """modules_payload items: {id,title,competencies,lessons:[{id,title,type,relpath,minutes,objectives,text_for_quiz}]}"""
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "content").mkdir(exist_ok=True)
    (dest / "practice").mkdir(exist_ok=True)
    (dest / "source").mkdir(exist_ok=True)

    modules_meta = []
    total_minutes = 0
    total_lessons = 0
    total_qs = 0
    all_final_qs = []

    for mi, mod in enumerate(modules_payload, start=1):
        mod_id = mod["id"]
        practice_items = []
        lessons_meta = []
        for li, les in enumerate(mod["lessons"], start=1):
            total_lessons += 1
            total_minutes += int(les["minutes"])
            excerpt = les.get("excerpt") or ""
            qs = make_generated_mcqs(
                les["title"],
                excerpt,
                (course.get("competencies") or ["general"])[0],
                (course.get("topics") or ["general"])[0],
                n=3,
            )
            for q in qs:
                q["question_id"] = f"{les['id']}-{q['question_id']}"
            qpath = dest / "practice" / f"{les['id']}.json"
            write_json(qpath, {"lesson_id": les["id"], "questions": qs})
            practice_items.extend(qs)
            total_qs += len(qs)
            lessons_meta.append(
                {
                    "lesson_id": les["id"],
                    "title": les["title"],
                    "type": les["type"],
                    "content_file": les["content_file"],
                    "practice_file": f"practice/{les['id']}.json",
                    "estimated_minutes": int(les["minutes"]),
                    "objectives": les.get("objectives") or [],
                    "competencies": course.get("competencies", [])[:2],
                    "topics": course.get("topics", [])[:3],
                    "progress_unit": True,
                }
            )
        write_json(
            dest / "practice" / f"{mod_id}.json",
            {"module_id": mod_id, "questions": practice_items[:12]},
        )
        all_final_qs.extend(practice_items[:4])
        modules_meta.append(
            {
                "module_id": mod_id,
                "title": mod["title"],
                "competencies": course.get("competencies", []),
                "lessons": lessons_meta,
            }
        )

    hours = round(total_minutes / 60.0, 1)
    if hours < 1:
        hours = 1.0 if total_minutes >= 50 else round(max(total_minutes / 60.0, 0.5), 1)

    write_json(dest / "practice" / "final.json", {"course_id": course["course_id"], "questions": all_final_qs[:20]})

    course_out = {
        **course,
        "duration": {"estimated_hours": hours, "estimated_minutes": total_minutes},
        "totals": {
            "modules": len(modules_meta),
            "lessons": total_lessons,
            "practice_questions": total_qs,
        },
        "progress_model": {
            "unit": "lesson",
            "formula": "completed_lessons / total_lessons * 100",
        },
        "modules": modules_meta,
    }
    write_json(dest / "course.json", course_out)
    write_json(dest / "source" / "original-source-info.json", source_info)

    readme = f"""# {course['title']}

**Provider:** {course['provider']}
**Category:** {course['category']} / {course.get('subcategory', '')}
**Level:** {course.get('level', '')}
**Duration:** {hours} hours ({total_lessons} lessons, {len(modules_meta)} modules)
**License:** {course['source']['license']}
**Official source:** {course['source']['official_url']}

## Description

{course.get('description', '')}

## Competencies

{chr(10).join('- ' + c for c in course.get('competencies', []))}

## Progress

Each lesson is one completable unit. Percent complete = completed lessons / {total_lessons} × 100.

{readme_extra}
"""
    (dest / "README.md").write_text(readme, encoding="utf-8")
    print(
        f"OK {dest.name} lessons={total_lessons} modules={len(modules_meta)} "
        f"hours={hours} qs={total_qs}",
        flush=True,
    )
    return course_out
