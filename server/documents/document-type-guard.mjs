/**
 * document-type-guard.mjs — the STUDY MATERIAL ONLY upload gate.
 *
 * Nexora ingests learning material and turns it into questions. It must NOT ingest personal
 * or sensitive records: marksheets, ID cards, bank statements, medical reports, resumes, and
 * so on. This module is the deterministic, zero-dependency, NO-AI gate that decides — before
 * any chunking, indexing, or AI call — whether an upload is study material or must be
 * rejected. Rejected documents are never forwarded to Gemini (spec §3/§19).
 *
 * Design principles (spec §5/§7/§16):
 *   - Multiple independent signals, never a single generic word. "marks" or "grade" in a
 *     physics textbook, "ID"/"Name"/"Address" in a CS PDF, must NOT trigger a rejection.
 *   - Instance fingerprints, not topic words. We reject on the shape of an actual record
 *     (a formatted Aadhaar/PAN number, an IFSC code, a "hereinafter" contract clause, a
 *     "patient name" + prescription) — the things a textbook ABOUT these topics never has.
 *   - Long, continuous educational prose is protected: a 900-page textbook that happens to
 *     mention a rejected keyword is still accepted (spec §11), so large PDFs never break.
 *   - Conservative default: if we cannot reasonably confirm study material, we REJECT as
 *     'unknown' (spec §1/§7) — but only after the positive study checks have had their say,
 *     so genuine notes/papers/manuals are not caught by the default.
 *
 * It reuses the tuned classifier in classify.mjs (marksheet/certificate/textbook signals)
 * and layers the personal/identity/financial/medical/legal/resume/form detectors on top.
 *
 * guardDocument({ text, filename, pageCount, charsPerPage })
 *   → { decision:'accept'|'reject', documentType, category, confidence, reason, message, signals }
 * where documentType is one of GUARD_CATEGORIES (spec §4).
 */

import { classifyDocument, isLearningType } from './classify.mjs';

/** The stable, machine-readable categories the guard can emit (spec §4). */
export const GUARD_CATEGORIES = Object.freeze([
  'study_material',
  'marksheet', 'transcript', 'certificate',
  'government_id', 'student_id', 'passport',
  'financial_document', 'medical_document', 'legal_document',
  'resume', 'form', 'personal_document', 'unrelated_image', 'unknown',
]);

/** Professional, user-facing rejection copy per category (spec §8). Never "Invalid file." */
const MESSAGES = {
  marksheet: 'Marksheet or academic result documents are not supported. Please upload study material such as textbooks, lecture notes, course PDFs, research papers, or technical documentation.',
  transcript: 'Marksheet or academic result documents are not supported. Please upload study material such as textbooks, lecture notes, course PDFs, research papers, or technical documentation.',
  certificate: 'Certificates and academic record documents are not supported. Please upload learning material instead.',
  government_id: 'Government identity documents are not allowed. Nexora accepts study and learning material only.',
  student_id: 'Government identity documents are not allowed. Nexora accepts study and learning material only.',
  passport: 'Government identity documents are not allowed. Nexora accepts study and learning material only.',
  financial_document: 'Financial or administrative documents are not supported. Please upload study material such as textbooks, lecture notes, course PDFs, or technical documentation.',
  medical_document: 'Medical or personal documents are not supported. Please upload study material only.',
  legal_document: 'Legal or administrative documents are not supported. Please upload study material such as textbooks, lecture notes, or course PDFs.',
  resume: 'Resumes and personal documents are not supported. Please upload study material such as textbooks, lecture notes, or course PDFs.',
  form: 'Application forms and administrative documents are not supported. Please upload study material only.',
  personal_document: 'Personal documents are not supported. Please upload study material only.',
  unrelated_image: 'This file does not appear to contain readable study material. Please upload a textbook, lecture notes, course material, research paper, or other educational document.',
  unknown: 'This file could not be verified as study material. Please upload a textbook, lecture notes, course material, research paper, or other educational document.',
};

