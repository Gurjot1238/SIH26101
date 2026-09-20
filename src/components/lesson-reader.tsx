/**
 * The in-app lesson reader — the thing that lets a lesson mark *itself* done.
 *
 * The catalogue used to open each lesson in a new browser tab and rely on the learner
 * ticking a checkbox afterwards. That is two problems in one: the tick is a claim, not
 * evidence, and the material was never actually in the app. This reads the lesson *inside*
 * the app and completes it only once the learner has scrolled to the end of it — so
 * completion means "this was read", not "this was clicked".
 *
 * How "read" is decided:
 *  - Markdown / plain text is parsed (src/lib/markdown.ts, zero-dependency) into real React
 *    elements — never dangerouslySetInnerHTML — and rendered in a scroll box. When the box
 *    is scrolled to within a small threshold of the bottom, the lesson is complete. A lesson
 *    short enough that there is nothing to scroll is complete as soon as it has been seen.
 *  - A PDF (or anything binary) is shown in an <embed>. A cross-origin embed's inner scroll
 *    cannot be observed, so those complete on a short dwell instead — the honest best a
 *    browser allows. This is rare: the dataset is almost entirely Markdown.
 *
 * The reader never writes progress itself. It calls `onComplete(lessonId)` once, and the
 * catalogue page owns the save. That keeps this component pure UI and testable against the
 * markdown parser without a server.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Check, RefreshCw, X } from 'lucide-react';
import { type Block, type InlineNode, parseMarkdown } from '@/lib/markdown';
import { contentUrl, fetchLessonContent } from '@/lib/course-content';
import { AuthError } from '@/lib/auth';

/** How close to the bottom (px) counts as "reached the end". A little slack for sub-pixel scroll. */
const BOTTOM_SLACK = 24;
/** A PDF/binary lesson can't be scroll-tracked; it completes after this long on screen. */
const PDF_DWELL_MS = 8000;

export type LessonReaderProps = {
  courseId: string;
  lessonId: string;
  title: string;
  contentFile: string;
  /** Source page for this lesson, shown as a footer link when present. */
  sourceUrl?: string;
  /** True if the learner has already completed this lesson — the reader shows it as done. */
  alreadyDone: boolean;
  /** Called once, the first time the lesson is read through. The parent saves progress. */
  onComplete: (lessonId: string) => void;
  onClose: () => void;
};

/* ------------------------------------------------------------------ inline render */

function renderInline(nodes: InlineNode[], keyPrefix: string) {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (node.type) {
      case 'text':
        return <span key={key}>{node.value}</span>;
      case 'strong':
        return <strong key={key} className="font-semibold text-foreground">{renderInline(node.children, key)}</strong>;
      case 'em':
        return <em key={key}>{renderInline(node.children, key)}</em>;
      case 'code':
        return <code key={key} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[.85em] text-foreground">{node.value}</code>;
      case 'link':
        return <a key={key} href={node.href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">{renderInline(node.children, key)}</a>;
      case 'image':
        // The dataset's image URLs are dead CDN links, so an <img> would just show a broken
        // icon. The alt text is the useful part, shown as a caption.
        return <span key={key} className="italic text-muted-foreground">[image: {node.alt || 'figure'}]</span>;
      default:
        return null;
    }
  });
}

/* ------------------------------------------------------------------ block render */

function renderBlock(block: Block, i: number) {
  const key = `b-${i}`;
  switch (block.type) {
    case 'heading': {
      const cls =
        block.level <= 1 ? 'mt-6 font-serif text-2xl leading-tight text-foreground'
        : block.level === 2 ? 'mt-6 font-serif text-xl leading-snug text-foreground'
        : 'mt-5 text-base font-semibold text-foreground';
      return <p key={key} className={`${cls} first:mt-0`}>{renderInline(block.children, key)}</p>;
    }
    case 'paragraph':
      return <p key={key} className="mt-4 text-sm leading-7 text-foreground/90 first:mt-0">{renderInline(block.children, key)}</p>;
    case 'blockquote':
      return <blockquote key={key} className="mt-4 border-l-2 border-primary bg-secondary px-4 py-2 text-sm leading-7 text-foreground/80">{renderInline(block.children, key)}</blockquote>;
    case 'code':
      return <pre key={key} className="mt-4 overflow-x-auto rounded-lg bg-sidebar p-4 text-xs leading-6 text-sidebar-foreground"><code>{block.value}</code></pre>;
    case 'list':
      return block.ordered
        ? <ol key={key} className="mt-4 list-decimal space-y-1.5 pl-6 text-sm leading-7 text-foreground/90">{block.items.map((item, j) => <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>)}</ol>
        : <ul key={key} className="mt-4 list-disc space-y-1.5 pl-6 text-sm leading-7 text-foreground/90">{block.items.map((item, j) => <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>)}</ul>;
    case 'hr':
      return <hr key={key} className="mt-6 border-border" />;
    default:
      return null;
  }
}

