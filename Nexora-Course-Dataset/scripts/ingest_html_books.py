#!/usr/bin/env python3
"""Download additional CC BY / CC BY-SA HTML textbooks."""
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

PY4E_CHAPTERS = [
    ("01-intro", "Why Program?"),
    ("02-variables", "Variables, expressions, and statements"),
    ("03-conditional", "Conditional execution"),
    ("04-functions", "Functions"),
    ("05-iterations", "Iteration"),
    ("06-strings", "Strings"),
    ("07-files", "Files"),
    ("08-lists", "Lists"),
    ("09-dictionaries", "Dictionaries"),
    ("10-tuples", "Tuples"),
    ("11-regex", "Regular expressions"),
    ("12-network", "Networked programs"),
    ("13-web", "Using Web Services"),
    ("14-objects", "Object-oriented programming"),
    ("15-database", "Using Databases and SQL"),
    ("16-viz", "Visualizing data"),
]


def ingest_py4e() -> None:
    dest = COURSES / "course-049-python-for-everybody"
    if (dest / "course.json").exists():
        print("EXISTS py4e")
        return
    modules_payload = []
    groups = [PY4E_CHAPTERS[i : i + 4] for i in range(0, len(PY4E_CHAPTERS), 4)]
    for pi, group in enumerate(groups, start=1):
        lessons = []
        for slug, title in group:
            url = f"https://www.py4e.com/html3/{slug}"
            html = fetch_text(url, timeout=25)
            doc = soup(html)
            main = doc.select_one("main") or doc.select_one("#main-content") or doc.select_one(".container")
            if not main:
                continue
            for bad in main.select("nav, script, style"):
                bad.decompose()
            md = html_to_markdown(str(main))
            wc = word_count(md)
            if wc < 200:
                continue
            li = len(lessons) + 1
            rel = f"content/module-{pi:02d}/lesson-{li:02d}.md"
            path = dest / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            header = attribution_block(
                "Python for Everybody",
                "Charles R. Severance",
                url,
                "CC BY 4.0",
            )
            path.write_text(f"# {title}\n\n{header}{md}\n", encoding="utf-8")
            lessons.append(
                {
                    "id": f"py4e-m{pi:02d}-l{li:02d}",
                    "title": title,
                    "type": "text",
                    "content_file": rel,
                    "minutes": minutes_from_words(wc),
                    "objectives": extract_objectives(md),
                    "excerpt": md[:1200],
                }
            )
        if lessons:
            modules_payload.append(
                {"id": f"py4e-m{pi:02d}", "title": group[0][1], "lessons": lessons}
            )
    course = {
        "course_id": "py4e-python-for-everybody",
        "title": "Python for Everybody",
        "provider": "Charles R. Severance / University of Michigan",
        "category": "Technology",
        "subcategory": "Python Programming",
        "level": "Beginner",
        "description": "Python for Everybody is a CC BY 4.0 textbook/course on programming, data, and the web.",
        "competencies": ["Python Programming", "SQL", "Programming Fundamentals"],
        "topics": ["Python", "files", "HTTP", "SQL"],
        "source": {
            "name": "Python for Everybody",
            "official_url": "https://www.py4e.com/book.php",
            "license": "CC BY 4.0",
            "license_url": "https://creativecommons.org/licenses/by/4.0/",
        },
        "language": "en",
        "format": "self-paced",
    }
    source_info = {
        "course_id": "py4e-python-for-everybody",
        "provider": "Charles R. Severance",
        "source_url": "https://www.py4e.com/book.php",
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "date_collected": COLLECTED,
        "reuse_permissions": "CC BY 4.0 permits copy and redistribution with attribution.",
        "changes_made": [
            "Downloaded HTML chapters from py4e.com/html3",
            "Converted to Markdown lessons",
            "Added Nexora-generated practice questions",
        ],
    }
    write_course_package(dest, course, modules_payload, source_info)


