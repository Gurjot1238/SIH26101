/**
 * The competency gap section of the Dashboard.
 *
 * Three charts and an overview strip, all drawn from `GET /api/analytics/competencies`.
 * Not one number on this screen is calculated here — the scores, the bands, the targets,
 * the shortfalls and the study order all arrive from the server, and this file decides
 * only where they sit and what colour they are.
 *
 * It lives in its own file rather than inside `demo-pages.tsx` so that adding it changed
 * no existing markup: the Dashboard gained one line. Everything visual reuses the tokens
 * already on the page — the same Card, the same eyebrow type, the same #dfe9ea grid and
 * 8px tooltips as the two charts above it — so it reads as part of the design rather
 * than bolted to it.
 */

import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, BarChart3, Sparkles, Target, TriangleAlert } from 'lucide-react';
import { Badge, Card, SectionHeading } from '@/components/ui';
import {
  AnalyticsError,
  type CompetencyAnalytics,
  type CompetencyRow,
  type PerformanceStatus,
  explainAnalytics,
  fetchCompetencyAnalytics,
  questionCountLabel,
  statusColors,
  statusLabel,
  statusTones,
} from '@/lib/analytics';

/** Chart axis and tooltip styling, copied from the charts already on this page. */
const AXIS = { fontSize: 10, fill: '#718189' } as const;
const CATEGORY_AXIS = { fontSize: 11, fill: '#40515a' } as const;
const TOOLTIP = { borderRadius: 8, border: '1px solid #dfe9ea', fontSize: 12 } as const;
const GRID = '#dfe9ea';

function StatusBadge({ status, scale }: { status: PerformanceStatus; scale: CompetencyAnalytics['scale'] }) {
  return <Badge tone={statusTones[status]}>{statusLabel(status, scale)}</Badge>;
}

/** One figure in the overview strip. Count-first, so a 0% off one question cannot mislead. */
function Tally({ label, value, note, tone }: { label: string; value: string; note: string; tone: PerformanceStatus }) {
  return <div className="rounded-lg border border-border p-4">
    <div className="flex items-center gap-2">
      <span className="size-2 rounded-full" style={{ backgroundColor: statusColors[tone] }} />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
    <p className="mt-2 font-serif text-3xl">{value}</p>
    <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
  </div>;
}

/**
 * `refreshKey` lets a parent force a re-fetch after it knows the data changed — e.g. the
 * quiz result screen bumps it once the just-finished attempt has been saved, so the gaps
 * shown include that sitting rather than the state from before it. Omitted on the
 * Dashboard, where a mount is always fresh.
 */