/** Is this a PDF/binary that has to be embedded rather than parsed? */
function isBinary(contentType: string, contentFile: string): boolean {
  return /pdf|octet-stream/i.test(contentType) || /\.pdf$/i.test(contentFile);
}

export function LessonReader({ courseId, lessonId, title, contentFile, sourceUrl, alreadyDone, onComplete, onClose }: LessonReaderProps) {
  const [status, setStatus] = useState<'loading' | 'text' | 'binary' | 'error'>('loading');
  const [text, setText] = useState('');
  const [problem, setProblem] = useState('');
  const [reached, setReached] = useState(alreadyDone);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  /** Guards `onComplete` so the parent's save fires exactly once per reading. */
  const firedRef = useRef(alreadyDone);

  // Fetch the lesson's real content. Course content is public, so no session is needed.
  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setProblem('');
    fetchLessonContent(courseId, contentFile)
      .then(({ text: body, contentType }) => {
        if (!alive) return;
        if (isBinary(contentType, contentFile)) {
          setStatus('binary');
        } else {
          setText(body);
          setStatus('text');
        }
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setStatus('error');
        setProblem(error instanceof AuthError ? error.message : 'This lesson could not be opened.');
      });
    return () => { alive = false; };
  }, [courseId, contentFile]);

  const blocks = useMemo(() => (status === 'text' ? parseMarkdown(text) : []), [status, text]);

  const markReached = () => {
    setReached(true);
    if (!firedRef.current) {
      firedRef.current = true;
      onComplete(lessonId);
    }
  };

  // Text lessons: complete when scrolled to the end. A lesson that isn't tall enough to
  // scroll has already been read in full the moment it's on screen, so complete it then.
  useEffect(() => {
    if (status !== 'text') return;
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_SLACK) markReached();
    };
    // Defer one frame so layout has settled before measuring scroll height.
    const raf = requestAnimationFrame(check);
    el.addEventListener('scroll', check, { passive: true });
    return () => { cancelAnimationFrame(raf); el.removeEventListener('scroll', check); };
    // markReached is stable enough for this effect's purpose; re-run only on content change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, blocks]);

  // PDF/binary lessons: can't observe inner scroll, so complete on a short dwell.
  useEffect(() => {
    if (status !== 'binary') return;
    const timer = setTimeout(markReached, PDF_DWELL_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Close on Escape, and lock the page behind the overlay from scrolling.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-[hsl(214_40%_16%/.55)] p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title} data-testid="lesson-reader">
      <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-card shadow-2xl sm:h-[86vh] sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Reading lesson</p>
            <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
          </div>
          {reached && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e2f1ef] px-2.5 py-1 text-[11px] font-semibold text-[#216b67]" data-testid="lesson-reader-done"><Check className="size-3.5" /> Read</span>}
          <button onClick={onClose} data-testid="button-lesson-reader-close" aria-label="Close reader" className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="size-4" /></button>
        </div>

        {/* Body */}
        {status === 'loading' && <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground"><RefreshCw className="mr-2 size-4 animate-spin" /> Opening lesson…</div>}

        {status === 'error' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-sm text-muted-foreground">{problem}</p>
            {sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Open the source page <ArrowUpRight className="size-3.5" /></a>}
          </div>
        )}

        {status === 'text' && (
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 sm:px-10" data-testid="lesson-reader-scroll">
            <article className="mx-auto max-w-2xl">{blocks.map(renderBlock)}</article>
            <div className="mx-auto mt-10 max-w-2xl border-t border-border pt-4 text-center text-xs text-muted-foreground">
              {reached ? 'You have reached the end of this lesson — it is marked read.' : 'Scroll to the end to mark this lesson read.'}
              {sourceUrl && <> · <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Source <ArrowUpRight className="inline size-3" /></a></>}
            </div>
          </div>
        )}

        {status === 'binary' && (
          <div className="flex flex-1 flex-col">
            <embed src={contentUrl(courseId, contentFile)} type="application/pdf" className="h-full w-full flex-1" data-testid="lesson-reader-embed" />
            <p className="border-t border-border px-5 py-3 text-center text-xs text-muted-foreground">
              {reached ? 'Marked read.' : 'This lesson is a document; it will be marked read shortly.'}
              {sourceUrl && <> · <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Source <ArrowUpRight className="inline size-3" /></a></>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
