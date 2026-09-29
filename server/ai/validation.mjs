export const OPTION_COUNT = 4;

export const MIN_QUESTION_CHARS = 20;
export const MIN_EXPLANATION_CHARS = 15;
export const MIN_SOURCE_CHARS = 25;

export const MAX_QUESTION_CHARS = 320;
export const MAX_OPTION_CHARS = 220;
export const MAX_EXPLANATION_CHARS = 600;
export const MAX_SOURCE_CHARS = 900;

export const GROUNDING_THRESHOLD = 0.8;

const SNAP_WINDOW_SENTENCES = 2;

export const ANSWER_SUPPORT_THRESHOLD = 0.5;

const SHINGLE_SIZE = 2;

export const DUPLICATE_THRESHOLD = 0.75;

export const QUESTION_KINDS = ['statement', 'cloze', 'numeric', 'identify', 'scenario'];

export function normalizeForMatch(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/(\d),(?=\d\d\d(?!\d))/g, '$1')
    .replace(/[^a-z0-9.'"%\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(value) {
  const normalized = normalizeForMatch(value);
  if (normalized === '') return [];
  return normalized
    .split(' ')
    .map((token) => token.replace(/^[.'"%-]+/, '').replace(/[.'"%-]+$/, ''))
    .filter((token) => token !== '');
}

export function matchKey(value) {
  return words(value).join(' ');
}

export function shingles(value, size = SHINGLE_SIZE) {
  const list = words(value);
  if (list.length < size) return list.length === 0 ? new Set() : new Set([list.join(' ')]);
  const out = new Set();
  for (let index = 0; index + size <= list.length; index += 1) {
    out.add(list.slice(index, index + size).join(' '));
  }
  return out;
}

export function containmentRatio(part, whole) {
  const partShingles = part instanceof Set ? part : shingles(part);
  const wholeShingles = whole instanceof Set ? whole : shingles(whole);
  if (partShingles.size === 0) return 0;
  let hits = 0;
  for (const shingle of partShingles) {
    if (wholeShingles.has(shingle)) hits += 1;
  }
  return hits / partShingles.size;
}

export function spanSupport(span, text) {
  const needle = words(span);
  const hay = words(text);
  if (needle.length === 0 || hay.length === 0) return 0;

  if (needle.length <= 3) {
    for (let start = 0; start + needle.length <= hay.length; start += 1) {
      let matched = true;
      for (let offset = 0; offset < needle.length; offset += 1) {
        if (hay[start + offset] !== needle[offset]) {
          matched = false;
          break;
        }
      }
      if (matched) return 1;
    }
    return 0;
  }

  return containmentRatio(span, text);
}

export function similarity(left, right) {
  const a = shingles(left);
  const b = shingles(right);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const shingle of a) {
    if (b.has(shingle)) shared += 1;
  }
  return shared / (a.size + b.size - shared);
}

export function documentSentences(documentText) {
  const raw = String(documentText ?? '').replace(/\r\n?/g, '\n');
  const sentences = [];
  for (const block of raw.split(/\n[ \t]*\n+/)) {
    const paragraph = block.replace(/\s+/g, ' ').trim();
    if (paragraph === '') continue;
    for (const piece of paragraph.split(/(?<=[.!?])\s+/)) {
      const sentence = piece.trim();
      if (sentence !== '') sentences.push(sentence);
    }
  }
  return sentences;
}

export function digitsIn(value) {
  const out = new Set();
  const matches = normalizeForMatch(value).match(/\d+(?:\.\d+)?/g);
  if (matches) for (const match of matches) out.add(match);
  return out;
}

const ENTITY_EXEMPT = new Set([
  'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii',
]);

function isSentenceStart(text, index) {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const character = text[cursor];
    if (/[\s"'([{“‘]/.test(character)) continue;
    return /[.!?:;]/.test(character);
  }
  return true;
}

export function properNounsIn(value) {
  const text = String(value ?? '');
  const out = new Set();
  const pattern = /[A-Za-z][A-Za-z.'’-]*/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const token = match[0].replace(/[.'’-]+$/, '');
    if (token.length < 2) continue;
    if (!/^[A-Z]/.test(token)) continue;

    const capitals = (token.match(/[A-Z]/g) ?? []).length;
    const acronym = capitals >= 2;
    if (!acronym && isSentenceStart(text, match.index)) continue;

    const key = token.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (key.length < 2 || ENTITY_EXEMPT.has(key)) continue;
    out.add(key);
  }
  return out;
}

export function documentHasWord(word, documentIndex) {
  const set = documentIndex.wordSet;
  if (!set || word === '') return false;
  const bare = word.replace(/[^a-z0-9]/g, '');
  const forms = [word, bare, `${bare}s`, bare.replace(/s$/, ''), bare.replace(/'s$/, '')];
  return forms.some((form) => form !== '' && set.has(form));
}

export function buildDocumentIndex(documentText) {
  const normalized = normalizeForMatch(documentText);
  const sentences = documentSentences(documentText);
  const sentenceShingles = sentences.map((sentence) => shingles(sentence));

  const shingleIndex = new Map();
  sentenceShingles.forEach((set, index) => {
    for (const shingle of set) {
      let bucket = shingleIndex.get(shingle);
      if (!bucket) {
        bucket = new Set();
        shingleIndex.set(shingle, bucket);
      }
      bucket.add(index);
    }
  });

  return {
    normalized,
    shingles: shingles(normalized),
    length: normalized.length,
    sentences,
    sentenceShingles,
    shingleIndex,
    digits: digitsIn(documentText),
    wordSet: new Set(words(documentText)),
  };
}

export function snapToDocument(source, documentIndex) {
  const sentences = documentIndex.sentences ?? [];
  if (sentences.length === 0) return null;

  const sourceShingles = shingles(source);
  if (sourceShingles.size === 0) return null;

  const starts = new Set();
  for (const shingle of sourceShingles) {
    const bucket = documentIndex.shingleIndex?.get(shingle);
    if (!bucket) continue;
    for (const index of bucket) {
      starts.add(index);
      if (index > 0) starts.add(index - 1);
    }
  }

  let best = null;
  for (const start of starts) {
    for (let span = 1; span <= SNAP_WINDOW_SENTENCES; span += 1) {
      const end = start + span;
      if (end > sentences.length) break;
      const windowText = sentences.slice(start, end).join(' ');
      const ratio = containmentRatio(sourceShingles, windowText);
      if (
        best === null ||
        ratio > best.ratio ||
        (ratio === best.ratio && windowText.length < best.text.length)
      ) {
        best = { ratio, text: windowText };
      }
    }
  }

  if (!best || best.ratio < GROUNDING_THRESHOLD) return null;
  return best.text;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

export function parseProviderJson(raw) {
  if (!isNonEmptyString(raw)) return { ok: false, reason: 'The AI provider returned an empty response.' };

  let text = raw.trim();

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) text = fenced[1].trim();

  if (!text.startsWith('{')) {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first === -1 || last <= first) {
      return { ok: false, reason: 'The AI provider did not return JSON.' };
    }
    text = text.slice(first, last + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'The AI provider returned malformed JSON.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'The AI provider returned JSON that is not an object.' };
  }
  if (!Array.isArray(parsed.questions)) {
    return { ok: false, reason: 'The AI response has no "questions" array.' };
  }
  return { ok: true, questions: parsed.questions };
}

export function validateQuestion(raw, documentIndex, options = {}) {
  const { allowedTopics = null } = options;

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'not an object' };
  }

  const question = typeof raw.question === 'string' ? raw.question.trim() : '';
  const explanation = typeof raw.explanation === 'string' ? raw.explanation.trim() : '';
  const source = typeof raw.source === 'string' ? raw.source.trim() : '';
  const topic = typeof raw.topic === 'string' ? raw.topic.trim() : '';

  if (question.length < MIN_QUESTION_CHARS) return { ok: false, reason: 'question is missing or too short' };
  if (question.length > MAX_QUESTION_CHARS) return { ok: false, reason: 'question is too long' };

  if (!Array.isArray(raw.options)) return { ok: false, reason: 'options is not an array' };
  if (raw.options.length !== OPTION_COUNT) {
    return { ok: false, reason: `expected ${OPTION_COUNT} options, got ${raw.options.length}` };
  }

  const optionList = [];
  for (const option of raw.options) {
    if (typeof option !== 'string') return { ok: false, reason: 'an option is not a string' };
    const trimmed = option.trim();
    if (trimmed === '') return { ok: false, reason: 'an option is empty' };
    if (trimmed.length > MAX_OPTION_CHARS) return { ok: false, reason: 'an option is too long' };
    optionList.push(trimmed);
  }

  const seen = new Set();
  for (const option of optionList) {
    const key = matchKey(option);
    if (key === '') return { ok: false, reason: 'an option is empty once normalized' };
    if (seen.has(key)) return { ok: false, reason: 'two options are the same' };
    seen.add(key);
  }

  const correct = raw.correctIndex;
  if (!Number.isInteger(correct) || correct < 0 || correct >= OPTION_COUNT) {
    return { ok: false, reason: `correctIndex must be an integer 0-${OPTION_COUNT - 1}` };
  }

  if (explanation.length < MIN_EXPLANATION_CHARS) return { ok: false, reason: 'explanation is missing or too short' };
  if (explanation.length > MAX_EXPLANATION_CHARS) return { ok: false, reason: 'explanation is too long' };

  if (source.length < MIN_SOURCE_CHARS) return { ok: false, reason: 'source passage is missing or too short' };
  if (source.length > MAX_SOURCE_CHARS) return { ok: false, reason: 'source passage is too long' };

  if (topic === '') return { ok: false, reason: 'topic is missing' };
  if (topic.length > 80) return { ok: false, reason: 'topic is too long' };
  if (allowedTopics && allowedTopics.length > 0) {
    const known = allowedTopics.some((candidate) => matchKey(candidate) === matchKey(topic));
    if (!known) return { ok: false, reason: `topic "${topic}" is not one of the topics extracted from the document` };
  } else {
    const topicWords = words(topic);
    const substantial = topicWords.filter((word) => word.length >= 3);
    const checked = substantial.length > 0 ? substantial : topicWords;
    if (checked.length === 0 || checked.some((word) => !documentHasWord(word, documentIndex))) {
      return { ok: false, reason: `topic "${topic}" uses words the document does not` };
    }
  }

  let kind;
  if (raw.kind === undefined || raw.kind === null || raw.kind === '') {
    kind = 'statement';
  } else if (QUESTION_KINDS.includes(raw.kind)) {
    kind = raw.kind;
  } else {
    return { ok: false, reason: `unknown question kind "${String(raw.kind).slice(0, 40)}"` };
  }

  const grounded = snapToDocument(source, documentIndex);
  if (grounded === null) {
    return { ok: false, reason: 'the quoted source passage is not in the uploaded document' };
  }
  const groundedSource = grounded.trim();
  if (groundedSource.length > MAX_SOURCE_CHARS) {
    return { ok: false, reason: 'the matched source passage is too long' };
  }

  const answer = optionList[correct];

  const answerWords = words(answer);
  if (answerWords.length > 0 && answerWords.length <= 3) {
    if (spanSupport(answer, groundedSource) < 1) {
      return { ok: false, reason: 'the correct answer does not appear in the quoted source' };
    }
  } else if (kind === 'numeric' || kind === 'cloze' || kind === 'identify') {
    if (spanSupport(answer, groundedSource) < ANSWER_SUPPORT_THRESHOLD) {
      return { ok: false, reason: 'the correct answer does not appear in the quoted source' };
    }
  }

  const groundedDigits = digitsIn(groundedSource);
  for (const digit of digitsIn(answer)) {
    if (!groundedDigits.has(digit)) {
      return { ok: false, reason: 'the correct answer states a figure the source does not' };
    }
  }

  for (const digit of digitsIn(explanation)) {
    if (!documentIndex.digits?.has(digit)) {
      return { ok: false, reason: 'the explanation states a figure the document does not' };
    }
  }
  for (const digit of digitsIn(question)) {
    if (!documentIndex.digits?.has(digit)) {
      return { ok: false, reason: 'the question states a figure the document does not' };
    }
  }

  for (const name of properNounsIn(explanation)) {
    if (!documentHasWord(name, documentIndex)) {
      return { ok: false, reason: 'the explanation names something the document does not' };
    }
  }
  for (const name of properNounsIn(question)) {
    if (!documentHasWord(name, documentIndex)) {
      return { ok: false, reason: 'the question names something the document does not' };
    }
  }

  if (kind !== 'cloze' && normalizeForMatch(question).includes(normalizeForMatch(answer))) {
    return { ok: false, reason: 'the question text gives away its own answer' };
  }

  const requested = options.requestedDifficulty;
  if (requested === 'easy' || requested === 'medium' || requested === 'hard') {
    const estBand = estimateDifficulty({ question, options: optionList, kind });
    if (DIFFICULTY_RANK[requested] - DIFFICULTY_RANK[estBand] >= 2) {
      return { ok: false, reason: `question is too easy for the requested "${requested}" level` };
    }
  }

  return {
    ok: true,
    question: { question, options: optionList, correctIndex: correct, topic, kind, explanation, source: groundedSource, difficulty: estimateDifficulty({ question, options: optionList, kind }) },
  };
}

export const DIFFICULTY_RANK = Object.freeze({ easy: 0, medium: 1, hard: 2 });

export function estimateDifficulty(question) {
  const stem = String(question?.question ?? '');
  const lower = stem.toLowerCase();
  const words = (lower.match(/[a-z0-9]+/g) ?? []).length;

  if (question?.kind === 'cloze' || stem.includes('_____')) return 'easy';

  const reasoningCues = [
    'why', 'how would', 'how does', 'if ', 'suppose', 'predict', 'consequence', 'would happen',
    'compare', 'difference between', 'most appropriate', 'best describes', 'which would', 'best explains',
    'implication', 'scenario', 'given that', 'as a result', 'what happens when', 'reason for', 'in order to',
    'leads to', 'affect', 'effect of', 'diagnose', 'evaluate', 'justify',
  ];
  const recallCues = [
    'what is', 'what are', 'define', 'which of the following is', 'according to', 'is called',
    'refers to', 'the term for', 'which term', 'name the', 'identify the',
  ];

  const reasoning = reasoningCues.filter((c) => lower.includes(c)).length;
  const recall = recallCues.some((c) => lower.includes(c));

  if (reasoning >= 2 || (reasoning >= 1 && words >= 22)) return 'hard';
  if (reasoning >= 1) return 'medium';
  if (recall || words < 12) return 'easy';
  return 'medium';
}

export function factKey(question) {
  const source = matchKey(question.source ?? '');
  const answer = matchKey((question.options ?? [])[question.correctIndex] ?? '');
  if (source === '' || answer === '') return '';
  return `${source} ${answer}`;
}

export function validateBatch(rawQuestions, documentIndex, options = {}) {
  const { existing = [], allowedTopics = null, requestedDifficulty = null } = options;
  const accepted = [];
  const rejected = [];
  const kept = [...existing];
  const facts = new Set();
  for (const question of kept) {
    const key = factKey(question);
    if (key !== '') facts.add(key);
  }

  for (const raw of Array.isArray(rawQuestions) ? rawQuestions : []) {
    const outcome = validateQuestion(raw, documentIndex, { allowedTopics, requestedDifficulty });
    if (!outcome.ok) {
      rejected.push({ reason: outcome.reason, question: typeof raw?.question === 'string' ? raw.question.slice(0, 120) : '' });
      continue;
    }

    const candidate = outcome.question;
    const clash = kept.find((other) => similarity(other.question, candidate.question) >= DUPLICATE_THRESHOLD);
    if (clash) {
      rejected.push({ reason: 'duplicate of another question in this paper', question: candidate.question.slice(0, 120) });
      continue;
    }

    const key = factKey(candidate);
    if (key !== '' && facts.has(key)) {
      rejected.push({ reason: 'asks the same fact as another question in this paper', question: candidate.question.slice(0, 120) });
      continue;
    }

    if (key !== '') facts.add(key);
    kept.push(candidate);
    accepted.push(candidate);
  }

  return { accepted, rejected };
}

export function selectQuestions(questions, target) {
  if (questions.length <= target) return [...questions];

  const byTopic = new Map();
  for (const question of questions) {
    const key = matchKey(question.topic);
    if (!byTopic.has(key)) byTopic.set(key, []);
    byTopic.get(key).push(question);
  }

  const picked = [];
  const queues = [...byTopic.values()];
  let progress = true;
  while (picked.length < target && progress) {
    progress = false;
    for (const queue of queues) {
      if (picked.length >= target) break;
      const next = queue.shift();
      if (next) {
        picked.push(next);
        progress = true;
      }
    }
  }
  return picked;
}
