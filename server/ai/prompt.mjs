/**
 * What the model is actually asked.
 *
 * Kept in its own file because the prompt is the single largest determinant of whether
 * this feature is honest. Everything downstream can only reject a bad question; only the
 * prompt can make good ones likely. It is versioned in the repo and reviewable as text
 * rather than buried in a request body.
 *
 * Three instructions do most of the work:
 *
 *  - Quote the source verbatim. The validator checks the quote against the document, so
 *    a model that paraphrases its own citation gets its question thrown away. Saying so
 *    explicitly turns a silent rejection into a followed rule.
 *  - Use only the supplied passage. Models know a great deal about price indices and
 *    will cheerfully write a textbook-correct question the uploaded document does not
 *    support, which would then be marked against a learner who read the document.
 *  - Say when there is not enough material. Given a target of twelve and a thin
 *    paragraph, a model will pad. An explicit permission to return fewer is what makes
 *    "8 good questions beat 12 invented ones" achievable rather than aspirational.
 */

const SCHEMA = `{
  "questions": [
    {
      "question": "string - the question stem",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "topic": "string - which supplied topic this measures",
      "kind": "statement | cloze | numeric | identify | scenario",
      "explanation": "string - why the correct option is correct, citing the passage",
      "source": "string - the sentence(s) from the passage this came from, copied exactly"
    }
  ]
}`;

const ROLE = `You are an educational assessment generator for India's official statistical system (MoSPI). You write multiple-choice questions that test whether a statistical officer has understood a specific document they were asked to read.`;

const RULES = `HARD RULES — a question breaking any of these is discarded:
1. Use ONLY the supplied passage. Do not use outside knowledge, even if you are certain it is correct.
2. Do not invent facts, statistics, organisations, definitions, dates, methodologies, thresholds or claims. If the passage does not say it, it does not exist.
3. "source" must be copied EXACTLY from the passage, word for word. It is checked against the document; a rephrased or composed sentence is rejected.
4. Every question must be answerable by someone who has read only the supplied passage.
5. Exactly 4 options. Exactly one correct. "correctIndex" is the 0-based position of the correct option.
6. All 4 options must be distinct, similar in length and style, and plausible to someone who has not read carefully.
7. Distractors must be wrong according to the passage — contradicted by it, unsupported by it, or a different value from it. Never nonsense, never obviously absurd.
8. The stem must not contain its own answer.
9. "explanation" must justify the answer using the passage only. It must not introduce information absent from the passage.
10. "topic" must be one of the supplied topics.

QUALITY:
- Prefer conceptual understanding, interpretation, statistical reasoning, methodological understanding, data-quality judgement and application over copying a sentence.
- Avoid trivial questions answerable from the stem's wording alone.
- Vary which position holds the correct answer. Do not put the answer at the same index repeatedly.

{{DIFFICULTY}}

QUESTION KINDS — choose the one the passage supports, do not force a spread:
- "statement": tests a factual or conceptual point the passage makes.
- "cloze": a key term or phrase is blanked out; the correct option must be that exact term as it appears in the passage.
- "numeric": a figure, percentage, rate, count or date that genuinely appears in the passage. Do NOT create these if the passage has no meaningful figures.
- "identify": asks which statement is supported by the passage.
- "scenario": applies the passage to a work situation. Use ONLY if the passage supports a real methodological judgement. Do not invent a scenario the passage cannot settle.

COUNT:
Return up to {{COUNT}} questions. Returning FEWER good questions is correct and expected when the passage is short or thin. Never pad the list with weak or invented questions to reach a number.

OUTPUT:
Return a single JSON object and nothing else. No prose, no markdown fence, no commentary.`;

function topicBlock(topics, concepts) {
  const lines = [];
  if (topics.length > 0) {
    lines.push(`TOPICS extracted from this document (use these exact strings in "topic"):\n${topics.map((topic) => `- ${topic}`).join('\n')}`);
  }
  if (concepts.length > 0) {
    lines.push(`KEY TERMS seen in this document (context only, not a topic list):\n${concepts.slice(0, 20).join(', ')}`);
  }
  return lines.join('\n\n');
}

