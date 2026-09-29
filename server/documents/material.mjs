import { generateText } from '../ai/provider.mjs';

export const MATERIAL_STYLES = Object.freeze(['quick', 'detailed', 'revision', 'exam']);

const STYLE_INSTRUCTION = {
  quick: 'Write QUICK NOTES: the shortest correct summary. Overview in 2-3 sentences, then a tight bullet list of key points. No padding.',
  detailed: 'Write a DETAILED EXPLANATION: overview, each key concept explained in its own short paragraph, a worked example if the source contains one, and common mistakes.',
  revision: 'Write a ONE-PAGE REVISION SHEET: dense but scannable — overview, key concepts as bullets, important rules, and a "Quick Revision" recap. It must fit on one page.',
  exam: 'Write EXAM PREPARATION material: the definitions and rules most likely to be tested, common mistakes, and a short "what to remember" list. Focus on what earns marks.',
};

export function buildMaterialPrompt({ topic, contextText, style = 'revision', pageRanges = [], documentTitle = 'the uploaded material' }) {
  const styleLine = STYLE_INSTRUCTION[style] ?? STYLE_INSTRUCTION.revision;
  const pages = pageRanges.length
    ? pageRanges.map((r) => (r.start === r.end ? `${r.start}` : `${r.start}-${r.end}`)).join(', ')
    : 'the retrieved sections';
  return `You are a study-material writer for a learner. Produce concise learning material on ONE topic, using ONLY the source passages provided below.

TOPIC: ${topic}

${styleLine}

HARD RULES:
- Use ONLY the SOURCE PASSAGES. Do not add facts, figures, definitions or claims the passages do not contain.
- If you add a sentence of general explanation to aid understanding, prefix it with "(Context)" so it is clearly not from the source.
- Do not invent page numbers or citations. The source pages are: ${pages}.
- If the passages are thin on this topic, write less rather than padding with invented content.

STRUCTURE (use these headings, omit a section only if the source truly offers nothing for it):
Overview
Key Concepts
Important Rules
Example
Common Mistakes
Quick Revision

End with a line:
Source: ${documentTitle}, pages ${pages}

SOURCE PASSAGES (the only permitted source of truth):
"""
${contextText}
"""`;
}

export async function generateMaterial({ topic, retrieval, style = 'revision', documentTitle, env = process.env } = {}) {
  const contextText = String(retrieval?.contextText ?? '').trim();
  if (contextText === '') {
    return { ok: false, code: 'no_context', message: 'No relevant source content was found for this topic, so no grounded material could be written.' };
  }
  const prompt = buildMaterialPrompt({
    topic,
    contextText,
    style: MATERIAL_STYLES.includes(style) ? style : 'revision',
    pageRanges: retrieval.pageRanges ?? [],
    documentTitle: documentTitle ?? 'the uploaded material',
  });

  const result = await generateText(prompt, { env });
  if (!result.ok) return { ok: false, code: result.code, message: result.message };

  const markdown = String(result.text ?? '').trim();
  if (markdown.length < 40) {
    return { ok: false, code: 'empty_material', message: 'The provider returned no usable material for this topic.' };
  }

  return {
    ok: true,
    topic,
    style,
    markdown,
    sourcePages: retrieval.pageRanges ?? [],
    sections: retrieval.sections ?? [],
    provider: result.provider,
  };
}
