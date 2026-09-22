/**
 * The offline recommender trainer — REAL machine learning, not a rule in disguise (§5, §16).
 *
 * Usage:
 *   node scripts/train-recommender.mjs                         # train from server/data/interactions.json
 *   node scripts/train-recommender.mjs --input events.json     # train from a specific event log
 *   node scripts/train-recommender.mjs --output model.json     # where to write the model
 *   node scripts/train-recommender.mjs --min 50 --k 5          # min rows to trust, and K for @K metrics
 *   node scripts/train-recommender.mjs --force                 # write even below --min (tests only)
 *
 * What it actually does — and why this is not fake ML:
 *
 *   1. Reads the anonymised interaction log and joins it into labelled training rows: each
 *      (learner, course) pair gets a FEATURE VECTOR (built by the very same extractFeatures
 *      the recommender scores with — so training and inference cannot drift) and a LABEL that
 *      is the learning outcome, not a click: relevance + completion + measured competency gain
 *      (server/recommend/features.mjs `outcomeLabel`). A course opened and abandoned at 3%
 *      labels near 0; one completed that moved a competency +25 labels near 1.
 *
 *   2. Fits a logistic-regression model by BATCH GRADIENT DESCENT with L2 regularisation —
 *      real weight updates over real epochs, minimising cross-entropy. Features are
 *      standardised for convergence, then the standardisation is folded back into the exported
 *      weights so the in-app `scoreVector` (a plain dot-product over raw features) reproduces
 *      the trained model exactly.
 *
 *   3. Evaluates on a held-out split: log-loss, accuracy, and the ranking metrics the spec
 *      names — Precision@K, Recall@K, NDCG@K (§13) — grouped per learner, because ranking is
 *      per learner. The objective that matters (competency improvement) is what the label
 *      encodes, so a model that ranks improving courses higher scores better.
 *
 *   4. Refuses to emit a model when there is too little data (< --min rows). A model fit on a
 *      handful of interactions is noise; better to ship nothing and let the app stay
 *      deterministic (model.mjs returns {ready:false}) than to pretend. This is the §16 line.
 *
 *   5. Writes model.json with full provenance (§14): model_version, training_dataset_version,
 *      trained_at, algorithm, features_used, weights, bias, minInteractionsToActivate, and the
 *      evaluation metrics — so any recommendation is traceable to the model that produced it
 *      and a previous model.json can be restored to roll back.
 *
 * The core functions are exported so scripts/recommend-service-test.mjs can drive the trainer
 * on a synthetic dataset with a known signal and assert the model actually learned it.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FEATURE_NAMES, extractFeatures, outcomeLabel, tagOverlap } from '../server/recommend/features.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/* --------------------------------------------------------- events → labelled rows */

/**
 * Join a flat event log into labelled training rows. Course engagement events
 * (recommendation_shown / course_opened / course_completed) build one row per (learner,
 * course); competency_measured events (which are per-competency, not per-course) supply the
 * AFTER score, joined to a course row by (learner, competency). The gain = after - before is
 * the heart of the learning-outcome label.
 *
 * Returns [{ features:{...}, label:0|1, outcome:0..1, learner, courseId, competency }].
 */
