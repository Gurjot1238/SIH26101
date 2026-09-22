/**
 * The recommendation model loader — and the honest truth about whether one exists yet.
 *
 * This is the file that keeps NEXORA from *faking* machine learning. There is exactly one
 * way the ML ranker becomes active: a real `model.json` produced by the offline training
 * pipeline is present on disk and parses. Until then `loadModel()` returns `{ ready: false }`
 * and every caller falls back to the deterministic rule-based engine. There is no
 * `if (score < 50) recommend` pretending to be a model anywhere in this codebase.
 *
 * WHY a JSON weights file rather than an in-process trainer: the app is a zero-runtime-
 * dependency Node/React stack (see the sandbox constraints) — it cannot run LightGBM,
 * XGBoost or a Python trainer. So training happens *offline* (a separate script on the
 * developer's machine, the same pattern the course-dataset builder already uses), and its
 * output is a small, inspectable JSON: the learned feature weights, the feature order they
 * apply to, the model version, and the offline evaluation metrics. In-app scoring is then a
 * plain, deterministic dot-product over the documented feature vector — genuinely the model
 * the pipeline trained, not a hand-tuned rule wearing an ML label.
 *
 * The model.json shape this loader accepts (all fields required for a model to be "ready"):
 *   {
 *     "modelVersion":        "ltr-2026.09-001",     // traceable, stored on every rec
 *     "trainedAt":           "2026-09-21T...Z",
 *     "trainingDatasetVersion": "interactions-2026.09-001",
 *     "algorithm":           "logistic-regression" | "lightgbm" | ...,
 *     "features":            ["competency_gap", "tag_overlap", ...],  // order matters
 *     "weights":             [0.83, 1.24, ...],       // aligned to `features`
 *     "bias":                -0.4,
 *     "minInteractionsToActivate": 200,   // guard: don't rank on near-empty data
 *     "evaluation":          { "ndcg@5": 0.71, "precision@5": 0.44, ... }
 *   }
 *
 * A file missing any required field is treated as *not ready* rather than trusted — a
 * half-specified model must never silently rank real learners.
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Where the trained model is expected. An env var wins; else server/recommend/model.json. */
function resolveModelPath(env = process.env) {
  if (env.NEXORA_MODEL_PATH) return resolve(env.NEXORA_MODEL_PATH);
  return join(HERE, 'model.json');
}

/** Every field a model.json must carry to be trusted for ranking. */
const REQUIRED_FIELDS = ['modelVersion', 'features', 'weights', 'bias'];

let cache = null;

/**
 * Load the trained model, or report honestly that there isn't one.
 *
 * Returns either:
 *   { ready: true,  model: {...}, path }      a valid, complete model.json
 *   { ready: false, reason: '...', path }     no file, unparseable, or incomplete
 *
 * Cached, because the file does not change while the server runs. `resetModelCache()` is
 * the test hook, mirroring `resetCoursesCache()`.
 */
export function loadModel(env = process.env) {
  if (cache) return cache;

  const path = resolveModelPath(env);
  if (!existsSync(path)) {
    cache = { ready: false, reason: 'No trained model is present; using the deterministic engine.', path };
    return cache;
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    cache = { ready: false, reason: 'The model file could not be parsed; using the deterministic engine.', path };
    return cache;
  }

  const missing = REQUIRED_FIELDS.filter((field) => raw[field] === undefined || raw[field] === null);
  if (missing.length > 0) {
    cache = { ready: false, reason: `The model file is missing: ${missing.join(', ')}.`, path };
    return cache;
  }
  if (!Array.isArray(raw.features) || !Array.isArray(raw.weights) || raw.features.length !== raw.weights.length) {
    cache = { ready: false, reason: 'The model file has a features/weights mismatch.', path };
    return cache;
  }

  cache = { ready: true, model: raw, path };
  return cache;
}

/** Test hook: forget any loaded model so a test can point at a fixture (or none). */
export function resetModelCache() {
  cache = null;
}

/**
 * Score one feature vector with a linear/logistic model: sigmoid(w·x + b).
 *
 * `featureVector` is a plain object keyed by feature name; the model's own `features` list
 * decides the order and which keys are read, so a learner-side vector carrying extra keys is
 * fine and a missing key contributes 0 (documented, not silent — the trainer must have used
 * the same default). This is the only place a "score" is computed, and it is exactly the
 * function the offline trainer optimises the weights for.
 */
export function scoreVector(model, featureVector) {
  let sum = Number.isFinite(model.bias) ? model.bias : 0;
  for (let i = 0; i < model.features.length; i += 1) {
    const value = Number(featureVector[model.features[i]] ?? 0);
    if (Number.isFinite(value)) sum += value * Number(model.weights[i] ?? 0);
  }
  // Logistic squash to a 0-1 usefulness probability. A tree model would export a different
  // `algorithm` and this function would branch; for the linear baseline this is the whole model.
  return 1 / (1 + Math.exp(-sum));
}
