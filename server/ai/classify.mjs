import * as local from './local.mjs';
import { ProviderError } from './gemini.mjs';

const SAMPLE_CHARS = 2_000;

export const DOCUMENT_TYPES = [
  {
    value: 'study_material',
    label: 'Study material',
    suitable: true,
    advice: 'This looks like study material. Great for generating quiz questions.',
  },
  {
    value: 'textbook_chapter',
    label: 'Textbook chapter',
    suitable: true,
    advice: 'This is a textbook chapter. Excellent source for quiz questions.',
  },
  {
    value: 'research_paper',
    label: 'Research paper / article',
    suitable: true,
    advice: 'This is a research paper or article. Good for generating analytical questions.',
  },
  {
    value: 'marksheet',
    label: 'Marksheet / Results',
    suitable: false,
    advice: 'This appears to be a marksheet or results sheet. It contains grades or scores rather than study content. Upload study material (textbook chapters, notes, methodology documents) for better quiz questions.',
  },
  {
    value: 'attendance_sheet',
    label: 'Attendance / Register',
    suitable: false,
    advice: 'This looks like an attendance sheet or register. It contains names and dates rather than study content. Upload study material for quiz questions.',
  },
  {
    value: 'form_template',
    label: 'Blank form / Template',
    suitable: false,
    advice: 'This appears to be a blank form or template. It has structure but little studyable content. Upload completed study material for quiz questions.',
  },
  {
    value: 'report',
    label: 'Report',
    suitable: true,
    advice: 'This is a report. It may contain useful study content — questions will be generated from its text.',
  },
  {
    value: 'data_table',
    label: 'Data table / Spreadsheet',
    suitable: false,
    advice: 'This looks like a data table or spreadsheet dump. It contains numbers without enough context for good quiz questions. Upload a document with explanatory text.',
  },
  {
    value: 'other',
    label: 'Other',
    suitable: true,
    advice: 'The document type is unclear. Questions will be generated from whatever text was found.',
  },
];

const TYPE_VALUES = DOCUMENT_TYPES.map((t) => t.value);

const CLASSIFICATION_SCHEMA = `{
  "type": "string - one of: ${TYPE_VALUES.join(', ')}",
  "confidence": "high | medium | low",
  "reason": "string - one sentence explaining why you classified it this way",
  "topics": ["string", "string", "string"],
  "summary": "string - one to two sentences summarising what the document is about"
}`;

const CLASSIFY_ROLE = `You are a document classification assistant for an educational platform. You analyse document text and identify what kind of document it is.`;

const CLASSIFY_RULES = `HARD RULES:
1. Read the passage and classify it into exactly one of these types:
   - "study_material": Notes, lecture content, study guides, methodology documents, explanatory text
   - "textbook_chapter": A chapter from a textbook or educational book
   - "research_paper": A research paper, journal article, or academic publication
   - "marksheet": A results sheet, grade card, marksheet, or transcript with scores/grades
   - "attendance_sheet": An attendance register, enrolment list, or sign-in sheet
   - "form_template": A blank form, template, or questionnaire with fields but no filled content
   - "data_table": A spreadsheet dump, data table, or numerical listing without explanatory text
   - "report": A government report, statistical bulletin, or official publication with analysis
   - "other": Anything that does not clearly fit the above

2. Be precise. A statistical methodology note is "study_material" or "report", not "data_table". A marksheet has student names and grades, not explanatory paragraphs.
3. "topics" should list 1-5 key subjects the document covers (e.g., "Consumer Price Index", "Sampling Methodology").
4. "summary" should describe what the document is about in 1-2 sentences.
5. "reason" should explain your classification in one sentence.

OUTPUT:
Return a single JSON object and nothing else. No prose, no markdown fence, no commentary.`;

function buildClassifyPrompt(sample) {
  return `${CLASSIFY_ROLE}

${CLASSIFY_RULES}

JSON SCHEMA:
${CLASSIFICATION_SCHEMA}

PASSAGE (a sample from the document):
"""
${sample}
"""`;
}

function parseClassifyJson(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return { ok: false, reason: 'empty response' };
  }

  let text = raw.trim();

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) text = fenced[1].trim();

  if (!text.startsWith('{')) {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first === -1 || last <= first) return { ok: false, reason: 'no JSON object found' };
    text = text.slice(first, last + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'malformed JSON' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'not a JSON object' };
  }

  return { ok: true, parsed };
}

function normaliseClassification(parsed) {
  const type = typeof parsed.type === 'string' ? parsed.type.trim().toLowerCase() : 'other';

  const matched = DOCUMENT_TYPES.find((t) => t.value === type) ?? DOCUMENT_TYPES.find((t) => t.value === 'other');

  const confidence = ['high', 'medium', 'low'].includes(String(parsed.confidence).toLowerCase())
    ? String(parsed.confidence).toLowerCase()
    : 'medium';

  const reason = typeof parsed.reason === 'string' && parsed.reason.trim() !== ''
    ? parsed.reason.trim().slice(0, 300)
    : matched.advice;

  const topics = Array.isArray(parsed.topics)
    ? parsed.topics
        .filter((t) => typeof t === 'string' && t.trim() !== '')
        .map((t) => t.trim().slice(0, 80))
        .slice(0, 5)
    : [];

  const summary = typeof parsed.summary === 'string' && parsed.summary.trim() !== ''
    ? parsed.summary.trim().slice(0, 400)
    : '';

  return {
    type: matched.value,
    label: matched.label,
    suitable: matched.suitable,
    confidence,
    reason,
    topics,
    summary,
    advice: matched.advice,
  };
}

export async function classifyMaterial(input, { env = process.env } = {}) {
  const text = String(input.text ?? '');

  if (text.trim() === '') {
    return {
      ok: false,
      code: 'no_text',
      message: 'No document text was provided for classification.',
    };
  }

  const sample = text.slice(0, SAMPLE_CHARS).trim();

  const prompt = buildClassifyPrompt(sample);

  let raw;
  try {
    raw = await local.generateRaw(prompt, { env, timeoutMs: 180_000 });
  } catch (error) {
    if (error instanceof ProviderError) {
      return { ok: false, code: error.code, message: error.message };
    }
    return {
      ok: false,
      code: 'provider_error',
      message: 'The AI model could not classify the document. Try again in a moment.',
    };
  }

  const parsed = parseClassifyJson(raw);
  if (!parsed.ok) {
    return {
      ok: false,
      code: 'provider_error',
      message: 'The AI model returned an unparseable response during classification.',
    };
  }

  const classification = normaliseClassification(parsed.parsed);

  return { ok: true, classification };
}

export function classificationStatus(env = process.env) {
  return local.isConfigured(env);
}
