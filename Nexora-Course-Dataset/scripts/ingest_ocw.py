#!/usr/bin/env python3
"""Download MIT OCW lecture PDFs (CC BY-NC-SA 4.0)."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urljoin

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ingest_lib import (  # noqa: E402
    COLLECTED,
    COURSES,
    fetch_bytes,
    fetch_text,
    minutes_from_pdf_bytes,
    write_course_package,
)

OCW = "https://ocw.mit.edu"

COURSES_DEF = [
    {
        "slug": "course-022-mit-intro-cs-python",
        "course_id": "mit-6-0001-python",
        "ocw": "6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016",
        "title": "Introduction to Computer Science and Programming in Python",
        "code": "6.0001",
        "term": "Fall 2016",
        "subcategory": "Python Programming",
        "level": "Beginner",
        "competencies": ["Python Programming", "Computer Science", "Programming Fundamentals"],
        "topics": ["Python", "functions", "objects", "complexity"],
        "hours_hint": 12,
    },
    {
        "slug": "course-023-mit-computational-thinking",
        "course_id": "mit-6-0002-data-science",
        "ocw": "6-0002-introduction-to-computational-thinking-and-data-science-fall-2016",
        "title": "Introduction to Computational Thinking and Data Science",
        "code": "6.0002",
        "term": "Fall 2016",
        "subcategory": "Data Science",
        "level": "Beginner",
        "competencies": ["Data Science", "Python Programming", "Computational Thinking"],
        "topics": ["simulation", "optimization", "machine learning intro", "plotting"],
        "hours_hint": 12,
    },
    {
        "slug": "course-024-mit-algorithms-2020",
        "course_id": "mit-6-006-algorithms",
        "ocw": "6-006-introduction-to-algorithms-spring-2020",
        "title": "Introduction to Algorithms",
        "code": "6.006",
        "term": "Spring 2020",
        "subcategory": "Algorithms",
        "level": "Intermediate",
        "competencies": ["Algorithms", "Data Structures", "Computer Science"],
        "topics": ["graphs", "sorting", "dynamic programming", "shortest paths"],
        "hours_hint": 40,
        "prefer": "lec",
    },
    {
        "slug": "course-025-mit-artificial-intelligence",
        "course_id": "mit-6-034-ai",
        "ocw": "6-034-artificial-intelligence-fall-2010",
        "title": "Artificial Intelligence",
        "code": "6.034",
        "term": "Fall 2010",
        "subcategory": "Artificial Intelligence",
        "level": "Intermediate",
        "competencies": ["Artificial Intelligence", "Machine Learning", "Search Algorithms"],
        "topics": ["search", "constraints", "neural nets", "learning"],
        "hours_hint": 40,
    },
    {
        "slug": "course-026-mit-machine-learning",
        "course_id": "mit-6-867-ml",
        "ocw": "6-867-machine-learning-fall-2006",
        "title": "Machine Learning",
        "code": "6.867",
        "term": "Fall 2006",
        "subcategory": "Machine Learning",
        "level": "Advanced",
        "competencies": ["Machine Learning", "Artificial Intelligence", "Statistical Learning"],
        "topics": ["supervised learning", "kernels", "graphical models"],
        "hours_hint": 40,
    },
    {
        "slug": "course-027-mit-design-algorithms",
        "course_id": "mit-6-046-algorithms",
        "ocw": "6-046j-design-and-analysis-of-algorithms-spring-2015",
        "title": "Design and Analysis of Algorithms",
        "code": "6.046J",
        "term": "Spring 2015",
        "subcategory": "Algorithms",
        "level": "Advanced",
        "competencies": ["Algorithms", "Complexity", "Computer Science"],
        "topics": ["amortized analysis", "network flow", "NP-completeness"],
        "hours_hint": 40,
    },
    {
        "slug": "course-028-mit-computation-structures",
        "course_id": "mit-6-004-computation-structures",
        "ocw": "6-004-computation-structures-spring-2017",
        "title": "Computation Structures",
        "code": "6.004",
        "term": "Spring 2017",
        "subcategory": "Computer Architecture",
        "level": "Intermediate",
        "competencies": ["Computer Architecture", "Digital Logic", "Computer Engineering"],
        "topics": ["CMOS", "assembly", "processors", "caches"],
        "hours_hint": 40,
    },
    {
        "slug": "course-029-mit-computer-system-engineering",
        "course_id": "mit-6-033-systems",
        "ocw": "6-033-computer-system-engineering-spring-2018",
        "title": "Computer System Engineering",
        "code": "6.033",
        "term": "Spring 2018",
        "subcategory": "Operating Systems",
        "level": "Intermediate",
        "competencies": ["Operating Systems", "Distributed Systems", "Computer Networks"],
        "topics": ["complexity", "naming", "reliability", "security"],
        "hours_hint": 40,
    },
    {
        "slug": "course-030-mit-database-systems",
        "course_id": "mit-6-830-databases",
        "ocw": "6-830-database-systems-fall-2010",
        "title": "Database Systems",
        "code": "6.830",
        "term": "Fall 2010",
        "subcategory": "Database Systems",
        "level": "Advanced",
        "competencies": ["Database Systems", "SQL", "Data Engineering"],
        "topics": ["query processing", "transactions", "indexing"],
        "hours_hint": 36,
    },
    {
        "slug": "course-031-mit-computer-security",
        "course_id": "mit-6-858-security",
        "ocw": "6-858-computer-systems-security-fall-2014",
        "title": "Computer Systems Security",
        "code": "6.858",
        "term": "Fall 2014",
        "subcategory": "Cybersecurity",
        "level": "Advanced",
        "competencies": ["Cybersecurity", "Operating Systems", "Software Security"],
        "topics": ["control hijacking", "web security", "isolation"],
        "hours_hint": 40,
        "prefer": "lec",
    },
    {
        "slug": "course-032-mit-circuits",
        "course_id": "mit-6-002-circuits",
        "ocw": "6-002-circuits-and-electronics-spring-2007",
        "title": "Circuits and Electronics",
        "code": "6.002",
        "term": "Spring 2007",
        "subcategory": "Electrical Engineering",
        "level": "Beginner",
        "competencies": ["Electrical Engineering", "Circuits", "Electronics"],
        "topics": ["resistive networks", "MOSFET", "amplifiers", "digital circuits"],
        "hours_hint": 40,
    },
    {
        "slug": "course-033-mit-signals-systems",
        "course_id": "mit-6-003-signals",
        "ocw": "6-003-signals-and-systems-fall-2011",
        "title": "Signals and Systems",
        "code": "6.003",
        "term": "Fall 2011",
        "subcategory": "Electrical Engineering",
        "level": "Intermediate",
        "competencies": ["Signals and Systems", "Electrical Engineering", "DSP"],
        "topics": ["LTI systems", "Fourier", "Laplace", "sampling"],
        "hours_hint": 40,
        "prefer": "lec",
    },
    {
        "slug": "course-034-mit-linear-algebra",
        "course_id": "mit-18-06-linear-algebra",
        "ocw": "18-06-linear-algebra-spring-2010",
        "title": "Linear Algebra",
        "code": "18.06",
        "term": "Spring 2010",
        "subcategory": "Mathematics",
        "level": "Intermediate",
        "competencies": ["Linear Algebra", "Mathematics", "Engineering Fundamentals"],
        "topics": ["matrices", "vector spaces", "eigenvalues", "least squares"],
        "hours_hint": 36,
    },
    {
        "slug": "course-035-mit-eecs-intro",
        "course_id": "mit-6-01sc-eecs",
        "ocw": "6-01sc-introduction-to-electrical-engineering-and-computer-science-i-spring-2011",
        "title": "Introduction to Electrical Engineering and Computer Science I",
        "code": "6.01SC",
        "term": "Spring 2011",
        "subcategory": "Electrical Engineering",
        "level": "Beginner",
        "competencies": ["Electrical Engineering", "Computer Science", "Robotics"],
        "topics": ["Python", "circuits", "feedback", "state machines"],
        "hours_hint": 40,
    },
    {
        "slug": "course-036-mit-engineering-dynamics",
        "course_id": "mit-2-003-dynamics",
        "ocw": "2-003sc-engineering-dynamics-fall-2011",
        "title": "Engineering Dynamics",
        "code": "2.003SC",
        "term": "Fall 2011",
        "subcategory": "Mechanical Engineering",
        "level": "Intermediate",
        "competencies": ["Mechanical Engineering", "Dynamics", "Mechanics"],
        "topics": ["kinematics", "Newton-Euler", "Lagrangian", "vibration"],
        "hours_hint": 36,
    },
    {
        "slug": "course-037-mit-automata",
        "course_id": "mit-6-045-automata",
        "ocw": "6-045j-automata-computability-and-complexity-spring-2011",
        "title": "Automata, Computability, and Complexity",
        "code": "6.045J",
        "term": "Spring 2011",
        "subcategory": "Theory of Computation",
        "level": "Advanced",
        "competencies": ["Theory of Computation", "Algorithms", "Computer Science"],
        "topics": ["automata", "computability", "complexity"],
        "hours_hint": 36,
    },
    {
        "slug": "course-038-mit-algorithms-2011",
        "course_id": "mit-6-006-algorithms-2011",
        "ocw": "6-006-introduction-to-algorithms-fall-2011",
        "title": "Introduction to Algorithms (Fall 2011)",
        "code": "6.006",
        "term": "Fall 2011",
        "subcategory": "Algorithms",
        "level": "Intermediate",
        "competencies": ["Algorithms", "Data Structures", "Computer Science"],
        "topics": ["hashing", "trees", "graphs", "shortest paths"],
        "hours_hint": 40,
        "prefer": "lec",
    },
    {
        "slug": "course-039-mit-digital-communication",
        "course_id": "mit-6-02-digital-comm",
        "ocw": "6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012",
        "title": "Introduction to EECS II: Digital Communication Systems",
        "code": "6.02",
        "term": "Fall 2012",
        "subcategory": "Computer Networks",
        "level": "Intermediate",
        "competencies": ["Computer Networks", "Digital Communications", "Electrical Engineering"],
        "topics": ["bits", "noise", "coding", "packets"],
        "hours_hint": 36,
    },
    {
        "slug": "course-040-mit-dynamics-aero",
        "course_id": "mit-16-07-dynamics",
        "ocw": "16-07-dynamics-fall-2009",
        "title": "Dynamics",
        "code": "16.07",
        "term": "Fall 2009",
        "subcategory": "Aerospace Engineering",
        "level": "Intermediate",
        "competencies": ["Aerospace Engineering", "Dynamics", "Mechanics"],
        "topics": ["particles", "rigid bodies", "orbital mechanics"],
        "hours_hint": 36,
    },
    {
        "slug": "course-041-mit-design-manufacturing",
        "course_id": "mit-2-007-design-manufacturing",
        "ocw": "2-007-design-and-manufacturing-i-spring-2009",
        "title": "Design and Manufacturing I",
        "code": "2.007",
        "term": "Spring 2009",
        "subcategory": "Mechanical Engineering",
        "level": "Beginner",
        "competencies": ["Mechanical Engineering", "Manufacturing", "Engineering Design"],
        "topics": ["design process", "mechanisms", "fabrication"],
        "hours_hint": 36,
    },
    {
        "slug": "course-042-mit-solid-state-chemistry",
        "course_id": "mit-3-091-ssc",
        "ocw": "3-091-introduction-to-solid-state-chemistry-fall-2018",
        "title": "Introduction to Solid State Chemistry",
        "code": "3.091",
        "term": "Fall 2018",
        "subcategory": "Materials Science",
        "level": "Beginner",
        "competencies": ["Materials Science", "Chemistry", "Engineering Fundamentals"],
        "topics": ["bonding", "crystals", "polymers", "metals"],
        "hours_hint": 40,
        "prefer": "lec",
    },
    {
        "slug": "course-043-mit-nlp",
        "course_id": "mit-6-864-nlp",
        "ocw": "6-864-advanced-natural-language-processing-fall-2005",
        "title": "Advanced Natural Language Processing",
        "code": "6.864",
        "term": "Fall 2005",
        "subcategory": "Natural Language Processing",
        "level": "Advanced",
        "competencies": ["Natural Language Processing", "Machine Learning", "Artificial Intelligence"],
        "topics": ["parsing", "tagging", "translation", "language models"],
        "hours_hint": 30,
    },
    {
        "slug": "course-044-mit-machine-vision",
        "course_id": "mit-6-801-vision",
        "ocw": "6-801-machine-vision-fall-2004",
        "title": "Machine Vision",
        "code": "6.801",
        "term": "Fall 2004",
        "subcategory": "Computer Vision",
        "level": "Advanced",
        "competencies": ["Computer Vision", "Artificial Intelligence", "Image Processing"],
        "topics": ["image formation", "stereo", "motion", "recognition"],
        "hours_hint": 30,
    },
    {
        "slug": "course-045-mit-software-studio",
        "course_id": "mit-6-170-software-studio",
        "ocw": "6-170-software-studio-spring-2013",
        "title": "Software Studio",
        "code": "6.170",
        "term": "Spring 2013",
        "subcategory": "Software Engineering",
        "level": "Intermediate",
        "competencies": ["Software Engineering", "Programming Fundamentals", "System Design"],
        "topics": ["design", "testing", "web apps", "code review"],
        "hours_hint": 30,
    },
    {
        "slug": "course-046-mit-engineering-problem-solving",
        "course_id": "mit-1-00-problem-solving",
        "ocw": "1-00-introduction-to-computers-and-engineering-problem-solving-spring-2012",
        "title": "Introduction to Computers and Engineering Problem Solving",
        "code": "1.00",
        "term": "Spring 2012",
        "subcategory": "Programming Fundamentals",
        "level": "Beginner",
        "competencies": ["Programming Fundamentals", "Java", "Engineering Computation"],
        "topics": ["Java", "objects", "data structures", "simulation"],
        "hours_hint": 36,
    },
    {
        "slug": "course-047-mit-math-for-cs",
        "course_id": "mit-6-042-math-cs",
        "ocw": "6-042j-mathematics-for-computer-science-fall-2010",
        "title": "Mathematics for Computer Science",
        "code": "6.042J",
        "term": "Fall 2010",
        "subcategory": "Discrete Mathematics",
        "level": "Intermediate",
        "competencies": ["Discrete Mathematics", "Computer Science", "Proofs"],
        "topics": ["proofs", "graphs", "counting", "probability"],
        "hours_hint": 40,
        "prefer": "lec",
    },
    {
        "slug": "course-048-mit-classical-mechanics",
        "course_id": "mit-8-01-mechanics",
        "ocw": "8-01sc-classical-mechanics-fall-2016",
        "title": "Classical Mechanics",
        "code": "8.01SC",
        "term": "Fall 2016",
        "subcategory": "Physics",
        "level": "Beginner",
        "competencies": ["Physics", "Mechanics", "Engineering Fundamentals"],
        "topics": ["kinematics", "Newton's laws", "energy", "momentum"],
        "hours_hint": 36,
    },
]


def collect_pdfs(html: str, course_path: str) -> list[tuple[str, str]]:
    items = []
    seen = set()
    for m in re.finditer(r'href="([^"]+\.pdf)"', html, flags=re.I):
        href = m.group(1)
        if href in seen:
            continue
        seen.add(href)
        name = href.split("/")[-1]
        items.append((name, urljoin(OCW, href)))
    return items


def prefer_filter(items: list[tuple[str, str]], prefer: str | None) -> list[tuple[str, str]]:
    if not prefer:
        return items
    selected = [it for it in items if prefer.lower() in it[0].lower()]
    return selected if len(selected) >= 6 else items


def ingest(defn: dict) -> None:
    dest = COURSES / defn["slug"]
    print("START", defn["slug"], flush=True)
    if (dest / "course.json").exists():
        print("EXISTS", defn["slug"], flush=True)
        return
    url = f"{OCW}/courses/{defn['ocw']}/download/"
    html = fetch_text(url, timeout=40)
    items = collect_pdfs(html, defn["ocw"])
    items = prefer_filter(items, defn.get("prefer"))
    # drop huge solution dumps if we still have enough lectures
    lectures = [it for it in items if re.search(r"lec|lecture|notes|ch\d", it[0], re.I)]
    if len(lectures) >= 6:
        items = lectures
    if len(items) < 4:
        print("FAIL few pdfs", defn["slug"], len(items))
        return

    # group into modules of ~4 lessons
    lessons_raw = []
    for name, href in items:
        try:
            data = fetch_bytes(href, timeout=60)
        except Exception as exc:  # noqa: BLE001
            print("  skip pdf", name, exc)
            continue
        if len(data) < 8000:
            continue
        lessons_raw.append((name, href, data))
        if len(lessons_raw) >= 16:
            break
    if len(lessons_raw) < 4:
        print("FAIL downloaded", defn["slug"], len(lessons_raw))
        return

    modules_payload = []
    group_size = 4 if len(lessons_raw) > 8 else 3
    for i in range(0, len(lessons_raw), group_size):
        chunk = lessons_raw[i : i + group_size]
        pi = len(modules_payload) + 1
        lessons = []
        for li, (name, href, data) in enumerate(chunk, start=1):
            rel = f"content/module-{pi:02d}/{name}"
            path = dest / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            title = re.sub(r"[_-]+", " ", Path(name).stem)
            title = re.sub(r"MIT\d+\w+\s*", "", title, flags=re.I).strip() or name
            lessons.append(
                {
                    "id": f"{defn['course_id']}-m{pi:02d}-l{li:02d}",
                    "title": title,
                    "type": "pdf",
                    "content_file": rel,
                    "minutes": minutes_from_pdf_bytes(len(data)),
                    "objectives": [],
                    "excerpt": f"MIT OCW lecture/resource {name} from {defn['code']} {defn['title']}.",
                }
            )
        modules_payload.append(
            {
                "id": f"{defn['course_id']}-m{pi:02d}",
                "title": f"Module {pi}",
                "lessons": lessons,
            }
        )

    official = f"{OCW}/courses/{defn['ocw']}/"
    course = {
        "course_id": defn["course_id"],
        "title": f"{defn['code']} {defn['title']}",
        "provider": "Massachusetts Institute of Technology",
        "category": "Technology",
        "subcategory": defn["subcategory"],
        "level": defn["level"],
        "description": (
            f"MIT OpenCourseWare {defn['code']} {defn['title']} ({defn['term']}). "
            "Lecture notes and course PDFs were downloaded from the official OCW download page."
        ),
        "competencies": defn["competencies"],
        "topics": defn["topics"],
        "source": {
            "name": "MIT OpenCourseWare",
            "official_url": official,
            "license": "CC BY-NC-SA 4.0",
            "license_url": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
        },
        "language": "en",
        "format": "university-course",
        "term": defn["term"],
    }
    source_info = {
        "course_id": defn["course_id"],
        "provider": "Massachusetts Institute of Technology",
        "source_url": official,
        "download_url": url,
        "license": "CC BY-NC-SA 4.0",
        "license_url": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
        "date_collected": COLLECTED,
        "reuse_permissions": (
            "CC BY-NC-SA 4.0 permits non-commercial sharing and adaptation with attribution and share-alike."
        ),
        "changes_made": [
            "Downloaded official OCW PDF resources",
            "Grouped lecture PDFs into sequential modules",
            "Added Nexora-generated practice questions grounded in course titles/topics",
        ],
        "notes": "Do not use MIT name or logo to imply endorsement. Non-commercial reuse only.",
    }
    extra = (
        "MIT OCW materials are used under CC BY-NC-SA 4.0. "
        "This packaged copy is for non-commercial educational reuse with attribution."
    )
    write_course_package(dest, course, modules_payload, source_info, extra)


def main():
    COURSES.mkdir(parents=True, exist_ok=True)
    for defn in COURSES_DEF:
        try:
            ingest(defn)
        except Exception as exc:  # noqa: BLE001
            print("ERROR", defn["slug"], exc)


if __name__ == "__main__":
    main()