/** The user-facing message for a rejected category (spec §8). Safe for any input. */
export function rejectionMessage(category) {
  return MESSAGES[category] ?? MESSAGES.unknown;
}

// --- Identity fingerprints (case-sensitive; run on the ORIGINAL text) --------
// These are document-INSTANCE patterns, not topic words: a real ID carries a formatted
// number, a study PDF that merely discusses IDs does not.
const AADHAAR_NUM = /\b\d{4}\s\d{4}\s\d{4}\b/;                 // 12 digits grouped 4-4-4
const AADHAAR_WORD = /\b(aadhaar|aadhar|uidai|unique identification authority)\b/i;
const AADHAAR_CTX = /\b(government of india|govt\.? of india|date of birth|year of birth|\bdob\b|male|female|s\/o|d\/o|w\/o)\b/i;
const PAN_NUM = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/;                   // ABCDE1234F
const PAN_WORD = /\b(permanent account number|income tax department|\bpan\b)/i;
const PASSPORT_WORD = /\bpassport\b/i;
const PASSPORT_NUM = /\b[A-PR-WYa-pr-wy][0-9]{7}\b/;           // Indian passport number
const PASSPORT_CTX = /\b(republic of india|place of issue|date of issue|date of expiry|nationality|given name(s)?|surname|passport no)\b/i;
const VOTER_WORD = /\b(voter\s*id|elector'?s? photo identity|epic\s*(no|number)|election commission of india)\b/i;
const VOTER_NUM = /\b[A-Z]{3}[0-9]{7}\b/;
const DL_WORD = /\b(driving licen[cs]e|licence to drive|motor vehicles? act|transport department|\bdl\s*no\b)\b/i;
const DL_NUM = /\b[A-Z]{2}[- ]?\d{2}[- ]?\d{11}\b/;

// --- Category signal lists (topic-agnostic instance markers) -----------------
const MARKSHEET_CORROB = [
  /\bsgpa\b/i, /\bcgpa\b/i, /\bgrade point\b/i, /\bmarks? obtained\b/i, /\bmax(imum)? marks\b/i,
  /\broll\s*(no|number)\b/i, /\bregistration\s*(no|number)\b/i, /\bsemester\b/i, /\bgrade card\b/i,
  /\bmark\s*sheet\b/i, /\bmarksheet\b/i, /\bstatement of marks\b/i, /\bfirst class|distinction\b/i,
  /\bpass(ed)?\b/i, /\bacademic year\b/i,
];
const TRANSCRIPT_WORD = [/\btranscript of records\b/i, /\bofficial transcript\b/i, /\bacademic transcript\b/i, /\btranscript\b/i];
const CERT_WORD = [
  /\bthis is to certify\b/i, /\bcertificate of (completion|achievement|participation|merit|excellence)\b/i,
  /\bhas successfully completed\b/i, /\bawarded to\b/i, /\bcertifies that\b/i, /\bin recognition of\b/i,
  /\bconvocation\b/i, /\bhereby awarded\b/i,
];
const FINANCIAL_WORD = [
  /\bbank statement\b/i, /\baccount statement\b/i, /\bstatement of account\b/i, /\bstatement period\b/i,
  /\b(account|a\/c)\s*(no|number)\b/i, /\bifsc\b/i, /\bmicr code\b/i, /\b(closing|opening|available)\s*balance\b/i,
  /\btax invoice\b/i, /\bgstin\b/i, /\bgst\s*no\b/i, /\binvoice\s*(no|number)\b/i, /\bsalary slip\b/i,
  /\bpay ?slip\b/i, /\bnet pay\b/i, /\bpolicy\s*(no|number)\b/i, /\bsum assured\b/i, /\bpremium (amount|payable)\b/i,
  /\breceipt no\b/i,
];
const FINANCIAL_HARD = [/\b[A-Z]{4}0[A-Z0-9]{6}\b/, /\b\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]\b/]; // IFSC, GSTIN
const MEDICAL_WORD = [
  /\bprescription\b/i, /\brx\b/i, /\bdiagnosis\b/i, /\bpatient\s*(name|id|age)\b/i, /\bmedical (report|certificate)\b/i,
  /\blab(oratory)? report\b/i, /\bblood (test|group|pressure)\b/i, /\bh(a)?emoglobin\b/i, /\bdosage\b/i,
  /\bdischarge summary\b/i, /\bchief complaint\b/i, /\btreatment plan\b/i, /\bprescribed\b/i, /\bconsultant physician\b/i,
];
const LEGAL_WORD = [
  /\bhereinafter\b/i, /\bwitnesseth\b/i, /\bin witness whereof\b/i, /\bparty of the (first|second) part\b/i,
  /\bthis agreement is made\b/i, /\bthe parties (hereto )?agree\b/i, /\bnon[- ]disclosure agreement\b/i,
  /\bgoverning law\b/i, /\bshall indemnify\b/i, /\bexecuted (on|as of)\b/i, /\bdeed of\b/i, /\bstamp duty\b/i,
];
const RESUME_WORD = [
  /\bcurriculum vitae\b/i, /\bwork experience\b/i, /\bprofessional experience\b/i, /\bcareer objective\b/i,
  /\bemployment history\b/i, /\breferences available\b/i, /linkedin\.com\/in\//i, /\bexpected (salary|ctc)\b/i,
  /\bwork history\b/i, /\bprofessional summary\b/i, /\bcareer summary\b/i,
];
const FORM_WORD = [
  /\bapplication form\b/i, /\bfor office use only\b/i, /\bsignature of (the )?(applicant|candidate)\b/i,
  /\bi hereby declare\b/i, /\bplease (fill|tick)\b/i, /\btick (the )?(appropriate|relevant)\b/i,
  /\bform\s*(no|number)\b/i, /\baffix (your )?(recent )?photo(graph)?\b/i, /\bdate of application\b/i,
];
const STUDY_KEYWORD = [
  /\bchapter\b/i, /\bsection\b/i, /\bintroduction\b/i, /\bdefinition\b/i, /\btheorem\b/i, /\bexample\b/i,
  /\bexercise[s]?\b/i, /\balgorithm\b/i, /\bequation\b/i, /\bfigure\b/i, /\bconcept\b/i, /\blecture\b/i,
  /\bcourse\b/i, /\bsyllabus\b/i, /\bfunction\b/i, /\bvariable\b/i, /\bhypothesis\b/i, /\bexperiment\b/i,
  /\bproof\b/i, /\bsummary\b/i, /\btutorial\b/i, /\bmodule\b/i, /\bresearch\b/i, /\babstract\b/i,
  /\bmethodology\b/i, /\breferences\b/i, /\bconclusion\b/i, /\banalysis\b/i, /\btheory\b/i,
];

