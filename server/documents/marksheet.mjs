const STRONG_MIN = 80;
const AVERAGE_MIN = 50;

export const DEFAULT_SUBJECT_COMPETENCY_MAP = [
  [['data structure', 'algorithm', 'daa'], 'Data Structures & Algorithms'],
  [['database', 'dbms', 'sql', 'rdbms'], 'Database Systems'],
  [['network', 'tcp', 'computer network', 'cn'], 'Computer Networks'],
  [['operating system', 'os '], 'Operating Systems'],
  [['programming', 'java', 'python', 'c++', 'oop', 'object oriented'], 'Programming'],
  [['mathematics', 'maths', 'calculus', 'algebra', 'discrete', 'statistics', 'probability'], 'Mathematics'],
  [['machine learning', 'artificial intelligence', 'neural', 'deep learning', ' ai '], 'AI / Machine Learning'],
  [['software engineering', 'sdlc', 'agile'], 'Software Engineering'],
  [['web', 'html', 'javascript', 'frontend', 'react'], 'Web Development'],
  [['compiler', 'automata', 'theory of computation', 'flat'], 'Theory of Computation'],
  [['digital', 'microprocessor', 'coa', 'computer organization', 'architecture'], 'Computer Architecture'],
];

const GRADEPOINT_TO_PERCENT = (gp) => (Number.isFinite(gp) && gp >= 0 && gp <= 10 ? Math.round(gp * 10) : null);

function bandOf(percent) {
  if (percent === null || percent === undefined) return 'unrated';
  if (percent >= STRONG_MIN) return 'strong';
  if (percent >= AVERAGE_MIN) return 'average';
  return 'needs-work';
}

function mapCompetency(subject, map = DEFAULT_SUBJECT_COMPETENCY_MAP) {
  const s = ` ${subject.toLowerCase()} `;
  for (const [keys, competency] of map) {
    if (keys.some((k) => s.includes(k))) return competency;
  }
  return null;
}

export function extractMarksheet(text, { subjectMap = DEFAULT_SUBJECT_COMPETENCY_MAP } = {}) {
  const lines = String(text ?? '').split(/\r?\n/);
  const rows = [];

  for (const line of lines) {
    const clean = line.trim();
    if (clean.length < 4) continue;
    if (/^(subject|course)\b/i.test(clean) && /(credit|marks|grade)/i.test(clean)) continue;

    let cells = clean.includes('|') ? clean.split('|')
      : /\t/.test(clean) ? clean.split('\t')
        : clean.split(/\s{2,}/);
    cells = cells.map((c) => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;

    const subjectCell = cells.find((c) => /[a-z]{4,}/i.test(c) && !/^\d/.test(c));
    if (!subjectCell) continue;
    const subject = subjectCell.replace(/\s+/g, ' ').trim();
    if (subject.length < 3 || subject.length > 80) continue;

    const rest = cells.filter((c) => c !== subjectCell);
    const joined = rest.join(' ');

    const codeMatch = /\b([A-Z]{2,4}\s?\d{2,4}[A-Z]?\d?)\b/.exec(clean);
    const marksMax = /\b(\d{1,3})\s*\/\s*(\d{2,3})\b/.exec(joined);
    const gradeMatch = /\b(O|A\+|A|B\+|B|C\+|C|D|E|F|P|S)\b/.exec(joined);
    const gpMatch = /\b(10(?:\.0)?|[0-9](?:\.\d)?)\b/.exec(joined.replace(marksMax ? marksMax[0] : '', ''));
    const creditsMatch = /\bcredits?\s*[:=]?\s*(\d{1,2})\b/i.exec(clean);

    let marks = null; let maxMarks = null; let percent = null;
    if (marksMax) {
      marks = Number.parseInt(marksMax[1], 10);
      maxMarks = Number.parseInt(marksMax[2], 10);
      if (maxMarks > 0) percent = Math.round((marks / maxMarks) * 100);
    }
    let gradePoint = null;
    if (percent === null && gpMatch) {
      const gp = Number.parseFloat(gpMatch[1]);
      if (gp >= 0 && gp <= 10) { gradePoint = gp; percent = GRADEPOINT_TO_PERCENT(gp); }
    }

    const grade = gradeMatch ? gradeMatch[1] : null;
    if (percent === null && !grade) continue;

    rows.push({
      subject,
      code: codeMatch ? codeMatch[1].replace(/\s+/g, '') : null,
      credits: creditsMatch ? Number.parseInt(creditsMatch[1], 10) : null,
      marks,
      maxMarks,
      grade,
      gradePoint,
      percent,               // null when only an ungrounded letter grade was present
      band: bandOf(percent), // 'unrated' when percent is null — never guessed
      competency: mapCompetency(subject, subjectMap),
    });
  }

  const withPercent = rows.filter((r) => r.percent !== null);
  const overallPercent = withPercent.length
    ? Math.round(withPercent.reduce((s, r) => s + r.percent, 0) / withPercent.length)
    : null;
  const withGp = rows.filter((r) => r.gradePoint !== null);
  const cgpa = withGp.length
    ? Number((withGp.reduce((s, r) => s + r.gradePoint * (r.credits ?? 1), 0)
      / withGp.reduce((s, r) => s + (r.credits ?? 1), 0)).toFixed(2))
    : null;

  return { rows, overall: { percent: overallPercent, cgpa } };
}

export function analyzePerformance(marksheet) {
  const { rows, overall } = marksheet;
  const strong = rows.filter((r) => r.band === 'strong');
  const weak = rows.filter((r) => r.band === 'needs-work');
  const average = rows.filter((r) => r.band === 'average');

  const gaps = weak
    .filter((r) => r.competency && r.percent !== null)
    .map((r) => ({ competency: r.competency, subject: r.subject, percent: r.percent, gap: 100 - r.percent }))
    .sort((a, b) => b.gap - a.gap);

  return {
    overall,
    strongAreas: strong.map((r) => ({ subject: r.subject, percent: r.percent, competency: r.competency })),
    averageAreas: average.map((r) => ({ subject: r.subject, percent: r.percent, competency: r.competency })),
    attentionAreas: weak.map((r) => ({ subject: r.subject, percent: r.percent, competency: r.competency })),
    competencyGaps: gaps,
    unmapped: rows.filter((r) => !r.competency).map((r) => r.subject),
    unmeasured: rows.filter((r) => r.percent === null).map((r) => r.subject),
  };
}
