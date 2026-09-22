# NEXORA AI — Personalized Course Recommendation Engine

This document is the set of written deliverables for the recommendation upgrade (spec §18). It
describes what was built, how it satisfies each section of the specification, and — just as
importantly — where the honest limits are. Every claim here was verified by running the code; the
verification commands are given at the end so you can reproduce them.

The guiding rule throughout: **the system produces genuine, explainable, competency-aware
recommendations, never random ones and never fake ML.** Where a real ML model cannot yet be
justified (there is not enough data), the system says so and stays on a deterministic engine rather
than pretending.

---

## 1. Architecture overview (§17)

The upgrade is *additive*. The original gap-based engine (`server/course-recommendations.mjs`) is
untouched in behaviour and still passes its own 13-check suite. Everything new sits on top of it
behind one façade, so callers never talk to an engine directly.

```
                       handleRecommendedCourses  (server/index.mjs)
                                    │  builds learner context from data already held
                                    ▼
                        RecommendationService.recommend()            server/recommend/service.mjs
                                    │  picks an engine, guarantees a valid, never-empty payload
                    ┌───────────────┼────────────────────────────┐
                    ▼               ▼                            ▼
            RuleBasedEngine   HybridEngine (default)        MLEngine (re-ranker)
                    │               │                            │  usable() only if a REAL
                    │        1. candidate generation             │  model.json exists AND
                    │           (rule engine)                    │  interactionCount ≥ threshold
                    │        2. quality filter  ──► quality.mjs (§6)
                    │        3. rank            ──► ML if usable, else deterministic order
                    │        4. explain         ──► explain.mjs (§9/§10)
                    ▼
            recommendCoursesForGaps()  ← the existing, proven engine (candidate source)
```

Offline, entirely separate from the request path:

```
   interactions.json (anonymised log)  ──►  scripts/train-recommender.mjs  ──►  model.json
        (§2 data)                            (§5 learning-to-rank, §13 eval)      (§14 provenance)
                                                     │
                                        refuses to emit a model on < 50 rows (§16)
```

**Module inventory** (`server/recommend/`, 1,479 lines total incl. trainer):

| File | Lines | Responsibility |
|------|------:|----------------|
| `service.mjs` | 382 | Service façade + Rule/Hybrid/ML engines + `refineRecommendations` pipeline |
| `quality.mjs` | 173 | §6 candidate quality/relevance rejection gate |
| `interactions.mjs` | 169 | §2/§15 anonymised event log: hash, allow-list, training rows |
| `features.mjs` | 135 | Shared feature definition used by BOTH training and inference |
| `model.mjs` | 117 | Honest model loader + `scoreVector`; `{ready:false}` when no real model |
| `explain.mjs` | 89 | §9/§10 human-readable evidence explanations + variable count |
| `scripts/train-recommender.mjs` | 414 | §5/§13/§14 REAL offline logistic-regression trainer + eval |

---

## 2. Training dataset — what is collected, what is never collected (§2, §15)

Every learning interaction is appended to `server/data/interactions.json` as one anonymised event.
The learner is identified by an **HMAC-SHA256 of the user id under `SESSION_SECRET`** — a stable
32-hex pseudonym that cannot be reversed to a user without the server secret, and that refuses to
be computed at all if the secret is missing (`anonymiseLearner`).

Events are rebuilt from an **allow-list** (`sanitizeEvent`), so a field is only ever stored if it
is explicitly permitted. The permitted fields are the learning signals the model needs:

`learner` (hash), `type`, `courseId`, `competency`, `competencyScoreBefore`, `gapBefore`,
`competencyScoreAfter`, `gapAfter`, `assessmentScore`, `completionPercent`, `courseLevel`,
`courseDurationHours`, `courseCompetencies`, `courseTopics`, `strategy`, `modelVersion`, `at`.

**Never stored — by construction, not by promise:** passwords, session tokens, API keys, email,
name, any raw document text. `forbiddenKeysIn` is a second, belt-and-braces guard that refuses to
log a raw event that even *carries* a forbidden field. Verified live: after a full signup → submit
→ recommend flow, the log contained only 32-hex learner hashes and **zero** banned keys.

Event types: `recommendation_shown`, `course_opened`, `lesson_read`, `course_completed`,
`competency_measured`.

