#!/usr/bin/env python3
"""Download CC BY OpenStax textbooks (not BY-NC-SA live editions)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ingest_lib import (  # noqa: E402
    COLLECTED,
    COURSES,
    attribution_block,
    extract_objectives,
    fetch_text,
    html_to_markdown,
    minutes_from_words,
    soup,
    word_count,
    write_course_package,
)

SKIP_SLUG = re.compile(
    r"-(key-terms|chapter-review|review-questions|critical-thinking-questions|"
    r"interactive-link-questions|solution|index|preface)$"
)

BOOKS = [
    {
        "slug": "course-010-anatomy-physiology",
        "course_id": "openstax-anatomy-physiology",
        "book": "anatomy-and-physiology",
        "intro": "https://openstax.org/books/anatomy-and-physiology/pages/1-introduction",
        "title": "Anatomy and Physiology",
        "provider": "OpenStax / Rice University",
        "category": "Medical / Healthcare",
        "subcategory": "Anatomy and Physiology",
        "level": "Beginner",
        "competencies": ["Human Anatomy", "Human Physiology", "Biomedical Engineering"],
        "topics": ["cells", "tissues", "organ systems", "homeostasis"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
    },
    {
        "slug": "course-014-college-physics",
        "course_id": "openstax-college-physics",
        "book": "college-physics",
        "intro": "https://openstax.org/books/college-physics/pages/1-introduction-to-science-and-the-realm-of-physics-physical-quantities-and-units",
        "title": "College Physics",
        "provider": "OpenStax / Rice University",
        "category": "Technology",
        "subcategory": "Physics",
        "level": "Beginner",
        "competencies": ["Physics", "Engineering Fundamentals", "Mechanics"],
        "topics": ["kinematics", "Newton's laws", "energy", "electricity"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
    },
    {
        "slug": "course-015-biology",
        "course_id": "openstax-biology",
        "book": "biology",
        "intro": "https://openstax.org/books/biology/pages/1-introduction",
        "title": "Biology",
        "provider": "OpenStax / Rice University",
        "category": "Technology",
        "subcategory": "Biology",
        "level": "Beginner",
        "competencies": ["Biology", "Bioinformatics", "Cell Biology"],
        "topics": ["cells", "genetics", "evolution", "physiology"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
    },
    {
        "slug": "course-016-college-algebra",
        "course_id": "openstax-college-algebra",
        "book": "college-algebra",
        "intro": "https://openstax.org/books/college-algebra/pages/1-introduction-to-prerequisites",
        "title": "College Algebra",
        "provider": "OpenStax / Rice University",
        "category": "Technology",
        "subcategory": "Mathematics",
        "level": "Beginner",
        "competencies": ["Mathematics", "Algebra", "Engineering Fundamentals"],
        "topics": ["functions", "equations", "polynomials", "exponentials"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
    },
    {
        "slug": "course-017-precalculus",
        "course_id": "openstax-precalculus",
        "book": "precalculus",
        "intro": "https://openstax.org/books/precalculus/pages/1-introduction-to-functions",
        "title": "Precalculus",
        "provider": "OpenStax / Rice University",
        "category": "Technology",
        "subcategory": "Mathematics",
        "level": "Beginner",
        "competencies": ["Mathematics", "Precalculus", "Engineering Fundamentals"],
        "topics": ["functions", "trigonometry", "analytic geometry"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
    },
    {
        "slug": "course-018-algebra-trigonometry",
        "course_id": "openstax-algebra-trigonometry",
        "book": "algebra-and-trigonometry",
        "intro": "https://openstax.org/books/algebra-and-trigonometry/pages/1-introduction-to-prerequisites",
        "title": "Algebra and Trigonometry",
        "provider": "OpenStax / Rice University",
        "category": "Technology",
        "subcategory": "Mathematics",
        "level": "Beginner",
        "competencies": ["Mathematics", "Trigonometry", "Algebra"],
        "topics": ["algebra", "trig identities", "functions"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
    },
    {
        "slug": "course-019-introductory-statistics",
        "course_id": "openstax-introductory-statistics",
        "book": "introductory-statistics",
        "intro": "https://openstax.org/books/introductory-statistics/pages/1-introduction",
        "title": "Introductory Statistics",
        "provider": "OpenStax / Rice University",
        "category": "Technology",
        "subcategory": "Statistics",
        "level": "Beginner",
        "competencies": ["Statistics", "Data Science", "Probability"],
        "topics": ["descriptive statistics", "probability", "inference"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
    },
    {
        "slug": "course-020-physics",
        "course_id": "openstax-physics",
        "book": "physics",
        "intro": "https://openstax.org/books/physics/pages/1-introduction",
        "title": "Physics",
        "provider": "OpenStax / Rice University",
        "category": "Technology",
        "subcategory": "Physics",
        "level": "Beginner",
        "competencies": ["Physics", "Engineering Fundamentals", "Mechanics"],
        "topics": ["motion", "forces", "energy", "waves"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
    },
    {
        "slug": "course-021-statistics",
        "course_id": "openstax-statistics",
        "book": "statistics",
        "intro": "https://openstax.org/books/statistics/pages/1-introduction",
        "title": "Statistics",
        "provider": "OpenStax / Rice University",
        "category": "Technology",
        "subcategory": "Statistics",
        "level": "Beginner",
        "competencies": ["Statistics", "Data Science", "Data Analysis"],
        "topics": ["sampling", "regression", "hypothesis testing"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
    },
]


def page_slugs(html: str, book: str) -> list[str]:
    raw = re.findall(rf'"(?:/books/{re.escape(book)}/pages/)?([0-9]+(?:-[0-9]+)?-[a-z][a-z0-9-]{{3,}})"', html)
    ordered = []
    seen = set()
    for s in raw:
        if s in seen or SKIP_SLUG.search("-" + s if False else s):
            if SKIP_SLUG.search(s):
                continue
        if s in seen:
            continue
        if re.match(r"^\d{4}-", s) or re.match(r"^[0-9a-f]{8}-", s):
            continue
        seen.add(s)
        ordered.append(s)
    return ordered


def group_by_chapter(slugs: list[str]) -> list[tuple[str, list[str]]]:
    groups: dict[str, list[str]] = {}
    order: list[str] = []
    for s in slugs:
        m = re.match(r"^(\d+)-", s)
        ch = m.group(1) if m else "0"
        if ch not in groups:
            groups[ch] = []
            order.append(ch)
        groups[ch].append(s)
    return [(ch, groups[ch]) for ch in order]


def ingest_book(defn: dict) -> None:
    dest = COURSES / defn["slug"]
    print("START", defn["slug"], flush=True)
    if (dest / "course.json").exists():
        print("EXISTS", defn["slug"], flush=True)
        return
    html = fetch_text(defn["intro"], timeout=35)
    slugs = page_slugs(html, defn["book"])
    if len(slugs) < 6:
        print("FAIL few slugs", defn["slug"], len(slugs))
        return
    groups = group_by_chapter(slugs)[:10]
    modules_payload = []
    lesson_n = 0
    max_lessons = 32
    for pi, (ch, ch_slugs) in enumerate(groups, start=1):
        lessons = []
        for s in ch_slugs:
            if lesson_n >= max_lessons:
                break
            url = f"https://openstax.org/books/{defn['book']}/pages/{s}"
            try:
                page = fetch_text(url, timeout=30)
            except Exception as exc:  # noqa: BLE001
                print("  skip", s, exc)
                continue
            doc = soup(page)
            main = doc.select_one("#main-content") or doc.select_one("[data-type='page']")
            if not main:
                continue
            for bad in main.select("nav, script, style, .os-teacher, [data-type='note'] .os-solution"):
                bad.decompose()
            title_el = main.find(["h1", "h2"])
            title = title_el.get_text(" ", strip=True) if title_el else s.replace("-", " ").title()
            md_body = html_to_markdown(str(main))
            wc = word_count(md_body)
            if wc < 150:
                continue
            li = len(lessons) + 1
            rel = f"content/module-{pi:02d}/lesson-{li:02d}.md"
            path = dest / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            header = attribution_block(defn["title"], defn["provider"], url, defn["license"])
            path.write_text(f"# {title}\n\n{header}{md_body}\n", encoding="utf-8")
            lesson_n += 1
            lessons.append(
                {
                    "id": f"{defn['course_id']}-m{pi:02d}-l{li:02d}",
                    "title": title,
                    "type": "text",
                    "content_file": rel,
                    "minutes": minutes_from_words(wc, floor=15),
                    "objectives": extract_objectives(md_body),
                    "excerpt": md_body[:1200],
                }
            )
        if lessons:
            first = lessons[0]["title"]
            modules_payload.append(
                {
                    "id": f"{defn['course_id']}-m{pi:02d}",
                    "title": f"Chapter {ch}: {first}",
                    "lessons": lessons,
                }
            )
        if lesson_n >= max_lessons:
            break
    if not modules_payload:
        print("FAIL empty", defn["slug"])
        return
    course = {
        "course_id": defn["course_id"],
        "title": defn["title"],
        "provider": defn["provider"],
        "category": defn["category"],
        "subcategory": defn["subcategory"],
        "level": defn["level"],
        "description": (
            f"OpenStax {defn['title']} (CC BY 4.0). "
            "Section HTML was downloaded from the official OpenStax webview."
        ),
        "competencies": defn["competencies"],
        "topics": defn["topics"],
        "source": {
            "name": "OpenStax",
            "official_url": defn["intro"],
            "license": defn["license"],
            "license_url": defn["license_url"],
        },
        "language": "en",
        "format": "self-paced",
    }
    source_info = {
        "course_id": defn["course_id"],
        "provider": defn["provider"],
        "source_url": defn["intro"],
        "license": defn["license"],
        "license_url": defn["license_url"],
        "date_collected": COLLECTED,
        "reuse_permissions": "CC BY 4.0 permits copy, redistribute, remix with attribution.",
        "changes_made": [
            "Downloaded OpenStax section HTML and converted to Markdown",
            "Grouped numbered chapters as modules",
            "Omitted key-terms and end-of-chapter review pages",
            "Added Nexora-generated practice questions grounded in section text",
        ],
        "notes": "Do not use the OpenStax name or logo to imply endorsement.",
    }
    write_course_package(dest, course, modules_payload, source_info)


def main():
    COURSES.mkdir(parents=True, exist_ok=True)
    for defn in BOOKS:
        try:
            ingest_book(defn)
        except Exception as exc:  # noqa: BLE001
            print("ERROR", defn["slug"], exc)


if __name__ == "__main__":
    main()
