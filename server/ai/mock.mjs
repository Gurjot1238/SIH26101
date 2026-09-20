/**
 * A provider that returns canned text, so the pipeline can be tested without a key.
 *
 * This exists because every interesting failure in AI question generation is a failure
 * of *handling the response*: malformed JSON, three options instead of four, an answer
 * index of 7, a source sentence the document does not contain. Testing those against a
 * live model would be slow, costly, non-deterministic, and impossible in CI — and it
 * would test Google rather than this code.
 *
 * It is opt-in only: nothing selects it unless AI_PROVIDER is literally "mock". The
 * server prints a warning at startup when it is active and the API reports the provider
 * name in every response, so a mock run can never be mistaken for a real one.
 *
 *   AI_PROVIDER=mock
 *   AI_MOCK_FILE=/path/to/response.json      one canned reply, or
 *   AI_MOCK_DIR=/path/to/dir                 attempt-1.txt, attempt-2.txt, …
 *
 * The file contents are returned verbatim as the "model output", which is what lets a
 * test feed the validator deliberately broken JSON.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ProviderError } from './gemini.mjs';

export const providerName = 'mock';

export function isConfigured(env = process.env) {
  return Boolean((env.AI_MOCK_FILE ?? '').trim() || (env.AI_MOCK_DIR ?? '').trim());
}

/**
 * `attempt` lets one test drive the repair loop: attempt 1 can return something invalid
 * and attempt 2 something good, proving the retry path actually re-asks and recovers.
 */
export async function generateRaw(_prompt, { env = process.env, attempt = 1 } = {}) {
  const dir = (env.AI_MOCK_DIR ?? '').trim();
  if (dir !== '') {
    try {
      return readFileSync(join(dir, `attempt-${attempt}.txt`), 'utf8');
    } catch {
      throw new ProviderError('provider_error', `Mock provider has no canned reply for attempt ${attempt}.`);
    }
  }

  const file = (env.AI_MOCK_FILE ?? '').trim();
  if (file === '') {
    throw new ProviderError('not_configured', 'Mock provider needs AI_MOCK_FILE or AI_MOCK_DIR.');
  }

  // A canned reply of exactly this word simulates the provider being unreachable, which
  // is otherwise hard to arrange in a test that must not touch the network.
  const contents = readFileSync(file, 'utf8');
  if (contents.trim() === '__NETWORK_ERROR__') {
    throw new ProviderError('network_error', 'Could not reach the AI provider.');
  }
  if (contents.trim() === '__TIMEOUT__') {
    throw new ProviderError('timeout', 'The AI provider took too long to respond.');
  }
  if (contents.trim() === '__RATE_LIMITED__') {
    throw new ProviderError('rate_limited', 'The AI provider is rate limiting requests. Try again shortly.');
  }
  return contents;
}