## 3. The model learns outcomes, not clicks (§3)

The label is a **learning outcome**, computed by `outcomeLabel` as a blend of:

- `relevance` (0.2) — did the course's tags actually match the gap it was shown for,
- `completion` (0.3) — how much of the course the learner completed,
- `competency improvement` (0.5) — the measured before→after competency gain, capped at a +30 point gain.

A course that was clicked and abandoned at 3% labels near 0. A course that was completed and moved
a competency +25 points labels near 1. **Clicks alone never make a recommendation "good."** This is
why `recommendation_shown` logs the *before* competency and `competency_measured` (logged when the
learner next sits an assessment) logs the *after* — the two are joined per (learner, competency) to
recover the real gain (§11, below).

## 4. Hybrid signals (§4)

`extractFeatures` produces a 10-dimensional vector, identical in training and inference:

| Feature | Signal | Spec |
|---------|--------|------|
| `competency_gap` | how far below target the course's competency is | §4B competency-gap weighting |
| `competency_priority` | analytics' gap × weakness × confidence | §4B |
| `tag_overlap` / `tag_overlap_ratio` | how many subject tags match the gap | §4A relevance |
| `level_match` | course difficulty vs learner level | §4D difficulty-aware |
| `is_prerequisite_gap` | does this course unlock later ones | §4C prerequisite-aware |
| `course_hours_norm` | normalised effort | §4D |
| `already_started` / `prior_completion_pct` | the learner's own history with it | personalisation |
| `times_recommended_before` | fatigue signal | anti-repetition |

- **§4A (semantic, not just string match):** matching is done on a *controlled competency
  vocabulary* bridge (`COMPETENCY_TAGS` in `course-recommendations.mjs`) that maps the 5 MoSPI
  framework competencies to the dataset's ~30 subject tags by meaning, with `normalizeTag` folding
  casing/spacing so "Machine Learning" ≡ "machine-learning". It is not raw substring matching.
- **§4E (collaborative filtering):** deliberately **not** switched on. There is not enough
  multi-learner data to make it anything but noise, and inventing it would be fake ML.

## 5. Learning-to-rank pipeline (§5)

`HybridEngine.generate` runs the exact three stages the spec names:

