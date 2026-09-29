import { classifyDocument, isLearningType } from './classify.mjs';

export const GUARD_CATEGORIES = Object.freeze([
  'study_material',
  'marksheet', 'transcript', 'certificate',
  'government_id', 'student_id', 'passport',
  'financial_document', 'medical_document', 'legal_document',
  'resume', 'form', 'personal_document', 'unrelated_image', 'unknown',
]);

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

export function rejectionMessage(category) {
  return MESSAGES[category] ?? MESSAGES.unknown;
}

const AADHAAR_NUM = /\b\d{4}\s\d{4}\s\d{4}\b/;
const AADHAAR_WORD = /\b(aadhaar|aadhar|uidai|unique identification authority)\b/i;
const AADHAAR_CTX = /\b(government of india|govt\.? of india|date of birth|year of birth|\bdob\b|male|female|s\/o|d\/o|w\/o)\b/i;
const PAN_NUM = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/;
const PAN_WORD = /\b(permanent account number|income tax department|\bpan\b)/i;
const PASSPORT_WORD = /\bpassport\b/i;
const PASSPORT_NUM = /\b[A-PR-WYa-pr-wy][0-9]{7}\b/;
const PASSPORT_CTX = /\b(republic of india|place of issue|date of issue|date of expiry|nationality|given name(s)?|surname|passport no)\b/i;
const VOTER_WORD = /\b(voter\s*id|elector'?s? photo identity|epic\s*(no|number)|election commission of india)\b/i;
const VOTER_NUM = /\b[A-Z]{3}[0-9]{7}\b/;
const DL_WORD = /\b(driving licen[cs]e|licence to drive|motor vehicles? act|transport department|\bdl\s*no\b)\b/i;
const DL_NUM = /\b[A-Z]{2}[- ]?\d{2}[- ]?\d{11}\b/;

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
const FINANCIAL_HARD = [/\b[A-Z]{4}0[A-Z0-9]{6}\b/, /\b\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]\b/];
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

const round = (n) => Number(Math.max(0, Math.min(1, n)).toFixed(2));

function countSignals(text, patterns) {
  let n = 0;
  const hit = [];
  for (const p of patterns) {
    if (p.test(text)) { n += 1; hit.push(p.source); }
  }
  return { n, hit };
}

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
  const readsLikeNaturalText = wordCount >= 12 && avgSentenceWords >= 6 && digitRatio < 0.2 && letterRatio >= 0.55;
  const looksLikeProse = wordCount >= 90 && letterRatio >= 0.6 && digitRatio < 0.12 && avgSentenceWords >= 8;
  return { wordCount, digitRatio, letterRatio, avgSentenceWords, readsLikeNaturalText, looksLikeProse };
}

function transactionRowRatio(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return 0;
  const dateRe = /\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/i;
  const moneyRe = /((₹|rs\.?|inr|\$|usd)\s?\d)|(\d[\d,]*\.\d{2})\b/i;
  let rows = 0;
  for (const l of lines) if (dateRe.test(l) && moneyRe.test(l)) rows += 1;
  return rows / lines.length;
}

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

