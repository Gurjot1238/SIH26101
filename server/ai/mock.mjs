import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ProviderError } from './gemini.mjs';

export const providerName = 'mock';

export function isConfigured(env = process.env) {
  return Boolean((env.AI_MOCK_FILE ?? '').trim() || (env.AI_MOCK_DIR ?? '').trim());
}

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
