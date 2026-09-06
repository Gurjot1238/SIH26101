import { type DragEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, ArrowRight, ArrowUpRight, Award, BarChart3, Briefcase, Calendar, Camera, Check, CheckCircle2, Clock3, Download, Edit3, FileCheck2, Filter, Globe, Lightbulb, ListChecks, LockKeyhole, Mail, MapPin, Minus, Phone, Play, Plus, RefreshCw, Shield, ShieldCheck, Sparkles, Target, TrendingDown, TrendingUp, TriangleAlert, UploadCloud, Users, X } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import { ActionButton, Badge, Card, ProgressBar, SectionHeading, ToastMessage } from '@/components/ui';
import { initials, useSession } from '@/components/session-provider';
import {
  MAX_MATERIAL_BYTES,
  MIN_QUESTIONS,
  type MaterialQuestion,
  type PageProgress,
  extractConcepts,
  generateQuestions,
  questionKindLabels,
  readMaterial,
  sampleMaterialLabel,
  sampleMaterialMeta,
  sampleMaterialText,
  supportedAccept,
  supportedExtensions,
  supportedFormatsSentence,
} from '@/lib/materials';
import { clearMaterial, isDurable, setMaterial, useMaterial } from '@/lib/material-session';
import {
  type AssessmentResult,
  type SealedPaper,
  adoptServerScore,
  rebuildPaper,
  sectionOf,
  toChoices,
} from '@/lib/assessment';
import { MIN_QUESTIONS_FOR_BAND, bandColors, bandLabels, bandTones, competencyName } from '@/lib/topics';
import { type Choice, describeAttempt, gradeAttempt, toAttemptPayload } from '@/lib/scoring';
import { buildRetryPaper, buildStudyPlan, summarizePlan } from '@/lib/recommendations';
import { catalogueNote, courseMinutes, formatMinutes } from '@/lib/courses';
import {
  WEEK_DAYS,
  type ActivityRow,
  activeDays,
  activityRows,
  bucketHours,
  competencyBars,
  dashboardNote,
  lastDelta,
  longDate,
  monthEffort,
  pathwayProgress,
  practiceStreak,
  quarterLabel,
  recommended,
  signal,
  trend,
  weekBuckets,
} from '@/lib/insights';
import { useProgress } from '@/components/progress-provider';

const competencyData = [{ name: 'Data quality', score: 82 }, { name: 'Inference', score: 68 }, { name: 'Dissemination', score: 74 }, { name: 'Leadership', score: 54 }, { name: 'Digital tools', score: 61 }];
const weeklyData = [{ name: 'Mon', hours: 0.8 }, { name: 'Tue', hours: 1.4 }, { name: 'Wed', hours: 0.3 }, { name: 'Thu', hours: 1.7 }, { name: 'Fri', hours: 1.1 }, { name: 'Sat', hours: 2.2 }, { name: 'Sun', hours: 1.6 }];
/** One of the four figures across the top of the overview. */
type MetricRow = { label: string; value: string; note: string; accent: 'teal' | 'amber' | 'coral' };
/** A recommendation card: the design fields from `courses`, plus what the account measured. */
type CourseCard = { id: string; title: string; type: string; level: string; duration: string; progress: number; tag: string; color: string; icon: typeof TrendingUp; why: string };
/**
 * The sample overview, shown only when the progress API is not the source — demo mode
 * (`VITE_REQUIRE_AUTH=false`) or the server not answering. Left exactly as the design
 * shipped it, including the figures, because inventing *new* sample numbers would be
 * worse than keeping the ones the screenshot has always had. The eyebrow and the strip
 * at the top say out loud that this is what the reader is looking at.
 */
const sampleMetrics: MetricRow[] = [
  { label: 'Competency index', value: '68.4', note: '+4.8 pts since last review', accent: 'teal' as const },
  { label: 'Learning streak', value: '12 days', note: 'Best: 18 days', accent: 'amber' as const },
  { label: 'Hours this month', value: '7.6', note: '2.4 hrs to monthly goal', accent: 'teal' as const },
  { label: 'Pathway completion', value: '42%', note: '6 of 14 milestones', accent: 'coral' as const },
];
const sampleActivity: ActivityRow[] = [
  { id: 's1', title: 'Assessment calibrated', detail: 'Evidence-based Inference', date: '18 Sep', tone: 'teal' },
  { id: 's2', title: 'Course milestone', detail: 'R for Survey Processing · Module 4', date: '16 Sep', tone: 'amber' },
  { id: 's3', title: 'Certificate issued', detail: 'Foundations of Official Statistics', date: '12 Sep', tone: 'navy' },
];
/** Rows in the activity list, collapsed and expanded. 20 is the server's inline history. */
const ACTIVITY_ROWS = 3;
const ACTIVITY_ROWS_ALL = 20;
const courses = [
  { id: 'time-series', title: 'Time Series Analysis for Official Statistics', type: 'Priority pathway', level: 'Intermediate', duration: '4h 20m', progress: 38, tag: 'Recommended', color: 'bg-[#dceeea]', icon: TrendingUp },
  { id: 'data-ethics', title: 'Responsible Data Stewardship', type: 'Core practice', level: 'Foundational', duration: '2h 10m', progress: 0, tag: 'New', color: 'bg-[#f7ebd1]', icon: ShieldCheck },
  { id: 'r-programming', title: 'R for Survey Processing', type: 'Technical fluency', level: 'Intermediate', duration: '6h 40m', progress: 72, tag: 'In progress', color: 'bg-[#e2e8f0]', icon: BarChart3 },
];

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">{eyebrow}</p><h1 className="mt-2 font-serif text-3xl leading-tight tracking-[-.02em] sm:text-[39px]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{action}</div>;
}
function Donut({ value, color = '#2f7880', size = 108 }: { value: number; color?: string; size?: number }) {
  return <div className="relative" style={{ width: size, height: size }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ value }, { value: 100 - value }]} dataKey="value" innerRadius="75%" outerRadius="100%" startAngle={90} endAngle={-270} strokeWidth={0}><Cell fill={color} /><Cell fill="#e8eff0" /></Pie></PieChart></ResponsiveContainer><span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-medium text-foreground">{value}%</span></div>;
}
function Metric({ label, value, note, accent = 'teal' }: { label: string; value: string; note: string; accent?: 'teal' | 'amber' | 'coral' }) {
  const border = accent === 'amber' ? 'border-t-accent' : accent === 'coral' ? 'border-t-[#c86c5e]' : 'border-t-primary';
  return <Card className={`border-t-[3px] ${border} p-4`}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-serif text-3xl">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></Card>;
}

/**
 * The overview, driven by what the account measured.
 *
 * Every figure here used to be a literal: a 68.4 index, a 12-day streak, 7.6 hours, 42%
 * of a pathway, a competency chart of five invented scores, a week of invented hours,
 * three dated events that never happened. They are now derived from `useProgress()` —
 * see `src/lib/insights.ts`, which holds the arithmetic so a test can execute it.
 *
 * One switch decides which of two worlds the page is in, and there is nothing in
 * between: `live` means every number below is this learner's own. When it is false the
 * sample overview above is shown, and the eyebrow and the strip say so.
 */
