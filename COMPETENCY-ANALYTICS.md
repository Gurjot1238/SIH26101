# Competency analytics from the learner's own answers

What this document covers: what was built, how the numbers are calculated, where the
server draws the line against the browser, the charts on the Dashboard, the AI
explanation and the guard that keeps it honest, exactly what was changed, the tests,
and — at the end — what it still does not do.

The goal was narrow and specific: after a learner finishes the AI-generated MCQ
assessment, the platform should be able to say, from their *actual* answers, what they
are strong in, what they are weak in, which topics underneath a weak competency are
dragging it down, the gap between where they are and where the role expects them to be,
what to study next, and it should draw all of that on the Dashboard. Nothing is
invented and nothing is random; every figure is a pure function of stored attempts.

Nothing in the existing system was rebuilt. The assessment engine, the server-side
grading, the per-topic scoring in `server/progress.mjs`, the course catalogue and its
recommendation path, authentication, the Dashboard shell and every existing chart are
untouched. This feature sits *on top* of the rollup that was already there and answers
the questions that rollup could not.

---

## 1. The hierarchy, and a naming note

This project has two levels, not three:

- **competency** — the five framework areas in `src/lib/topics.ts` (`data-quality`,
  `inference`, `dissemination`, `digital-tools`, `leadership`). The top level.
- **topic** — what a question actually measured, from the uploaded document or from
  the assessment section. The level underneath.

The specification was written against a product that calls these "topic" and
"subtopic". The mapping is exact: this project's `competency` is the spec's "topic",
and this project's `topic` is the spec's "subtopic". A third level was deliberately
**not** invented, because no question in this build carries a third label and a chart
drawn from a label nothing produces would be decoration, not data.

## 2. Where the numbers are calculated — and where they are not

Every competency figure is computed in `server/competency.mjs`, on the server, from
stored attempts. The browser does no competency arithmetic at all: it maps a status
the server chose (`strong` / `good` / `needs-improvement` / `weak` / `unrated`) to a
colour and a label, and draws what it was sent.

That split is the whole point of the feature. A percentage worked out inside a React
component is a second copy of the scoring rule, and it is the copy nobody tests — so
the day the two disagree, the wrong number is the one on the screen. Keeping the
arithmetic in one tested place, behind an API, is what makes the charts trustworthy.

## 3. How each number is worked out

**Topic performance** (`calculateTopicPerformance`). Every topic across the chosen
attempts, matched case-insensitively so "Sampling frame" and "sampling frame" are one
topic, scored by its summed counts — `correct / questionsAttempted`. The question
count rides on every row and is shown everywhere the score is, because "0%" off one
question is not the same claim as "0%" off ten.

**Competency score** (`calculateCompetencyPerformance`). Topic rows are grouped into
the five framework competencies and scored by **summed counts, not by averaging the
topic percentages**. This matters: a topic asked once and a topic asked nine times are
not equal halves of a competency, and averaging them would let a single question move a
score ten points. A competency the paper never asked about is reported as *unmeasured*,
never as 0% — reporting a zero for a question that was never put would be a lie the
chart would then repeat.

**Classification** (`classifyPerformance`, `PERFORMANCE_SCALE`). One place holds the
four cut-offs: `80–100 → Strong`, `60–79 → Good`, `40–59 → Needs improvement`,
`0–39 → Weak`. Below two questions a score is reported but left `unrated` rather than
classified, because one question is not a measurement. Changing a threshold is a
one-line edit in this file and needs no client change, because the scale is published
in the API payload and the browser reads it from there.

**The gap** (`calculateCompetencyGap`). `gap = max(requiredScore − currentScore, 0)`.
Exceeding the target is not a negative gap, it is no gap: a chart drawing −12 would
invite "twelve points of surplus to spend elsewhere", which is not a thing a competency
score means.

**Required vs current.** Targets are NEXORA AI's own configurable demonstration
dataset (`DEFAULT_TARGETS`), labelled as such everywhere they appear. They are **not**
an MoSPI, FRAC or iGOT Karmayogi requirement, and the payload's `requirement.note` says
so. An operator sets `COMPETENCY_TARGETS` in `server/.env` to override them; the
payload then reports `custom: true` so the change is visible on screen.

**Learning priority** (`calculateLearningPriority`). A transparent formula, documented
in code and printed on the Dashboard next to each row:

```
gap        = max(required − current, 0) / 100
weakness   = (100 − current) / 100
confidence = min(questionsAttempted / 3, 1)
priority   = round(gap × weakness × confidence × 100)
```

Three factors, each earning its place: `gap` alone would over-rank a competency merely
below an ambitious target; `weakness` alone ignores what the role asks for; `confidence`
is what stops a single unlucky question from sending a learner down a six-hour pathway —
the same honesty floor as `unrated`, expressed as a slope instead of a cliff. The three
inputs are returned alongside the score, so the ranking can be checked rather than
believed.