export function CompetencyGapSection({ refreshKey = 0, scope = 'all' }: { refreshKey?: number; scope?: 'all' | 'latest' } = {}) {
  const [analytics, setAnalytics] = useState<CompetencyAnalytics | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [problem, setProblem] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string[]>([]);
  const [explainState, setExplainState] = useState<'idle' | 'working' | 'failed'>('idle');
  const [explainProblem, setExplainProblem] = useState('');

  useEffect(() => {
    let live = true;
    fetchCompetencyAnalytics(scope)
      .then((payload) => {
        if (!live) return;
        setAnalytics(payload);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!live) return;
        // A signed-out or offline visitor gets nothing rather than a placeholder chart.
        // Drawing invented bars here would be the exact failure this whole feature exists
        // to remove, so the section simply does not render.
        setProblem(error instanceof AnalyticsError ? error.message : 'Could not load your competency analysis.');
        setStatus('unavailable');
      });
    return () => { live = false; };
  }, [refreshKey, scope]);

  const rows = analytics?.competencies ?? [];
  const chosen = useMemo(
    () => rows.find((row) => row.competency === selected) ?? null,
    [rows, selected],
  );

  /**
   * Chart 2's data. `reached` and `short` stack to the target, so the bar's full height is
   * the required level and the coral part is literally the gap — the shortfall is a
   * distance you can see rather than a number you have to find.
   */
  const gapData = useMemo(
    () => rows.map((row) => ({
      name: row.name,
      reached: Math.min(row.currentScore, row.requiredScore),
      short: row.gap,
      above: Math.max(row.currentScore - row.requiredScore, 0),
      current: row.currentScore,
      required: row.requiredScore,
      questions: row.questionsAttempted,
    })),
    [rows],
  );

  async function runExplain() {
    setExplainState('working');
    setExplainProblem('');
    try {
      const result = await explainAnalytics(scope);
      setExplanation(result.paragraphs);
      setExplainState('idle');
    } catch (error: unknown) {
      setExplanation([]);
      setExplainState('failed');
      setExplainProblem(
        error instanceof AnalyticsError ? error.message : 'The AI summary could not be generated.',
      );
    }
  }

  if (status === 'loading') {
    return <div className="mt-8"><Card className="p-5"><p className="text-sm text-muted-foreground">Loading your competency analysis…</p></Card></div>;
  }

  // Nothing to draw and nothing to pretend. The rest of the Dashboard is unaffected.
  if (status === 'unavailable' || !analytics) {
    return <div className="mt-8"><Card className="p-5"><p className="text-sm leading-6 text-muted-foreground">{problem}</p></Card></div>;
  }

  if (!analytics.measured || rows.length === 0) {
    return <div className="mt-8">
      <SectionHeading eyebrow="Competency overview" title="Your competency gaps" description="Measured from the answers you gave, not from a sample." />
      <Card className="p-5">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-10 text-center">
          <BarChart3 className="size-6 text-muted-foreground" />
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Take an assessment and this section fills with your own competency scores, the level each one is expected to reach, and the gap between them. Nothing is charted until you have answered something.
          </p>
        </div>
      </Card>
    </div>;
  }

  const scale = analytics.scale;
  const biggest = analytics.gaps.slice(0, 4);

  return <div className="mt-8">
    <SectionHeading
      eyebrow="Competency overview"
      title="Your competency gaps"
      description={`Measured from ${questionCountLabel(analytics.overall.questionsAttempted)} you actually answered, across ${analytics.attempts} assessment${analytics.attempts === 1 ? '' : 's'}.`}
      action={<span className="text-xs text-muted-foreground">Overall {analytics.overall.score}% · {statusLabel(analytics.overall.status, scale)}</span>}
    />

    {/* ------------------------------------------------- the four-figure strip */}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tally
        label="Strong areas"
        value={String(analytics.strengths.length)}
        note={analytics.strengths.map((row) => row.name).join(', ') || 'None at this level yet'}
        tone="strong"
      />
      <Tally
        label="Doing well"
        value={String(analytics.good.length)}
        note={analytics.good.map((row) => row.name).join(', ') || 'None at this level yet'}
        tone="good"
      />
      <Tally
        label="Needs improvement"
        value={String(analytics.needsImprovement.length)}
        note={analytics.needsImprovement.map((row) => row.name).join(', ') || 'Nothing in this band'}
        tone="needs-improvement"
      />
      <Tally
        label="Weak areas"
        value={String(analytics.weaknesses.length)}
        note={analytics.weaknesses.map((row) => row.name).join(', ') || 'Nothing in this band'}
        tone="weak"
      />
    </div>

    {analytics.unmeasured.length > 0 && <p className="mt-3 text-xs leading-5 text-muted-foreground">
      Not yet measured: {analytics.unmeasured.map((row) => row.name).join(', ')}. These are not scored as zero — you have simply not answered anything in them.
    </p>}

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      {/* ------------------------------------------- chart 1: competency scores */}
      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Chart 1</p>
          <h3 className="mt-1 font-serif text-[22px]">Score by competency</h3>
          <p className="mt-1 text-sm text-muted-foreground">Bar colour is the band your score falls in. Select a bar to see the topics beneath it.</p>
        </div>
        <div className="p-5">
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows.map((row) => ({ name: row.name, score: row.currentScore, competency: row.competency, status: row.status, questions: row.questionsAttempted }))} layout="vertical" margin={{ left: 14, right: 20 }} barCategoryGap={13}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={AXIS} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={CATEGORY_AXIS} width={92} />
                <Tooltip
                  cursor={{ fill: '#f2f6f6' }}
                  contentStyle={TOOLTIP}
                  formatter={(value: number, _name, item) => [`${value}% · ${questionCountLabel((item?.payload as { questions: number })?.questions ?? 0)}`, 'Your score']}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={15} onClick={(entry: { competency?: string }) => setSelected(entry?.competency ?? null)}>
                  {rows.map((row) => <Cell key={row.competency} fill={statusColors[row.status]} cursor="pointer" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
            {scale.levels.map((level) => <span key={level.id} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: statusColors[level.id] }} />
              {level.label} {level.min}%+
            </span>)}
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: statusColors.unrated }} />
              {scale.unratedLabel} (under {scale.minQuestions})
            </span>
          </div>
        </div>
      </Card>

      {/* ---------------------------------- chart 3: topics under one competency */}
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Chart 3</p>
            <h3 className="mt-1 font-serif text-[22px]">{chosen ? chosen.name : 'Topic breakdown'}</h3>
          </div>
          {chosen && <StatusBadge status={chosen.status} scale={scale} />}
        </div>
        {chosen ? <>
          <p className="mt-1 text-sm text-muted-foreground">
            {chosen.currentScore}% against a target of {chosen.requiredScore}%, from {questionCountLabel(chosen.questionsAttempted)}.
            {chosen.gap > 0 ? ` ${chosen.gap} points short.` : ' Already at the expected level.'}
          </p>
          <div className="mt-4 h-[178px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chosen.topics.map((topic) => ({ name: topic.name, score: topic.score, questions: topic.questionsAttempted, status: topic.status }))} layout="vertical" margin={{ left: 4, right: 16 }} barCategoryGap={10}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={AXIS} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={CATEGORY_AXIS} width={120} />
                <Tooltip
                  cursor={{ fill: '#f2f6f6' }}
                  contentStyle={TOOLTIP}
                  formatter={(value: number, _name, item) => [`${value}% · ${questionCountLabel((item?.payload as { questions: number })?.questions ?? 0)}`, 'Topic score']}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={13}>
                  {chosen.topics.map((topic) => <Cell key={topic.name} fill={statusColors[topic.status]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5 border-t border-border pt-4">
            {chosen.topics.map((topic) => <div key={topic.name} className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-foreground">{topic.name}</span>
              <span className="shrink-0 text-muted-foreground">{topic.score}% · {questionCountLabel(topic.questionsAttempted)} · {statusLabel(topic.status, scale)}</span>
            </div>)}
          </div>
          <button data-testid="button-clear-competency" onClick={() => setSelected(null)} className="mt-4 text-xs font-semibold text-primary hover:underline">Clear selection</button>
        </> : <div className="mt-4 flex h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 text-center">
          <Target className="size-6 text-muted-foreground" />
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
            Select a competency — in the chart on the left, or from the gap list below — to see which topics under it are pulling the score down.
          </p>
        </div>}
      </Card>
    </div>

    {/* --------------------------- chart 2: current against the required level */}
    <Card className="mt-6 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Chart 2</p>
          <h3 className="mt-1 font-serif text-[22px]">Where you are against where the role expects you to be</h3>
          <p className="mt-1 text-sm text-muted-foreground">Each bar rises to the required level. The coral part is the gap still to close.</p>
        </div>
        <Badge tone={analytics.requirement.custom ? 'navy' : 'amber'}>{analytics.requirement.custom ? 'Configured targets' : analytics.requirement.label}</Badge>
      </div>
      <div className="p-5">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gapData} margin={{ top: 8, right: 16, left: -18, bottom: 0 }} barCategoryGap={22}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={CATEGORY_AXIS} interval={0} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={AXIS} />
              <Tooltip
                cursor={{ fill: '#f2f6f6' }}
                contentStyle={TOOLTIP}
                formatter={(value: number, name) => [`${value}%`, name]}
                labelFormatter={(label: string) => {
                  const row = gapData.find((entry) => entry.name === label);
                  return row ? `${label} — you ${row.current}%, target ${row.required}% (${questionCountLabel(row.questions)})` : label;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#718189' }} />
              <Bar dataKey="reached" stackId="gap" name="Your score" fill="#2f7880" radius={[0, 0, 4, 4]} barSize={30} />
              <Bar dataKey="short" stackId="gap" name="Gap to target" fill="#e3c4bf" radius={[4, 4, 0, 0]} barSize={30} />
              <Bar dataKey="above" stackId="gap" name="Above target" fill="#8cc0b5" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">{analytics.requirement.note}</p>
      </div>
    </Card>

    {/* ------------------------------------------------------- biggest gaps */}
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.9fr]">
      <Card className="p-5">
        <SectionHeading eyebrow="Priority order" title="Your biggest gaps" description="Ranked by gap × weakness × confidence — the formula is printed under each row." />
        {biggest.length === 0 ? <p className="text-sm leading-6 text-muted-foreground">
          Every measured competency is at or above its target level. There is no gap to close.
        </p> : <div className="space-y-3">
          {biggest.map((row) => {
            const priority = analytics.priorities.find((entry) => entry.competency === row.competency);
            return <div key={row.competency} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TriangleAlert className="size-4" style={{ color: statusColors[row.status] }} />
                  <p className="text-sm font-semibold">{row.name}</p>
                  <StatusBadge status={row.status} scale={scale} />
                </div>
                <button
                  data-testid={`button-view-topics-${row.competency}`}
                  onClick={() => setSelected(row.competency)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View topics <ArrowRight className="ml-1 inline size-3" />
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {row.currentScore}% now, {row.requiredScore}% expected — {row.gap} point{row.gap === 1 ? '' : 's'} short, from {questionCountLabel(row.questionsAttempted)}.
              </p>
              {priority && <p className="mt-1 font-mono text-[10px] leading-4 text-muted-foreground">
                priority {priority.priority} = gap {priority.inputs.gap} × weakness {priority.inputs.weakness} × confidence {priority.inputs.confidence}
                {priority.weakestTopic ? ` · weakest topic: ${priority.weakestTopic}` : ''}
              </p>}
            </div>;
          })}
        </div>}
      </Card>

      {/* ------------------------------------------------- the AI explanation */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Explained</p>
            <h3 className="mt-1 font-serif text-[22px]">What this means</h3>
          </div>
          <Sparkles className="size-5 text-accent" />
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          The server sends these figures to your configured AI provider and asks it to put them in words. Any figure it writes that is not one of yours is rejected, so the paragraph cannot disagree with the charts.
        </p>
        {explanation.length > 0 && <div className="mt-4 space-y-3">
          {explanation.map((paragraph, index) => <p key={index} className="text-sm leading-6 text-foreground">{paragraph}</p>)}
        </div>}
        {explainState === 'failed' && <p className="mt-4 rounded-lg border border-[#e6cfc9] bg-[#fbf1ef] px-4 py-3 text-xs leading-5 text-[#a34d43]">{explainProblem}</p>}
        <button
          data-testid="button-explain-analytics"
          onClick={runExplain}
          disabled={explainState === 'working'}
          className="mt-4 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-primary hover:bg-secondary disabled:opacity-60"
        >
          {explainState === 'working' ? 'Asking your AI provider…' : explanation.length > 0 ? 'Explain again' : 'Explain my results'}
          <ArrowRight className="size-3.5" />
        </button>
      </Card>
    </div>
  </div>;
}

export type { CompetencyRow };
