/**
 * A small, dependency-free Markdown parser for lesson content.
 *
 * The dataset ships 700+ real Markdown lessons (OpenStax, MIT OCW and the like). To read
 * one *inside* the app — which is what lets us tell when a learner has scrolled through
 * it — the Markdown has to become elements this app renders itself. There is no Markdown
 * library on the client (the whole stack is deliberately zero-runtime-dependency), so this
 * file is it.
 *
 * It parses to a *block tree*, not to an HTML string. That is the important choice: the
 * React reader turns these nodes into real elements, so nothing is ever fed to
 * `dangerouslySetInnerHTML` and a malformed lesson can produce a wrong-looking heading but
 * never injected markup. Being a pure function of a string, it is also testable in plain
 * Node with no browser — see scripts/markdown-test.mjs.
 *
 * It is intentionally a pragmatic subset, matched to what the lessons actually use:
 * ATX headings, blockquotes, fenced and indented code, ordered/unordered lists,
 * horizontal rules, images (kept as a node the reader shows as a caption, because the
 * dataset's image URLs are dead CDN links), and paragraphs — with inline bold, italic,
 * inline code and links inside all of them. Anything it does not recognise degrades to a
 * paragraph of text rather than being dropped, so no lesson ever renders blank.
 */

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'strong'; children: InlineNode[] }
  | { type: 'em'; children: InlineNode[] }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; children: InlineNode[] }
  | { type: 'image'; alt: string };

export type Block =
  | { type: 'heading'; level: number; children: InlineNode[] }
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'blockquote'; children: InlineNode[] }
  | { type: 'code'; value: string }
  | { type: 'list'; ordered: boolean; items: InlineNode[][] }
  | { type: 'hr' };

/* --------------------------------------------------------------- inline */

/**
 * Parse the inline span of one line/paragraph: bold, italic, inline code, links, images.
 *
 * A single left-to-right scan. `**`/`__` is strong, `*`/`_` is emphasis, backticks are
 * literal code (no inner parsing), `[text](href)` is a link, `![alt](src)` an image.
 * Unmatched markers are treated as plain text, so a stray asterisk never eats the rest of
 * a paragraph.
 */
export function parseInline(input: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let text = '';
  const flush = () => {
    if (text) { nodes.push({ type: 'text', value: text }); text = ''; }
  };

  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    const rest = input.slice(i);

    // Inline code: literal until the next backtick.
    if (ch === '`') {
      const end = input.indexOf('`', i + 1);
      if (end > i) {
        flush();
        nodes.push({ type: 'code', value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Image: ![alt](src) — matched before link because it starts with '!'.
    if (ch === '!' && input[i + 1] === '[') {
      const m = /^!\[([^\]]*)\]\(([^)]*)\)/.exec(rest);
      if (m) {
        flush();
        nodes.push({ type: 'image', alt: m[1] });
        i += m[0].length;
        continue;
      }
    }

    // Link: [text](href). Angle brackets in the href (the dataset uses them) are kept.
    if (ch === '[') {
      const m = /^\[([^\]]*)\]\(<?([^)>]*)>?\)/.exec(rest);
      if (m) {
        flush();
        nodes.push({ type: 'link', href: m[2], children: parseInline(m[1]) });
        i += m[0].length;
        continue;
      }
    }

    // Strong: ** or __ (two chars), then the matching close.
    if ((rest.startsWith('**') || rest.startsWith('__'))) {
      const marker = rest.slice(0, 2);
      const end = input.indexOf(marker, i + 2);
      if (end > i + 1) {
        flush();
        nodes.push({ type: 'strong', children: parseInline(input.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }

    // Emphasis: single * or _ with a matching close on the same line.
    if (ch === '*' || ch === '_') {
      const end = input.indexOf(ch, i + 1);
      if (end > i) {
        flush();
        nodes.push({ type: 'em', children: parseInline(input.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }

    text += ch;
    i += 1;
  }
  flush();
  return nodes;
}

/* ---------------------------------------------------------------- blocks */

const HR = /^ {0,3}([-*_])(?: *\1){2,} *$/;
const ATX = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const UL = /^ {0,3}[-*+]\s+(.*)$/;
const OL = /^ {0,3}\d+[.)]\s+(.*)$/;
const FENCE = /^ {0,3}(```|~~~)/;

/** Split into blocks and parse each. Blank lines separate paragraphs and end lists. */
export function parseMarkdown(input: string): Block[] {
  const lines = String(input ?? '').replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  const flushParagraph = (buffer: string[]) => {
    const joined = buffer.join(' ').trim();
    if (joined) blocks.push({ type: 'paragraph', children: parseInline(joined) });
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') { i += 1; continue; }

    // Fenced code: everything until the closing fence, verbatim.
    const fence = FENCE.exec(line);
    if (fence) {
      const marker = fence[1];
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trimStart().startsWith(marker)) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1; // consume the closing fence (or run off the end harmlessly)
      blocks.push({ type: 'code', value: body.join('\n') });
      continue;
    }

    // Horizontal rule.
    if (HR.test(line)) { blocks.push({ type: 'hr' }); i += 1; continue; }

    // Heading.
    const atx = ATX.exec(line);
    if (atx) {
      blocks.push({ type: 'heading', level: atx[1].length, children: parseInline(atx[2]) });
      i += 1;
      continue;
    }

    // Blockquote: consecutive `>` lines, joined.
    if (/^ {0,3}>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^ {0,3}>/.test(lines[i])) {
        quote.push(lines[i].replace(/^ {0,3}>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'blockquote', children: parseInline(quote.join(' ').trim()) });
      continue;
    }

    // List: a run of like-marker items. A blank line or a non-item ends it.
    if (UL.test(line) || OL.test(line)) {
      const ordered = OL.test(line);
      const items: InlineNode[][] = [];
      while (i < lines.length) {
        const m = ordered ? OL.exec(lines[i]) : UL.exec(lines[i]);
        if (!m) break;
        items.push(parseInline(m[1]));
        i += 1;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    // Indented code block (four spaces or a tab), verbatim until it stops.
    if (/^( {4}|\t)/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && (/^( {4}|\t)/.test(lines[i]) || lines[i].trim() === '')) {
        if (lines[i].trim() === '' && !/^( {4}|\t)/.test(lines[i + 1] ?? '')) break;
        body.push(lines[i].replace(/^( {4}|\t)/, ''));
        i += 1;
      }
      blocks.push({ type: 'code', value: body.join('\n').replace(/\n+$/, '') });
      continue;
    }

    // Otherwise: a paragraph, gathering lines until a blank or a block starter.
    const buffer: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !ATX.test(lines[i]) &&
      !HR.test(lines[i]) &&
      !FENCE.test(lines[i]) &&
      !/^ {0,3}>/.test(lines[i]) &&
      !UL.test(lines[i]) &&
      !OL.test(lines[i])
    ) {
      buffer.push(lines[i].trim());
      i += 1;
    }
    flushParagraph(buffer);
  }

  return blocks;
}