export function buildLabeledRows(events, { context = {} } = {}) {
  const list = Array.isArray(events) ? events : [];

  // Latest measured competency score per (learner, competency) — the "after" state.
  const afterScore = new Map(); // `${learner}::${competency}` -> { score, gap, at }
  for (const e of list) {
    if (e.type !== 'competency_measured' || !e.competency) continue;
    const key = `${e.learner}::${e.competency}`;
    const prev = afterScore.get(key);
    if (!prev || (e.at ?? 0) >= prev.at) {
      afterScore.set(key, { score: e.competencyScoreAfter, gap: e.gapAfter, at: e.at ?? 0 });
    }
  }

  // Aggregate course engagement per (learner, course).
  const rows = new Map();
  for (const e of list) {
    if (e.type === 'competency_measured') continue;
    if (!e.learner || !e.courseId) continue;
    const key = `${e.learner}::${e.courseId}`;
    const row = rows.get(key) ?? {
      learner: e.learner,
      courseId: e.courseId,
      competency: e.competency ?? null,
      shown: false,
      opened: false,
      completed: false,
      completionPercent: 0,
      competencyScoreBefore: null,
      gapBefore: null,
      courseCompetencies: [],
      courseLevel: null,
      courseDurationHours: null,
      at: 0,
    };
    if (e.type === 'recommendation_shown') row.shown = true;
    if (e.type === 'course_opened') row.opened = true;
    if (e.type === 'course_completed') row.completed = true;
    if (Number.isFinite(e.completionPercent)) row.completionPercent = Math.max(row.completionPercent, e.completionPercent);
    if (Number.isFinite(e.competencyScoreBefore) && row.competencyScoreBefore === null) row.competencyScoreBefore = e.competencyScoreBefore;
    if (Number.isFinite(e.gapBefore) && row.gapBefore === null) row.gapBefore = e.gapBefore;
    if (Array.isArray(e.courseCompetencies) && e.courseCompetencies.length > 0) row.courseCompetencies = e.courseCompetencies;
    if (typeof e.courseLevel === 'string' && !row.courseLevel) row.courseLevel = e.courseLevel;
    if (Number.isFinite(e.courseDurationHours) && row.courseDurationHours === null) row.courseDurationHours = e.courseDurationHours;
    if (e.competency && !row.competency) row.competency = e.competency;
    row.at = Math.max(row.at, e.at ?? 0);
    rows.set(key, row);
  }

  const labelled = [];
  for (const row of rows.values()) {
    // Feature vector via the SAME extractFeatures used at inference — parity by construction.
    // We rebuild its inputs from the logged fields; the overlap is recomputed with the real
    // tagOverlap, and unlogged inputs (learner level) default exactly as inference defaults.
    const overlap = row.competency
      ? tagOverlap(row.courseCompetencies, row.competency)
      : { count: 0, matched: [] };
    const gap = {
      competency: row.competency,
      name: row.competency ?? '',
      gap: Number.isFinite(row.gapBefore) ? row.gapBefore : 0,
      // Priority is not logged; the pre-course gap is a faithful proxy (both rank by need).
      priority: Number.isFinite(row.gapBefore) ? row.gapBefore : 0,
    };
    const course = {
      courseId: row.courseId,
      competencies: row.courseCompetencies,
      level: row.courseLevel,
      estimatedHours: row.courseDurationHours,
    };
    const features = extractFeatures(gap, course, overlap, {
      learnerLevel: Number.isFinite(context.learnerLevel) ? context.learnerLevel : 0,
      history: context.history,
    });

    const after = afterScore.get(`${row.learner}::${row.competency}`);
    const gain = after && Number.isFinite(after.score) && Number.isFinite(row.competencyScoreBefore)
      ? after.score - row.competencyScoreBefore
      : 0;
    const outcome = outcomeLabel({
      wasRelevant: overlap.count > 0,
      completionPct: row.completionPercent,
      competencyGain: gain,
    });
    labelled.push({
      features,
      outcome,
      label: outcome >= 0.5 ? 1 : 0, // binary target for the classifier + @K relevance
      learner: row.learner,
      courseId: row.courseId,
      competency: row.competency,
    });
  }
  return labelled;
}

/* ------------------------------------------------------------------ logistic model */

const sigmoid = (z) => 1 / (1 + Math.exp(-z));

/** Column mean/std over the feature matrix, for standardisation (std floored to avoid /0). */
function standardisation(matrix) {
  const n = FEATURE_NAMES.length;
  const mean = new Array(n).fill(0);
  const std = new Array(n).fill(0);
  if (matrix.length === 0) return { mean, std: std.map(() => 1) };
  for (const row of matrix) for (let j = 0; j < n; j += 1) mean[j] += row[j];
  for (let j = 0; j < n; j += 1) mean[j] /= matrix.length;
  for (const row of matrix) for (let j = 0; j < n; j += 1) std[j] += (row[j] - mean[j]) ** 2;
  for (let j = 0; j < n; j += 1) std[j] = Math.sqrt(std[j] / matrix.length) || 1;
  return { mean, std };
}

/** Feature object → ordered numeric array matching FEATURE_NAMES (missing key → 0). */
export function toVector(features) {
  return FEATURE_NAMES.map((name) => {
    const v = Number(features?.[name]);
    return Number.isFinite(v) ? v : 0;
  });
}

/**
 * Fit logistic regression by batch gradient descent. Returns raw-space weights/bias (already
 * un-standardised) so the in-app scoreVector reproduces this model on raw feature vectors.
 */