export function guardDocument({ text = '', filename = '', pageCount = 1, charsPerPage = null } = {}) {
  const raw = String(text);
  const name = String(filename);

  const cls = classifyDocument({ text: raw, filename: name, pageCount, charsPerPage });
  const prose = proseProfile(raw);
  const txnRatio = transactionRowRatio(raw);
  const studyKw = countSignals(raw, STUDY_KEYWORD);
  const shortDoc = pageCount <= 4;
  const longProse = (pageCount >= 15 || raw.length >= 20000 || prose.wordCount >= 1200)
    && prose.looksLikeProse && txnRatio < 0.15;
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

  const readable = raw.replace(/\s/g, '').length;
  if (readable < 25) {
    return reject('unrelated_image', 'No readable text was extracted (blank, image-only, or unsupported file).', 0.6);
  }

  const id = detectIdentity(raw);
  if (!eduProseDominant) {
    if (id.govtId) return reject('government_id', 'Government identity fingerprint (formatted ID number + identity context).', 0.9);
    if (id.passport) return reject('passport', 'Passport fingerprint (passport number/context).', 0.9);
    if (id.studentId && shortDoc) return reject('student_id', 'Identity-card fingerprint on a short document.', 0.8);
  }

  const ms = countSignals(raw, MARKSHEET_CORROB);
  const marksheetByClassifier = cls.documentType === 'MARKSHEET';
  const marksheetByCorrob = ms.n >= 2 && (cls.signals.tableHeader || cls.signals.tableRows >= 3 || shortDoc);
  if (!longProse && (marksheetByClassifier || marksheetByCorrob)) {
    const isTranscript = TRANSCRIPT_WORD.some((re) => re.test(raw));
    return reject(isTranscript ? 'transcript' : 'marksheet',
      `Academic-result signals (corroborations=${ms.n}, classifier=${cls.documentType}).`, Math.max(cls.confidence, 0.7));
  }

  const cert = countSignals(raw, CERT_WORD);
  if (!longProse && (cls.documentType === 'CERTIFICATE' || (cert.n >= 1 && pageCount <= 6))) {
    return reject('certificate', `Certificate signals (phrases=${cert.n}, classifier=${cls.documentType}).`, Math.max(cls.confidence, 0.7));
  }

  const fin = countSignals(raw, FINANCIAL_WORD);
  const finHard = FINANCIAL_HARD.some((re) => re.test(raw));
  if (!longProse && (finHard || fin.n >= 2 || (fin.n >= 1 && txnRatio >= 0.2))) {
    return reject('financial_document', `Financial signals (markers=${fin.n}, hardCode=${finHard}, txnRows=${round(txnRatio)}).`, 0.75);
  }

  const med = countSignals(raw, MEDICAL_WORD);
  const medAnchor = /\bpatient\s*(name|id)\b/i.test(raw) || /\brx\b/i.test(raw) || /\bprescription\b/i.test(raw) || /\bdischarge summary\b/i.test(raw);
  if (!longProse && medAnchor && med.n >= 2) {
    return reject('medical_document', `Medical record signals (markers=${med.n}, anchor).`, 0.75);
  }

  const legal = countSignals(raw, LEGAL_WORD);
  if (!longProse && legal.n >= 2) {
    return reject('legal_document', `Legal instrument signals (phrases=${legal.n}).`, 0.7);
  }

  const res = countSignals(raw, RESUME_WORD);
  const hasContact = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/.test(raw) && /(\+?\d[\d\s-]{7,}\d)/.test(raw);
  if (!longProse && (res.n >= 2 || (res.n >= 1 && hasContact && shortDoc))) {
    return reject('resume', `Resume signals (sections=${res.n}, contact=${hasContact}).`, 0.7);
  }

  const form = countSignals(raw, FORM_WORD);
  if (!longProse && form.n >= 2 && shortDoc) {
    return reject('form', `Form signals (markers=${form.n}).`, 0.7);
  }

  if (isLearningType(cls.documentType)) return accept(`Classifier recognised study material (${cls.documentType}).`, Math.max(cls.confidence, 0.6));
  if (cls.documentType === 'SYLLABUS' || cls.documentType === 'QUESTION_PAPER') {
    return accept(`Classifier recognised course/exam material (${cls.documentType}).`, Math.max(cls.confidence, 0.6));
  }
  if (longProse) return accept(`Long, continuous educational prose (words=${prose.wordCount}).`, 0.6);
  if (prose.looksLikeProse && studyKw.n >= 1) return accept(`Educational prose with study terms (${studyKw.n}).`, 0.58);
  if (studyKw.n >= 3) return accept(`Multiple distinct study terms (${studyKw.n}).`, 0.55);
  if (prose.readsLikeNaturalText) return accept('Reads like natural explanatory text with no disqualifying signals.', 0.5);

  return reject('unknown', `No confident study signal (classifier=${cls.documentType}, words=${prose.wordCount}, studyTerms=${studyKw.n}).`, 0.4);
}

export function isRejected(result) {
  return Boolean(result) && result.decision === 'reject';
}