// --- Small, pure helpers -----------------------------------------------------

const round = (n) => Number(Math.max(0, Math.min(1, n)).toFixed(2));

/** How many of a list of RegExp patterns match the text (each pattern counts at most once). */
function countSignals(text, patterns) {
  let n = 0;
  const hit = [];
  for (const p of patterns) {
    if (p.test(text)) { n += 1; hit.push(p.source); }
  }
  return { n, hit };
}

/**
 * Does this read like continuous educational prose (textbook / notes / paper / manual)
 * rather than a short structured record (an ID, a grade card, a form, a bank statement)?
 * Prose has many words, reasonable sentence length, a high letter ratio and few digits.
 */
function proseProfile(text) {
  const words = text.match(/[A-Za-z][A-Za-z'-]+/g) ?? [];
  const wordCount = words.length;
  const letters = (text.match(/[A-Za-z]/g) ?? []).length;
  const digits = (text.match(/\d/g) ?? []).length;
  const nonSpace = text.replace(/\s/g, '').length || 1;
  const digitRatio = digits / nonSpace;
  const letterRatio = letters / nonSpace;
  const sentences = text.split(/[.!?]+\s/).filter((s) => s.trim().length > 0);
  const avgSentenceWords = sentences.length ? wordCount / sentences.length : wordCount;
  // "Reads like natural sentences" — permissive, used only AFTER every reject check, so short
  // legit study snippets ("Mitochondria produce ATP through respiration.") are still accepted.
  const readsLikeNaturalText = wordCount >= 12 && avgSentenceWords >= 6 && digitRatio < 0.2 && letterRatio >= 0.55;
  // "Substantial prose" — a stronger bar used to protect large documents from any reject rule.
  const looksLikeProse = wordCount >= 90 && letterRatio >= 0.6 && digitRatio < 0.12 && avgSentenceWords >= 8;
  return { wordCount, digitRatio, letterRatio, avgSentenceWords, readsLikeNaturalText, looksLikeProse };
}

/** Fraction of lines that look like ledger rows (a date AND a money-ish amount) — a statement tell. */
function transactionRowRatio(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return 0;
  const dateRe = /\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/i;
  const moneyRe = /((₹|rs\.?|inr|\$|usd)\s?\d)|(\d[\d,]*\.\d{2})\b/i;
  let rows = 0;
  for (const l of lines) if (dateRe.test(l) && moneyRe.test(l)) rows += 1;
  return rows / lines.length;
}

/** Identity-document fingerprints. Each requires a formatted number OR strong ID context. */
function detectIdentity(raw) {
  const aadhaar = (AADHAAR_WORD.test(raw) && AADHAAR_NUM.test(raw))
    || (AADHAAR_NUM.test(raw) && AADHAAR_CTX.test(raw));
  const pan = PAN_NUM.test(raw) && PAN_WORD.test(raw);
  const voter = VOTER_WORD.test(raw) && (VOTER_NUM.test(raw) || /\b(father'?s name|age|sex)\b/i.test(raw));
  const dl = DL_WORD.test(raw) && (DL_NUM.test(raw) || /\b(date of birth|valid till|class of vehicle|licen[cs]e no)\b/i.test(raw));
  const passport = PASSPORT_WORD.test(raw) && (PASSPORT_NUM.test(raw) || PASSPORT_CTX.test(raw));
  const studentId = /\b(student\s*(id|identity)\s*card|identity\s*card|\bid\s*card\b|library\s*card|enrol?ment\s*(no|number)|admission\s*(no|number))\b/i.test(raw)
    && /\b(valid\s*(up\s*to|till|until)|date of birth|\bdob\b|blood group|issued by|father'?s name)\b/i.test(raw);
  return { aadhaar, pan, voter, dl, passport, studentId, govtId: aadhaar || pan || voter || dl };
}

/**
 * Decide whether an upload is study material. Runs entirely locally (no AI).
 *
 *   text        extracted text — for large docs a head SAMPLE is enough (the callers pass the
 *               same first-8000-char sample they already compute for routing). For scanned
 *               pages this already includes locally-OCR'd text, so a scanned marksheet is seen
 *               as a marksheet and a scanned textbook is seen as a textbook (spec §6).
 *   filename    original filename (a hint only — NEVER the sole basis for a rejection, §5/§16).
 *   pageCount   best page estimate.
 *   charsPerPage  extractable chars / page (flags scans).
 *
 * Returns { decision, documentType, category, confidence, reason, message, signals }.
 */
export function guardDocument({ text = '', filename = '', pageCount = 1, charsPerPage = null } = {}) {
  const raw = String(text);
  const name = String(filename);

  const cls = classifyDocument({ text: raw, filename: name, pageCount, charsPerPage });
  const prose = proseProfile(raw);
  const txnRatio = transactionRowRatio(raw);
  const studyKw = countSignals(raw, STUDY_KEYWORD);
  const shortDoc = pageCount <= 4;
  // A document is "long educational prose" — a textbook, paper, manual, tutorial — when it is
  // large AND substantially prose AND not a dense ledger. Such a document is protected from
  // every reject rule below (spec §11/§16), so large PDFs never break.
  const longProse = (pageCount >= 15 || raw.length >= 20000 || prose.wordCount >= 1200)
    && prose.looksLikeProse && txnRatio < 0.15;
  // A genuine ID/record is short and number-dense, never long educational prose; so a large,
  // keyword-rich tutorial that merely SHOWS an example ID number is not treated as an ID.
  const eduProseDominant = longProse && studyKw.n >= 4;

  const signals = {
    classify: cls.documentType, classifyConfidence: cls.confidence, isScanned: cls.isScanned,
    pageCount, wordCount: prose.wordCount, digitRatio: round(prose.digitRatio), txnRatio: round(txnRatio),
    studyKeywords: studyKw.n, tableHeader: cls.signals.tableHeader, tableRows: cls.signals.tableRows,
    longProse, eduProseDominant,
  };
  const accept = (reason, confidence) => ({
    decision: 'accept', documentType: 'study_material', category: 'study_material',
    confidence: round(confidence), reason, message: null, signals,
  });
  const reject = (documentType, reason, confidence) => ({
    decision: 'reject', documentType, category: documentType,
    confidence: round(confidence), reason, message: rejectionMessage(documentType), signals,
  });

  // 0) No readable content at all — a blank/unsupported file or an image with no text (§1/§7).
  //    (On the pipeline path, low-text pages were already OCR'd, so empty here means empty.)
  const readable = raw.replace(/\s/g, '').length;
  if (readable < 25) {
    return reject('unrelated_image', 'No readable text was extracted (blank, image-only, or unsupported file).', 0.6);
  }

  // 1) Personal identity documents — highest privacy priority (§1/§3). Decisive instance
  //    fingerprints (formatted Aadhaar/PAN/passport/voter/DL number + context). Skipped only
  //    for a large keyword-rich tutorial that is clearly ABOUT such IDs, never an actual one.
  const id = detectIdentity(raw);
  if (!eduProseDominant) {
    if (id.govtId) return reject('government_id', 'Government identity fingerprint (formatted ID number + identity context).', 0.9);
    if (id.passport) return reject('passport', 'Passport fingerprint (passport number/context).', 0.9);
    if (id.studentId && shortDoc) return reject('student_id', 'Identity-card fingerprint on a short document.', 0.8);
  }

  // 2) Academic records — marksheets / transcripts / grade cards (§1). Reuse the tuned
  //    classifier (which already applies a length penalty so long books are not marksheets)
  //    OR corroborate with several result signals plus a tabular/short shape.
  const ms = countSignals(raw, MARKSHEET_CORROB);
  const marksheetByClassifier = cls.documentType === 'MARKSHEET';
  const marksheetByCorrob = ms.n >= 2 && (cls.signals.tableHeader || cls.signals.tableRows >= 3 || shortDoc);
  if (!longProse && (marksheetByClassifier || marksheetByCorrob)) {
    const isTranscript = TRANSCRIPT_WORD.some((re) => re.test(raw));
    return reject(isTranscript ? 'transcript' : 'marksheet',
      `Academic-result signals (corroborations=${ms.n}, classifier=${cls.documentType}).`, Math.max(cls.confidence, 0.7));
  }

  // 3) Certificates / diplomas (§1). A "this is to certify"/"certificate of completion" phrase
  //    is a strong single tell, but we still require the document to be short (real certs are).
  const cert = countSignals(raw, CERT_WORD);
  if (!longProse && (cls.documentType === 'CERTIFICATE' || (cert.n >= 1 && pageCount <= 6))) {
    return reject('certificate', `Certificate signals (phrases=${cert.n}, classifier=${cls.documentType}).`, Math.max(cls.confidence, 0.7));
  }

  // 4) Financial / administrative records (§1). Require an IFSC/GSTIN hard code, or two distinct
  //    instance markers, or one marker on a document that is mostly dated money rows.
  const fin = countSignals(raw, FINANCIAL_WORD);
  const finHard = FINANCIAL_HARD.some((re) => re.test(raw));
  if (!longProse && (finHard || fin.n >= 2 || (fin.n >= 1 && txnRatio >= 0.2))) {
    return reject('financial_document', `Financial signals (markers=${fin.n}, hardCode=${finHard}, txnRows=${round(txnRatio)}).`, 0.75);
  }

  // 5) Medical records (§1). Require an actual-record anchor (patient/Rx/prescription/discharge)
  //    plus a second medical signal, so an anatomy/medicine TEXTBOOK is not caught.
  const med = countSignals(raw, MEDICAL_WORD);
  const medAnchor = /\bpatient\s*(name|id)\b/i.test(raw) || /\brx\b/i.test(raw) || /\bprescription\b/i.test(raw) || /\bdischarge summary\b/i.test(raw);
  if (!longProse && medAnchor && med.n >= 2) {
    return reject('medical_document', `Medical record signals (markers=${med.n}, anchor).`, 0.75);
  }

  // 6) Legal / contractual instruments (§1). Two distinct contract-instance phrases — a law
  //    TEXTBOOK explaining contracts rarely stacks two, and long ones are prose-protected.
  const legal = countSignals(raw, LEGAL_WORD);
  if (!longProse && legal.n >= 2) {
    return reject('legal_document', `Legal instrument signals (phrases=${legal.n}).`, 0.7);
  }

  // 7) Resumes / CVs (§1). Two resume-section signals, or one plus a contact block on a short doc.
  const res = countSignals(raw, RESUME_WORD);
  const hasContact = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/.test(raw) && /(\+?\d[\d\s-]{7,}\d)/.test(raw);
  if (!longProse && (res.n >= 2 || (res.n >= 1 && hasContact && shortDoc))) {
    return reject('resume', `Resume signals (sections=${res.n}, contact=${hasContact}).`, 0.7);
  }

  // 8) Application/administrative forms (§1). Two form signals on a short document.
  const form = countSignals(raw, FORM_WORD);
  if (!longProse && form.n >= 2 && shortDoc) {
    return reject('form', `Form signals (markers=${form.n}).`, 0.7);
  }

  // 9) POSITIVE study evidence — accept (§1 accepted list, §11, §12, §16).
  if (isLearningType(cls.documentType)) return accept(`Classifier recognised study material (${cls.documentType}).`, Math.max(cls.confidence, 0.6));
  if (cls.documentType === 'SYLLABUS' || cls.documentType === 'QUESTION_PAPER') {
    return accept(`Classifier recognised course/exam material (${cls.documentType}).`, Math.max(cls.confidence, 0.6));
  }
  if (longProse) return accept(`Long, continuous educational prose (words=${prose.wordCount}).`, 0.6);
  if (prose.looksLikeProse && studyKw.n >= 1) return accept(`Educational prose with study terms (${studyKw.n}).`, 0.58);
  if (studyKw.n >= 3) return accept(`Multiple distinct study terms (${studyKw.n}).`, 0.55);
  if (prose.readsLikeNaturalText) return accept('Reads like natural explanatory text with no disqualifying signals.', 0.5);

  // 10) Conservative default (§1/§7): cannot reasonably confirm study material → reject.
  return reject('unknown', `No confident study signal (classifier=${cls.documentType}, words=${prose.wordCount}, studyTerms=${studyKw.n}).`, 0.4);
}

/** Convenience for callers/tests: true when a guard result is a rejection. */
export function isRejected(result) {
  return Boolean(result) && result.decision === 'reject';
}