**Answer-level analysis** (`analyseAnswers`). From the same grading the assessment
already does, which questions were missed and under which topic, rolled up into
attempted / correct / incorrect / unanswered and a single most-problematic topic (null
on a clean paper). It carries no question text and no answer key.

**The trend** (`buildTrend`). One point per stored attempt, oldest first, built only
from attempts that exist. An account with one sitting gets one point; nothing is
interpolated or back-filled.

## 4. The API

Two endpoints, both authenticated with the existing session cookie. There is no second
auth system.

```
GET  /api/analytics/competencies   ?scope=all (default) | latest
POST /api/analytics/explain        ?scope=… only; no body is read from the browser
```

`GET /api/analytics/competencies` returns the whole picture: overall score, every
measured competency with its target, gap, status, priority and its topics, the
strengths / good / needs-improvement / weaknesses / unrated buckets, the unmeasured
competencies, the gaps sorted biggest-first, the study-order priorities, any topics the
framework could not place, and the trend. A brand-new account gets a complete, valid
payload with `measured: false` and empty lists — not an error, not null — so the empty
state is drawn from the same shape as everything else. An unknown `?scope=` is a `400`
rather than being silently treated as `all`.

`POST /api/analytics/explain` rebuilds the analysis from stored attempts server-side
and hands it to the AI provider. It reads nothing from the request body: a body
carrying its own scores would let the browser dictate what the model is told, and the
guarantee — that the numbers in the paragraph are the numbers in the charts — would be
worth nothing.

## 5. The Dashboard

The new section (`src/components/competency-gap.tsx`) is added to the existing
Dashboard, gated on `live` so demo/sample mode is visually unchanged and never shows a
fabricated chart. It renders:

- a four-tally overview strip (strong / good / needs-improvement / weak counts),
- **Chart 1** — a competency bar chart coloured by status; clicking a bar selects it,
- **Chart 2** — current vs required, drawn as a stacked bar so the coral segment *is*
  the gap, with the demonstration-target badge and its disclaimer printed underneath,
- **Chart 3** — the topic breakdown for the selected competency,
- the biggest-gaps list with `[View topics]` buttons and the priority formula per row,
- the AI explanation card with an "Explain my results" button.

The assessment report screen also gained an "Answer breakdown" card, fed by
`analyseAnswers`, showing which questions went wrong and under which topic. Every chart
reuses the page's existing tokens, colours and components — no new design language, no
3D, no restyle. The colours are the same hex values `bandColors` already uses in
`src/lib/topics.ts`.

## 6. The AI explanation, and the guard

The model is a **writer here, not a calculator**. It is handed the finished analysis
and asked for four short paragraphs; it is told, in the prompt, to use only the numbers
given and to calculate nothing. That instruction is not trusted — it is verified.

`server/ai/explain.mjs` collects every finite number anywhere in the payload, then
regex-scans the reply for every percentage and every "N points" claim. Any figure that
is not in the payload (with a ±1 tolerance for honest rounding) is an invention. On a
first offence the model is re-asked once, with the offending figures named; if the
second reply still invents a figure, the explanation is discarded and the endpoint
returns `unverified`. On refusal the analytics payload still rides along in the
response, because the charts never needed the model — they are already drawn from the
server's own numbers.

The failure taxonomy is kept honest: `no_data → 409` (nothing to explain yet — a caller
state, not a fault), `unverified → 502` (the model returned something unusable), and
every provider error (`not_configured`, `timeout`, `rate_limited`, …) falls through to
the same status map the generation endpoint already uses. An unconfigured provider
returns the exact §13 wording — *"AI question generation is not configured. Add the
server AI provider key and try again."* — and never a key. Both the local (Ollama) and
Gemini providers are supported through the existing provider abstraction; no new paid
API is required, and the local provider needs no key.

## 7. What was changed

New:

```
server/competency.mjs             the analytics engine — every formula above
server/ai/explain.mjs             the prose explanation and its arithmetic guard
src/lib/analytics.ts              the browser's typed client; no arithmetic, only shapes
src/components/competency-gap.tsx the Dashboard section (Charts 1–3, gaps, explanation)
scripts/competency-test.mjs       27 checks over the engine and the guard
scripts/competency-test.sh        the runner; wired into npm test and npm run competency:test
COMPETENCY-ANALYTICS.md           this report
```

Modified:

