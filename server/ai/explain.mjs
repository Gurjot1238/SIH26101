/**
 * Put the competency analysis into sentences — without letting the model do arithmetic.
 *
 * Every number on the dashboard is computed in `server/competency.mjs` from stored
 * attempts. This module hands that finished object to the model and asks for prose. The
 * model is a writer here, not a calculator, and the difference matters: a language model
 * asked to "analyse these results" will cheerfully average two percentages and get it
 * wrong, and a wrong number in a friendly paragraph is more convincing — and so more
 * damaging — than a wrong number in a table.
 *
 * So the output is checked before it is returned. Every percentage and every "N points"
 * claim in the reply must be a figure that appears in the payload; anything else is an
 * invention. One corrective re-ask, then refusal. Refusing is the right failure: the page
 * already has the real numbers and can draw the whole dashboard without this paragraph.
 *
 *   { ok: true,  explanation: { paragraphs, text, provider, attempts } }
 *   { ok: false, code, message, unsupported? }
 *
 * `code` reuses the provider vocabulary (not_configured | timeout | rate_limited |
 * network_error | provider_error) plus `unverified` for a reply that failed the check,
 * so the route can map it to a status the same way it maps a generation failure.
 */

import { generateText } from './provider.mjs';
import { COMPETENCY_LABELS } from '../competency.mjs';

/** A local model is answering from a cold start, so allow the same headroom classification does. */
const EXPLAIN_TIMEOUT_MS = 180_000;
/** Enough for four short paragraphs. Anything longer is the model padding, and gets cut. */
const MAX_EXPLANATION_CHARS = 2_000;
/** Generate, then at most one corrective re-ask naming the invented figures. */
const MAX_ATTEMPTS = 2;

const EXPLAIN_ROLE = `You are a learning advisor for NEXORA AI, a competency development platform for statistical officers. You explain assessment results to the learner who took the assessment.`;

const EXPLAIN_RULES = `HARD RULES:
1. Every number has already been calculated for you. Use ONLY the numbers given below.
2. Do NOT calculate anything. Do not average, total, rank, convert or estimate any number. If a figure is not written in the data, do not write it.
3. Write to the learner as "you". Be direct and encouraging, never flattering.
4. Say what they are doing well, then what needs the most attention and why, then what to study next. Lead with the largest gap, because that is what the priority order below already reflects.
5. Where a competency is weak, name the specific topics listed under it as the reason. That is the most useful sentence in your answer.
6. If a competency is marked "not enough questions", say it has not been measured yet. Do NOT describe it as weak.
7. Four short paragraphs at most. Plain sentences. No headings, no bullet points, no markdown, no bold.`;

/** Percent claims and "N points" claims — the two ways a sentence asserts a figure. */
const PERCENT_CLAIM = /(\d+(?:\.\d+)?)\s*(?:%|per ?cent(?:age)?)/gi;
const POINTS_CLAIM = /(\d+(?:\.\d+)?)\s*(?:points?|marks?|pp\b)/gi;

/**
 * Every finite number anywhere in the payload, walked recursively.
 *
 * Deliberately indiscriminate. A narrower list (scores and gaps only) would reject the
 * model for quoting a target or a question count, which are legitimate things to quote,
 * and the cost of being broad is only that an invented figure which happens to collide
 * with some unrelated count slips through. That trade is the right way round: the guard
 * exists to catch arithmetic the model did itself, and arithmetic rarely lands on a
 * number already in the data.
 */
function collectNumbers(value, into = new Set()) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    into.add(round1(value));
    return into;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectNumbers(item, into);
    return into;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectNumbers(item, into);
  }
  return into;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

/**
 * Which figures in the reply were not in the data.
 *
 * Whole percentages are also matched against the number one above and below, because a
 * model rounding 66.7 to 67 is reporting the server's figure, not inventing one, and
 * refusing that would make the feature fail constantly for no safety gain.
 */
export function unsupportedFigures(text, allowed) {
  const claimed = [];
  for (const pattern of [PERCENT_CLAIM, POINTS_CLAIM]) {
    pattern.lastIndex = 0;
    for (const match of String(text).matchAll(pattern)) {
      const value = Number(match[1]);
      if (Number.isFinite(value)) claimed.push(round1(value));
    }
  }
  const unsupported = claimed.filter(
    (value) => !allowed.has(value) && !allowed.has(round1(value - 1)) && !allowed.has(round1(value + 1)),
  );
  return [...new Set(unsupported)];
}

function nameFor(row) {
  return row.name ?? COMPETENCY_LABELS[row.competency] ?? row.competency;
}

function describeTopics(topics, limit = 4) {
  if (!Array.isArray(topics) || topics.length === 0) return '      (no topic detail recorded)';
  return topics
    .slice(0, limit)
    .map(
      (topic) =>
        `      - ${topic.name}: ${topic.score}% (${topic.status}, ${topic.questionsAttempted} question${topic.questionsAttempted === 1 ? '' : 's'})`,
    )
    .join('\n');
}