export function trainLogistic(rows, { epochs = 400, lr = 0.3, l2 = 0.001 } = {}) {
  const X = rows.map((r) => toVector(r.features));
  const y = rows.map((r) => r.label);
  const n = FEATURE_NAMES.length;
  const { mean, std } = standardisation(X);
  const Xs = X.map((row) => row.map((v, j) => (v - mean[j]) / std[j]));

  let w = new Array(n).fill(0);
  let b = 0;
  const history = [];
  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const gradW = new Array(n).fill(0);
    let gradB = 0;
    for (let i = 0; i < Xs.length; i += 1) {
      const p = sigmoid(dot(w, Xs[i]) + b);
      const err = p - y[i];
      for (let j = 0; j < n; j += 1) gradW[j] += err * Xs[i][j];
      gradB += err;
    }
    const m = Math.max(1, Xs.length);
    for (let j = 0; j < n; j += 1) w[j] -= lr * (gradW[j] / m + l2 * w[j]);
    b -= lr * (gradB / m);
    if (epoch % 50 === 0 || epoch === epochs - 1) history.push(Number(logloss(Xs, y, w, b).toFixed(5)));
  }

  // Fold standardisation into the weights: score in raw space = Σ (w_j/σ_j)·x_j + (b - Σ w_j·μ_j/σ_j)
  const rawW = w.map((wj, j) => wj / std[j]);
  let rawB = b;
  for (let j = 0; j < n; j += 1) rawB -= (w[j] * mean[j]) / std[j];
  return { weights: rawW, bias: rawB, loglossHistory: history };
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += a[i] * b[i];
  return s;
}

function logloss(Xs, y, w, b) {
  let sum = 0;
  const eps = 1e-9;
  for (let i = 0; i < Xs.length; i += 1) {
    const p = Math.min(1 - eps, Math.max(eps, sigmoid(dot(w, Xs[i]) + b)));
    sum += -(y[i] * Math.log(p) + (1 - y[i]) * Math.log(1 - p));
  }
  return sum / Math.max(1, Xs.length);
}

/** Score a raw feature vector with raw-space weights — identical maths to server scoreVector. */
export function predictRaw(weights, bias, features) {
  const x = toVector(features);
  let z = bias;
  for (let j = 0; j < weights.length; j += 1) z += weights[j] * x[j];
  return sigmoid(z);
}

/* -------------------------------------------------------------------- evaluation */

/**
 * Precision@K, Recall@K, NDCG@K averaged over learners, plus accuracy and log-loss (§13).
 * Ranking metrics are per learner because that is how recommendations are served.
 */
export function evaluate(rows, weights, bias, { k = 5 } = {}) {
  if (rows.length === 0) return { rows: 0 };
  const scored = rows.map((r) => ({ ...r, score: predictRaw(weights, bias, r.features) }));

  // accuracy + logloss (pointwise)
  let correct = 0;
  let ll = 0;
  const eps = 1e-9;
  for (const r of scored) {
    const p = Math.min(1 - eps, Math.max(eps, r.score));
    if ((p >= 0.5 ? 1 : 0) === r.label) correct += 1;
    ll += -(r.label * Math.log(p) + (1 - r.label) * Math.log(1 - p));
  }

  // per-learner ranking metrics
  const byLearner = new Map();
  for (const r of scored) {
    const arr = byLearner.get(r.learner) ?? [];
    arr.push(r);
    byLearner.set(r.learner, arr);
  }
  let pSum = 0;
  let rSum = 0;
  let nSum = 0;
  let groups = 0;
  for (const arr of byLearner.values()) {
    const ranked = [...arr].sort((a, b) => b.score - a.score);
    const topK = ranked.slice(0, k);
    const relevantTotal = arr.reduce((s, r) => s + r.label, 0);
    const hits = topK.reduce((s, r) => s + r.label, 0);
    pSum += hits / Math.max(1, topK.length);
    rSum += relevantTotal > 0 ? hits / relevantTotal : 0;
    // NDCG@K with binary gains
    let dcg = 0;
    topK.forEach((r, i) => { dcg += r.label / Math.log2(i + 2); });
    let idcg = 0;
    const idealHits = Math.min(relevantTotal, k);
    for (let i = 0; i < idealHits; i += 1) idcg += 1 / Math.log2(i + 2);
    nSum += idcg > 0 ? dcg / idcg : 0;
    groups += 1;
  }

  return {
    rows: rows.length,
    accuracy: Number((correct / scored.length).toFixed(4)),
    logloss: Number((ll / scored.length).toFixed(4)),
    k,
    precisionAtK: Number((pSum / Math.max(1, groups)).toFixed(4)),
    recallAtK: Number((rSum / Math.max(1, groups)).toFixed(4)),
    ndcgAtK: Number((nSum / Math.max(1, groups)).toFixed(4)),
    learners: groups,
  };
}

