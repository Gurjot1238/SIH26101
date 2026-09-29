import {
  MAX_QUESTION_CHARS,
  documentSentences,
  matchKey,
  validateBatch,
} from './validation.mjs';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with',
  'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'that', 'this', 'these',
  'those', 'it', 'its', 'their', 'they', 'them', 'which', 'who', 'whom', 'whose', 'what',
  'when', 'where', 'why', 'how', 'not', 'no', 'so', 'than', 'then', 'each', 'every', 'any',
  'all', 'some', 'more', 'most', 'such', 'has', 'have', 'had', 'can', 'may', 'must', 'will',
  'would', 'should', 'could', 'into', 'over', 'under', 'between', 'within', 'against', 'per',
  'about', 'before', 'after', 'during', 'while', 'because', 'if', 'whether', 'both', 'either',
]);

const BLANK = '_____';
const STEM_PREFIX = 'Fill in the blank from the material: ';

function isNumeric(core) {
  return /^\d[\d.,]*%?$/.test(core);
}

function tokenize(sentence) {
  const out = [];
  const pattern = /[A-Za-z0-9][A-Za-z0-9.,'%-]*/g;
  let match;
  while ((match = pattern.exec(sentence)) !== null) {
    const raw = match[0];
    const core = raw.replace(/^[.,'%-]+/, '').replace(/[.,'-]+$/, '');
    if (core === '') continue;
    const startInRaw = raw.indexOf(core);
    const start = match.index + startInRaw;
    out.push({ core, start, end: start + core.length });
  }
  return out;
}

function blankOut(sentence, term) {
  return `${sentence.slice(0, term.start)}${BLANK}${sentence.slice(term.end)}`;
}

function isBlankable(core) {
  if (isNumeric(core)) return true;
  const key = core.toLowerCase();
  if (STOPWORDS.has(key)) return false;
  if (/^[A-Z][a-z]+/.test(core)) return true;
  return core.length >= 5;
}

function blankPriority(core) {
  if (isNumeric(core)) return 0;
  if (/^[A-Z]/.test(core)) return 1;
  return 2;
}

function buildPools(sentences) {
  const numbers = new Map();
  const wordsPool = new Map();
  for (const sentence of sentences) {
    for (const { core } of tokenize(sentence)) {
      if (isNumeric(core)) {
        const key = matchKey(core);
        if (key !== '' && !numbers.has(key)) numbers.set(key, core);
      } else {
        const key = matchKey(core);
        if (key === '' || STOPWORDS.has(core.toLowerCase()) || core.length < 4) continue;
        if (!wordsPool.has(key)) wordsPool.set(key, core);
      }
    }
  }
  return { numbers: [...numbers.values()], words: [...wordsPool.values()] };
}

function pickDistractors(answer, pool, excludeKeys) {
  const answerKey = matchKey(answer);
  const seen = new Set([answerKey]);
  const ranked = pool
    .filter((candidate) => {
      const key = matchKey(candidate);
      return key !== '' && key !== answerKey && !excludeKeys.has(key) && candidate.length <= 200;
    })
    .sort((a, b) => Math.abs(a.length - answer.length) - Math.abs(b.length - answer.length));

  const chosen = [];
  for (const candidate of ranked) {
    const key = matchKey(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    chosen.push(candidate);
    if (chosen.length === 3) break;
  }
  return chosen;
}

function topicForSentence(sentence, allowedTopics, preferOrder) {
  const sentenceKeys = new Set(matchKey(sentence).split(' ').filter(Boolean));
  if (Array.isArray(allowedTopics) && allowedTopics.length > 0) {
    let best = allowedTopics[0];
    let bestScore = -1;
    let bestRank = Infinity;
    for (const topic of allowedTopics) {
      const topicWords = matchKey(topic).split(' ').filter(Boolean);
      let overlap = 0;
      for (const word of topicWords) if (sentenceKeys.has(word)) overlap += 1;
      const rank = preferOrder.get(topic) ?? Infinity;
      if (overlap > bestScore || (overlap === bestScore && rank < bestRank)) {
        best = topic;
        bestScore = overlap;
        bestRank = rank;
      }
    }
    return best;
  }
  let topicWord = '';
  for (const { core } of tokenize(sentence)) {
    if (isNumeric(core)) continue;
    if (STOPWORDS.has(core.toLowerCase())) continue;
    if (core.length > topicWord.length) topicWord = core;
  }
  return topicWord;
}

export function buildBackfillCandidates(text, { allowedTopics = [], preferTopics = [] } = {}) {
  const sentences = documentSentences(text).filter((s) => s.trim().length >= 30);
  const pools = buildPools(sentences);
  const preferOrder = new Map(preferTopics.map((topic, index) => [topic, index]));

  const candidates = [];
  for (const sentence of sentences) {
    if (STEM_PREFIX.length + sentence.length + 2 > MAX_QUESTION_CHARS) continue;

    const topic = topicForSentence(sentence, allowedTopics, preferOrder);
    if (!topic || topic.trim() === '') continue;

    const sentenceKeys = new Set(tokenize(sentence).map((t) => matchKey(t.core)).filter(Boolean));

    const terms = tokenize(sentence)
      .filter((t) => isBlankable(t.core))
      .sort((a, b) => blankPriority(a.core) - blankPriority(b.core) || a.start - b.start);

    for (const term of terms) {
      const answer = term.core;
      const pool = isNumeric(answer) ? pools.numbers : pools.words;
      const distractors = pickDistractors(answer, pool, sentenceKeys);
      if (distractors.length < 3) continue;

      const stem = `${STEM_PREFIX}${blankOut(sentence, term)}`;
      if (stem.length < 20 || stem.length > MAX_QUESTION_CHARS) continue;

      const options = [answer, ...distractors];
      const correctIndex = answer.length % 4;
      if (correctIndex !== 0) {
        [options[0], options[correctIndex]] = [options[correctIndex], options[0]];
      }

      const explanation = `The blanked word in this sentence from the material is "${answer}".`;

      candidates.push({
        question: stem,
        options,
        correctIndex,
        topic,
        kind: 'cloze',
        explanation,
        source: sentence,
        _prefRank: preferOrder.get(topic) ?? Infinity,
      });
    }
  }

  candidates.sort((a, b) => a._prefRank - b._prefRank);
  return candidates.map(({ _prefRank, ...rest }) => rest);
}

export function generateBackfill(text, documentIndex, { need, existing = [], allowedTopics = [], preferTopics = [], requestedDifficulty = null }) {
  if (!Number.isInteger(need) || need <= 0) return { accepted: [], asked: 0, rejected: 0 };

  const candidates = buildBackfillCandidates(text, { allowedTopics, preferTopics });
  const { accepted } = validateBatch(candidates, documentIndex, { existing, allowedTopics, requestedDifficulty });
  return {
    accepted: accepted.slice(0, need),
    asked: candidates.length,
    rejected: candidates.length - accepted.length,
  };
}
