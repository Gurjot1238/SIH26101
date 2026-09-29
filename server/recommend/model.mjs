import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

function resolveModelPath(env = process.env) {
  if (env.NEXORA_MODEL_PATH) return resolve(env.NEXORA_MODEL_PATH);
  return join(HERE, 'model.json');
}

const REQUIRED_FIELDS = ['modelVersion', 'features', 'weights', 'bias'];

let cache = null;

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

export function resetModelCache() {
  cache = null;
}

export function scoreVector(model, featureVector) {
  let sum = Number.isFinite(model.bias) ? model.bias : 0;
  for (let i = 0; i < model.features.length; i += 1) {
    const value = Number(featureVector[model.features[i]] ?? 0);
    if (Number.isFinite(value)) sum += value * Number(model.weights[i] ?? 0);
  }
  return 1 / (1 + Math.exp(-sum));
}