/**
 * Flatten the analytics object into the few lines the model actually needs.
 *
 * Not `JSON.stringify(analytics)`: the payload carries trend points, priority inputs and
 * formula strings that are for the charts, and a small local model handed all of it
 * starts quoting fields at the learner. Fewer numbers in front of it is also fewer
 * numbers it can mangle.
 */
export function buildExplanationPrompt(analytics, { correction = null } = {}) {
  const lines = [];

  const overall = analytics.overall ?? {};
  lines.push(
    `OVERALL: ${overall.score ?? 0}% across ${overall.questionsAttempted ?? 0} answered questions, over ${analytics.attempts ?? 0} assessment${analytics.attempts === 1 ? '' : 's'}.`,
  );

  lines.push('', 'COMPETENCIES (current score, the level this role expects, and the shortfall):');
  for (const row of analytics.competencies ?? []) {
    lines.push(
      `  ${nameFor(row)} — you scored ${row.currentScore}%, target ${row.requiredScore}%, ` +
        `${row.gap === 0 ? 'no shortfall' : `${row.gap} points short`}, rated "${row.status}", ` +
        `from ${row.questionsAttempted} question${row.questionsAttempted === 1 ? '' : 's'}.`,
    );
    lines.push(describeTopics(row.topics));
  }

  if ((analytics.unmeasured ?? []).length > 0) {
    lines.push(
      '',
      `NOT YET MEASURED (no questions answered — do not call these weak): ${analytics.unmeasured.map(nameFor).join(', ')}.`,
    );
  }

  if ((analytics.priorities ?? []).length > 0) {
    lines.push(
      '',
      'STUDY ORDER (already calculated — follow it, do not re-rank):',
      ...analytics.priorities.map((row, index) => `  ${index + 1}. ${nameFor(row)}`),
    );
  }

  const requirement = analytics.requirement ?? {};
  if (requirement.custom === false) {
    lines.push(
      '',
      'NOTE: the target levels above are the platform default for demonstration, not an official government requirement. Do not claim they come from any framework.',
    );
  }

  const correctionBlock = correction
    ? `\nYOUR PREVIOUS ANSWER WAS REJECTED. It contained these figures, which are not in the data: ${correction.join(', ')}. Every number you write must appear in the DATA block exactly as written there. Rewrite the whole answer.\n`
    : '';

  return `${EXPLAIN_ROLE}

${EXPLAIN_RULES}
${correctionBlock}
DATA:
"""
${lines.join('\n')}
"""

Write the explanation now.`;
}

/** Strip a stray heading or bullet the model added anyway, then split into paragraphs. */
function toParagraphs(text) {
  return String(text)
    .replace(/\*\*/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter((paragraph) => paragraph !== '');
}

/**
 * Explain a competency summary in prose.
 *
 * `analytics` must be the object `buildAnalyticsSummary` returned on this request. It is
 * never taken from the browser: the whole guarantee here is that the numbers the model
 * saw are the numbers the server computed, and a payload that arrived over the wire
 * would make the guard meaningless.
 */
export async function explainAnalytics(analytics, { env = process.env, fetchImpl } = {}) {
  if (!analytics || typeof analytics !== 'object') {
    return { ok: false, code: 'no_data', message: 'There is no competency analysis to explain yet.' };
  }
  if ((analytics.competencies ?? []).length === 0) {
    return {
      ok: false,
      code: 'no_data',
      message: 'Complete an assessment first — there are no measured competencies to explain yet.',
    };
  }

  const allowed = collectNumbers(analytics);
  let correction = null;
  let lastUnsupported = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const outcome = await generateText(buildExplanationPrompt(analytics, { correction }), {
      env,
      fetchImpl,
      timeoutMs: EXPLAIN_TIMEOUT_MS,
      attempt,
    });

    if (!outcome.ok) {
      // A provider problem is not a verification problem — pass it straight through so
      // the page can say "not configured" or "try again" rather than blaming the model's
      // arithmetic for a missing key.
      return { ok: false, code: outcome.code, message: outcome.message, provider: outcome.provider };
    }

    const text = outcome.text.trim().slice(0, MAX_EXPLANATION_CHARS);
    const paragraphs = toParagraphs(text);
    if (paragraphs.length === 0) {
      lastUnsupported = [];
      correction = null;
      continue;
    }

    const unsupported = unsupportedFigures(paragraphs.join(' '), allowed);
    if (unsupported.length === 0) {
      return {
        ok: true,
        explanation: {
          paragraphs,
          text: paragraphs.join('\n\n'),
          provider: outcome.provider,
          attempts: attempt,
        },
      };
    }

    lastUnsupported = unsupported;
    correction = unsupported;
  }

  return {
    ok: false,
    code: 'unverified',
    message:
      'The AI wrote figures that are not in your results, so the summary was discarded. Your scores and charts above are calculated by the server and are unaffected.',
    unsupported: lastUnsupported,
  };
}