export function Dashboard() {
  const [, setLocation] = useLocation();
  const [toast, setToast] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [noteOpen, setNoteOpen] = useState(true);
  const [fullActivity, setFullActivity] = useState(false);
  const { live, status, problem, progress, history, courses: records } = useProgress();
  const sample = !live;
  const view = useMemo(() => {
    const now = new Date();
    return { quarter: quarterLabel(now), bars: competencyBars(progress), buckets: weekBuckets(history, now), streak: practiceStreak(history, now), month: monthEffort(history, now), pathway: pathwayProgress(records), trend: trend(history), recs: recommended(progress, records), rows: activityRows(history, fullActivity ? ACTIVITY_ROWS_ALL : ACTIVITY_ROWS), signal: signal(progress), note: dashboardNote(progress), delta: lastDelta(history) };
  }, [progress, history, records, fullActivity]);
  const nothingYet = live && progress.attempts === 0;
  const metrics: MetricRow[] = sample ? sampleMetrics : [
    { label: 'Competency index', value: nothingYet ? '—' : progress.index.toFixed(1), note: nothingYet ? 'No sittings recorded yet' : view.delta, accent: 'teal' },
    { label: 'Learning streak', value: nothingYet ? '—' : `${view.streak.current} day${view.streak.current === 1 ? '' : 's'}`, note: nothingYet ? 'Nothing logged yet' : `Longest run: ${view.streak.best} day${view.streak.best === 1 ? '' : 's'}`, accent: 'amber' },
    { label: 'Hours this month', value: view.month.sittings === 0 ? '—' : view.month.hours.toFixed(1), note: view.month.sittings === 0 ? 'No sittings this month' : `${view.month.sittings} sitting${view.month.sittings === 1 ? '' : 's'} this month`, accent: 'teal' },
    { label: 'Pathway completion', value: view.pathway.tracked === 0 ? '—' : `${view.pathway.percent}%`, note: view.pathway.tracked === 0 ? 'No pathway started yet' : `${view.pathway.done} of ${view.pathway.total} modules`, accent: 'coral' },
  ];
  const design = new Map(courses.map((course) => [course.id, course]));
  const cards: CourseCard[] = sample ? courses.map((course) => ({ ...course, why: '' })) : view.recs.flatMap((rec) => { const base = design.get(rec.id); return base ? [{ ...base, progress: rec.percent, tag: rec.tag, why: rec.why }] : []; });
  const rows = sample ? sampleActivity : view.rows;
  const faces = sample ? ['M', 'T', 'W'] : view.buckets.filter((day) => day.active).slice(-3).map((day) => day.name.slice(0, 1));
  const moreActivity = !sample && history.length > ACTIVITY_ROWS;
  const strip = live ? view.note : status === 'loading' ? 'Loading your results…' : status === 'unavailable' ? `${problem} The figures below are sample data until it answers.` : 'These figures are sample data. Sign in with the auth server running and this overview fills with your own results.';
  return <div className="mx-auto max-w-[1440px] animate-rise-in">
    <PageIntro eyebrow={sample ? 'Sample / Demonstration Data' : `Learner overview · ${view.quarter}`} title="Your next best move is clear." description="Competency signals, learning momentum, and one considered recommendation for the week ahead." action={<ActionButton onClick={() => setLocation('/assessment')} variant="amber" icon={<ArrowRight className="size-4" />}>{nothingYet ? 'Take the assessment' : 'Continue assessment'}</ActionButton>} />
    {noteOpen && <div className="mb-7 flex items-center gap-2 rounded-lg border border-[#c6ded9] bg-[#eef8f5] px-4 py-3 text-xs text-[#216b67]"><Sparkles className="size-4" /><span><b>Intelligence note:</b> {strip}</span><button data-testid="button-dismiss-intelligence" onClick={() => setNoteOpen(false)} className="ml-auto text-[#216b67]/60 hover:text-[#216b67]"><X className="size-4" /></button></div>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map((metric) => <Metric key={metric.label} label={metric.label} value={metric.value} note={metric.note} accent={metric.accent} />)}</div>
    <div className="mt-7 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <Card className="overflow-hidden"><div className="flex items-start justify-between border-b border-border p-5"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Competency profile</p><h2 className="mt-1 font-serif text-[22px]">Where your practice stands</h2></div><button data-testid="button-view-competencies" onClick={() => setLocation('/assessment')} className="text-xs font-semibold text-primary hover:underline">View assessment <ArrowUpRight className="ml-1 inline size-3" /></button></div><div className="p-5">{sample || view.bars.length > 0 ? <div className="h-[230px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={sample ? competencyData : view.bars} layout="vertical" margin={{ left: 14, right: 20 }} barCategoryGap={13}><CartesianGrid horizontal={false} stroke="#dfe9ea" /><XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718189' }} /><YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#40515a' }} width={92} /><Tooltip cursor={{ fill: '#f2f6f6' }} contentStyle={{ borderRadius: 8, border: '1px solid #dfe9ea', fontSize: 12 }} /><Bar dataKey="score" fill="#2f7880" radius={[0, 4, 4, 0]} barSize={15} /></BarChart></ResponsiveContainer></div> : <div className="flex h-[230px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 text-center"><BarChart3 className="size-6 text-muted-foreground" /><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Take your first assessment to generate your learning profile. Nothing is charted until you have answered something.</p></div>}<div className="mt-2 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span>{sample ? 'Last calibrated 18 Sep 2024' : progress.lastAttemptAt ? `Last measured ${longDate(progress.lastAttemptAt)}` : 'Nothing measured yet'}</span>{sample ? <span className="flex items-center gap-1 text-[#216b67]"><TrendingUp className="size-3.5" /> Trending upward</span> : <span className="flex items-center gap-1 text-[#216b67]">{view.trend.direction === 'up' ? <TrendingUp className="size-3.5" /> : view.trend.direction === 'down' ? <TrendingDown className="size-3.5" /> : <Minus className="size-3.5" />} {view.trend.label}</span>}</div></div></Card>
      <Card className="p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">{sample ? 'This week' : 'Last 7 days'}</p><h2 className="mt-1 font-serif text-[22px]">Learning rhythm</h2></div><Badge tone="amber">{sample ? '7.6 hours' : `${bucketHours(view.buckets)} hours`}</Badge></div><div className="mt-5 h-[178px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={sample ? weeklyData : view.buckets} margin={{ top: 12, right: 4, left: -25, bottom: 0 }}><defs><linearGradient id="rhythmFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2f7880" stopOpacity=".23" /><stop offset="100%" stopColor="#2f7880" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e4ecec" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718189' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718189' }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #dfe9ea', fontSize: 12 }} /><Area dataKey="hours" stroke="#2f7880" strokeWidth={2} fill="url(#rhythmFill)" /></AreaChart></ResponsiveContainer></div><div className="flex items-center justify-between border-t border-border pt-4"><div className="flex -space-x-1">{faces.length > 0 && <span className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-[#d8e9e6] text-[9px] font-bold text-[#216b67]">{faces[0]}</span>}{faces.length > 1 && <span className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-[#f7dfaa] text-[9px] font-bold text-[#8a6319]">{faces[1]}</span>}{faces.length > 2 && <span className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-[#dce3ec] text-[9px] font-bold text-[#29485a]">{faces[2]}</span>}</div><span className="text-xs text-muted-foreground">{sample ? '5 of 7 days active' : `${activeDays(view.buckets)} of ${WEEK_DAYS} days active`}</span></div></Card>
    </div>
    <div className="mt-8"><SectionHeading eyebrow="Curated for your role" title="Recommended next" description={sample ? 'Signals from your profile, current role, and recent assessment.' : 'Ordered by the competency your answers scored lowest.'} action={<button data-testid="button-show-all-recommendations" onClick={() => setShowAll(!showAll)} className="text-xs font-semibold text-primary hover:underline">{showAll ? 'Show less' : 'See all recommendations'} <ArrowRight className="ml-1 inline size-3.5" /></button>} /><div className="grid gap-4 md:grid-cols-3">{cards.slice(0, showAll ? 3 : 2).map((course) => <Card key={course.id} interactive className="overflow-hidden"><div className={`flex h-20 items-center justify-between px-5 ${course.color}`}><course.icon className="size-8 text-[#296b6b]/60" /><Badge tone={course.tag === 'Recommended' ? 'teal' : 'amber'}>{course.tag}</Badge></div><div className="p-5"><p className="text-[11px] font-semibold uppercase tracking-[.08em] text-muted-foreground">{course.type}</p><h3 className="mt-2 min-h-[48px] font-semibold leading-6">{course.title}</h3>{course.why && <p className="text-xs leading-5 text-muted-foreground">{course.why}</p>}<div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{course.duration}</span><span>{course.progress ? `${course.progress}% complete` : course.level}</span></div>{course.progress > 0 && <ProgressBar value={course.progress} className="mt-3" />}<button data-testid={`button-open-course-${course.id}`} onClick={() => setLocation(`/courses/${course.id}`)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-semibold text-primary hover:bg-secondary">{course.progress ? 'Resume learning' : 'View course'}<ArrowRight className="size-3.5" /></button></div></Card>)}</div></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.9fr]"><Card className="p-5"><SectionHeading eyebrow="Recent activity" title="A short record of progress" action={<button data-testid="button-view-activity" onClick={sample ? () => setToast('Sign in to see your own history') : moreActivity ? () => setFullActivity(!fullActivity) : () => setToast(history.length === 0 ? 'Nothing is recorded yet' : 'That is everything recorded so far')} className="text-xs font-semibold text-primary">{moreActivity ? (fullActivity ? 'Show less' : `View all ${history.length}`) : 'View history'}</button>} /><div className="space-y-4">{rows.length === 0 ? <p className="text-sm leading-6 text-muted-foreground">Nothing recorded yet. Assessments and knowledge checks appear here with the score each one earned.</p> : rows.map((row) => <div key={row.id} className="flex items-center gap-3"><div className={`size-2 rounded-full ${row.tone === 'teal' ? 'bg-primary' : row.tone === 'amber' ? 'bg-accent' : 'bg-[#9db5c5]'}`} /><div className="flex-1"><p className="text-sm font-semibold">{row.title}</p><p className="text-xs text-muted-foreground">{row.detail}</p></div><span className="font-mono text-[10px] text-muted-foreground">{row.date}</span></div>)}</div></Card><Card className="relative overflow-hidden bg-sidebar p-6 text-sidebar-foreground"><div className="absolute -right-8 -top-10 size-40 rounded-full border border-accent/20" /><div className="absolute -right-3 -top-5 size-28 rounded-full border border-accent/15" /><Award className="mb-5 size-6 text-accent" /><p className="font-mono text-[10px] uppercase tracking-[.16em] text-accent">Signal worth noticing</p><h3 className="mt-2 max-w-[290px] font-serif text-2xl text-white">{sample ? 'Your strongest and weakest competency, side by side.' : view.signal ? view.signal.headline : 'Your profile starts with one sitting.'}</h3><p className="mt-3 max-w-[300px] text-sm leading-6 text-sidebar-foreground/70">{sample ? 'This card is showing demonstration copy. With your own results it names your strongest and weakest competency, and the gap between them.' : view.signal ? view.signal.detail : 'Sit the assessment or upload your own material, and this card names your strongest and weakest competency with the counts behind them.'}</p><button data-testid="button-view-insight" onClick={sample ? () => setToast('Sign in to keep this in your learning brief') : () => setLocation(view.signal ? view.signal.href : '/assessment')} className="mt-5 text-sm font-semibold text-accent hover:underline">{sample ? 'Save to brief' : view.signal ? view.signal.actionLabel : 'Take the assessment'} <ArrowRight className="ml-1 inline size-4" /></button></Card></div>
    {toast && <ToastMessage message={toast} onClose={() => setToast('')} />}
  </div>;
}

/** m:ss, so a twelve-minute sitting reads 12:04 rather than 724 seconds. */
function clockText(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * The quarterly competency check.
 *
 * What was here before measured nothing. Three questions, no answer key, a donut
 * hardcoded to 78%, "2 / 3 correct" and "+6 pts" printed whatever was chosen, and a
 * "Review answers" button that deleted the attempt instead of showing it. The layout
 * was the honest part, so the layout is what has been kept.
 *
 * The paper then moved into `lib/assessment.ts` and was graded here in the tab. That
 * fixed the measurement and left one problem: the answer key was in the bundle, and the
 * score the account kept was a number this page had worked out about itself. Both are
 * now the server's. `GET /api/assessment/paper` deals fifteen scenarios with the options
 * shuffled and no key; `POST /api/assessment/submit` marks them, stores the attempt and
 * sends back its own figures, which is what appears below.
 *
 * The report screens are unchanged, because the key that comes back with the result is
 * rebuilt into the same `MaterialQuestion[]` a quiz from an uploaded document produces.
 * One grader, one set of bands, one set of tests — `adoptServerScore` then puts the
 * stored numbers on screen so a drift between the two would show rather than hide.
 *
 * Three things about the answering screen look like design choices and are really
 * constraints:
 *
 *  - The stepper keeps its markup but its dots are now the five *sections* rather than
 *    the questions. Fifteen `size-7` circles do not fit a 375px viewport.
 *  - The badge shows elapsed time. It used to say "6 min remaining", counting down from
 *    nothing on a paper that had no clock.
 *  - Nothing is revealed question by question. This is the assessment, not the practice
 *    quiz: the key stays on the server until the paper is submitted, and then all of it
 *    opens at once.
 */
export function Assessment() {
  const [, setLocation] = useLocation();
  const { openAssessment, sitAssessment } = useProgress();
  /** The dealt paper. Null until the server answers — there is no local fallback. */
  const [paper, setPaper] = useState<SealedPaper | null>(null);
  const [dealing, setDealing] = useState(true);
  const [dealProblem, setDealProblem] = useState('');
  const [step, setStep] = useState(0);
  /** Index-aligned with `paper.questions`, holding display indexes. */
  const [answers, setAnswers] = useState<Choice[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  /** The server's marking. Its arrival is what "submitted" means. */
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState('');

  /** Deal a paper, or say why not. Also used by "Take it again", which reshuffles. */
  const deal = async () => {
    setDealing(true);
    setDealProblem('');
    const outcome = await openAssessment();
    setDealing(false);
    if (outcome.saved) {
      setPaper(outcome.value);
      return;
    }
    setPaper(null);
    setDealProblem(outcome.reason);
  };

  useEffect(() => {
    void deal();
    // Once per mount. Retaking calls `deal` directly rather than through a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * The report, rebuilt from the sealed paper plus the key that came back with the
   * result. Null until then, which is what keeps the key out of the answering screen.
   */
  const marked = useMemo(() => (paper && result ? rebuildPaper(paper, result) : null), [paper, result]);
  const graded = useMemo(
    () => (marked && result ? adoptServerScore(gradeAttempt(marked, answers), result) : null),
    [marked, result, answers],
  );
  const plan = useMemo(() => (marked && graded ? buildStudyPlan(marked, graded) : null), [marked, graded]);
  const advice = useMemo(() => (plan ? summarizePlan(plan) : []), [plan]);
  const scenario = paper?.questions[step] ?? null;
  const section = paper && scenario ? paper.sections[scenario.section] : null;
  const isLast = paper ? step === paper.questions.length - 1 : false;

  /** One tick a second while the paper is open, so the badge is a clock and not a claim. */
  useEffect(() => {
    if (result) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [result, startedAt]);

  const choose = (index: number) => {
    setSelected(index);
    setAnswers((prev) => {
      // Assign at `step` rather than truncating: going back to change one answer used to
      // discard every answer after it.
      const next = [...prev];
      next[step] = index;
      return next;
    });
  };

  const goTo = (next: number) => {
    setStep(next);
    setSelected(answers[next] ?? null);
  };

  /**
   * Hand the sitting in. What goes out is `{ question, option }` per answer and the time
   * taken — no score, no percent, no band, because the server would ignore them.
   *
   * A failure here leaves every answer in place and offers the button again: the sitting
   * is not lost because the network was, and nothing is shown as graded until it is.
   */
  const submit = async () => {
    if (!paper) return;
    setSaving(true);
    setSaveNote('');
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    setElapsed(seconds);
    const outcome = await sitAssessment({ choices: toChoices(paper, answers), durationSeconds: seconds });
    setSaving(false);
    if (!outcome.saved) {
      setSaveNote(outcome.reason);
      return;
    }
    setResult(outcome.value.result);
    setSaveNote('Saved to your account.');
  };

  const retake = () => {
    setStep(0);
    setAnswers([]);
    setSelected(null);
    setResult(null);
    setShowReview(false);
    setSaveNote('');
    setStartedAt(Date.now());
    setElapsed(0);
    void deal();
  };

  if (paper && result && marked && graded && plan) return (
    <div className="mx-auto max-w-3xl animate-rise-in">
      <PageIntro eyebrow="Assessment complete" title="Your evidence is useful." description="Your answers were checked on the server against a fixed answer key, and each section is scored on its own three scenarios." />
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col items-center border-b border-border pb-8 text-center">
          <Donut value={graded.percent} size={138} color={bandColors[graded.band]} />
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Competency check score</p>
          <h2 className="mt-1 font-serif text-3xl">{bandLabels[graded.band]}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{describeAttempt(graded)}</p>
        </div>
        <div className="grid gap-3 py-6 sm:grid-cols-3">{[['Correct responses', `${graded.correct} / ${graded.total}`], ['Sections to revisit', `${graded.focus.length} of ${paper.sections.length}`], ['Time taken', clockText(elapsed)]].map(([l, v]) => <div key={l} className="rounded-lg bg-secondary p-4 text-center"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 font-semibold">{v}</p></div>)}</div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <ActionButton onClick={() => setLocation('/learning')} icon={<ArrowRight className="size-4" />}>Open my pathway</ActionButton>
          <ActionButton variant="outline" data-testid="button-assessment-review" onClick={() => setShowReview(!showReview)}>{showReview ? 'Hide answers' : 'Review answers'}</ActionButton>
          <ActionButton variant="outline" data-testid="button-assessment-retake" onClick={retake}>Take it again</ActionButton>
        </div>
        {(saving || saveNote) && <p className="mt-5 text-center text-xs text-muted-foreground">{saving ? 'Saving this result to your account...' : saveNote}</p>}
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">{paper.note}</p>
      </Card>

      <Card className="mt-6 p-6 sm:p-8">
        <SectionHeading eyebrow="Per section" title="Where you stand, competency by competency" description={`Each of the five sections is scored on its own ${paper.questionsPerSection} scenarios, so a band here is a reading of that competency rather than of the paper as a whole.`} />
        <div className="space-y-5">
          {graded.topics.map((score) => <div key={score.topic}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{score.topic}</p>
              <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{score.correct} / {score.total}</span><Badge tone={bandTones[score.band]}>{bandLabels[score.band]}</Badge></div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${score.percent}%`, backgroundColor: bandColors[score.band] }} /></div>
            <p className="mt-1.5 text-xs text-muted-foreground">{score.competency ? `Counts towards ${competencyName(score.competency)}` : 'Not matched to a framework competency, so it is reported as itself.'}</p>
          </div>)}
        </div>
        {graded.competencies.length > 0 && <div className="mt-7 border-t border-border pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Framework competencies this paper measured</p>
          <div className="mt-4 space-y-3">
            {graded.competencies.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-foreground">{entry.name}</p>
              <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{entry.percent}%</span><Badge tone={bandTones[entry.band]}>{bandLabels[entry.band]}</Badge></div>
            </div>)}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">This paper asks about all five competencies, so all five are reported. A quiz built from an uploaded document usually touches fewer, and the ones it never asked about are left out rather than shown as zero.</p>
        </div>}
      </Card>

      {advice.length > 0 && <Card className="mt-6 p-6 sm:p-8">
        <SectionHeading eyebrow="What to do next" title="The sections worth another pass" description={plan.headline} />
        <ul className="space-y-3">
          {plan.topics.map((topic, index) => <li key={topic.score.topic} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={bandTones[topic.score.band]}>{topic.bandLabel}</Badge>
              {topic.competencyName && <Badge tone="navy">{topic.competencyName}</Badge>}
            </div>
            <p className="mt-2 text-sm leading-6 text-foreground">{advice[index]}</p>
          </li>)}
        </ul>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">There is no document behind these scenarios to quote back, so the material for a weak section is the explanation on each question you missed, plus any pathway below that builds the same competency.</p>
      </Card>}

      {plan.courses.length > 0 && <Card className="mt-6 p-6 sm:p-8">
        <SectionHeading eyebrow="Pathways" title="Where a longer pass would help" description="Matched to the competency your weaker sections sit under. Only pathways that actually build it are listed, so this section is often short." />
        <div className="space-y-3">
          {plan.courses.map((facts) => {
            const listed = courses.find((item) => item.id === facts.id);
            const Icon = listed?.icon ?? Target;
            return <Link key={facts.id} href={`/courses/${facts.id}`} data-testid={`link-assessment-pathway-${facts.id}`} className="flex items-start gap-4 rounded-xl border border-border p-4 transition-all hover:border-primary/50 hover:bg-secondary">
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${listed?.color ?? 'bg-secondary'}`}><Icon className="size-5 text-[#29485a]" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{listed?.title ?? facts.id}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{facts.helpsWith}</span>
                <span className="mt-2 block font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{competencyName(facts.competency)} · {formatMinutes(courseMinutes(facts.id))} outline</span>
              </span>
              <ArrowRight className="ml-auto mt-1 size-4 shrink-0 text-muted-foreground" />
            </Link>;
          })}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">{catalogueNote}</p>
      </Card>}

      {showReview && <Card className="mt-6 p-6 sm:p-8">
        <SectionHeading eyebrow="Answer review" title="Scenario by scenario" description="Your answer, the key, and why the key is the key." />
        <ol className="space-y-4">
          {marked.map((question, index) => {
            const pick = answers[index] ?? null;
            const right = pick !== null && pick === question.correct;
            return <li key={question.q} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Scenario {index + 1}</span>
                <Badge tone={right ? 'teal' : pick === null ? 'neutral' : 'coral'}>{right ? 'Correct' : pick === null ? 'Not answered' : 'Missed'}</Badge>
                <Badge tone="navy">{question.topic}</Badge>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-foreground">{question.q}</p>
              {pick !== null && !right && <p className="mt-3 text-sm leading-6 text-[#a34d43]"><X className="mr-1 inline size-3.5" />You chose: {question.a[pick]}</p>}
              <p className="mt-1.5 text-sm leading-6 text-[#216b67]"><Check className="mr-1 inline size-3.5" />Answer: {question.a[question.correct]}</p>
              <AnswerReveal question={question} pick={pick} className="mt-3" />
            </li>;
          })}
        </ol>
      </Card>}
    </div>
  );

  /**
   * Waiting for the paper. A skeleton rather than a spinner because the shape of what is
   * coming is known — one scenario and four options — so the page does not jump when it
   * arrives.
   */
  if (dealing) return <div className="mx-auto max-w-4xl animate-rise-in"><PageIntro eyebrow="Quarterly competency check" title="Assessment, without the anxiety." description="Dealing a fresh paper. The scenarios and the answer key are held on the server, so your sitting is marked there and not in this tab." /><Card className="p-6 sm:p-10"><div data-testid="assessment-dealing" className="h-5 w-40 animate-pulse rounded bg-secondary" /><div className="mt-8 h-7 w-full animate-pulse rounded bg-secondary" /><div className="mt-3 h-7 w-2/3 animate-pulse rounded bg-secondary" /><div className="mt-8 space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-[58px] w-full animate-pulse rounded-xl bg-secondary" />)}</div></Card></div>;

  /**
   * No paper. Signed out, or the server is not running — either way there is nothing to
   * sit, and the honest thing is to say which and offer the two ways forward rather than
   * a local exam nobody can mark.
   */
  if (!paper || !scenario || !section) return <div className="mx-auto max-w-4xl animate-rise-in"><PageIntro eyebrow="Quarterly competency check" title="The paper could not be dealt." description="The assessment is dealt and marked by the server, so this screen needs it. Nothing about your earlier attempts is affected." /><Card className="p-6 sm:p-10"><div className="flex items-start gap-3"><TriangleAlert className="mt-0.5 size-5 shrink-0 text-[#c86c5e]" /><div><p className="text-sm font-semibold text-foreground">What went wrong</p><p data-testid="text-assessment-unavailable" className="mt-1 text-sm leading-6 text-muted-foreground">{dealProblem || 'The assessment API did not answer.'}</p></div></div><div className="mt-7 flex flex-col gap-3 sm:flex-row"><ActionButton onClick={() => void deal()} icon={<RefreshCw className="size-4" />}>Try again</ActionButton><ActionButton variant="outline" onClick={() => setLocation('/materials')} icon={<ArrowRight className="size-4" />}>Practise from a document instead</ActionButton></div><p className="mt-5 text-xs leading-5 text-muted-foreground">A quiz built from your own PDF is graded in this tab, so it works without the assessment server.</p></Card></div>;

  return <div className="mx-auto max-w-4xl animate-rise-in"><PageIntro eyebrow="Quarterly competency check" title="Assessment, without the anxiety." description={`${paper.length} scenario questions, ${paper.questionsPerSection} for each of the five competencies in the National Competency Framework for official statistics. Marked on the server against a fixed answer key.`} action={<Badge tone="navy"><Clock3 className="size-3.5" /> {clockText(elapsed)} elapsed</Badge>} /><div className="mb-5 flex items-center gap-2">{paper.sections.map((item, i) => <div key={item.competency} className="flex flex-1 items-center gap-2"><div className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${i < sectionOf(paper, step) ? 'bg-primary text-white' : i === sectionOf(paper, step) ? 'bg-accent text-foreground' : 'bg-secondary text-muted-foreground'}`}>{i < sectionOf(paper, step) ? <Check className="size-3.5" /> : i + 1}</div>{i < paper.sections.length - 1 && <div className={`h-px flex-1 ${i < sectionOf(paper, step) ? 'bg-primary' : 'bg-border'}`} />}</div>)}</div><Card className="p-6 sm:p-10"><div className="flex items-center justify-between"><Badge tone="teal">Scenario {step + 1} of {paper.questions.length}</Badge><span className="font-mono text-xs text-muted-foreground">{section.focus}</span></div><h2 className="mt-8 max-w-2xl font-serif text-2xl leading-snug sm:text-3xl">{scenario.q}</h2><div className="mt-8 space-y-3">{scenario.options.map((option, i) => <button key={option.id} data-testid={`button-assessment-option-${i}`} onClick={() => choose(i)} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all ${selected === i ? 'border-primary bg-[#edf7f5] ring-1 ring-primary' : 'border-border hover:border-primary/40 hover:bg-secondary'}`}><span className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${selected === i ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground'}`}>{String.fromCharCode(65 + i)}</span><span className="leading-6">{option.text}</span></button>)}</div><div className="mt-8 flex justify-between border-t border-border pt-5"><button data-testid="button-assessment-back" onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground disabled:opacity-30"><ArrowLeft className="size-4" /> Back</button><ActionButton disabled={selected === null || saving} onClick={() => { if (isLast) void submit(); else goTo(step + 1); }} icon={<ArrowRight className="size-4" />}>{isLast ? (saving ? 'Marking...' : 'Submit assessment') : 'Save & continue'}</ActionButton></div>{saveNote && <p data-testid="text-assessment-submit-problem" className="mt-4 text-sm leading-6 text-[#a34d43]">{saveNote}</p>}</Card><p className="mt-4 text-xs leading-5 text-muted-foreground">{paper.note}</p></div>;
}

export function Learning() {
  const [filter, setFilter] = useState('All'); const [saved, setSaved] = useState<string[]>([]);
  const shown = filter === 'All' ? courses : courses.filter((course) => filter === 'In progress' ? course.progress > 0 : course.tag === 'New');
  return <div className="mx-auto max-w-[1440px] animate-rise-in"><PageIntro eyebrow="Learning intelligence" title="A pathway built around your work." description="Your learning plan adapts to demonstrated strengths, role expectations, and the skills that will matter next." action={<ActionButton variant="outline" onClick={() => setFilter('All')} icon={<RefreshCw className="size-4" />}>Refresh pathway</ActionButton>} /><div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]"><Card className="overflow-hidden bg-sidebar text-sidebar-foreground"><div className="border-b border-sidebar-border p-6"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-accent">Active pathway</p><h2 className="mt-2 font-serif text-2xl text-white">Statistical inference<br />in public practice</h2></div><Donut value={42} color="#c49743" size={82} /></div><p className="mt-5 text-sm leading-6 text-sidebar-foreground/70">A focused sequence to move from reliable data production to confident interpretation and advice.</p></div><div className="space-y-0 p-6">{[['01', 'Evidence foundations', true], ['02', 'Inference in context', true], ['03', 'Communicating uncertainty', false], ['04', 'Applied capstone', false]].map(([n, t, done]) => <div key={String(n)} className="flex gap-3"><div className="flex flex-col items-center"><div className={`flex size-7 items-center justify-center rounded-full text-[10px] font-bold ${done ? 'bg-accent text-sidebar' : 'border border-sidebar-border text-sidebar-foreground/50'}`}>{done ? <Check className="size-3" /> : n}</div>{n !== '04' && <div className={`my-1 h-6 w-px ${done ? 'bg-accent/50' : 'bg-sidebar-border'}`} />}</div><div className="pb-4"><p className={`text-sm font-semibold ${done ? 'text-white' : 'text-sidebar-foreground/50'}`}>{t}</p><p className="mt-1 text-[11px] text-sidebar-foreground/50">{done ? 'Milestone complete' : 'Unlocks after previous milestone'}</p></div></div>)}</div><div className="border-t border-sidebar-border p-6"><ActionButton variant="amber" className="w-full" onClick={() => window.scrollTo({ top: 450, behavior: 'smooth' })}>Continue pathway <ArrowRight className="size-4" /></ActionButton></div></Card><div><div className="mb-4 flex items-center justify-between"><div className="flex gap-1 rounded-lg bg-secondary p-1">{['All', 'In progress', 'New'].map((f) => <button key={f} data-testid={`button-filter-${f.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setFilter(f)} className={`rounded-md px-3 py-2 text-xs font-semibold ${filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{f}</button>)}</div><span className="text-xs text-muted-foreground">{shown.length} courses</span></div><div className="space-y-3">{shown.map((course) => <Card key={course.id} interactive className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className={`flex size-14 shrink-0 items-center justify-center rounded-xl ${course.color}`}><course.icon className="size-6 text-primary/80" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">{course.type}</p><Badge tone={course.tag === 'New' ? 'amber' : 'teal'}>{course.tag}</Badge></div><h3 className="mt-1 font-semibold">{course.title}</h3><div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{course.duration}</span><span>{course.level}</span></div>{course.progress > 0 && <div className="mt-3 flex items-center gap-2"><ProgressBar value={course.progress} className="max-w-[180px] flex-1" /><span className="font-mono text-[10px] text-muted-foreground">{course.progress}%</span></div>}</div><div className="flex items-center gap-2 sm:flex-col sm:items-end"><button data-testid={`button-save-course-${course.id}`} onClick={() => setSaved(saved.includes(course.id) ? saved.filter((id) => id !== course.id) : [...saved, course.id])} className={`rounded-lg p-2 ${saved.includes(course.id) ? 'text-accent' : 'text-muted-foreground hover:bg-secondary'}`}><Target className="size-4" /></button><Link href={`/courses/${course.id}`} data-testid={`link-course-${course.id}`} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">{course.progress ? 'Resume' : 'Start'} <ArrowRight className="size-3.5" /></Link></div></Card>)}</div></div></div></div>;
}

export function CourseDetail() {
  const { id } = useParams<{ id: string }>(); const course = courses.find((item) => item.id === id) ?? courses[0]; const [started, setStarted] = useState(course.progress > 0); const [toast, setToast] = useState('');
  return <div className="mx-auto max-w-5xl animate-rise-in"><Link href="/learning" data-testid="link-back-learning" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-3.5" /> Back to learning</Link><Card className="overflow-hidden"><div className={`relative px-6 py-12 sm:px-12 ${course.color}`}><div className="absolute right-10 top-8 hidden opacity-20 sm:block"><course.icon className="size-32 text-primary" /></div><Badge tone="teal">{course.type}</Badge><h1 className="mt-4 max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">{course.title}</h1><p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">A practical course for officials who need to move from a result to a defensible interpretation. Learn with worked examples from official statistical practice.</p><div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-4" />{course.duration}</span><span className="flex items-center gap-1"><Users className="size-4" />1,248 learners</span><span>Intermediate</span></div></div><div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_280px]"><div><h2 className="font-serif text-2xl">What you will take away</h2><div className="mt-5 space-y-4">{['Read seasonality without mistaking it for structural change', 'Choose an appropriate model and explain its assumptions', 'Write a short, decision-ready interpretation for a policy brief'].map((item) => <div key={item} className="flex gap-3 text-sm leading-6"><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />{item}</div>)}</div><h2 className="mt-10 font-serif text-2xl">Course outline</h2><div className="mt-4 divide-y divide-border rounded-xl border border-border">{['The language of change', 'Seasonal adjustment in practice', 'Model choices and diagnostics', 'Capstone: write the brief'].map((item, i) => <button key={item} data-testid={`button-course-module-${i}`} onClick={() => setToast(`${item} marked as previewed`)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-secondary"><span className="font-mono text-xs text-muted-foreground">0{i + 1}</span><span className="flex-1 text-sm font-semibold">{item}</span><span className="text-xs text-muted-foreground">{i === 0 ? '18 min' : `${i + 1}h ${i + 5}m`}</span><Play className="size-3.5 text-primary" /></button>)}</div></div><aside><div className="sticky top-24 rounded-xl border border-border bg-secondary p-5"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Your progress</p><div className="mt-4 flex items-center gap-4"><Donut value={course.progress} size={74} /><div><p className="font-semibold">{course.progress}% complete</p><p className="mt-1 text-xs text-muted-foreground">{course.progress ? 'Module 2 of 4' : 'Not started'}</p></div></div><ProgressBar value={course.progress} className="mt-5" /><ActionButton className="mt-5 w-full" onClick={() => { setStarted(true); setToast(started ? 'Course resumed' : 'Course added to your pathway'); }}>{started ? 'Resume course' : 'Start course'} <ArrowRight className="size-4" /></ActionButton><button data-testid="button-download-outline" onClick={() => setToast('Course outline downloaded')} className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-primary"><Download className="size-3.5" /> Download outline</button></div></aside></div></Card>{toast && <ToastMessage message={toast} onClose={() => setToast('')} />}</div>;
}

const stageOrder = ['reading', 'topics', 'questions', 'checking'] as const;
type Stage = (typeof stageOrder)[number];

/**
 * What the learner is told is happening, and what is actually happening at that moment.
 *
 * The old page moved a bar to 12 / 28 / 58 / 86 / 100 around one synchronous call, so
 * these four labels were decoration: they all painted after the work had finished. Each
 * one now brackets exactly one real step, and `paint()` between steps gives the browser
 * the frame it needs to show a label before that step blocks the thread.
 */
const stageLabels: Record<Stage, string> = {
  reading: 'Reading document',
  topics: 'Understanding topics',
  questions: 'Generating questions',
  checking: 'Validating questions',
};

type Work = {
  fileName: string;
  fileSize: number;
  fileType: string;
  isSample: boolean;
  stage: Stage;
  pagesRead: number;
  pageCount: number;
  conceptCount: number;
  questionCount: number;
};

/**
 * Reading owns most of the bar because on a real PDF it is the only step that takes
 * measurable time, and the only one that can report sub-steps: pages actually decoded.
 */
function progressFor(work: Work): number {
  if (work.stage === 'reading') return work.pageCount > 0 ? Math.round(4 + (56 * work.pagesRead) / work.pageCount) : 4;
  if (work.stage === 'topics') return 66;
  if (work.stage === 'questions') return 86;
  return 100;
}

/** Yield to the browser so the stage label on screen is the stage that is about to run. */
const paint = () => new Promise<void>((resolve) => { setTimeout(resolve, 0); });

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
}

const maxMaterialSize = formatFileSize(MAX_MATERIAL_BYTES);

export function Materials() {
  const [, setLocation] = useLocation();
  const material = useMaterial();
  const [work, setWork] = useState<Work | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const startProcessing = async (
    meta: { fileName: string; fileSize: number; fileType: string; isSample: boolean },
    read: (onPage: PageProgress) => Promise<{ text: string; pageCount: number }>,
  ) => {
    setError('');
    setShowQuestions(false);
    setConfirmingDiscard(false);
    setWork({ ...meta, stage: 'reading', pagesRead: 0, pageCount: 0, conceptCount: 0, questionCount: 0 });
    const advance = async (stage: Stage, extra?: Partial<Work>) => {
      setWork((previous) => (previous ? { ...previous, ...extra, stage } : previous));
      await paint();
    };
    try {
      await paint();
      const { text, pageCount } = await read((pagesRead, pages) => {
        setWork((previous) => (previous ? { ...previous, pagesRead, pageCount: pages } : previous));
      });
      await advance('topics', { pageCount });
      const concepts = extractConcepts(text);
      await advance('questions', { conceptCount: concepts.length });
      const { questions, topics } = generateQuestions(text);
      await advance('checking');
      // Real work, not a pause. A repeated stem, or an answer index outside its own option
      // list, is a defect in the generator rather than a problem with the document — and
      // both are cheaper to drop here than to explain to a learner mid-quiz.
      const seen = new Set<string>();
      const checked = questions.filter((question) => {
        if (question.correct < 0 || question.correct >= question.a.length) return false;
        const stem = question.q.toLowerCase();
        if (seen.has(stem)) return false;
        seen.add(stem);
        return true;
      });
      if (checked.length === 0) {
        throw new Error('The document was read, but there was not enough sentence-level text to build a grounded quiz.');
      }
      // Store only the topics this paper can actually score, in the order the analyser
      // ranked them, so the topic list on screen matches the questions behind it.
      const scored = Array.from(new Set(checked.map((question) => question.topic)))
        .sort((left, right) => topics.indexOf(left) - topics.indexOf(right));
      setWork((previous) => (previous ? { ...previous, questionCount: checked.length } : previous));
      await paint();
      setMaterial({ ...meta, pageCount, concepts, topics: scored, questions: checked, createdAt: new Date().toISOString() });
      setWork(null);
    } catch (failure) {
      setWork(null);
      setError(failure instanceof Error ? failure.message : 'The document could not be read. Please try another file.');
    }
  };

  const handleFile = (file: File) => {
    setError('');
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    // One list, in the lib, shared with the `accept` attribute and the help text — the
    // page used to offer DOCX and PPTX here that `readMaterial` then refused.
    if (!(supportedExtensions as readonly string[]).includes(extension)) {
      setError(`Please choose a ${supportedFormatsSentence} file.`);
      return;
    }
    if (file.size === 0) {
      setError('That file is empty. Choose a material with text in it.');
      return;
    }
    if (file.size > MAX_MATERIAL_BYTES) {
      setError(`This file is ${formatFileSize(file.size)}, over the ${maxMaterialSize} ceiling. Choose a smaller material to continue.`);
      return;
    }
    void startProcessing(
      { fileName: file.name, fileSize: file.size, fileType: extension, isSample: false },
      (onPage) => readMaterial(file, onPage),
    );
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  /**
   * The sample describes itself. Its name, size and page count come from the sample text
   * in the lib, so nothing on screen refers to a file that does not exist — the previous
   * version announced a 482 KB, three-page 'Quarterly_Inflation_Brief_Q2.pdf'.
   */
  const chooseSample = () => {
    void startProcessing({ ...sampleMaterialMeta, isSample: true }, async (onPage) => {
      onPage(sampleMaterialMeta.pageCount, sampleMaterialMeta.pageCount);
      return { text: sampleMaterialText, pageCount: sampleMaterialMeta.pageCount };
    });
  };

  const discard = () => {
    clearMaterial();
    setConfirmingDiscard(false);
    setShowQuestions(false);
    setError('');
  };

  const stageIndex = work ? stageOrder.indexOf(work.stage) : -1;
  const progress = work ? progressFor(work) : 0;
  const perTopic = material
    ? material.topics.map((topic) => ({ topic, count: material.questions.filter((question) => question.topic === topic).length }))
    : [];

  return <div className="mx-auto max-w-5xl animate-rise-in">
     <PageIntro eyebrow="Materials lab · Local extraction" title="Turn a brief into a knowledge check." description="Upload a work material and NEXORA AI will extract selectable text in your browser, identify concepts, and build a grounded practice set." action={<Badge tone="navy"><LockKeyhole className="size-3.5" /> No external AI required</Badge>} />
    {!work && !material && <Card className="p-6 sm:p-10">
      <div onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${isDragging ? 'border-primary bg-[#e3f3ef]' : 'border-[#a9cdca] bg-[#f0f8f6]'}`}>
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#d9ece8] text-primary"><UploadCloud className="size-7" /></div>
        <h2 className="mt-5 font-serif text-2xl">Drop a material here</h2>
         <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Choose a text-based {supportedFormatsSentence} up to {maxMaterialSize}. The file is read in this browser and is not sent to an external service.</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <label htmlFor="material-upload" className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#245b62] active:scale-[.98]"><UploadCloud className="size-4" /> Choose file</label>
          <input id="material-upload" data-testid="input-material-upload" type="file" accept={supportedAccept} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleFile(file); event.currentTarget.value = ''; }} />
          <ActionButton variant="outline" onClick={chooseSample} icon={<Plus className="size-4" />}>Use sample material</ActionButton>
        </div>
       <p className="mt-4 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Text-based PDF recommended · max {maxMaterialSize} · {MIN_QUESTIONS}+ questions per paper</p>
      </div>
      {error && <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg border border-[#eac3bd] bg-[#fff2ef] px-4 py-3 text-sm text-[#a34d43]"><X className="size-4 shrink-0" />{error}</div>}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">{[['1', 'Upload', 'Add a work material'], ['2', 'Ground', 'Extract key concepts'], ['3', 'Practise', 'Generate MCQs']].map(([n, t, d]) => <div key={n} className="flex gap-3 rounded-lg bg-secondary p-4"><span className="font-mono text-xs text-primary">{n}</span><div><p className="text-sm font-semibold">{t}</p><p className="mt-1 text-xs text-muted-foreground">{d}</p></div></div>)}</div>
    </Card>}
    {work && <Card className="p-6 sm:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#f7ebd1]"><FileCheck2 className="size-6 text-[#8a6319]" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{work.fileName}</p><p className="mt-1 text-xs text-muted-foreground">{work.fileType.toUpperCase()} · {formatFileSize(work.fileSize)} · {stageLabels[work.stage]}...</p></div><Badge tone="amber">Processing</Badge></div>
      <div className="mt-8 space-y-3"><ProgressBar value={progress} color="bg-accent" /><div className="flex justify-between font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground"><span>{stageLabels[work.stage]}</span><span>{progress}%</span></div></div>
       <div className="mt-8 grid gap-3 sm:grid-cols-3">{['Document text', 'Key terms', 'Question blueprint'].map((t, i) => <div key={t} className="rounded-lg border border-border p-4"><div className="mb-4 h-2 w-2/3 animate-pulse rounded bg-secondary" /><p className="text-xs text-muted-foreground">{t}</p><p className="mt-1 text-sm font-semibold">{i === 0 ? (stageIndex > 0 ? `Text extracted · ${work.pageCount} ${work.pageCount === 1 ? 'page' : 'pages'}` : work.pagesRead > 0 ? `${work.pagesRead} of ${work.pageCount} pages read` : 'Working...') : i === 1 ? (stageIndex > 1 ? `${work.conceptCount} concepts found` : 'Working...') : work.questionCount > 0 ? `${work.questionCount} questions ready` : 'Working...'}</p></div>)}</div>
    </Card>}
    {!work && material && <Card className="p-6 sm:p-10">
       <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center"><div className="flex min-w-0 items-center gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#dceeea]"><CheckCircle2 className="size-6 text-primary" /></div><div className="min-w-0"><p className="truncate font-semibold">{material.fileName}</p><p className="mt-1 text-xs text-muted-foreground">Read in this browser · {formatFileSize(material.fileSize)} · {material.pageCount} {material.pageCount === 1 ? 'page' : 'pages'} · {material.concepts.length} concepts identified</p></div></div><div className="flex shrink-0 flex-wrap items-center gap-2">{material.isSample && <Badge tone="amber">{sampleMaterialLabel}</Badge>}<Badge tone="teal">Ready to practise</Badge></div></div>
       <div className="grid gap-5 py-7 lg:grid-cols-[1fr_260px]"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Extracted intelligence</p><h2 className="mt-2 font-serif text-2xl">Your briefing, made queryable.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Text was extracted from your file and used to build these concepts and grounded questions in this browser.</p><div className="mt-5 flex flex-wrap gap-2">{material.concepts.map((concept) => <span key={concept} className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground">{concept}</span>)}</div></div><div className="rounded-xl bg-secondary p-5"><p className="text-xs text-muted-foreground">Generated set</p><p className="mt-2 font-serif text-3xl">{material.questions.length} MCQs</p><p className="mt-1 text-xs text-muted-foreground">Every question is built from extracted sentences in this material.</p><ActionButton className="mt-4 w-full" onClick={() => setLocation('/quiz')} icon={<ArrowRight className="size-4" />}>Open generated quiz</ActionButton>{confirmingDiscard ? <div className="mt-3 rounded-lg border border-[#eac3bd] bg-[#fff2ef] p-3"><p className="text-xs leading-5 text-[#a34d43]">Discard this {material.questions.length}-question paper? Rebuilding it needs the file again.</p><div className="mt-3 flex gap-2"><button data-testid="button-confirm-discard-material" onClick={discard} className="flex-1 rounded-lg bg-[#a34d43] py-2 text-xs font-semibold text-white">Discard</button><button data-testid="button-cancel-discard-material" onClick={() => setConfirmingDiscard(false)} className="flex-1 rounded-lg border border-border bg-card py-2 text-xs font-semibold">Keep it</button></div></div> : <button data-testid="button-upload-another-material" onClick={() => setConfirmingDiscard(true)} className="mt-3 w-full py-2 text-xs font-semibold text-primary hover:underline">Upload another material</button>}{!isDurable() && <p className="mt-3 text-[11px] leading-5 text-muted-foreground">Tab storage is blocked in this browser, so the paper is held in memory only and a reload will lose it.</p>}</div></div>
       {material.questions.length < MIN_QUESTIONS && <div role="status" className="mb-6 flex items-start gap-2 rounded-lg border border-[#eddcb4] bg-[#fdf6e6] px-4 py-3 text-sm leading-6 text-[#8a6319]"><TriangleAlert className="mt-0.5 size-4 shrink-0" /><span>This material yielded {material.questions.length} questions, fewer than the {MIN_QUESTIONS} a full check uses. A longer, more prose-heavy document produces more.</span></div>}
       <div className="border-t border-border pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Scored topics</p><h3 className="mt-2 font-serif text-xl">What this paper will measure</h3></div><button data-testid="button-toggle-material-questions" onClick={() => setShowQuestions(!showQuestions)} className="text-xs font-semibold text-primary hover:underline">{showQuestions ? 'Hide the questions' : 'Show the questions'} <ArrowRight className="ml-1 inline size-3" /></button></div>
        <div className="mt-4 divide-y divide-border rounded-xl border border-border">{perTopic.map(({ topic, count }) => <div key={topic} className="flex items-center gap-3 p-4"><ListChecks className="size-4 shrink-0 text-primary" /><span className="flex-1 text-sm font-semibold">{topic}</span><span className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{count} {count === 1 ? 'question' : 'questions'}</span></div>)}</div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Each topic is rated on its own once it has at least {MIN_QUESTIONS_FOR_BAND} answered questions, so the result tells you which topics to revise rather than one overall mark.</p>
        {showQuestions && <div className="mt-5 space-y-3">{material.questions.map((question, index) => <div key={question.q} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, '0')}</span><Badge>{questionKindLabels[question.kind]}</Badge><span className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">{question.topic}</span></div><p className="mt-2 text-sm leading-6">{question.q}</p></div>)}<p className="text-xs leading-5 text-muted-foreground">The options and the answer key stay hidden until the check starts, so reading this list cannot give the answers away.</p></div>}
       </div>
    </Card>}
  </div>;
}

/**
 * Why an answer was right, and the sentence it came from.
 *
 * This is a component rather than inline markup for one reason. For a `statement`
 * question the source sentence *is* the correct option, so the question screen must
 * not be able to mention it at all — printing it there is how the old version gave
 * every answer away. Keeping the sentence in here makes revealing it something a
 * screen has to opt into by name, which `scripts/render-test.sh` can then count.
 */
function AnswerReveal({ question, pick, className = '' }: { question: MaterialQuestion; pick: Choice; className?: string }) {
  const right = pick !== null && pick === question.correct;
  const tone = pick === null ? 'bg-secondary text-muted-foreground' : right ? 'bg-[#edf8f5] text-[#216b67]' : 'bg-[#f9e5e1] text-[#a34d43]';
  return <div className={`rounded-lg px-4 py-3 text-xs leading-5 ${tone} ${className}`}>
    <b className="font-semibold">{pick === null ? 'Left unanswered.' : right ? 'Correct.' : 'Not this time.'}</b> {question.explanation}
    {question.source.trim().length > 0 && <span className="mt-2 block text-muted-foreground">Source sentence: “{question.source}”</span>}
  </div>;
}

/**
 * The knowledge check, and the report that is the whole point of it.
 *
 * Two things were wrong with the old version. It printed the source sentence in a
 * "Grounding:" box directly beneath the options — and for a `statement` question that
 * sentence *is* the correct option, so every answer was given away. And it ended on
 * `{score} / {quiz.length}`, a single number that tells a learner nothing about what
 * to do next.
 *
 * So the source sentence now appears only after the question has been answered, as
 * the explanation for the answer key, and the final screen is a per-topic report:
 * each topic banded on its own, the passages behind the questions that were missed,
 * the pathways that build the matching competency, and a retry paper made only of
 * the questions that were wrong. `answered` is what gates the reveal.
 *
 * The report is computed by `gradeAttempt` and `buildStudyPlan`, which know nothing
 * about React and are covered by `scripts/engine-test.sh`. This component only
 * arranges what they return.
 */
export function Quiz() {
  const material = useMaterial();
  const { record } = useProgress();
  /** Non-null once the learner chooses to re-sit only what they missed. */
  const [retryPaper, setRetryPaper] = useState<MaterialQuestion[] | null>(null);
  const [started, setStarted] = useState(false);
  const [q, setQ] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  /** Index-aligned with the paper. A hole means the question was skipped. */
  const [answers, setAnswers] = useState<Choice[]>([]);
  /** True once the current answer is locked in, which is what reveals the explanation. */
  const [answered, setAnswered] = useState(false);
  const [done, setDone] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState('');
  const [showReview, setShowReview] = useState(false);

  const full = material?.questions ?? [];
  const paper = retryPaper ?? full;
  const quizTitle = material?.fileName ?? 'No material selected';
  const graded = useMemo(() => gradeAttempt(paper, answers), [paper, answers]);
  const plan = useMemo(() => buildStudyPlan(paper, graded), [paper, graded]);
  const current = paper[q];
  const isLast = q === paper.length - 1;

  /**
   * A newly generated paper invalidates everything: a retry paper holds questions
   * from the document the learner has just replaced, and a half-finished attempt is
   * measuring a document that is no longer on screen.
   */
  useEffect(() => {
    setRetryPaper(null);
    setStarted(false);
    setQ(0);
    setChoice(null);
    setAnswers([]);
    setAnswered(false);
    setDone(false);
    setSaveNote('');
    setShowReview(false);
  }, [material]);

  const begin = (questions: MaterialQuestion[] | null) => {
    setRetryPaper(questions);
    setStarted(true);
    setQ(0);
    setChoice(null);
    setAnswers([]);
    setAnswered(false);
    setDone(false);
    setSaveNote('');
    setShowReview(false);
    setStartedAt(Date.now());
  };

  /** Lock the answer in and show why it was right or wrong. Nothing advances yet. */
  const check = () => {
    if (choice === null || answered) return;
    const next = [...answers];
    next[q] = choice;
    setAnswers(next);
    setAnswered(true);
  };

  /**
   * Move on without guessing. A blank still counts as wrong in the total, but the
   * report counts it separately, so "I did not know" is never presented back as
   * "I got this wrong" — and a guess would corrupt the learner's own diagnostic.
   */
  const skip = () => {
    if (answered) return;
    const blank = [...answers];
    blank[q] = null;
    setAnswers(blank);
    setChoice(null);
    setAnswered(true);
  };

  /**
   * Save the graded attempt. Topic names and counts only — `toAttemptPayload` is the
   * file that keeps the document text in this tab, and the server never sees it.
   */
  const save = async () => {
    if (paper.length === 0) return;
    setSaving(true);
    const outcome = await record(
      toAttemptPayload(graded, {
        source: 'material',
        label: retryPaper ? `${quizTitle} (retry)` : quizTitle,
        durationSeconds: (Date.now() - startedAt) / 1000,
      }),
    );
    setSaving(false);
    setSaveNote(outcome.saved ? 'Saved to your account.' : outcome.reason);
  };

  const advance = () => {
    if (!answered) return;
    if (isLast) {
      setDone(true);
      void save();
      return;
    }
    setQ(q + 1);
    setChoice(null);
    setAnswered(false);
  };

  /** Re-sit only the questions that were wrong, keeping the original options and key. */
  const practiseMissed = () => {
    const { questions } = buildRetryPaper(paper, plan);
    if (questions.length > 0) begin(questions);
  };

  if (paper.length === 0) return <div className="mx-auto max-w-3xl animate-rise-in"><PageIntro eyebrow="Grounded quiz" title="Generate a quiz from your material." description={`Upload a ${supportedFormatsSentence} file in Materials Lab first. NEXORA AI will extract the text and build questions from that source.`} /><Card className="p-8 text-center"><FileCheck2 className="mx-auto size-10 text-primary" /><p className="mt-4 text-sm text-muted-foreground">There is no generated material quiz in this browser session yet.</p><Link href="/materials" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white">Open Materials Lab <ArrowRight className="size-4" /></Link></Card></div>;
  if (!started) return <div className="mx-auto max-w-3xl animate-rise-in"><PageIntro eyebrow="Grounded quiz · Generated locally" title="Test the brief, not your memory." description={`A ${paper.length}-question knowledge check built from extracted text in ${quizTitle}. Each answer points back to a source sentence.`} /><Card className="overflow-hidden"><div className="bg-sidebar p-8 text-sidebar-foreground sm:p-12"><div className="flex items-center justify-between"><Badge tone="amber">{paper.length} questions</Badge><span className="font-mono text-[10px] uppercase tracking-[.14em] text-sidebar-foreground/50">Source-grounded</span></div><h2 className="mt-8 max-w-lg break-words font-serif text-4xl text-white">{quizTitle}</h2><p className="mt-4 max-w-lg text-sm leading-6 text-sidebar-foreground/70">Practise identifying what the uploaded material actually says. Distractors are generated locally from the source topic.</p><ActionButton variant="amber" className="mt-8" onClick={() => begin(null)} icon={<Play className="size-4" />}>Begin knowledge check</ActionButton></div><div className="grid gap-3 p-6 sm:grid-cols-3">{[['01', 'Recall', 'Find the source statement'], ['02', 'Interpret', 'Read the signal'], ['03', 'Apply', 'Make the call']].map(([n, t, d]) => <div key={n}><p className="font-mono text-xs text-primary">{n}</p><p className="mt-2 text-sm font-semibold">{t}</p><p className="mt-1 text-xs text-muted-foreground">{d}</p></div>)}</div></Card></div>;
  if (done) return (
    <div className="mx-auto max-w-3xl animate-rise-in">
      <PageIntro eyebrow="Knowledge check complete" title="Good judgement is a practice." description="Your answers were checked against the source-grounded answer key." />
      <Card className="p-8 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#fff2d8]"><Award className="size-9 text-[#a47727]" /></div>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Score</p>
        <p className="mt-1 font-serif text-5xl">{graded.correct} / {graded.total}</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2"><Badge tone={bandTones[graded.band]}>{bandLabels[graded.band]}</Badge>{retryPaper && <Badge>Retry of the questions you missed</Badge>}</div>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{describeAttempt(graded)}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {plan.retry.length > 0 && <ActionButton onClick={practiseMissed} icon={<RefreshCw className="size-4" />}>Practise what you missed</ActionButton>}
          <ActionButton variant={plan.retry.length > 0 ? 'outline' : 'primary'} onClick={() => { setRetryPaper(null); setStarted(false); setDone(false); setQ(0); setChoice(null); setAnswers([]); setAnswered(false); setShowReview(false); setSaveNote(''); }}>Take the full paper again</ActionButton>
          <Link href="/materials" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold">Back to material</Link>
        </div>
        {(saving || saveNote) && <p className="mt-5 text-xs text-muted-foreground">{saving ? 'Saving this result to your account...' : saveNote}</p>}
      </Card>

      <Card className="mt-6 p-6 sm:p-8">
        <SectionHeading eyebrow="Per topic" title="Where you stand, topic by topic" description={`Each topic is scored on its own questions. Fewer than ${MIN_QUESTIONS_FOR_BAND} questions on a topic is reported as unrated rather than weak — one wrong answer is not a measurement.`} />
        <div className="space-y-5">
          {graded.topics.map((score) => <div key={score.topic}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{score.topic}</p>
              <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{score.correct} / {score.total}</span><Badge tone={bandTones[score.band]}>{bandLabels[score.band]}</Badge></div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${score.percent}%`, backgroundColor: bandColors[score.band] }} /></div>
            <p className="mt-1.5 text-xs text-muted-foreground">{score.competency ? `Counts towards ${competencyName(score.competency)}` : 'Not matched to a framework competency, so it is reported as itself.'}</p>
          </div>)}
        </div>
        {graded.competencies.length > 0 && <div className="mt-7 border-t border-border pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Framework competencies this paper touched</p>
          <div className="mt-4 space-y-3">
            {graded.competencies.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-foreground">{entry.name}</p>
              <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{entry.percent}%</span><Badge tone={bandTones[entry.band]}>{bandLabels[entry.band]}</Badge></div>
            </div>)}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Competencies this material never asked about are left out rather than shown as zero.</p>
        </div>}
      </Card>

      {plan.passages.length > 0 && <Card className="mt-6 p-6 sm:p-8">
        <SectionHeading eyebrow="Revise this" title="The passages behind what you missed" description={plan.headline} />
        <div className="space-y-3">
          {plan.passages.map((passage) => <blockquote key={passage.text} className="rounded-lg border-l-2 border-primary bg-secondary px-4 py-3 text-sm leading-6 text-foreground">“{passage.text}”</blockquote>)}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">Quoted from {quizTitle}, in the order they appear in the document. This is your own material — nothing here was fetched from anywhere else.</p>
      </Card>}

      {plan.courses.length > 0 && <Card className="mt-6 p-6 sm:p-8">
        <SectionHeading eyebrow="Pathways" title="Where a longer pass would help" description="Matched to the competency your weaker topics sit under. Only pathways that actually build it are listed, so this section is often short." />
        <div className="space-y-3">
          {plan.courses.map((facts) => {
            const listed = courses.find((item) => item.id === facts.id);
            const Icon = listed?.icon ?? Target;
            return <Link key={facts.id} href={`/courses/${facts.id}`} data-testid={`link-quiz-pathway-${facts.id}`} className="flex items-start gap-4 rounded-xl border border-border p-4 transition-all hover:border-primary/50 hover:bg-secondary">
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${listed?.color ?? 'bg-secondary'}`}><Icon className="size-5 text-[#29485a]" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{listed?.title ?? facts.id}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{facts.helpsWith}</span>
                <span className="mt-2 block font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{competencyName(facts.competency)} · {formatMinutes(courseMinutes(facts.id))} outline</span>
              </span>
              <ArrowRight className="ml-auto mt-1 size-4 shrink-0 text-muted-foreground" />
            </Link>;
          })}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">{catalogueNote}</p>
      </Card>}

      <Card className="mt-6 p-6 sm:p-8">
        <SectionHeading eyebrow="Answer review" title="Question by question" description="Every question with your answer, the key, and the sentence it was built from." action={<ActionButton variant="outline" onClick={() => setShowReview(!showReview)}>{showReview ? 'Hide review' : 'Show review'}</ActionButton>} />
        {showReview ? <ol className="space-y-4">
          {paper.map((question, index) => {
            const pick = answers[index] ?? null;
            const right = pick !== null && pick === question.correct;
            return <li key={question.q} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Question {index + 1}</span>
                <Badge tone={right ? 'teal' : pick === null ? 'neutral' : 'coral'}>{right ? 'Correct' : pick === null ? 'Not answered' : 'Missed'}</Badge>
                <Badge tone="navy">{question.topic}</Badge>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-foreground">{question.q}</p>
              {pick !== null && !right && <p className="mt-3 text-sm leading-6 text-[#a34d43]"><X className="mr-1 inline size-3.5" />You chose: {question.a[pick]}</p>}
              <p className="mt-1.5 text-sm leading-6 text-[#216b67]"><Check className="mr-1 inline size-3.5" />Answer: {question.a[question.correct]}</p>
              <AnswerReveal question={question} pick={pick} className="mt-3" />
            </li>;
          })}
        </ol> : <p className="text-sm text-muted-foreground">{graded.total} {graded.total === 1 ? 'question' : 'questions'} in this paper. Opening the review shows the answer key, so it stays closed until you ask for it.</p>}
      </Card>
    </div>
  );

  /**
   * Option styling. The unanswered branches are exactly what this screen has always
   * shown; the answered ones are new, because before the reveal there was nothing to
   * reveal — the answer was already printed underneath.
   */
  const optionClass = (index: number) => {
    if (!answered) return choice === index ? 'border-primary bg-[#edf7f5] ring-1 ring-primary' : 'border-border hover:bg-secondary';
    if (index === current.correct) return 'border-primary bg-[#edf7f5] ring-1 ring-primary';
    if (index === choice) return 'border-[#e0b7b0] bg-[#f9e5e1]';
    return 'border-border opacity-60';
  };
  const bubbleClass = (index: number) => {
    if (!answered) return choice === index ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground';
    if (index === current.correct) return 'border-primary bg-primary text-white';
    if (index === choice) return 'border-[#c2796d] bg-[#c2796d] text-white';
    return 'border-border text-muted-foreground';
  };
  return <div className="mx-auto max-w-3xl animate-rise-in"><PageIntro eyebrow={quizTitle} title="Read closely." description="Choose the statement that is supported by the uploaded source. There is no penalty for taking a moment." action={<span className="font-mono text-xs text-muted-foreground">{q + 1} / {paper.length}</span>} /><ProgressBar value={((q + 1) / paper.length) * 100} className="mb-6" color="bg-accent" /><Card className="p-6 sm:p-10"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Question {q + 1}</p><Badge tone="navy">{current.topic}</Badge></div><h2 className="mt-4 text-xl font-semibold leading-snug sm:text-2xl">{current.q}</h2><div className="mt-8 space-y-3">{current.a.map((answer, i) => <button key={answer} data-testid={`button-quiz-answer-${i}`} disabled={answered} onClick={() => setChoice(i)} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all disabled:cursor-default ${optionClass(i)}`}><span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${bubbleClass(i)}`}>{String.fromCharCode(65 + i)}</span><span className="leading-6">{answer}</span></button>)}</div><div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">{!answered && <ActionButton variant="quiet" onClick={skip}>Skip this question</ActionButton>}<ActionButton disabled={!answered && choice === null} onClick={answered ? advance : check} icon={<ArrowRight className="size-4" />}>{!answered ? 'Check answer' : isLast ? 'See your report' : 'Next question'}</ActionButton></div>{answered && <AnswerReveal question={current} pick={choice} className="mt-6" />}</Card></div>;
}

export function Intelligence() {
  const [period, setPeriod] = useState('Last 90 days'); const [toast, setToast] = useState('');
  const org = [{ name: 'Apr', trained: 42, target: 55 }, { name: 'May', trained: 64, target: 60 }, { name: 'Jun', trained: 58, target: 62 }, { name: 'Jul', trained: 81, target: 70 }, { name: 'Aug', trained: 74, target: 76 }, { name: 'Sep', trained: 92, target: 82 }];
  return <div className="mx-auto max-w-[1440px] animate-rise-in"><PageIntro eyebrow="Training manager · Demonstration data" title="See the capability picture." description="A calm view of readiness across your directorate — where to invest, who needs support, and what is moving." action={<div className="flex gap-2"><button data-testid="button-intelligence-period" onClick={() => setPeriod(period === 'Last 90 days' ? 'This financial year' : 'Last 90 days')} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold"><Filter className="size-3.5" />{period}</button><ActionButton onClick={() => setToast('Brief exported as a demonstration PDF')} icon={<Download className="size-4" />}>Export brief</ActionButton></div>} /><div className="mb-6 rounded-lg border border-[#d6e2e7] bg-[#edf3f6] px-4 py-3 text-xs text-[#29485a]"><span className="font-semibold">Demonstration Data</span> · Organisational figures are synthetic and intended for the SIH26101 product walkthrough.</div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Directorate readiness" value="71.8%" note="+5.2 pts this quarter" /><Metric label="Active learners" value="184" note="of 216 staff" accent="amber" /><Metric label="Critical gaps" value="12" note="Across 3 competencies" accent="coral" /><Metric label="Learning hours" value="486" note="This financial year" /></div><div className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.65fr]"><Card className="p-5"><SectionHeading eyebrow="Capability movement" title="Learning activity vs target" description="Learners completing at least one assessed milestone each month." /><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={org} margin={{ top: 8, right: 8, left: -15, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e1e9ea" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#718189' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718189' }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #dfe9ea', fontSize: 12 }} /><Bar dataKey="trained" name="Active learners" fill="#2f7880" radius={[4, 4, 0, 0]} barSize={24} /><Bar dataKey="target" name="Target" fill="#c49743" radius={[4, 4, 0, 0]} barSize={24} /></BarChart></ResponsiveContainer></div></Card><Card className="p-5"><SectionHeading eyebrow="Competency distribution" title="Where support is needed" /><div className="space-y-5">{[['Statistical inference', 54, 'coral'], ['Data stewardship', 68, 'amber'], ['Dissemination', 79, 'teal'], ['Digital fluency', 83, 'teal']].map(([label, val, tone]) => <div key={String(label)}><div className="mb-2 flex justify-between text-xs"><span className="font-semibold">{label}</span><span className="font-mono text-muted-foreground">{val}%</span></div><ProgressBar value={Number(val)} color={tone === 'coral' ? 'bg-[#c86c5e]' : tone === 'amber' ? 'bg-accent' : 'bg-primary'} /></div>)}</div><button data-testid="button-view-gap-analysis" onClick={() => setToast('Gap analysis queued for review')} className="mt-7 w-full rounded-lg border border-border py-2.5 text-xs font-semibold text-primary hover:bg-secondary">Open gap analysis <ArrowRight className="ml-1 inline size-3.5" /></button></Card></div><div className="mt-7 grid gap-6 lg:grid-cols-3"><Card className="p-5 lg:col-span-2"><SectionHeading eyebrow="Priority queue" title="Signals that deserve a response" /><div className="divide-y divide-border">{[['12 people', 'Need support in statistical inference', 'High priority', 'coral'], ['28 people', 'Have not opened a pathway this quarter', 'Attention', 'amber'], ['46 people', 'Ready for an advanced practice module', 'Opportunity', 'teal']].map(([num, text, label, tone], i) => <div key={text} className="flex items-center gap-4 py-4"><div className={`flex size-10 items-center justify-center rounded-lg ${tone === 'coral' ? 'bg-[#f9e5e1] text-[#a34d43]' : tone === 'amber' ? 'bg-[#fff2d8] text-[#8a6319]' : 'bg-[#e2f1ef] text-[#216b67]'}`}><span className="font-mono text-xs font-bold">{num.split(' ')[0]}</span></div><div className="flex-1"><p className="text-sm font-semibold">{text}</p><p className="mt-1 text-xs text-muted-foreground">Detected by competency and activity signals</p></div><Badge tone={tone === 'coral' ? 'coral' : tone === 'amber' ? 'amber' : 'teal'}>{label}</Badge><button data-testid={`button-action-priority-${i}`} onClick={() => setToast(`${label} action noted for review`)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary"><ArrowRight className="size-4" /></button></div>)}</div></Card><Card className="bg-[#f7ebd1] p-6"><Lightbulb className="size-5 text-[#9b722b]" /><p className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#8a6319]">Manager note</p><h3 className="mt-2 font-serif text-2xl text-[#5f4a27]">Make the next cohort applied.</h3><p className="mt-3 text-sm leading-6 text-[#755f38]">The strongest shift this quarter came from worked examples, not video completion. Consider pairing the inference module with a live release review.</p><button data-testid="button-save-manager-note" onClick={() => setToast('Manager note saved')} className="mt-5 text-sm font-semibold text-[#8a6319] hover:underline">Save to planning brief <ArrowRight className="ml-1 inline size-4" /></button></Card></div>{toast && <ToastMessage message={toast} onClose={() => setToast('')} />}</div>;
}

export function Profile() {
  const [, setLocation] = useLocation();
  const { user } = useSession();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? 'Ananya Sharma');
  const [email, setEmail] = useState(user?.email ?? 'ananya.sharma@mospi.gov.in');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [bio, setBio] = useState('Statistical Officer with 6 years of experience in survey design, data quality assurance, and dissemination of national economic indicators.');
  const [role, setRole] = useState('Statistical Officer');
  const [department, setDepartment] = useState('Directorate of Economics & Statistics');
  const [location, setLoc] = useState('Bengaluru, Karnataka');
  const [language, setLanguage] = useState('English');
  const [notifications, setNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [demoLabels, setDemoLabels] = useState(true);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { if (user?.name) setName(user.name); }, [user?.name]);
  useEffect(() => { if (user?.email) setEmail(user.email); }, [user?.email]);

  const handleSave = () => { setEditing(false); setSaved(true); setToast('Profile updated successfully'); setTimeout(() => setToast(''), 3000); };
  const handleCancel = () => { setEditing(false); setName(user?.name ?? 'Ananya Sharma'); setEmail(user?.email ?? 'ananya.sharma@mospi.gov.in'); };

  const skills = [
    { name: 'Data Quality', level: 82 },
    { name: 'Statistical Inference', level: 68 },
    { name: 'Data Dissemination', level: 74 },
    { name: 'Leadership', level: 54 },
    { name: 'Digital Tools', level: 61 },
  ];

  const stats = [
    { label: 'Courses completed', value: '27', icon: Award },
    { label: 'Assessments taken', value: '12', icon: Target },
    { label: 'Learning hours', value: '142', icon: Clock3 },
    { label: 'Current streak', value: '8 days', icon: Sparkles },
  ];

  const inputClass = 'w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-60 disabled:cursor-not-allowed';

  return <div className="mx-auto max-w-5xl animate-rise-in">
    <PageIntro eyebrow="Profile & preferences" title="Your NEXORA AI identity." description="Manage your personal information, professional details, and platform preferences — all in one place." />

    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => <Card key={s.label} className="p-4 text-center">
        <s.icon className="mx-auto size-5 text-primary" />
        <p className="mt-2 font-serif text-2xl font-semibold">{s.value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</p>
      </Card>)}
    </div>

    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-sidebar via-[#1e4a4f] to-[#173a3e] px-6 pb-16 pt-8 text-center">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #9ed5cc 0%, transparent 60%)' }} />
            <div className="relative mx-auto flex size-24 items-center justify-center rounded-full bg-[#b8ddd6] font-serif text-4xl text-sidebar ring-4 ring-white/20">
              {initials(user?.name ?? name)}
            </div>
            <button data-testid="button-change-avatar" className="relative mx-auto mt-3 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25">
              <Camera className="size-3" /> Change photo
            </button>
          </div>
          <div className="-mt-8 rounded-t-[20px] bg-card px-6 pb-6 pt-8 text-center">
            <h2 className="font-serif text-xl">{name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{role}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Badge tone="amber">Verified official</Badge>
              <Badge tone="teal">Active</Badge>
            </div>
            <div className="mt-5 flex justify-center gap-6 border-t border-border pt-5 text-xs text-muted-foreground">
              <div className="text-center"><p className="font-semibold text-foreground">27</p><p>Courses</p></div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center"><p className="font-semibold text-foreground">68.4</p><p>Score</p></div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center"><p className="font-semibold text-foreground">142h</p><p>Learning</p></div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Competencies" title="Skill levels" />
          <div className="space-y-4">
            {skills.map((s) => <div key={s.name}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{s.level}%</span>
              </div>
              <ProgressBar value={s.level} />
            </div>)}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <SectionHeading eyebrow="Personal" title="Your information" />
            {!editing && <button data-testid="button-edit-profile" onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-secondary"><Edit3 className="size-3.5" /> Edit</button>}
          </div>
          <div className="space-y-5">
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold"><Users className="size-3.5 text-muted-foreground" /> Full name</span>
              <input data-testid="input-name" type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={!editing} className={`mt-2 ${inputClass}`} />
            </label>
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold"><Mail className="size-3.5 text-muted-foreground" /> Email address</span>
              <input data-testid="input-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!editing} className={`mt-2 ${inputClass}`} />
            </label>
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold"><Phone className="size-3.5 text-muted-foreground" /> Phone number</span>
              <input data-testid="input-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!editing} className={`mt-2 ${inputClass}`} />
            </label>
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold"><Edit3 className="size-3.5 text-muted-foreground" /> Bio</span>
              <textarea data-testid="input-bio" value={bio} onChange={(e) => setBio(e.target.value)} disabled={!editing} rows={3} className={`mt-2 resize-none ${inputClass}`} />
            </label>
            {editing && <div className="flex gap-3 border-t border-border pt-5">
              <ActionButton onClick={handleSave}>Save changes <Check className="size-4" /></ActionButton>
              <ActionButton variant="outline" onClick={handleCancel}>Cancel</ActionButton>
            </div>}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Professional" title="Work details" />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><Briefcase className="size-3.5" /> Role</p>
              <p className="mt-1.5 text-sm font-semibold">{role}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><Shield className="size-3.5" /> Department</p>
              <p className="mt-1.5 text-sm font-semibold">{department}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-3.5" /> Location</p>
              <p className="mt-1.5 text-sm font-semibold">{location}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="size-3.5" /> Joined</p>
              <p className="mt-1.5 text-sm font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'March 2021'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Preferences" title="How you work" />
          <div className="space-y-6">
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold"><Globe className="size-3.5 text-muted-foreground" /> Preferred language</span>
              <select data-testid="select-language" value={language} onChange={(e) => setLanguage(e.target.value)} className={`mt-2 ${inputClass}`}>
                <option>English</option><option>Hindi</option><option>Kannada</option><option>Tamil</option><option>Telugu</option><option>Bengali</option>
              </select>
            </label>

            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-semibold">Push notifications</span>
                <span className="mt-1 block text-xs text-muted-foreground">Get notified about assessment windows and new pathways.</span>
              </span>
              <button data-testid="button-toggle-notifications" onClick={() => setNotifications(!notifications)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${notifications ? 'bg-primary' : 'bg-secondary'}`}><span className={`absolute top-1 size-4 rounded-full bg-card transition-transform ${notifications ? 'left-6' : 'left-1'}`} /></button>
            </label>

            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-semibold">Weekly intelligence digest</span>
                <span className="mt-1 block text-xs text-muted-foreground">A short Monday brief on your next learning move.</span>
              </span>
              <button data-testid="button-toggle-digest" onClick={() => setWeeklyDigest(!weeklyDigest)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${weeklyDigest ? 'bg-primary' : 'bg-secondary'}`}><span className={`absolute top-1 size-4 rounded-full bg-card transition-transform ${weeklyDigest ? 'left-6' : 'left-1'}`} /></button>
            </label>

            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-semibold">Show demonstration labels</span>
                <span className="mt-1 block text-xs text-muted-foreground">Keep prototype data markers visible in your workspace.</span>
              </span>
              <button data-testid="button-toggle-demo-labels" onClick={() => setDemoLabels(!demoLabels)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${demoLabels ? 'bg-primary' : 'bg-secondary'}`}><span className={`absolute top-1 size-4 rounded-full bg-card transition-transform ${demoLabels ? 'left-6' : 'left-1'}`} /></button>
            </label>

            <div className="flex items-center gap-3 border-t border-border pt-5">
              <ActionButton onClick={() => { setSaved(true); setToast('Preferences saved'); setTimeout(() => setToast(''), 3000); }}>{saved ? 'Preferences saved' : 'Save preferences'} <Check className="size-4" /></ActionButton>
              <button data-testid="button-open-integrations" onClick={() => setLocation('/integrations')} className="text-sm font-semibold text-primary hover:underline">Manage integrations</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
    {toast && <ToastMessage message={toast} onClose={() => setToast('')} />}
  </div>;
}
function Building2Icon() { return <svg viewBox="0 0 24 24" className="size-7 text-[#29485a]" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 21V5l8-3 8 3v16M8 9h1m3 0h1m3 0h1M8 13h1m3 0h1m3 0h1M8 17h1m3 0h1m3 0h1M10 21v-4h4v4" /></svg>; }

export function Presentation() {
  const [, setLocation] = useLocation(); const [slide, setSlide] = useState(0); const slides = [{ kicker: '01 · Orient', title: 'NEXORA AI turns competency data into a next action.', body: 'A guided tour for the official statistical workforce — from individual signal to organisational response.', target: '/dashboard', button: 'Open learner overview' }, { kicker: '02 · Diagnose', title: 'Start with the question behind the score.', body: 'Scenario-based assessment makes competency evidence useful, not ornamental.', target: '/assessment', button: 'Run a sample assessment' }, { kicker: '03 · Practise', title: 'Make a work material a learning surface.', body: 'Upload a briefing, ground the language, then practise the judgement it demands.', target: '/materials', button: 'Open materials lab' }, { kicker: '04 · See the system', title: 'Managers see where support will matter.', body: 'Organisational intelligence turns scattered activity into a prioritised queue.', target: '/intelligence', button: 'Open intelligence view' }]; const current = slides[slide]; return <div className="min-h-[calc(100dvh-68px)]"><div className="mx-auto flex min-h-[calc(100dvh-120px)] max-w-6xl flex-col justify-between py-8 sm:py-14"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white"><span className="font-serif text-xl">S</span></div><div><p className="font-serif text-lg">NEXORA AI</p><p className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Guided presentation</p></div></div><Badge tone="amber">Prototype · Demonstration data</Badge></div><div className="grid items-center gap-12 py-14 lg:grid-cols-[1fr_.8fr]"><div key={slide} className="animate-rise-in"><p className="font-mono text-xs font-medium uppercase tracking-[.18em] text-primary">{current.kicker}</p><h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.02] tracking-[-.03em] sm:text-7xl">{current.title}</h1><p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">{current.body}</p><ActionButton className="mt-8" onClick={() => setLocation(current.target)} icon={<ArrowRight className="size-4" />}>{current.button}</ActionButton></div><div className="relative aspect-square max-w-[440px] justify-self-center"><div className="absolute inset-7 rounded-full border border-primary/15" /><div className="absolute inset-16 rounded-full border border-primary/20" /><div className="absolute inset-[27%] flex flex-col items-center justify-center rounded-full bg-sidebar text-center text-white shadow-xl"><Sparkles className="mb-3 size-6 text-accent" /><span className="font-mono text-[10px] uppercase tracking-[.15em] text-sidebar-foreground/60">Signal</span><span className="mt-1 font-serif text-3xl">68.4</span><span className="mt-1 text-xs text-sidebar-foreground/60">competency index</span></div><div className="absolute left-0 top-[31%] rounded-lg border border-border bg-card p-3 shadow-lg"><p className="font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Next move</p><p className="mt-1 text-xs font-semibold">Applied inference</p></div><div className="absolute bottom-[20%] right-0 rounded-lg border border-border bg-card p-3 shadow-lg"><p className="font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Pathway</p><p className="mt-1 text-xs font-semibold">42% complete</p></div></div></div><div className="flex items-center justify-between border-t border-border pt-5"><div className="flex gap-2">{slides.map((s, i) => <button key={s.kicker} data-testid={`button-presentation-slide-${i}`} onClick={() => setSlide(i)} className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-12 bg-primary' : 'w-5 bg-border'}`} aria-label={`Go to presentation slide ${i + 1}`} />)}</div><div className="flex gap-2"><button data-testid="button-presentation-previous" onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0} className="rounded-lg border border-border p-2.5 disabled:opacity-30"><ArrowLeft className="size-4" /></button><button data-testid="button-presentation-next" onClick={() => setSlide(Math.min(slides.length - 1, slide + 1))} disabled={slide === slides.length - 1} className="rounded-lg bg-primary p-2.5 text-white disabled:opacity-30"><ArrowRight className="size-4" /></button></div></div></div></div>;
}
export function Roadmap() {
  const [expanded, setExpanded] = useState<number | null>(1);
  const milestones = [{ title: 'Statistical Officer', sub: 'Current role · Directorate of Economics', status: 'Current', score: 68, skills: ['Data quality', 'Official methods', 'Release practice'] }, { title: 'Senior Statistical Officer', sub: 'Next horizon · 12–18 months', status: 'Next horizon', score: 78, skills: ['Applied inference', 'Policy communication', 'Team leadership'] }, { title: 'Deputy Director, Statistics', sub: 'Longer horizon · 3–5 years', status: 'Aspirational', score: 0, skills: ['Strategic planning', 'System leadership', 'Advanced dissemination'] }];
  return <div className="mx-auto max-w-5xl animate-rise-in"><PageIntro eyebrow="Career roadmap" title="Make the next role legible." description="A skills-first view of your progression, grounded in the competencies expected across India’s official statistical system." action={<ActionButton variant="outline" onClick={() => setExpanded(expanded === null ? 1 : null)} icon={<MapPin className="size-4" />}>Recenter map</ActionButton>} /><Card className="overflow-hidden p-6 sm:p-10"><div className="relative"><div className="absolute left-[19px] top-5 h-[calc(100%-40px)] w-px bg-border sm:left-6" />{milestones.map((m, i) => <div key={m.title} className="relative mb-8 flex gap-5 last:mb-0 sm:gap-8"><div className={`z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-4 border-card ${i === 0 ? 'bg-primary text-white' : i === 1 ? 'bg-accent text-foreground' : 'bg-secondary text-muted-foreground'}`}><span className="font-mono text-xs font-bold">{i === 0 ? <Check className="size-4" /> : `0${i + 1}`}</span></div><div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-5 transition-colors hover:bg-secondary/50"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-serif text-xl">{m.title}</h2><Badge tone={i === 0 ? 'teal' : i === 1 ? 'amber' : 'neutral'}>{m.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{m.sub}</p></div>{i < 2 && <div className="text-left sm:text-right"><p className="font-mono text-xl text-primary">{m.score}%</p><p className="text-[10px] text-muted-foreground">readiness</p></div>}</div><button data-testid={`button-expand-roadmap-${i}`} onClick={() => setExpanded(expanded === i ? null : i)} className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">{expanded === i ? 'Hide competency detail' : 'View competency detail'}<ArrowRight className={`size-3.5 transition-transform ${expanded === i ? 'rotate-90' : ''}`} /></button>{expanded === i && <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">{m.skills.map((skill, j) => <div key={skill} className="rounded-lg bg-secondary p-3"><p className="text-xs font-semibold">{skill}</p><p className="mt-2 text-[11px] text-muted-foreground">{i === 0 ? 'Demonstrated' : j === 0 ? 'Focus next' : 'Build evidence'}</p></div>)}</div>}</div></div>)}</div></Card><div className="mt-6 grid gap-4 sm:grid-cols-2"><Card className="flex items-center gap-4 p-5"><div className="flex size-11 items-center justify-center rounded-xl bg-[#e2f1ef]"><Target className="size-5 text-primary" /></div><div><p className="text-sm font-semibold">Next evidence to collect</p><p className="mt-1 text-xs text-muted-foreground">Lead one quality review and document the decision.</p></div></Card><Card className="flex items-center gap-4 p-5"><div className="flex size-11 items-center justify-center rounded-xl bg-[#fff2d8]"><Award className="size-5 text-[#8a6319]" /></div><div><p className="text-sm font-semibold">Recognition milestone</p><p className="mt-1 text-xs text-muted-foreground">2 more pathway modules unlock a badge.</p></div></Card></div></div>;
}

export function Integrations() {
  const [connected, setConnected] = useState(true); const [syncing, setSyncing] = useState(false); const [toast, setToast] = useState('');
  const sync = () => { setSyncing(true); window.setTimeout(() => { setSyncing(false); setToast('iGOT training history synced locally'); }, 1200); };
  return <div className="mx-auto max-w-4xl animate-rise-in"><PageIntro eyebrow="Integrations" title="Connect the systems that know your work." description="Prototype connectors for a future NEXORA AI intelligence layer. No external services are contacted in this demo." /><Card className="overflow-hidden"><div className="flex flex-col justify-between gap-5 border-b border-border p-6 sm:flex-row sm:items-center sm:p-8"><div className="flex items-center gap-4"><div className="flex size-14 items-center justify-center rounded-xl bg-[#dce5ee]"><Building2Icon /></div><div><h2 className="font-serif text-2xl">iGOT Karmayogi</h2><p className="mt-1 text-sm text-muted-foreground">Training history and course completion</p></div></div><Badge tone={connected ? 'teal' : 'neutral'}>{connected ? 'Connected' : 'Not connected'}</Badge></div><div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_260px]"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Connector status</p><div className="mt-4 space-y-4">{[['Last sync', 'Today, 09:42 IST'], ['Records available', '27 completed courses'], ['Permission scope', 'Learning history only']].map(([l, v]) => <div key={l} className="flex justify-between border-b border-border pb-3 text-sm"><span className="text-muted-foreground">{l}</span><span className="font-semibold">{v}</span></div>)}</div><div className="mt-6 flex items-center gap-2 text-xs text-[#216b67]"><CheckCircle2 className="size-4" /> Connector is operating within its approved scope.</div></div><div className="rounded-xl bg-secondary p-5"><p className="text-xs text-muted-foreground">Demo controls</p><ActionButton className="mt-4 w-full" disabled={syncing} onClick={sync} icon={syncing ? <RefreshCw className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}>{syncing ? 'Syncing...' : 'Sync now'}</ActionButton><button data-testid="button-disconnect-igot" onClick={() => { setConnected(!connected); setToast(connected ? 'iGOT connector paused' : 'iGOT connector restored'); }} className="mt-3 w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">{connected ? 'Pause connector' : 'Restore connector'}</button></div></div></Card><Card className="mt-5 p-6"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Coming next</p><h2 className="mt-1 font-serif text-xl">Other trusted sources</h2></div><Badge tone="navy">Prototype</Badge></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-dashed border-border p-4"><p className="text-sm font-semibold">Department HRMS</p><p className="mt-1 text-xs text-muted-foreground">Role history and movement signals</p></div><div className="rounded-lg border border-dashed border-border p-4"><p className="text-sm font-semibold">Learning Management System</p><p className="mt-1 text-xs text-muted-foreground">Local course and assessment events</p></div></div></Card>{toast && <ToastMessage message={toast} onClose={() => setToast('')} />}</div>;
}