/**
 * The difficulty instruction, chosen by what the learner picked on the page.
 *
 * `easy | medium | hard` each get a focused instruction; anything else (including an
 * absent choice) gets the balanced mix, which is the sensible default when nobody said.
 * The last two lines are shared by every level: a good distractor and a verbatim source
 * are required regardless of how hard the question is.
 */
const DIFFICULTY_SHARED = `- Distractors must be the answers a reader gives when they half-understood the passage — a common misreading, a plausible-but-wrong application, the right idea applied to the wrong case — never random or absurd wrong facts.
- You may still quote "source" verbatim (that rule never relaxes); the difficulty lives in the stem and the options, not in the sentence you cite.`;

function difficultyBlock(difficulty) {
  if (difficulty === 'easy') {
    return `DIFFICULTY — write EASY questions:
- Test direct understanding: whether the reader recognised and understood what the passage plainly states.
- One careful read of the passage should be enough to answer.
- Still not answerable from the stem's wording alone; still exactly four plausible options.
${DIFFICULTY_SHARED}`;
  }
  if (difficulty === 'medium') {
    return `DIFFICULTY — write MEDIUM questions:
- The reader must understand what a sentence MEANS, not just locate it: restate a definition in other words, pick the correct interpretation of a stated fact, or read a figure in context.
- Avoid trivial recognition, and avoid full multi-step reasoning across the whole passage.
${DIFFICULTY_SHARED}`;
  }
  if (difficulty === 'hard') {
    return `DIFFICULTY — write HARD questions:
- The reader must reason ACROSS the passage: apply a stated method or rule to a situation, compare two ideas the passage raises, work out a consequence it implies, diagnose what would go wrong if a stated principle were broken, or judge which of several plausible readings the passage supports.
- A HARD question cannot be answered by matching words between the stem and one sentence.
${DIFFICULTY_SHARED}`;
  }
  return `DIFFICULTY — aim for a mix, and do NOT just lift a sentence and blank a word:
- Roughly one third MEDIUM (understand what a sentence means) and two thirds HARD (reason across the passage: apply, compare, work out a consequence, diagnose, or judge which reading the passage supports).
- A HARD question cannot be answered by matching words between the stem and one sentence.
${DIFFICULTY_SHARED}`;
}

export function buildGenerationPrompt({ chunk, topics = [], concepts = [], count = 12, difficulty }) {
  return `${ROLE}

${RULES.replace('{{COUNT}}', String(count)).replace('{{DIFFICULTY}}', difficultyBlock(difficulty))}

JSON SCHEMA:
${SCHEMA}

${topicBlock(topics, concepts)}

PASSAGE (the only permitted source of truth):
"""
${chunk}
"""`;
}

/**
 * The second attempt. Same rules, plus the exact reasons the previous batch was thrown
 * out, because "some were rejected" teaches a model nothing but "the source passage was
 * not in the document" changes what it does next.
 */
export function buildRepairPrompt({ chunk, topics = [], count = 6, reasons = [], difficulty }) {
  const unique = [...new Set(reasons)].slice(0, 8);
  return `${ROLE}

Your previous attempt on this passage was rejected by an automatic validator. Reasons given:
${unique.map((reason) => `- ${reason}`).join('\n')}

Fix these specific problems. In particular, copy "source" verbatim from the passage below — do not rephrase it, do not merge sentences, do not correct its punctuation.

${RULES.replace('{{COUNT}}', String(count)).replace('{{DIFFICULTY}}', difficultyBlock(difficulty))}

JSON SCHEMA:
${SCHEMA}

${topicBlock(topics, [])}

PASSAGE (the only permitted source of truth):
"""
${chunk}
"""`;
}