1. **Candidate generation** — the proven rule engine proposes courses for each gap.
2. **Quality filtering** — `refineRecommendations` runs every candidate through the §6 gate.
3. **Ranking** — the ML re-ranker reorders *only if* a real model is usable; otherwise the
   deterministic gap-order is kept. The model is **logistic regression** (the spec's "start
   simple"), trained offline by batch gradient descent.

## 6. Quality & relevance gate (§6)

`validateCandidate` (in `quality.mjs`) rejects a candidate for any of seven concrete, testable
reasons, each surfaced in the response's `rejected` diagnostics:

`already_completed`, `unavailable`, `invalid_url`, `missing_prerequisites`, `too_advanced`
(only when prerequisites are also unmet), `low_relevance`, `duplicate` (title+tag+provider
similarity over threshold).

## 7. Course ingestion without retraining (§7)

`server/courses.mjs summarize()` was extended additively with `language`, `learningFormat`,
`prerequisites`, and `availability` (via `normaliseAvailability`). New courses added to the dataset
flow straight into candidate generation and the quality gate with no retraining required; the model
scores whatever feature vector a course produces. Missing metadata is defaulted, **never invented**.

## 8. Real URLs only, never invented (§8)

`hasValidUrl` requires a real `http(s)` URL with a host; a candidate without one is rejected as
`invalid_url` rather than shown with a fabricated link. Verified live: the top recommendation linked
to `https://ocw.mit.edu/courses/6-867-machine-learning-fall-2006/`, a real course page.

## 9. Human-readable explanations from real evidence (§9)

`explainRecommendation` builds a `summary` and a `why[]` list from **real evidence only**: the
learner's actual competency %, their weak topics from the assessment, the matched subject tags, the
difficulty fit, and any prerequisite role. Example produced live:

> **Recommended because your Inference competency is currently 0%, 75 points below target.**
> - Your assessment showed difficulty with Evidence and inference.
> - This course covers Machine Learning, Artificial Intelligence, Statistical Learning, which builds inference.
> - It is an advanced course, and your completed prerequisites qualify you for it.

Raw ML scores are **never** shown to the user.

## 10. Variable recommendation count by severity (§10)

`countForGap` returns more courses for worse gaps: gap ≥ 40 → 4, gap ≥ 20 → 3, else → 2, capped at
`MAX_TOTAL_RECOMMENDATIONS = 8` overall.

## 11. Learning feedback loop (§11)

The loop is wired end to end. `recommendation_shown` records `competencyScoreBefore` / `gapBefore`
at the moment a course is suggested; when the learner next submits an assessment,
`handleAssessmentSubmit` logs `competency_measured` with `competencyScoreAfter` / `gapAfter` per
competency. `buildLabeledRows` pairs before↔after per (learner, competency) to compute the real
improvement that becomes the training label. Verified live: both event types appear in the log.

## 12. Cold-start escalation (§12)

With no data, the service serves the **rule-based** engine. The ML re-ranker's `usable()` returns
false until *both* a real `model.json` exists *and* `interactionCount ≥ minInteractionsToActivate`.
So a new deployment is never blocked and never empty; ML switches on only when it is earned.

## 13. Evaluation metrics (§13)

`evaluate` computes, on a held-out 20% split, **Precision@K, Recall@K, NDCG@K** (per learner,
because ranking is per learner) plus accuracy and log-loss. These are written into `model.json` so
every model ships with its own evaluation.

## 14. Model versioning, traceability, rollback (§14)

`trainAndEvaluate` writes `modelVersion` (`ltr-YYYY-MM-DD-<hash>`), `trainingDatasetVersion`,
`trainedAt`, `algorithm`, `features`, `weights`, `bias`, `minInteractionsToActivate`, and the
`evaluation` block. Every recommendation carries the `modelVersion` that produced it (in `strategy`
and in the logged event). Rollback = restore a previous `model.json`.

## 15. Privacy (§15)

Covered in §2 above: anonymised HMAC learner ids, allow-listed minimum data, forbidden-key guard,
and a hard refusal to hash without a secret. No PII or document text is ever used as a feature.

## 16. This is NOT fake ML (§16)

This is the section the spec cared about most, so it gets the bluntest answer.

- There is **no** `if score < 50: recommend` masquerading as a model. The only place a model score
  is computed is `model.mjs scoreVector`, a genuine `sigmoid(w·x+b)` over trained weights.
- The trainer (`scripts/train-recommender.mjs`) is real: batch gradient descent minimising
  cross-entropy with L2 regularisation over real epochs, standardisation folded back into the
  exported weights so inference reproduces training exactly.
- The trainer **refuses to emit a model** on fewer than 50 labelled rows or a single outcome class.
  Run against the current real log it reports: *"Only 9 labelled rows; need at least 50. Staying
  deterministic."* — and no `model.json` is written.
- Because no trained model exists yet, `model.mjs` returns `{ready:false}`, the ML engine is not
  `usable()`, and the live system serves `hybrid:rule-based`. **ML activates only after real
  training and evaluation exist** — exactly the §16 line.

The unit tests prove both directions: one asserts the trainer *learns* that tag-overlap predicts a
good outcome (weights move the right way on a synthetic dataset with a known signal), and another
asserts it *refuses* thin data.

## 18. Incremental, non-destructive delivery (§18)

Existing code was inspected before writing (the rule engine, analytics, courses reader, store).
Nothing was replaced; every addition is additive and behind the service façade or a new module. The
original recommendation suite (13 checks) and the analytics/engine suites still pass unchanged.

---

## Verification — how to reproduce every claim

```bash
# Full suite — 694 checks across all suites, 0 failed
npm test

# Just the recommender service (30 checks incl. real-trainer tests)
npm run recommend-service:test

# Types
npm run typecheck

# The offline trainer against the real log — MUST refuse (proves §16, no fake ML)
node scripts/train-recommender.mjs
#   → "Only 9 labelled rows; need at least 50. Staying deterministic."
```

**Current honest state:** no `model.json` exists, so recommendations are served by the deterministic
hybrid pipeline (candidate → quality filter → gap-ordered), fully explained from real evidence. When
enough real interactions accumulate, run the trainer to produce a model; the ML re-ranker will then
activate automatically. Until then, the system is genuine, explainable, and competency-aware — and
it does not pretend to be more than it is.