def ingest_thinkcspy() -> None:
    dest = COURSES / "course-050-think-like-computer-scientist"
    if (dest / "course.json").exists():
        print("EXISTS thinkcspy")
        return
    index = fetch_text("https://www.greenteapress.com/thinkpython/thinkCSpy/html/", timeout=25)
    chapters = re.findall(r'href="(chap\d+\.html)"', index)
    chapters = list(dict.fromkeys(chapters))
    modules_payload = []
    groups = [chapters[i : i + 4] for i in range(0, len(chapters), 4)]
    for pi, group in enumerate(groups, start=1):
        lessons = []
        for fname in group:
            url = f"https://www.greenteapress.com/thinkpython/thinkCSpy/html/{fname}"
            html = fetch_text(url, timeout=25)
            doc = soup(html)
            title_el = doc.find("h1") or doc.find("h2") or doc.find("title")
            title = title_el.get_text(" ", strip=True) if title_el else fname
            md = html_to_markdown(str(doc.body or doc))
            wc = word_count(md)
            if wc < 150:
                continue
            li = len(lessons) + 1
            rel = f"content/module-{pi:02d}/lesson-{li:02d}.md"
            path = dest / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            header = attribution_block(
                "How to Think Like a Computer Scientist: Learning with Python",
                "Allen Downey, Jeffrey Elkner, Chris Meyers",
                url,
                "CC BY",
            )
            path.write_text(f"# {title}\n\n{header}{md}\n", encoding="utf-8")
            lessons.append(
                {
                    "id": f"thinkcspy-m{pi:02d}-l{li:02d}",
                    "title": title,
                    "type": "text",
                    "content_file": rel,
                    "minutes": minutes_from_words(wc),
                    "objectives": extract_objectives(md),
                    "excerpt": md[:1200],
                }
            )
        if lessons:
            modules_payload.append(
                {"id": f"thinkcspy-m{pi:02d}", "title": lessons[0]["title"], "lessons": lessons}
            )
    course = {
        "course_id": "thinkcspy-learning-with-python",
        "title": "How to Think Like a Computer Scientist: Learning with Python",
        "provider": "Green Tea Press / Allen Downey, Jeffrey Elkner, Chris Meyers",
        "category": "Technology",
        "subcategory": "Python Programming",
        "level": "Beginner",
        "description": "An openly licensed introduction to computer science using Python.",
        "competencies": ["Python Programming", "Programming Fundamentals", "Computer Science"],
        "topics": ["variables", "functions", "classes", "algorithms"],
        "source": {
            "name": "Green Tea Press",
            "official_url": "https://www.greenteapress.com/thinkpython/thinkCSpy/html/",
            "license": "CC BY",
            "license_url": "https://creativecommons.org/licenses/by/3.0/",
        },
        "language": "en",
        "format": "self-paced",
    }
    source_info = {
        "course_id": "thinkcspy-learning-with-python",
        "source_url": "https://www.greenteapress.com/thinkpython/thinkCSpy/html/",
        "license": "CC BY",
        "license_url": "https://creativecommons.org/licenses/by/3.0/",
        "date_collected": COLLECTED,
        "reuse_permissions": "CC BY permits copy and redistribution with attribution.",
        "changes_made": ["Downloaded HTML chapters", "Converted to Markdown", "Added generated practice questions"],
    }
    write_course_package(dest, course, modules_payload, source_info)


def latex_to_md(tex: str) -> str:
    tex = re.sub(r"%.*", "", tex)
    tex = re.sub(r"\\(chapter|section|subsection|subsubsection)\*?\{([^}]+)\}", r"\n## \2\n", tex)
    tex = re.sub(r"\\(textbf|textit|emph|term|termsub)\{([^}]+)\}", r"**\2**", tex)
    tex = re.sub(r"\\begin\{itemize\}|\\end\{itemize\}|\\begin\{enumerate\}|\\end\{enumerate\}", "", tex)
    tex = re.sub(r"\\item\s*", "- ", tex)
    tex = re.sub(r"\\begin\{quote\}|\\end\{quote\}", "", tex)
    tex = re.sub(r"\\(label|index|ref|cite|footfullcite|caption|includegraphics)\{[^}]*\}", "", tex)
    tex = re.sub(r"\\[a-zA-Z]+\*?(\[[^\]]*\])?\{([^}]*)\}", r"\2", tex)
    tex = re.sub(r"\\[a-zA-Z]+\*?", "", tex)
    tex = tex.replace("{", "").replace("}", "")
    tex = re.sub(r"\n{3,}", "\n\n", tex)
    return tex.strip() + "\n"


