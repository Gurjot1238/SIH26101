#!/usr/bin/env python3
"""Build catalog files and validate the Nexora course dataset."""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path("/workspace/Nexora-Course-Dataset")
COURSES_DIR = ROOT / "courses"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def slug_id(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def main() -> int:
    course_dirs = sorted(p for p in COURSES_DIR.iterdir() if p.is_dir() and (p / "course.json").exists())
    courses = []
    errors = []
    competencies = {}
    topics = {}
    sources = []
    lesson_ids = set()
    course_ids = set()
    totals = defaultdict(int)
    files_exist_ok = 0
    files_missing = 0

    for d in course_dirs:
        course = load_json(d / "course.json")
        cid = course.get("course_id")
        if not cid:
            errors.append(f"{d.name}: missing course_id")
            continue
        if cid in course_ids:
            errors.append(f"duplicate course_id {cid}")
        course_ids.add(cid)
        cat = course.get("category") or ""
        hours = (course.get("duration") or {}).get("estimated_hours") or 0
        src = course.get("source") or {}
        if hours < 1:
            errors.append(f"{cid}: estimated_hours {hours} < 1")
        if not src.get("official_url"):
            errors.append(f"{cid}: missing official_url")
        if not src.get("license"):
            errors.append(f"{cid}: missing license")
        for cname in course.get("competencies") or []:
            competencies.setdefault(slug_id(cname), {"id": slug_id(cname), "name": cname, "courses": []})
            if cid not in competencies[slug_id(cname)]["courses"]:
                competencies[slug_id(cname)]["courses"].append(cid)
        for tname in course.get("topics") or []:
            topics.setdefault(slug_id(tname), {"id": slug_id(tname), "name": tname, "courses": []})
            if cid not in topics[slug_id(tname)]["courses"]:
                topics[slug_id(tname)]["courses"].append(cid)
        n_mod = 0
        n_les = 0
        n_q = 0
        for mod in course.get("modules") or []:
            n_mod += 1
            mid = mod.get("module_id")
            if not mid:
                errors.append(f"{cid}: module missing id")
            for les in mod.get("lessons") or []:
                n_les += 1
                lid = les.get("lesson_id")
                if not lid:
                    errors.append(f"{cid}: lesson missing id")
                elif lid in lesson_ids:
                    errors.append(f"duplicate lesson_id {lid}")
                else:
                    lesson_ids.add(lid)
                cf = les.get("content_file")
                if not cf:
                    errors.append(f"{lid}: missing content_file")
                else:
                    fp = d / cf
                    if fp.exists() and fp.stat().st_size > 0:
                        files_exist_ok += 1
                    else:
                        files_missing += 1
                        errors.append(f"{lid}: missing file {cf}")
                pf = les.get("practice_file")
                if pf:
                    pp = d / pf
                    if pp.exists():
                        try:
                            n_q += len(load_json(pp).get("questions") or [])
                        except Exception:
                            errors.append(f"{lid}: bad practice json")
                    else:
                        errors.append(f"{lid}: missing practice {pf}")
        totals["modules"] += n_mod
        totals["lessons"] += n_les
        totals["questions"] += n_q
        totals["hours"] += hours
        is_med = "medical" in cat.lower() or "health" in cat.lower()
        if is_med:
            totals["medical"] += 1
        else:
            totals["technology"] += 1
        courses.append(
            {
                "course_id": cid,
                "slug": d.name,
                "title": course.get("title"),
                "provider": course.get("provider"),
                "category": cat,
                "subcategory": course.get("subcategory"),
                "level": course.get("level"),
                "estimated_hours": hours,
                "license": src.get("license"),
                "official_url": src.get("official_url"),
                "path": f"courses/{d.name}/",
                "totals": course.get("totals"),
                "competencies": course.get("competencies"),
                "topics": course.get("topics"),
            }
        )
        sources.append(
            {
                "course_id": cid,
                "provider": course.get("provider"),
                "official_url": src.get("official_url"),
                "license": src.get("license"),
                "license_url": src.get("license_url"),
                "name": src.get("name"),
            }
        )

    totals["courses"] = len(courses)
    totals["downloaded_files"] = files_exist_ok
    report = {
        "total_courses": totals["courses"],
        "technology_courses": totals["technology"],
        "medical_courses": totals["medical"],
        "courses_with_downloaded_content": totals["courses"],
        "courses_with_external_only_content": 0,
        "total_modules": totals["modules"],
        "total_lessons": totals["lessons"],
        "total_downloaded_files": files_exist_ok,
        "missing_content_files": files_missing,
        "total_practice_questions": totals["questions"],
        "total_estimated_learning_hours": round(totals["hours"], 1),
        "competencies": sorted(competencies),
        "topics": sorted(topics),
        "validation_errors": errors,
        "valid": len(errors) == 0
        and totals["courses"] >= 50
        and totals["technology"] >= 40
        and totals["medical"] >= 10
        and files_missing == 0,
    }
    (ROOT / "courses.json").write_text(json.dumps(courses, indent=2) + "\n", encoding="utf-8")
    (ROOT / "competencies.json").write_text(json.dumps(list(competencies.values()), indent=2) + "\n", encoding="utf-8")
    (ROOT / "topics.json").write_text(json.dumps(list(topics.values()), indent=2) + "\n", encoding="utf-8")
    (ROOT / "sources.json").write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")
    (ROOT / "dataset-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Nexora Genuine Course Content Dataset",
        "",
        "Standalone dataset of real university/OER courses with downloaded lesson files.",
        "Progress is lesson-based: `completed_lessons / total_lessons * 100`.",
        "",
        f"- Total courses: {totals['courses']}",
        f"- Technology / Engineering: {totals['technology']}",
        f"- Medical / Healthcare: {totals['medical']}",
        f"- Modules: {totals['modules']}",
        f"- Lessons: {totals['lessons']}",
        f"- Downloaded content files: {files_exist_ok}",
        f"- Practice questions: {totals['questions']}",
        f"- Estimated learning hours: {round(totals['hours'], 1)}",
        "",
        "## License notes",
        "",
        "- OpenStax 1e science/math books: CC BY 4.0",
        "- Open RN / Pressbooks nursing texts: CC BY 4.0",
        "- MIT OpenCourseWare lecture PDFs: CC BY-NC-SA 4.0 (non-commercial, share-alike)",
        "- OpenIntro Statistics: CC BY-SA 3.0",
        "- Python for Everybody: CC BY 4.0",
        "",
        "Do not imply endorsement by MIT, OpenStax, Open RN, or other providers.",
        "",
        "## Courses",
        "",
    ]
    for c in courses:
        t = c.get("totals") or {}
        lines.extend(
            [
                f"### {c['title']}",
                "",
                f"- Path: `courses/{c['slug']}/`",
                f"- Provider: {c['provider']}",
                f"- Category: {c['category']} / {c.get('subcategory')}",
                f"- Duration: {c['estimated_hours']} hours",
                f"- Level: {c.get('level')}",
                f"- License: {c.get('license')}",
                f"- Downloaded content: yes ({t.get('lessons')} lessons, {t.get('modules')} modules)",
                f"- Competencies: {', '.join(c.get('competencies') or [])}",
                f"- Official source: {c.get('official_url')}",
                "",
            ]
        )
    (ROOT / "README.md").write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({k: report[k] for k in ["total_courses", "technology_courses", "medical_courses", "valid", "missing_content_files"]}, indent=2))
    if errors:
        print("ERRORS", len(errors))
        for e in errors[:30]:
            print(" -", e)
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
