# GitHub repo presentation — paste-ready values

These are the repository **settings** (About box, topics, website, social preview,
releases). They live on GitHub's side, not in the code, so they can't be changed by a
`git push` — set them once in the browser. Doing so fixes the "gibberish description",
"no topics", and "empty website" findings and gives search engines real keywords.

## 1. About → Description  (fixes the `jweffjejfqfjjfq` description)

Repo home → the gear icon next to **About** → paste into **Description**:

```
AI-assisted competency assessment and learning platform for MoSPI statistical officers — Smart India Hackathon 2026 (SIH26101). Server-graded assessments, document-grounded MCQ generation, competency-gap analytics, OCR + chart vision, and a real open-course catalogue. React 19 + standard-library Node.
```

## 2. About → Topics  (fixes "no topics")

Same **About** panel → **Topics** → add (GitHub caps at 20):

```
smart-india-hackathon  sih2026  sih26101  mospi  edtech
competency-based-learning  assessment-platform  question-generation
learning-analytics  react  typescript  nodejs  vite  postgresql
ocr  paddleocr  gemini  machine-learning  education  govtech
```

## 3. About → Website  (fixes "empty website field")

If you deploy a live demo, put its URL here. If there is no public demo (the app runs
locally by design), leave it blank rather than pointing at something that isn't live.

## 4. Social preview image  (fixes "default auto-generated card")

Settings → **Social preview** → upload a 1280×640 PNG with the NEXORA AI name and a
one-line tagline. This is the image that shows when the repo is shared on chat/social.

## 5. First release  (fixes "no releases signal an unfinished project")

Tag a version so the repo reads as a finished, usable project:

```bash
cd statskill-mac
git tag -a v1.0.0 -m "NEXORA AI — SIH26101 submission"
git push origin v1.0.0
```

Then Releases → **Draft a new release** → pick `v1.0.0` → title "v1.0.0 — SIH26101
submission" → paste the README summary → **Publish**.

## 6. Default branch & re-crawl

The professional README is already committed on `main`. If your GitHub repo's **default
branch** is something else (e.g. `master`), set it to `main` under
Settings → Branches so visitors land on the good README. Google's search snippet updates
on its own recrawl schedule — there's no verify/re-index button for github.com pages, so
the stale gibberish snippet will clear once it recrawls the updated page.

## Note on the repo name

Keeping the name `SIH26101` is fine — it matches what people search for the problem
statement. The description and topics above carry the extra keywords (AI learning
platform, MoSPI, etc.) without renaming.