def ingest_openintro() -> None:
    src = Path("/tmp/nexora-src/openintro-statistics")
    dest = COURSES / "course-051-openintro-statistics"
    if (dest / "course.json").exists():
        print("EXISTS openintro")
        return
    if not src.exists():
        print("SKIP openintro missing clone")
        return
    chapters = [
        ("ch_intro_to_data", "Introduction to data"),
        ("ch_summarizing_data", "Summarizing data"),
        ("ch_probability", "Probability"),
        ("ch_distributions", "Distributions"),
        ("ch_foundations_for_inf", "Foundations for inference"),
        ("ch_inference_for_props", "Inference for proportions"),
        ("ch_inference_for_means", "Inference for means"),
        ("ch_regr_simple_linear", "Simple linear regression"),
        ("ch_regr_mult_and_log", "Multiple and logistic regression"),
    ]
    modules_payload = []
    for pi, (folder, title) in enumerate(chapters, start=1):
        texdir = src / folder / "TeX"
        files = sorted(
            p
            for p in texdir.glob("*.tex")
            if p.name != f"{folder}.tex" and "review_exercises" not in p.name
        )
        if not files:
            files = list(texdir.glob("*.tex"))
        lessons = []
        for li, path in enumerate(files, start=1):
            md = latex_to_md(path.read_text(encoding="utf-8", errors="replace"))
            wc = word_count(md)
            if wc < 200:
                continue
            rel = f"content/module-{pi:02d}/lesson-{li:02d}.md"
            out = dest / rel
            out.parent.mkdir(parents=True, exist_ok=True)
            header = attribution_block(
                "OpenIntro Statistics",
                "OpenIntro",
                "https://www.openintro.org/book/os/",
                "CC BY-SA 3.0",
            )
            ltitle = path.stem.replace("_", " ").title()
            out.write_text(f"# {ltitle}\n\n{header}{md}\n", encoding="utf-8")
            lessons.append(
                {
                    "id": f"openintro-m{pi:02d}-l{li:02d}",
                    "title": ltitle,
                    "type": "text",
                    "content_file": rel,
                    "minutes": minutes_from_words(wc, floor=20),
                    "objectives": extract_objectives(md),
                    "excerpt": md[:1200],
                }
            )
        if lessons:
            modules_payload.append({"id": f"openintro-m{pi:02d}", "title": title, "lessons": lessons})
    course = {
        "course_id": "openintro-statistics",
        "title": "OpenIntro Statistics",
        "provider": "OpenIntro",
        "category": "Technology",
        "subcategory": "Statistics",
        "level": "Beginner",
        "description": "OpenIntro Statistics is a CC BY-SA college statistics textbook with data, probability, and inference.",
        "competencies": ["Statistics", "Data Science", "Probability"],
        "topics": ["data", "probability", "inference", "regression"],
        "source": {
            "name": "OpenIntro",
            "official_url": "https://www.openintro.org/book/os/",
            "license": "CC BY-SA 3.0",
            "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        },
        "language": "en",
        "format": "self-paced",
    }
    source_info = {
        "course_id": "openintro-statistics",
        "source_url": "https://github.com/OpenIntroStat/openintro-statistics",
        "license": "CC BY-SA 3.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "date_collected": COLLECTED,
        "reuse_permissions": "CC BY-SA 3.0 permits share and adapt with attribution and share-alike.",
        "changes_made": [
            "Converted chapter TeX source to Markdown lessons",
            "Omitted review-exercise dump files and figures",
            "Added generated practice questions",
            "Title does not include a confusing OpenIntro derivative product name beyond attribution",
        ],
        "notes": "Do not use the OpenIntro trademark/logo except for attribution of the original.",
    }
    write_course_package(dest, course, modules_payload, source_info)


def ingest_erickson() -> None:
    dest = COURSES / "course-052-algorithms-jeff-erickson"
    if (dest / "course.json").exists():
        print("EXISTS erickson")
        return
    html = fetch_text("https://jeffe.cs.illinois.edu/teaching/algorithms/", timeout=25)
    pdfs = re.findall(r'href="(book/[^"]+\.pdf)"', html)
    pdfs = [p for p in pdfs if "Algorithms-JeffE" not in p and "frontmatter" not in p]
    pdfs = list(dict.fromkeys(pdfs))
    if len(pdfs) < 6:
        print("FAIL erickson pdfs", len(pdfs))
        return
    from ingest_lib import fetch_bytes, minutes_from_pdf_bytes

    lessons_raw = []
    for p in pdfs[:16]:
        url = "https://jeffe.cs.illinois.edu/teaching/algorithms/" + p
        try:
            data = fetch_bytes(url, timeout=45)
        except Exception as exc:  # noqa: BLE001
            print(" skip", p, exc)
            continue
        if len(data) < 8000:
            continue
        lessons_raw.append((p, url, data))
    modules_payload = []
    for i in range(0, len(lessons_raw), 3):
        chunk = lessons_raw[i : i + 3]
        pi = len(modules_payload) + 1
        lessons = []
        for li, (p, url, data) in enumerate(chunk, start=1):
            name = Path(p).name
            rel = f"content/module-{pi:02d}/{name}"
            path = dest / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            lessons.append(
                {
                    "id": f"erickson-m{pi:02d}-l{li:02d}",
                    "title": Path(name).stem.replace("-", " "),
                    "type": "pdf",
                    "content_file": rel,
                    "minutes": minutes_from_pdf_bytes(len(data)),
                    "objectives": [],
                    "excerpt": f"Chapter PDF {name} from Algorithms by Jeff Erickson.",
                }
            )
        modules_payload.append({"id": f"erickson-m{pi:02d}", "title": f"Module {pi}", "lessons": lessons})
    course = {
        "course_id": "illinois-algorithms-erickson",
        "title": "Algorithms",
        "provider": "Jeff Erickson / University of Illinois Urbana-Champaign",
        "category": "Technology",
        "subcategory": "Algorithms",
        "level": "Intermediate",
        "description": "Jeff Erickson's Algorithms textbook, reused under CC BY 4.0.",
        "competencies": ["Algorithms", "Data Structures", "Computer Science"],
        "topics": ["recursion", "backtracking", "dynamic programming", "graphs"],
        "source": {
            "name": "Jeff Erickson",
            "official_url": "https://jeffe.cs.illinois.edu/teaching/algorithms/",
            "license": "CC BY 4.0",
            "license_url": "https://creativecommons.org/licenses/by/4.0/",
        },
        "language": "en",
        "format": "self-paced",
    }
    source_info = {
        "course_id": "illinois-algorithms-erickson",
        "source_url": "https://jeffe.cs.illinois.edu/teaching/algorithms/",
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "date_collected": COLLECTED,
        "reuse_permissions": "CC BY 4.0 permits copy and redistribution with attribution.",
        "changes_made": ["Downloaded chapter PDFs", "Grouped into modules", "Added generated practice questions"],
    }
    write_course_package(dest, course, modules_payload, source_info)


def main():
    COURSES.mkdir(parents=True, exist_ok=True)
    for fn in (ingest_py4e, ingest_thinkcspy, ingest_openintro, ingest_erickson):
        try:
            fn()
        except Exception as exc:  # noqa: BLE001
            print("ERROR", fn.__name__, exc)


if __name__ == "__main__":
    main()
