#!/usr/bin/env python3
"""Download CC BY / CC BY-SA Pressbooks courses into Nexora packages."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ingest_lib import (  # noqa: E402
    COURSES,
    COLLECTED,
    attribution_block,
    extract_objectives,
    fetch_json,
    fetch_text,
    html_to_markdown,
    minutes_from_words,
    soup,
    word_count,
    write_course_package,
)

BOOKS = [
    {
        "base": "https://wtcs.pressbooks.pub/nursingfundamentals",
        "course_id": "wtcs-nursing-fundamentals-2e",
        "slug": "course-001-nursing-fundamentals",
        "category": "Medical / Healthcare",
        "subcategory": "Nursing",
        "level": "Beginner",
        "competencies": ["Nursing Fundamentals", "Healthcare Informatics", "Patient Safety"],
        "topics": ["scope of practice", "nursing process", "communication", "safety"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "provider": "Wisconsin Technical College System / Open RN",
    },
    {
        "base": "https://wtcs.pressbooks.pub/nursingskills",
        "course_id": "wtcs-nursing-skills-2e",
        "slug": "course-002-nursing-skills",
        "category": "Medical / Healthcare",
        "subcategory": "Clinical Skills",
        "level": "Beginner",
        "competencies": ["Clinical Nursing Skills", "Patient Safety", "Healthcare Informatics"],
        "topics": ["vital signs", "infection control", "medication administration"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "provider": "Wisconsin Technical College System / Open RN",
    },
    {
        "base": "https://wtcs.pressbooks.pub/pharmacology",
        "course_id": "wtcs-nursing-pharmacology",
        "slug": "course-003-nursing-pharmacology",
        "category": "Medical / Healthcare",
        "subcategory": "Pharmacology",
        "level": "Intermediate",
        "competencies": ["Pharmacology", "Patient Safety", "Nursing Fundamentals"],
        "topics": ["pharmacokinetics", "drug classes", "medication safety"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "provider": "Wisconsin Technical College System / Open RN",
    },
    {
        "base": "https://wtcs.pressbooks.pub/nursingmhcc",
        "course_id": "wtcs-nursing-mental-health",
        "slug": "course-004-nursing-mental-health",
        "category": "Medical / Healthcare",
        "subcategory": "Mental Health Nursing",
        "level": "Intermediate",
        "competencies": ["Psychiatric-Mental Health Nursing", "Public Health", "Patient Safety"],
        "topics": ["mental health", "community nursing", "therapeutic communication"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "provider": "Wisconsin Technical College System / Open RN",
    },
    {
        "base": "https://wtcs.pressbooks.pub/nursingmpc",
        "course_id": "wtcs-nursing-management",
        "slug": "course-005-nursing-management",
        "category": "Medical / Healthcare",
        "subcategory": "Nursing Leadership",
        "level": "Intermediate",
        "competencies": ["Healthcare Information Systems", "Nursing Leadership", "Patient Safety"],
        "topics": ["leadership", "delegation", "quality improvement"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "provider": "Wisconsin Technical College System / Open RN",
    },
    {
        "base": "https://wtcs.pressbooks.pub/nursingadvancedskills",
        "course_id": "wtcs-nursing-advanced-skills",
        "slug": "course-006-nursing-advanced-skills",
        "category": "Medical / Healthcare",
        "subcategory": "Clinical Skills",
        "level": "Intermediate",
        "competencies": ["Clinical Nursing Skills", "Patient Safety", "Biomedical Engineering"],
        "topics": ["advanced procedures", "infusion therapy", "airway management"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "provider": "Wisconsin Technical College System / Open RN",
    },
    {
        "base": "https://wtcs.pressbooks.pub/healthpromo",
        "course_id": "wtcs-nursing-health-promotion",
        "slug": "course-007-nursing-health-promotion",
        "category": "Medical / Healthcare",
        "subcategory": "Public Health",
        "level": "Beginner",
        "competencies": ["Public Health", "Health Promotion", "Digital Health"],
        "topics": ["health promotion", "prevention", "community assessment"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "provider": "Wisconsin Technical College System / Open RN",
    },
    {
        "base": "https://pressbooks.uwf.edu/medicalterminology",
        "course_id": "uwf-medical-terminology",
        "slug": "course-008-medical-terminology",
        "category": "Medical / Healthcare",
        "subcategory": "Medical Terminology",
        "level": "Beginner",
        "competencies": ["Medical Terminology", "Healthcare Informatics", "Anatomy"],
        "topics": ["word roots", "body systems", "clinical language"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "provider": "University of West Florida",
    },
    {
        "base": "https://uta.pressbooks.pub/anatomylab",
        "course_id": "uta-human-anatomy-lab",
        "slug": "course-009-human-anatomy-lab",
        "category": "Medical / Healthcare",
        "subcategory": "Anatomy",
        "level": "Beginner",
        "competencies": ["Human Anatomy", "Biomedical Engineering", "Clinical Skills"],
        "topics": ["anatomical language", "organ systems", "laboratory identification"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "provider": "University of Texas at Arlington",
    },
    {
        "base": "https://pressbooks.lib.vt.edu/aerodynamics",
        "course_id": "vt-aerodynamics-aircraft-performance",
        "slug": "course-011-aerodynamics",
        "category": "Technology",
        "subcategory": "Aerospace Engineering",
        "level": "Intermediate",
        "competencies": ["Aerospace Engineering", "Fluid Mechanics", "Aircraft Performance"],
        "topics": ["lift", "drag", "airfoils", "performance"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "provider": "Virginia Tech",
    },
    {
        "base": "https://iastate.pressbooks.pub/me270baughman",
        "course_id": "isu-mechanical-engineering-design",
        "slug": "course-012-mechanical-engineering-design",
        "category": "Technology",
        "subcategory": "Mechanical Engineering",
        "level": "Intermediate",
        "competencies": ["Mechanical Engineering", "Engineering Design", "System Design"],
        "topics": ["define", "measure", "analyze", "design process"],
        "license": "CC BY-SA 4.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
        "provider": "Iowa State University",
    },
    {
        "base": "https://openoregon.pressbooks.pub/blueprint",
        "course_id": "openoregon-basic-blueprint-reading",
        "slug": "course-013-basic-blueprint-reading",
        "category": "Technology",
        "subcategory": "Engineering Graphics",
        "level": "Beginner",
        "competencies": ["Engineering Graphics", "Manufacturing", "Technical Drawing"],
        "topics": ["views", "dimensions", "tolerances", "blueprints"],
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "provider": "Open Oregon Educational Resources",
    },
]

SKIP_TITLE = re.compile(
    r"glossary|references|index|answer key|acknowledg|preface|about (the|this)|versioning|suggested attribution",
    re.I,
)


def ingest_book(defn: dict) -> dict | None:
    print("START", defn["slug"], flush=True)
    toc = fetch_json(defn["base"] + "/wp-json/pressbooks/v2/toc", timeout=40)
    site = fetch_json(defn["base"] + "/wp-json/", timeout=20)
    title = site.get("name") or defn["course_id"]
    dest = COURSES / defn["slug"]
    if dest.exists() and (dest / "course.json").exists():
        print("EXISTS", defn["slug"], flush=True)
        return None

    modules_payload = []
    parts = toc.get("parts") or []
    lesson_n = 0
    max_lessons = 28
    for pi, part in enumerate(parts, start=1):
        chapters = part.get("chapters") or []
        lessons = []
        for ch in chapters:
            chtitle = ch.get("title") or ""
            if SKIP_TITLE.search(chtitle):
                continue
            if lesson_n >= max_lessons:
                break
            ch_id = ch.get("id")
            link = ch.get("link")
            md_body = ""
            if ch_id:
                try:
                    payload = fetch_json(
                        f"{defn['base']}/wp-json/pressbooks/v2/chapters/{ch_id}",
                        timeout=20,
                    )
                    rendered = ((payload.get("content") or {}).get("rendered")) or ""
                    md_body = html_to_markdown(rendered)
                except Exception as exc:  # noqa: BLE001
                    print("  skip api", chtitle, exc, flush=True)
            if word_count(md_body) < 120 and link:
                try:
                    html = fetch_text(link, timeout=20)
                    doc = soup(html)
                    main = (
                        doc.select_one(".type-chapter")
                        or doc.select_one(".chapter")
                        or doc.select_one("main")
                    )
                    if main:
                        for bad in main.select("nav, .nav, script, style, .sharedaddy, .toc"):
                            bad.decompose()
                        md_body = html_to_markdown(str(main))
                except Exception as exc:  # noqa: BLE001
                    print("  skip fetch", chtitle, exc, flush=True)
                    continue
            wc = word_count(md_body)
            if wc < 120:
                continue
            lesson_n += 1
            li = len(lessons) + 1
            rel = f"content/module-{pi:02d}/lesson-{li:02d}.md"
            path = dest / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            header = attribution_block(title, defn["provider"], defn["base"] + "/", defn["license"])
            path.write_text(f"# {chtitle}\n\n{header}{md_body}\n", encoding="utf-8")
            lessons.append(
                {
                    "id": f"{defn['course_id']}-m{pi:02d}-l{li:02d}",
                    "title": chtitle,
                    "type": "text",
                    "content_file": rel,
                    "minutes": minutes_from_words(wc),
                    "objectives": extract_objectives(md_body),
                    "excerpt": md_body[:1200],
                }
            )
        if lesson_n >= max_lessons:
            if lessons:
                modules_payload.append(
                    {
                        "id": f"{defn['course_id']}-m{pi:02d}",
                        "title": part.get("title") or f"Module {pi}",
                        "lessons": lessons,
                    }
                )
            break
        if lessons:
            modules_payload.append(
                {
                    "id": f"{defn['course_id']}-m{pi:02d}",
                    "title": part.get("title") or f"Module {pi}",
                    "lessons": lessons,
                }
            )

    if not modules_payload:
        print("FAIL empty", defn["slug"])
        return None

    course = {
        "course_id": defn["course_id"],
        "title": title,
        "provider": defn["provider"],
        "category": defn["category"],
        "subcategory": defn["subcategory"],
        "level": defn["level"],
        "description": (
            f"Open textbook / course '{title}' from {defn['provider']}. "
            "Chapters were downloaded from the openly licensed Pressbooks edition."
        ),
        "competencies": defn["competencies"],
        "topics": defn["topics"],
        "source": {
            "name": defn["provider"],
            "official_url": defn["base"] + "/",
            "license": defn["license"],
            "license_url": defn["license_url"],
        },
        "language": "en",
        "format": "self-paced",
    }
    source_info = {
        "course_id": defn["course_id"],
        "provider": defn["provider"],
        "source_url": defn["base"] + "/",
        "license": defn["license"],
        "license_url": defn["license_url"],
        "date_collected": COLLECTED,
        "reuse_permissions": f"{defn['license']} permits copy and redistribution with attribution.",
        "changes_made": [
            "Downloaded Pressbooks chapter HTML and converted to Markdown lessons",
            "Grouped original book parts as modules",
            "Added Nexora-generated practice questions grounded in chapter text",
            "Omitted glossary/preface/index pages",
        ],
    }
    return write_course_package(dest, course, modules_payload, source_info)


def main():
    COURSES.mkdir(parents=True, exist_ok=True)
    for defn in BOOKS:
        try:
            ingest_book(defn)
        except Exception as exc:  # noqa: BLE001
            print("ERROR", defn["slug"], exc)


if __name__ == "__main__":
    main()