```
server/index.mjs        two routes (handleAnalytics, handleExplainAnalytics), the
                        scope parser, the analytics failure-status map; the assessment
                        submit response carries the per-question `answers` rollup
server/ai/provider.mjs  a new generateText() sharing the existing provider selection
server/ai/local.mjs     a format:'text' option, so the explanation comes back as prose
                        rather than being forced into JSON on Ollama (a real bug fix)
src/lib/progress.ts     submitAssessment's return type gained answers + analytics
src/components/progress-provider.tsx  sitAssessment now returns the answer rollup
src/pages/demo-pages.tsx  the CompetencyGapSection is rendered (live only); an
                        "Answer breakdown" card added to the report screen
server/smoke-test.sh    the analytics HTTP surface and the explain failure paths
server/.env.example     the COMPETENCY_TARGETS placeholder and its documentation
AUTH-SETUP.md           the two new endpoints in the endpoint table
package.json            competency:test script, added to the test chain
```

`server/progress.mjs`'s three-band scale (`strong`/`average`/`needs-work`) is
**untouched**. The new four-level scale is additive and server-owned; the two read the
same two counts, so they cannot contradict each other on the arithmetic, only on how
coarsely it is described. That is what keeps every existing screen reading the same
words it did before — the drift guard in `server/taxonomy-check.mjs` enforces it.

## 8. Tests — what has run, and what is written and pending

**Executed and passing (full `npm test` run on the Mac):**

```
npm run typecheck              exit 0 — clean
engine                         116 passed, 0 failed
competency                     27 passed, 0 failed
auth / HTTP (incl. analytics)  all passed
ai                             passed
render                         passed
```

The analytics HTTP surface passed in full: the `/api/analytics/competencies`
endpoint (401, 200 with the published scale, the demo-label disclaimer, no key or
answer-key leak, `scope=latest`, bad-scope→400, read-only→405) and the
`/api/analytics/explain` failure paths (401, 403, 503 with the exact wording, 409
no-data with the analysis still attached).

The 27 checks are exactly the cases §21 names, run against the real
`server/competency.mjs` and `server/ai/explain.mjs`: gap 80/55→25, no-gap 80/85→0,
on-target→0; the four cut-offs (80→strong, 60→good, 40→needs-improvement, 39→weak) and
the unrated floor; topic scoring by summed counts with the question count attached; the
same topic across two attempts collapsing to one row; competency aggregation that sums
counts rather than averaging percentages; the gap and status riding on the aggregate;
the priority formula and its confidence slope; the whole-summary shape (gaps sorted,
priorities ordered, trend from real attempts); the demonstration-target labelling and
an override flipping `custom`; and every missing-data case — no attempts, missing topic
name, unknown competency, zero questions — proven not to crash. Plus the
`unsupportedFigures` guard: a present figure passes, an invented one is flagged, ±1
rounding is tolerated, a "N points" claim is checked the same way, and plain prose
passes.

**One fix the first full run caught.** The initial run surfaced two failures, both in
pre-existing forgery-rejection assertions rather than in the analytics engine: the
save-attempt and submit responses had been given an inline copy of the whole analytics
summary, and that summary legitimately names every competency (including one the paper
never tested) and carries a trend point from an earlier perfect attempt — so a blunt
"the forged value is not echoed back" grep tripped on real data. The inline analytics
was removed from both responses: no page consumed it (the Dashboard fetches the
analysis from `GET /api/analytics/competencies`, and the report screen uses only the
`answers` rollup), so the response contract is now minimal and the forgery tests stay
meaningful. Re-run clean.

**Action for you on your Mac:**

```
cd ~/Documents/SIH26101/statskill-mac
npm run typecheck
npm test
npm run build      # cannot run in the sandbox: Linux aarch64 vs the macOS rollup binary
```

I will not claim the smoke-test additions pass until they have actually run against a
booted server. Everything above the "written but not yet re-run" line has been executed
and is green.

## 9. What this does not do

**Targets are demonstration data, not an official standard.** They are defensible
defaults, configurable in one place, and labelled as demonstration everywhere they
appear. Wiring them to a real FRAC / iGOT Karmayogi requirement is a data-source task,
not a code task, and was out of scope.

**Two levels, not three.** No subtopic tier is produced, because no question carries a
third label. If questions ever gain one, the engine groups by whatever label the
attempt stores and the third level would appear without a rewrite.

**The explanation guard is a figure check, not a fact check.** It guarantees the model
quotes no number the server did not calculate. It does not verify that the *prose* around
those numbers is a fair reading of them — that is a smaller surface than an ungrounded
paragraph, but it is not zero. The charts, which need no model, are the source of truth.

**Question quality is still not asserted**, exactly as with generation: the pipeline is
tested, the pedagogy is a human judgement.

**No test has spoken to a real Ollama for the explanation.** The guard and the failure
paths are proven against a mock provider and a dead port; a real gpt-oss:20b returning
prose the guard accepts is the manual check, the same as for generation.