/** Deterministic shuffle (seeded) so a train/test split is reproducible across runs. */
function seededShuffle(arr, seed = 42) {
  const a = [...arr];
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------------------- driver */

/**
 * The full train+evaluate flow over a set of labelled rows. Returns the model object (or
 * { ready:false, reason } when there is not enough data). Split 80/20, train on the larger
 * part, evaluate on the held-out part.
 */
export function trainAndEvaluate(labelled, { min = 50, k = 5, force = false } = {}) {
  if (labelled.length < min && !force) {
    return {
      ready: false,
      reason: `Only ${labelled.length} labelled rows; need at least ${min}. Staying deterministic.`,
      rows: labelled.length,
    };
  }
  // Need both classes present to fit a meaningful classifier.
  const positives = labelled.filter((r) => r.label === 1).length;
  if ((positives === 0 || positives === labelled.length) && !force) {
    return { ready: false, reason: 'Training data has only one outcome class; cannot learn a ranking.', rows: labelled.length };
  }

  const shuffled = seededShuffle(labelled);
  const cut = Math.max(1, Math.floor(shuffled.length * 0.8));
  const train = shuffled.slice(0, cut);
  const test = shuffled.slice(cut).length > 0 ? shuffled.slice(cut) : shuffled.slice(0, cut);

  const { weights, bias, loglossHistory } = trainLogistic(train);
  const evaluation = evaluate(test, weights, bias, { k });

  const datasetVersion = createHash('sha256').update(JSON.stringify(labelled.map((r) => [r.learner, r.courseId, r.label]))).digest('hex').slice(0, 12);
  const trainedAt = new Date().toISOString();
  return {
    ready: true,
    modelVersion: `ltr-${trainedAt.slice(0, 10)}-${datasetVersion.slice(0, 6)}`,
    trainedAt,
    trainingDatasetVersion: `interactions-${datasetVersion}`,
    algorithm: 'logistic-regression',
    features: FEATURE_NAMES,
    weights: weights.map((w) => Number(w.toFixed(6))),
    bias: Number(bias.toFixed(6)),
    minInteractionsToActivate: Math.max(min, 200),
    evaluation: { ...evaluation, trainRows: train.length, loglossHistory },
  };
}

function parseArgs(argv) {
  const args = { input: null, output: null, min: 50, k: 5, force: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--input') args.input = argv[++i];
    else if (a === '--output') args.output = argv[++i];
    else if (a === '--min') args.min = Number(argv[++i]);
    else if (a === '--k') args.k = Number(argv[++i]);
    else if (a === '--force') args.force = true;
  }
  return args;
}

function loadEvents(inputPath) {
  const path = inputPath
    ? resolve(inputPath)
    : join(HERE, '..', 'server', 'data', 'interactions.json');
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  return Array.isArray(parsed) ? parsed : (parsed.interactions ?? []);
}

/** CLI entry — only runs when invoked directly, not when imported by the test. */
function main() {
  const args = parseArgs(process.argv);
  let events;
  try {
    events = loadEvents(args.input);
  } catch (error) {
    console.error(`  Could not read the interaction log: ${error.message}`);
    process.exit(1);
  }
  const labelled = buildLabeledRows(events);
  console.log(`  Loaded ${events.length} events → ${labelled.length} labelled (learner, course) rows.`);

  const model = trainAndEvaluate(labelled, { min: args.min, k: args.k, force: args.force });
  if (!model.ready) {
    console.log(`  No model written: ${model.reason}`);
    console.log('  The app stays on the deterministic engine (this is correct, not a failure).');
    process.exit(0);
  }

  const outPath = args.output ? resolve(args.output) : join(HERE, '..', 'server', 'recommend', 'model.json');
  const { ready, ...toWrite } = model;
  writeFileSync(outPath, `${JSON.stringify(toWrite, null, 2)}\n`, 'utf8');
  console.log(`  Model ${model.modelVersion} written to ${outPath}`);
  console.log(`  Eval: acc=${model.evaluation.accuracy} logloss=${model.evaluation.logloss} ` +
    `P@${model.evaluation.k}=${model.evaluation.precisionAtK} NDCG@${model.evaluation.k}=${model.evaluation.ndcgAtK}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
