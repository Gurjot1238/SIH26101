import { type DragEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, ArrowRight, ArrowUpRight, Award, BarChart3, Briefcase, Calendar, Camera, Check, CheckCircle2, Clock3, Download, Edit3, FileCheck2, Filter, Globe, GraduationCap, Lightbulb, ListChecks, LockKeyhole, Mail, MapPin, Minus, Phone, Play, Plus, RefreshCw, Shield, Sparkles, Target, TrendingDown, TrendingUp, TriangleAlert, UploadCloud, Users, X } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import { ActionButton, Badge, Card, EmptyState, LoadingBlock, ProgressBar, SectionHeading, ToastMessage } from '@/components/ui';
import { initials, useSession } from '@/components/session-provider';
import {
  MAX_MATERIAL_BYTES,
  MIN_QUESTIONS,
  type MaterialQuestion,
  type OcrPageFn,
  type VisionPageFn,
  type PageProgress,
  type PageText,
  TARGET_QUESTIONS,
  extractConcepts,
  extractTopics,
  questionKindLabels,
  readMaterial,
  readMaterialWithPages,
  isLargeDocument,
  sampleMaterialLabel,
  sampleMaterialMeta,
  sampleMaterialText,
  sentenceList,
  supportedAccept,
  supportedExtensions,
  supportedFormatsSentence,
} from '@/lib/materials';
import { AiGenerationError, generateAiQuestions, classifyDocument, type MaterialClassification, type Difficulty } from '@/lib/ai-questions';
import { DocumentError, checkOcrAvailable, createOcrTransport, checkVisionAvailable, createVisionTransport, guardMaterial, ingestLargeDocument, searchDocument, generateFromTopic, type DocumentRecord, type SearchPreview } from '@/lib/documents';
import { MAX_SAVED_PAPERS, PaperError, type SavedPaperSummary, deletePaper, getPaper, listPapers, savePaper } from '@/lib/papers';
import { clearMaterial, isDurable, setMaterial, useMaterial } from '@/lib/material-session';
import { attemptKey, clearAttempt, loadAttempt, saveAttempt } from '@/lib/attempt-session';
import { clearAssessment, loadAssessment, saveAssessment } from '@/lib/assessment-session';
import {
  type AssessmentResult,
  type SealedPaper,
  adoptServerScore,
  rebuildPaper,
  sectionOf,
  toChoices,
} from '@/lib/assessment';
import { type CompetencyId, MIN_QUESTIONS_FOR_BAND, bandColors, bandLabels, bandTones, competencyName } from '@/lib/topics';
import { type AttemptResult, type Choice, describeAttempt, gradeAttempt, toAttemptPayload } from '@/lib/scoring';
import { buildRetryPaper, buildStudyPlan, summarizePlan } from '@/lib/recommendations';
import {
  type CatalogueCourse,
  type CourseDetail as DatasetCourseDetail,
  type CourseLesson,
  completedCount,
  completionPercent,
  fetchCatalogue,
  fetchCourse,
} from '@/lib/course-content';
import { LessonReader } from '@/components/lesson-reader';
import {
  type CourseCategory,
  categoryCounts,
  categoryLabels,
  categoryOrder,
  courseHoursLabel,
  courseLibrary,
  coursesInCategory,
  libraryNote,
  trendingCourses,
} from '@/lib/course-library';
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
  practiceStreak,
  quarterLabel,
  signal,
  trend,
  weekBuckets,
} from '@/lib/insights';
import { useProgress } from '@/components/progress-provider';
import { type AnswerAnalysis } from '@/lib/analytics';
import { CompetencyGapSection } from '@/components/competency-gap';
import { GapCourseRecommendations } from '@/components/gap-course-recommendations';

const competencyData = [{ name: 'Data quality', score: 82 }, { name: 'Inference', score: 68 }, { name: 'Dissemination', score: 74 }, { name: 'Leadership', score: 54 }, { name: 'Digital tools', score: 61 }];
const weeklyData = [{ name: 'Mon', hours: 0.8 }, { name: 'Tue', hours: 1.4 }, { name: 'Wed', hours: 0.3 }, { name: 'Thu', hours: 1.7 }, { name: 'Fri', hours: 1.1 }, { name: 'Sat', hours: 2.2 }, { name: 'Sun', hours: 1.6 }];
type MetricRow = { label: string; value: string; note: string; accent: 'teal' | 'amber' | 'coral' };
const sampleMetrics: MetricRow[] = [
  { label: 'Competency index', value: '68.4', note: '+4.8 pts since last review', accent: 'teal' as const },
  { label: 'Learning streak', value: '12 days', note: 'Best: 18 days', accent: 'amber' as const },
  { label: 'Hours this month', value: '7.6', note: '2.4 hrs to monthly goal', accent: 'teal' as const },
  { label: 'Latest score', value: '42%', note: 'Your most recent sitting', accent: 'coral' as const },
];
const sampleActivity: ActivityRow[] = [
  { id: 's1', title: 'Assessment calibrated', detail: 'Evidence-based Inference', date: '18 Sep', tone: 'teal' },
  { id: 's2', title: 'Course milestone', detail: 'R for Survey Processing · Module 4', date: '16 Sep', tone: 'amber' },
  { id: 's3', title: 'Certificate issued', detail: 'Foundations of Official Statistics', date: '12 Sep', tone: 'navy' },
];
const ACTIVITY_ROWS = 3;
const ACTIVITY_ROWS_ALL = 20;

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

export function Dashboard() {
  const [, setLocation] = useLocation();
  const [toast, setToast] = useState('');
  const [noteOpen, setNoteOpen] = useState(true);
  const [fullActivity, setFullActivity] = useState(false);
  const { live, status, problem, progress, history } = useProgress();
  const sample = !live;
  const view = useMemo(() => {
    const now = new Date();
    return { quarter: quarterLabel(now), bars: competencyBars(progress), buckets: weekBuckets(history, now), streak: practiceStreak(history, now), month: monthEffort(history, now), trend: trend(history), rows: activityRows(history, fullActivity ? ACTIVITY_ROWS_ALL : ACTIVITY_ROWS), signal: signal(progress), note: dashboardNote(progress), delta: lastDelta(history) };
  }, [progress, history, fullActivity]);
  const nothingYet = live && progress.attempts === 0;
  const metrics: MetricRow[] = sample ? sampleMetrics : [
    { label: 'Competency index', value: nothingYet ? '—' : progress.index.toFixed(1), note: nothingYet ? 'No sittings recorded yet' : view.delta, accent: 'teal' },
    { label: 'Learning streak', value: nothingYet ? '—' : `${view.streak.current} day${view.streak.current === 1 ? '' : 's'}`, note: nothingYet ? 'Nothing logged yet' : `Longest run: ${view.streak.best} day${view.streak.best === 1 ? '' : 's'}`, accent: 'amber' },
    { label: 'Hours this month', value: view.month.sittings === 0 ? '—' : view.month.hours.toFixed(1), note: view.month.sittings === 0 ? 'No sittings this month' : `${view.month.sittings} sitting${view.month.sittings === 1 ? '' : 's'} this month`, accent: 'teal' },
    { label: 'Latest score', value: nothingYet ? '—' : `${history[0].percent}%`, note: nothingYet ? 'No sittings yet' : `${history[0].correct} of ${history[0].total} correct`, accent: 'coral' },
  ];
  const rows = sample ? sampleActivity : view.rows;
  const faces = sample ? ['M', 'T', 'W'] : view.buckets.filter((day) => day.active).slice(-3).map((day) => day.name.slice(0, 1));
  const moreActivity = !sample && history.length > ACTIVITY_ROWS;
  const strip = live ? view.note : status === 'loading' ? 'Loading your results…' : status === 'unavailable' ? `${problem} The figures below are sample data until it answers.` : 'These figures are sample data. Sign in with the auth server running and this overview fills with your own results.';
  return <div className="mx-auto max-w-[1440px] animate-rise-in">
    <PageIntro eyebrow={sample ? 'Sample / Demonstration Data' : `Learner overview · ${view.quarter}`} title="Your next best move is clear." description="Competency signals, learning momentum, and one considered recommendation for the week ahead." action={<ActionButton onClick={() => setLocation('/assessment')} variant="amber" icon={<ArrowRight className="size-4" />}>{nothingYet ? 'Take the assessment' : 'Continue assessment'}</ActionButton>} />
    {noteOpen && <div className="mb-7 flex items-center gap-2 rounded-lg border border-[#c6ded9] bg-[#eef8f5] px-4 py-3 text-xs text-[#216b67]"><Sparkles className="size-4" /><span><b>Intelligence note:</b> {strip}</span><button data-testid="button-dismiss-intelligence" onClick={() => setNoteOpen(false)} aria-label="Dismiss note" className="ml-auto text-[#216b67]/60 hover:text-[#216b67]"><X className="size-4" /></button></div>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map((metric) => <Metric key={metric.label} label={metric.label} value={metric.value} note={metric.note} accent={metric.accent} />)}</div>
    <div className="mt-7 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <Card className="overflow-hidden"><div className="flex items-start justify-between border-b border-border p-5"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Competency profile</p><h2 className="mt-1 font-serif text-[22px]">Where your practice stands</h2></div><button data-testid="button-view-competencies" onClick={() => setLocation('/assessment')} className="text-xs font-semibold text-primary hover:underline">View assessment <ArrowUpRight className="ml-1 inline size-3" /></button></div><div className="p-5">{sample || view.bars.length > 0 ? <div className="h-[230px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={sample ? competencyData : view.bars} layout="vertical" margin={{ left: 14, right: 20 }} barCategoryGap={13}><CartesianGrid horizontal={false} stroke="#dfe9ea" /><XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718189' }} /><YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#40515a' }} width={92} /><Tooltip cursor={{ fill: '#f2f6f6' }} contentStyle={{ borderRadius: 8, border: '1px solid #dfe9ea', fontSize: 12 }} /><Bar dataKey="score" fill="#2f7880" radius={[0, 4, 4, 0]} barSize={15} /></BarChart></ResponsiveContainer></div> : <div className="flex h-[230px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 text-center"><BarChart3 className="size-6 text-muted-foreground" /><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Take your first assessment to generate your learning profile. Nothing is charted until you have answered something.</p></div>}<div className="mt-2 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span>{sample ? 'Last calibrated 18 Sep 2024' : progress.lastAttemptAt ? `Last measured ${longDate(progress.lastAttemptAt)}` : 'Nothing measured yet'}</span>{sample ? <span className="flex items-center gap-1 text-[#216b67]"><TrendingUp className="size-3.5" /> Trending upward</span> : <span className="flex items-center gap-1 text-[#216b67]">{view.trend.direction === 'up' ? <TrendingUp className="size-3.5" /> : view.trend.direction === 'down' ? <TrendingDown className="size-3.5" /> : <Minus className="size-3.5" />} {view.trend.label}</span>}</div></div></Card>
      <Card className="p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">{sample ? 'This week' : 'Last 7 days'}</p><h2 className="mt-1 font-serif text-[22px]">Learning rhythm</h2></div><Badge tone="amber">{sample ? '7.6 hours' : `${bucketHours(view.buckets)} hours`}</Badge></div><div className="mt-5 h-[178px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={sample ? weeklyData : view.buckets} margin={{ top: 12, right: 4, left: -25, bottom: 0 }}><defs><linearGradient id="rhythmFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2f7880" stopOpacity=".23" /><stop offset="100%" stopColor="#2f7880" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e4ecec" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718189' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718189' }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #dfe9ea', fontSize: 12 }} /><Area dataKey="hours" stroke="#2f7880" strokeWidth={2} fill="url(#rhythmFill)" /></AreaChart></ResponsiveContainer></div><div className="flex items-center justify-between border-t border-border pt-4"><div className="flex -space-x-1">{faces.length > 0 && <span className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-[#d8e9e6] text-[9px] font-bold text-[#216b67]">{faces[0]}</span>}{faces.length > 1 && <span className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-[#f7dfaa] text-[9px] font-bold text-[#8a6319]">{faces[1]}</span>}{faces.length > 2 && <span className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-[#dce3ec] text-[9px] font-bold text-[#29485a]">{faces[2]}</span>}</div><span className="text-xs text-muted-foreground">{sample ? '5 of 7 days active' : `${activeDays(view.buckets)} of ${WEEK_DAYS} days active`}</span></div></Card>
    </div>
    {/**
      * The competency gap analysis. Gated on `live` for the same reason every other
      * figure on this page is: in sample mode there are no real answers to analyse, and
      * a chart of invented gaps is the precise thing this section exists to replace. Not
      * rendering it leaves the demo view exactly as it was.
      */}
    {live && <CompetencyGapSection />}
    {live && <GapCourseRecommendations />}
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.9fr]"><Card className="p-5"><SectionHeading eyebrow="Recent activity" title="A short record of progress" action={<button data-testid="button-view-activity" onClick={sample ? () => setToast('Sign in to see your own history') : moreActivity ? () => setFullActivity(!fullActivity) : () => setToast(history.length === 0 ? 'Nothing is recorded yet' : 'That is everything recorded so far')} className="text-xs font-semibold text-primary">{moreActivity ? (fullActivity ? 'Show less' : `View all ${history.length}`) : 'View history'}</button>} /><div className="space-y-4">{rows.length === 0 ? <p className="text-sm leading-6 text-muted-foreground">Nothing recorded yet. Assessments and knowledge checks appear here with the score each one earned.</p> : rows.map((row) => <div key={row.id} className="flex items-center gap-3"><div className={`size-2 rounded-full ${row.tone === 'teal' ? 'bg-primary' : row.tone === 'amber' ? 'bg-accent' : 'bg-[#9db5c5]'}`} /><div className="flex-1"><p className="text-sm font-semibold">{row.title}</p><p className="text-xs text-muted-foreground">{row.detail}</p></div><span className="font-mono text-[10px] text-muted-foreground">{row.date}</span></div>)}</div></Card><Card className="relative overflow-hidden bg-sidebar p-6 text-sidebar-foreground"><div className="absolute -right-8 -top-10 size-40 rounded-full border border-accent/20" /><div className="absolute -right-3 -top-5 size-28 rounded-full border border-accent/15" /><Award className="mb-5 size-6 text-accent" /><p className="font-mono text-[10px] uppercase tracking-[.16em] text-accent">Signal worth noticing</p><h3 className="mt-2 max-w-[290px] font-serif text-2xl text-white">{sample ? 'Your strongest and weakest competency, side by side.' : view.signal ? view.signal.headline : 'Your profile starts with one sitting.'}</h3><p className="mt-3 max-w-[300px] text-sm leading-6 text-sidebar-foreground/70">{sample ? 'This card is showing demonstration copy. With your own results it names your strongest and weakest competency, and the gap between them.' : view.signal ? view.signal.detail : 'Sit the assessment or upload your own material, and this card names your strongest and weakest competency with the counts behind them.'}</p><button data-testid="button-view-insight" onClick={sample ? () => setToast('Sign in to keep this in your learning brief') : () => setLocation(view.signal ? view.signal.href : '/assessment')} className="mt-5 text-sm font-semibold text-accent hover:underline">{sample ? 'Save to brief' : view.signal ? view.signal.actionLabel : 'Take the assessment'} <ArrowRight className="ml-1 inline size-4" /></button></Card></div>
    {toast && <ToastMessage message={toast} onClose={() => setToast('')} />}
  </div>;
}

function clockText(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function Assessment() {
  const [, setLocation] = useLocation();
  const { openAssessment, sitAssessment } = useProgress();
  const [restored] = useState(() => loadAssessment());
  const [paper, setPaper] = useState<SealedPaper | null>(restored?.paper ?? null);
  const [dealing, setDealing] = useState(!restored);
  const [dealProblem, setDealProblem] = useState('');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Choice[]>(restored?.answers ?? []);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(restored?.result ?? null);
  const [answerAnalysis, setAnswerAnalysis] = useState<AnswerAnalysis | null>(restored?.answerAnalysis ?? null);
  const [showReview, setShowReview] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(restored?.elapsed ?? 0);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState('');

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
    // A completed sitting restored from this tab's storage keeps its result on screen;
    // dealing a fresh paper here is what used to wipe it when navigating back.
    if (restored) return;
    void deal();
    // Once per mount. Retaking calls `deal` directly rather than through a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    if (result) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [result, startedAt]);

  const choose = (index: number) => {
    setSelected(index);
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = index;
      return next;
    });
  };

  const goTo = (next: number) => {
    setStep(next);
    setSelected(answers[next] ?? null);
  };

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
    setAnswerAnalysis(outcome.value.answers);
    setSaveNote('Saved to your account.');
    // Keep this finished sitting on screen when the learner navigates away and back,
    // instead of dealing a fresh paper over the top of their result.
    saveAssessment({
      paper,
      answers: [...answers],
      result: outcome.value.result,
      answerAnalysis: outcome.value.answers,
      elapsed: seconds,
    });
  };

  const retake = () => {
    clearAssessment();
    setStep(0);
    setAnswers([]);
    setSelected(null);
    setResult(null);
    setAnswerAnalysis(null);
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

      {/**
        * The answer-level rollup, straight from the server's grading of this sitting.
        * It answers a question the per-section card cannot: not "how did each competency
        * score" but "which topic did the wrong answers actually fall under". The counts
        * are the server's, and no question text or answer key is in this payload.
        */}
      {answerAnalysis && <Card className="mt-6 p-6 sm:p-8">
        <SectionHeading eyebrow="Answer breakdown" title="Which questions went wrong, and where" description={`You attempted ${answerAnalysis.attempted} of ${answerAnalysis.total} questions and got ${answerAnalysis.correct} right — ${answerAnalysis.accuracy}% of the paper.`} />
        <div className="grid gap-3 sm:grid-cols-4">
          {[['Attempted', `${answerAnalysis.attempted}`], ['Correct', `${answerAnalysis.correct}`], ['Incorrect', `${answerAnalysis.incorrect}`], ['Unanswered', `${answerAnalysis.unanswered}`]].map(([label, value]) => <div key={label} className="rounded-lg bg-secondary p-4 text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
          </div>)}
        </div>
        <div className="mt-6 space-y-3">
          {answerAnalysis.topics.map((row) => <div key={row.topic} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{row.topic}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {row.correct} of {row.total} correct{row.unanswered > 0 ? ` · ${row.unanswered} left blank` : ''}
                {row.competency ? ` · counts towards ${competencyName(row.competency as CompetencyId)}` : ''}
              </p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{row.percent}%</span>
          </div>)}
        </div>
        <p className="mt-5 text-xs leading-5 text-muted-foreground">
          {answerAnalysis.mostProblematicTopic
            ? `Most of your wrong answers were in ${answerAnalysis.mostProblematicTopic.topic} — ${answerAnalysis.mostProblematicTopic.incorrect} of ${answerAnalysis.mostProblematicTopic.total} questions there went wrong. That is the topic to start with.`
            : 'Nothing went wrong on this paper, so there is no single topic to single out.'}
        </p>
      </Card>}

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
        <p className="mt-4 text-xs leading-5 text-muted-foreground">There is no document behind these scenarios to quote back, so the material for a weak section is the explanation on each question you missed.</p>
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

  if (dealing) return <div className="mx-auto max-w-4xl animate-rise-in"><PageIntro eyebrow="Quarterly competency check" title="Assessment, without the anxiety." description="Dealing a fresh paper. The scenarios and the answer key are held on the server, so your sitting is marked there and not in this tab." /><Card className="p-6 sm:p-10"><div data-testid="assessment-dealing" className="h-5 w-40 animate-pulse rounded bg-secondary" /><div className="mt-8 h-7 w-full animate-pulse rounded bg-secondary" /><div className="mt-3 h-7 w-2/3 animate-pulse rounded bg-secondary" /><div className="mt-8 space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-[58px] w-full animate-pulse rounded-xl bg-secondary" />)}</div></Card></div>;

  if (!paper || !scenario || !section) return <div className="mx-auto max-w-4xl animate-rise-in"><PageIntro eyebrow="Quarterly competency check" title="The paper could not be dealt." description="The assessment is dealt and marked by the server, so this screen needs it. Nothing about your earlier attempts is affected." /><Card className="p-6 sm:p-10"><div className="flex items-start gap-3"><TriangleAlert className="mt-0.5 size-5 shrink-0 text-[#c86c5e]" /><div><p className="text-sm font-semibold text-foreground">What went wrong</p><p data-testid="text-assessment-unavailable" className="mt-1 text-sm leading-6 text-muted-foreground">{dealProblem || 'The assessment API did not answer.'}</p></div></div><div className="mt-7 flex flex-col gap-3 sm:flex-row"><ActionButton onClick={() => void deal()} icon={<RefreshCw className="size-4" />}>Try again</ActionButton><ActionButton variant="outline" onClick={() => setLocation('/assignment')} icon={<ArrowRight className="size-4" />}>Practise from a document instead</ActionButton></div><p className="mt-5 text-xs leading-5 text-muted-foreground">A quiz built from your own PDF is graded in this tab, so it works without the assessment server.</p></Card></div>;

  return <div className="mx-auto max-w-4xl animate-rise-in"><PageIntro eyebrow="Quarterly competency check" title="Assessment, without the anxiety." description={`${paper.length} scenario questions, ${paper.questionsPerSection} for each of the five competencies in the National Competency Framework for official statistics. Marked on the server against a fixed answer key.`} action={<Badge tone="navy"><Clock3 className="size-3.5" /> {clockText(elapsed)} elapsed</Badge>} /><div className="mb-5 flex items-center gap-2">{paper.sections.map((item, i) => <div key={item.competency} className="flex flex-1 items-center gap-2"><div className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${i < sectionOf(paper, step) ? 'bg-primary text-white' : i === sectionOf(paper, step) ? 'bg-accent text-foreground' : 'bg-secondary text-muted-foreground'}`}>{i < sectionOf(paper, step) ? <Check className="size-3.5" /> : i + 1}</div>{i < paper.sections.length - 1 && <div className={`h-px flex-1 ${i < sectionOf(paper, step) ? 'bg-primary' : 'bg-border'}`} />}</div>)}</div><Card className="p-6 sm:p-10"><div className="flex items-center justify-between"><Badge tone="teal">Scenario {step + 1} of {paper.questions.length}</Badge><span className="font-mono text-xs text-muted-foreground">{section.focus}</span></div><h2 className="mt-8 max-w-2xl font-serif text-2xl leading-snug sm:text-3xl">{scenario.q}</h2><div className="mt-8 space-y-3">{scenario.options.map((option, i) => <button key={option.id} data-testid={`button-assessment-option-${i}`} onClick={() => choose(i)} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all ${selected === i ? 'border-primary bg-[#edf7f5] ring-1 ring-primary' : 'border-border hover:border-primary/40 hover:bg-secondary'}`}><span className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${selected === i ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground'}`}>{String.fromCharCode(65 + i)}</span><span className="leading-6">{option.text}</span></button>)}</div><div className="mt-8 flex justify-between border-t border-border pt-5"><button data-testid="button-assessment-back" onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground disabled:opacity-30"><ArrowLeft className="size-4" /> Back</button><ActionButton disabled={selected === null || saving} onClick={() => { if (isLast) void submit(); else goTo(step + 1); }} icon={<ArrowRight className="size-4" />}>{isLast ? (saving ? 'Marking...' : 'Submit assessment') : 'Save & continue'}</ActionButton></div>{saveNote && <p data-testid="text-assessment-submit-problem" className="mt-4 text-sm leading-6 text-[#a34d43]">{saveNote}</p>}</Card><p className="mt-4 text-xs leading-5 text-muted-foreground">{paper.note}</p></div>;
}

export function Learning() {
  const { courses: records, markCourse } = useProgress();
  const [filter, setFilter] = useState<'All' | 'In progress' | 'Completed'>('All');
  const [toast, setToast] = useState('');
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; problem: string; courses: CatalogueCourse[]; available: boolean }>(
    { status: 'loading', problem: '', courses: [], available: false },
  );

  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, status: 'loading', problem: '' }));
    fetchCatalogue()
      .then((data) => { if (live) setState({ status: 'ready', problem: '', courses: data.courses, available: data.available }); })
      .catch((error: unknown) => { if (live) setState({ status: 'error', problem: error instanceof Error ? error.message : 'The course service did not answer.', courses: [], available: false }); });
    return () => { live = false; };
  }, []);

  const doneByCourse = useMemo(() => {
    const map = new Map<string, number>();
    for (const record of records) map.set(record.courseId, record.completedLessons.length);
    return map;
  }, [records]);
  const percentOf = (course: CatalogueCourse) => (course.lessons > 0 ? Math.min(100, Math.round(((doneByCourse.get(course.courseId) ?? 0) / course.lessons) * 100)) : 0);

  const savedIds = useMemo(() => new Set(records.filter((record) => record.saved).map((record) => record.courseId)), [records]);
  const toggleSave = async (courseId: string) => {
    const outcome = await markCourse({ courseId, saved: !savedIds.has(courseId) });
    if (!outcome.saved) setToast(outcome.reason);
  };

  const shown = state.courses.filter((course) => {
    const p = percentOf(course);
    if (filter === 'In progress') return p > 0 && p < 100;
    if (filter === 'Completed') return p === 100;
    return true;
  });

  const started = state.courses.filter((c) => (doneByCourse.get(c.courseId) ?? 0) > 0);
  const pathwayValue = started.length ? Math.round(started.reduce((sum, c) => sum + percentOf(c), 0) / started.length) : 0;
  const milestones: [string, string, number][] = [['01', 'Get started', 1], ['02', 'Building momentum', 40], ['03', 'Most of the way', 75], ['04', 'Pathway complete', 100]];

  return <div className="mx-auto max-w-[1440px] animate-rise-in"><PageIntro eyebrow="Learning intelligence" title="A pathway built around your work." description="Real, openly-licensed courses on your platform — open one, mark lessons done, and your progress is tracked against your account." action={<ActionButton variant="outline" onClick={() => setFilter('All')} icon={<RefreshCw className="size-4" />}>Show all</ActionButton>} /><div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]"><Card className="overflow-hidden bg-sidebar text-sidebar-foreground"><div className="border-b border-sidebar-border p-6"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-accent">Your progress</p><h2 className="mt-2 font-serif text-2xl text-white">Courses you've<br />started</h2></div><Donut value={pathwayValue} color="#c49743" size={82} /></div><p className="mt-5 text-sm leading-6 text-sidebar-foreground/70">{started.length === 0 ? 'Open a course and mark a lesson done to start tracking your completion here.' : `Average completion across the ${started.length} ${started.length === 1 ? 'course' : 'courses'} you've begun.`}</p></div><div className="space-y-0 p-6">{milestones.map(([n, t, threshold], i) => { const done = pathwayValue >= threshold; return <div key={String(n)} className="flex gap-3"><div className="flex flex-col items-center"><div className={`flex size-7 items-center justify-center rounded-full text-[10px] font-bold ${done ? 'bg-accent text-sidebar' : 'border border-sidebar-border text-sidebar-foreground/50'}`}>{done ? <Check className="size-3" /> : n}</div>{i < milestones.length - 1 && <div className={`my-1 h-6 w-px ${done ? 'bg-accent/50' : 'bg-sidebar-border'}`} />}</div><div className="pb-4"><p className={`text-sm font-semibold ${done ? 'text-white' : 'text-sidebar-foreground/50'}`}>{t}</p><p className="mt-1 text-[11px] text-sidebar-foreground/50">{done ? 'Reached' : 'As your completion grows'}</p></div></div>; })}</div><div className="border-t border-sidebar-border p-6"><Link href="/catalog" data-testid="link-learning-catalog" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-sidebar">Browse full catalogue <ArrowRight className="size-4" /></Link></div></Card><div><div className="mb-4 flex items-center justify-between"><div className="flex gap-1 rounded-lg bg-secondary p-1">{(['All', 'In progress', 'Completed'] as const).map((f) => <button key={f} data-testid={`button-filter-${f.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setFilter(f)} aria-pressed={filter === f} className={`rounded-md px-3 py-2 text-xs font-semibold ${filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{f}</button>)}</div><span className="text-xs text-muted-foreground">{shown.length} courses</span></div>
    {state.status === 'loading' && <LoadingBlock label="Loading your courses" />}
    {state.status === 'error' && <EmptyState title="The course service is not answering" description={state.problem} />}
    {state.status === 'ready' && !state.available && <EmptyState title="No course dataset found" description="The downloaded course content is not on this machine yet. Once the Nexora course dataset sits beside the app and the server is restarted, your courses appear here." />}
    {state.status === 'ready' && state.available && <div className="space-y-3">{shown.map((course) => { const done = doneByCourse.get(course.courseId) ?? 0; const progress = percentOf(course); return <Card key={course.courseId} interactive className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#dceeea]"><GraduationCap className="size-6 text-primary/80" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">{course.provider}</p><Badge tone={progress === 100 ? 'teal' : progress > 0 ? 'teal' : 'amber'}>{progress === 100 ? 'Completed' : progress > 0 ? 'In progress' : 'Not started'}</Badge></div><h3 className="mt-1 font-semibold">{course.title}</h3><div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">{course.estimatedHours ? <span className="flex items-center gap-1"><Clock3 className="size-3.5" />{course.estimatedHours} hrs</span> : null}<span className="flex items-center gap-1"><ListChecks className="size-3.5" />{course.lessons} {course.lessons === 1 ? 'lesson' : 'lessons'}</span><span>{course.level}</span></div>{progress > 0 && <div className="mt-3 flex items-center gap-2"><ProgressBar value={progress} className="max-w-[180px] flex-1" /><span className="font-mono text-[10px] text-muted-foreground">{done}/{course.lessons}</span></div>}</div><div className="flex items-center gap-2 sm:flex-col sm:items-end"><button data-testid={`button-save-course-${course.courseId}`} onClick={() => void toggleSave(course.courseId)} aria-label={savedIds.has(course.courseId) ? 'Remove from saved courses' : 'Save this course'} aria-pressed={savedIds.has(course.courseId)} className={`rounded-lg p-2 ${savedIds.has(course.courseId) ? 'text-accent' : 'text-muted-foreground hover:bg-secondary'}`}><Target className="size-4" /></button><Link href={`/catalog/${course.courseId}`} data-testid={`link-course-${course.courseId}`} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">{progress > 0 ? 'Resume' : 'Open'} <ArrowRight className="size-3.5" /></Link></div></Card>; })}</div>}</div></div>{toast && <ToastMessage message={toast} onClose={() => setToast('')} />}</div>;
}

type LibraryFilter = 'all' | 'trending' | CourseCategory;

function costTone(cost: string): 'teal' | 'amber' | 'coral' {
  if (cost === 'Paid') return 'amber';
  if (cost === 'Subscription') return 'coral';
  return 'teal';
}

export function CourseLibrary() {
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const counts = useMemo(() => categoryCounts(), []);
  const trendingCount = useMemo(() => trendingCourses().length, []);
  const shown = filter === 'trending' ? trendingCourses() : coursesInCategory(filter);
  const chips: { id: LibraryFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: courseLibrary.length },
    { id: 'trending', label: 'Trending now', count: trendingCount },
    ...categoryOrder.map((category) => ({ id: category, label: categoryLabels[category], count: counts[category] })),
  ];
  return <div className="mx-auto max-w-[1440px] animate-rise-in"><PageIntro eyebrow="Course library" title="Courses worth your evening, from across the web." description="A hand-picked catalogue of real online courses — engineering, medicine, data science and business — every one at least an hour, linking straight to the provider." action={<ActionButton variant="outline" onClick={() => setFilter('all')} icon={<RefreshCw className="size-4" />}>Reset filters</ActionButton>} /><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-1 rounded-lg bg-secondary p-1">{chips.map((chip) => <button key={chip.id} data-testid={`button-library-filter-${chip.id}`} onClick={() => setFilter(chip.id)} aria-pressed={filter === chip.id} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold ${filter === chip.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{chip.id === 'trending' && <TrendingUp className="size-3.5" />}{chip.label}<span className="font-mono text-[10px] text-muted-foreground">{chip.count}</span></button>)}</div><span className="text-xs text-muted-foreground">{shown.length} {shown.length === 1 ? 'course' : 'courses'}</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{shown.map((course) => <Card key={course.id} interactive className="flex flex-col gap-3 p-5"><div className="flex items-start justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><Badge tone="navy">{categoryLabels[course.category]}</Badge>{course.trending && <Badge tone="amber"><TrendingUp className="size-3" /> Trending</Badge>}</div><span className="shrink-0 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{course.level}</span></div><div className="min-w-0 flex-1"><h3 className="font-semibold leading-snug">{course.title}</h3><p className="mt-1 text-xs text-muted-foreground">{course.provider} · {course.partner}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{course.blurb}</p></div><div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{courseHoursLabel(course.hours)}</span><Badge tone={costTone(course.cost)}>{course.cost}</Badge>{course.certificate && <span className="flex items-center gap-1"><Award className="size-3.5" />Certificate</span>}</div><a href={course.url} target="_blank" rel="noopener noreferrer" data-testid={`link-library-course-${course.id}`} className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90">View course <ArrowUpRight className="size-3.5" /></a></Card>)}</div><p className="mt-6 max-w-3xl text-xs leading-5 text-muted-foreground">{libraryNote}</p></div>;
}

type CatalogueFilter = 'all' | 'technology' | 'medical';

function categoryTone(category: string): 'navy' | 'coral' | 'neutral' {
  const key = category.toLowerCase();
  if (key.startsWith('tech')) return 'navy';
  if (key.startsWith('med')) return 'coral';
  return 'neutral';
}

export function CourseCatalog() {
  const { courses: records } = useProgress();
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; problem: string; courses: CatalogueCourse[]; available: boolean; technology: number; medical: number }>(
    { status: 'loading', problem: '', courses: [], available: false, technology: 0, medical: 0 },
  );
  const [filter, setFilter] = useState<CatalogueFilter>('all');

  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, status: 'loading', problem: '' }));
    fetchCatalogue()
      .then((data) => {
        if (!live) return;
        setState({ status: 'ready', problem: '', courses: data.courses, available: data.available, technology: data.technology, medical: data.medical });
      })
      .catch((error: unknown) => {
        if (!live) return;
        setState({ status: 'error', problem: error instanceof Error ? error.message : 'The course service did not answer.', courses: [], available: false, technology: 0, medical: 0 });
      });
    return () => { live = false; };
  }, []);

  const doneByCourse = useMemo(() => {
    const map = new Map<string, number>();
    for (const record of records) map.set(record.courseId, record.completedLessons.length);
    return map;
  }, [records]);

  const shown = useMemo(() => {
    if (filter === 'technology') return state.courses.filter((c) => c.category.toLowerCase().startsWith('tech'));
    if (filter === 'medical') return state.courses.filter((c) => c.category.toLowerCase().startsWith('med'));
    return state.courses;
  }, [state.courses, filter]);

  const chips: { id: CatalogueFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All courses', count: state.courses.length },
    { id: 'technology', label: 'Technology', count: state.technology },
    { id: 'medical', label: 'Medical & health', count: state.medical },
  ];

  return <div className="mx-auto max-w-[1440px] animate-rise-in">
    <PageIntro eyebrow="Course catalogue" title="Real courses you can open and finish here." description="Openly-licensed course content downloaded to your platform — open a lesson, mark it done, and your completion is tracked against your account." action={<ActionButton variant="outline" onClick={() => setFilter('all')} icon={<RefreshCw className="size-4" />}>Show all</ActionButton>} />
    {state.status === 'loading' && <LoadingBlock label="Loading the course catalogue" />}
    {state.status === 'error' && <EmptyState title="The course service is not answering" description={state.problem} />}
    {state.status === 'ready' && !state.available && <EmptyState title="No course dataset found" description="The downloaded course content is not on this machine yet. Once the Nexora course dataset sits beside the app and the server is restarted, every course appears here." />}
    {state.status === 'ready' && state.available && <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg bg-secondary p-1">{chips.map((chip) => <button key={chip.id} data-testid={`button-catalog-filter-${chip.id}`} onClick={() => setFilter(chip.id)} aria-pressed={filter === chip.id} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold ${filter === chip.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{chip.label}<span className="font-mono text-[10px] text-muted-foreground">{chip.count}</span></button>)}</div>
        <span className="text-xs text-muted-foreground">{shown.length} {shown.length === 1 ? 'course' : 'courses'}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{shown.map((course) => {
        const done = doneByCourse.get(course.courseId) ?? 0;
        const percent = course.lessons > 0 ? Math.min(100, Math.round((done / course.lessons) * 100)) : 0;
        return <Card key={course.courseId} interactive className="flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2"><Badge tone={categoryTone(course.category)}>{course.category || 'Course'}</Badge>{percent === 100 && <Badge tone="teal"><Check className="size-3" /> Complete</Badge>}</div>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{course.level}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold leading-snug">{course.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{course.provider}</p>
            {course.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{course.description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {course.estimatedHours ? <span className="flex items-center gap-1"><Clock3 className="size-3.5" />{course.estimatedHours} hrs</span> : null}
            <span className="flex items-center gap-1"><ListChecks className="size-3.5" />{course.lessons} {course.lessons === 1 ? 'lesson' : 'lessons'}</span>
          </div>
          <div className="flex items-center gap-2"><ProgressBar value={percent} className="flex-1" /><span className="font-mono text-[10px] text-muted-foreground">{done}/{course.lessons}</span></div>
          <Link href={`/catalog/${course.courseId}`} data-testid={`link-catalog-course-${course.courseId}`} className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#245b62]">{percent > 0 ? 'Resume course' : 'Open course'} <ArrowRight className="size-3.5" /></Link>
        </Card>;
      })}</div>
      <p className="mt-6 max-w-3xl text-xs leading-5 text-muted-foreground">Every course here is real content downloaded under an open licence. NEXORA AI hosts the files it was allowed to redistribute and links to the source for the rest; your completion percentage is measured from the lessons you mark done.</p>
    </>}
  </div>;
}

export function CatalogCourse() {
  const { id } = useParams<{ id: string }>();
  const { courseFor, markCourse, live } = useProgress();
  const [course, setCourse] = useState<DatasetCourseDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [problem, setProblem] = useState('');
  const [toast, setToast] = useState('');
  const [reading, setReading] = useState<CourseLesson | null>(null);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setProblem('');
    fetchCourse(id)
      .then((data) => { if (alive) { setCourse(data); setStatus('ready'); } })
      .catch((error: unknown) => { if (alive) { setStatus('error'); setProblem(error instanceof Error ? error.message : 'This course could not be loaded.'); } });
    return () => { alive = false; };
  }, [id]);

  const record = course ? courseFor(course.courseId) : null;
  const completed = record?.completedLessons ?? [];
  const percent = course ? completionPercent(course.lessonIds, completed) : 0;
  const doneCount = course ? completedCount(course.lessonIds, completed) : 0;
  const doneSet = useMemo(() => new Set(completed), [completed]);

  async function completeLesson(lessonId: string) {
    if (!course || doneSet.has(lessonId)) return;
    const next = new Set(course.lessonIds.filter((lid) => doneSet.has(lid)));
    next.add(lessonId);
    const outcome = await markCourse({ courseId: course.courseId, started: true, completedLessons: [...next] });
    if (!outcome.saved) setToast(outcome.reason);
  }

  if (status === 'loading') return <div className="mx-auto max-w-5xl animate-rise-in"><Link href="/catalog" data-testid="link-back-catalog" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-3.5" /> Back to catalogue</Link><LoadingBlock label="Opening course" /></div>;
  if (status === 'error' || !course) return <div className="mx-auto max-w-5xl animate-rise-in"><Link href="/catalog" data-testid="link-back-catalog" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-3.5" /> Back to catalogue</Link><EmptyState title="Course unavailable" description={problem || 'No such course.'} /></div>;

  return <div className="mx-auto max-w-5xl animate-rise-in">
    <Link href="/catalog" data-testid="link-back-catalog" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-3.5" /> Back to catalogue</Link>
    <Card className="overflow-hidden">
      <div className="relative bg-secondary px-6 py-12 sm:px-12">
        <div className="flex flex-wrap items-center gap-2"><Badge tone={categoryTone(course.category)}>{course.category || 'Course'}</Badge>{course.level && <Badge tone="neutral">{course.level}</Badge>}{percent === 100 && <Badge tone="teal"><Check className="size-3" /> Complete</Badge>}</div>
        <h1 className="mt-4 max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">{course.title}</h1>
        {course.description && <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{course.description}</p>}
        <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1"><Globe className="size-4" />{course.provider}</span>
          {course.estimatedHours ? <span className="flex items-center gap-1"><Clock3 className="size-4" />{course.estimatedHours} hrs</span> : null}
          <span className="flex items-center gap-1"><ListChecks className="size-4" />{course.lessons} lessons · {course.modules.length} modules</span>
        </div>
      </div>
      <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_280px]">
        <div>
          <h2 className="font-serif text-2xl">Course outline</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Open a lesson to read the real material in the app. Each one marks itself done once you have read to the end — your completion below is measured from the lessons you have actually read.</p>
          <div className="mt-5 space-y-6">{course.modules.map((module, mi) => <div key={module.moduleId || mi}>
            <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{String(mi + 1).padStart(2, '0')}</span><h3 className="text-sm font-semibold">{module.title || `Module ${mi + 1}`}</h3></div>
            <div className="mt-3 divide-y divide-border rounded-xl border border-border">{module.lessons.map((lesson) => {
              const isDone = doneSet.has(lesson.lessonId);
              return <div key={lesson.lessonId} className="flex items-center gap-3 p-3.5">
                <span aria-hidden className={`flex size-6 shrink-0 items-center justify-center rounded-md border ${isDone ? 'border-primary bg-primary text-white' : 'border-border text-transparent'}`}><Check className="size-3.5" /></span>
                <div className="min-w-0 flex-1"><p className={`truncate text-sm font-semibold ${isDone ? 'text-muted-foreground' : ''}`}>{lesson.title || lesson.lessonId}</p><p className="text-[11px] text-muted-foreground">{lesson.estimatedMinutes ? `${lesson.estimatedMinutes} min · ` : ''}{lesson.type}{isDone ? ' · Read' : ''}</p></div>
                {lesson.hasContent ? <button onClick={() => setReading(lesson)} data-testid={`button-lesson-open-${lesson.lessonId}`} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-secondary">{isDone ? 'Re-read' : 'Read'} <ArrowRight className="size-3.5" /></button> : lesson.sourceUrl ? <a href={lesson.sourceUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-lesson-source-${lesson.lessonId}`} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary">Source <ArrowUpRight className="size-3.5" /></a> : <span className="shrink-0 text-[11px] text-muted-foreground">No file</span>}
              </div>;
            })}</div>
          </div>)}</div>
        </div>
        <aside>
          <div className="sticky top-24 rounded-xl border border-border bg-secondary p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Your progress</p>
            <div className="mt-4 flex items-center gap-4"><Donut value={percent} size={74} /><div><p className="font-semibold">{percent}% complete</p><p className="mt-1 text-xs text-muted-foreground">{doneCount} of {course.lessonIds.length} lessons</p></div></div>
            <ProgressBar value={percent} className="mt-5" />
            {!live && <p className="mt-4 text-xs leading-5 text-muted-foreground">Sign in with the server running to save your progress. You can still open every lesson.</p>}
            {course.officialUrl && <a href={course.officialUrl} target="_blank" rel="noopener noreferrer" data-testid="link-course-source" className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-semibold text-primary hover:bg-card"><Globe className="size-3.5" /> Source & licence</a>}
            {course.license && <p className="mt-3 text-center text-[10px] text-muted-foreground">Licence: {course.license}</p>}
          </div>
        </aside>
      </div>
    </Card>
    {reading && <LessonReader
      courseId={course.courseId}
      lessonId={reading.lessonId}
      title={reading.title || reading.lessonId}
      contentFile={reading.contentFile}
      sourceUrl={reading.sourceUrl}
      alreadyDone={doneSet.has(reading.lessonId)}
      onComplete={(lessonId) => { void completeLesson(lessonId); }}
      onClose={() => setReading(null)}
    />}
    {toast && <ToastMessage message={toast} onClose={() => setToast('')} />}
  </div>;
}

const stageOrder = ['reading', 'classifying', 'topics', 'questions', 'checking'] as const;
type Stage = (typeof stageOrder)[number];

const stageLabels: Record<Stage, string> = {
  reading: 'Reading document',
  classifying: 'Identifying document type',
  topics: 'Understanding topics',
  questions: 'Writing questions with AI',
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
  askedAt: number;
  classification: MaterialClassification | null;
  ocrActive?: boolean;
};

function progressFor(work: Work): number {
  if (work.stage === 'reading') return work.pageCount > 0 ? Math.round(4 + (38 * work.pagesRead) / work.pageCount) : 4;
  if (work.stage === 'classifying') return 46;
  if (work.stage === 'topics') return 52;
  if (work.stage === 'questions') return 60;
  if (work.stage === 'checking') return 90;
  return 100;
}

const paint = () => new Promise<void>((resolve) => { setTimeout(resolve, 0); });

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
}

const maxMaterialSize = formatFileSize(MAX_MATERIAL_BYTES);

function LargePdfPanel({ document, initialDifficulty, initialCount, onDiscard }: {
  document: DocumentRecord;
  initialDifficulty: Difficulty;
  initialCount: number;
  onDiscard: () => void;
}) {
  const [, setLocation] = useLocation();
  const [topic, setTopic] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchPreview | null>(null);
  const [searchError, setSearchError] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [count, setCount] = useState(initialCount);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const pagesText = (ranges?: { start: number; end: number }[]) =>
    (ranges ?? []).map((r) => (r.start === r.end ? `${r.start}` : `${r.start}–${r.end}`)).join(', ');

  const runSearch = async () => {
    const query = topic.trim();
    if (query === '') return;
    setSearching(true); setSearchError(''); setResult(null); setGenError('');
    try {
      setResult(await searchDocument(document.id, query));
    } catch (failure) {
      setSearchError(failure instanceof DocumentError ? failure.message : 'The search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const runGenerate = async () => {
    const query = topic.trim();
    if (query === '' || !result?.topicFound) return;
    setGenerating(true); setGenError('');
    try {
      const gen = await generateFromTopic({ documentId: document.id, query, questionCount: count, difficulty, documentTitle: document.title });
      if (gen.questions.length === 0) throw new DocumentError('No gradeable questions could be built for this topic. Try a broader topic.', 'no_questions');
      setMaterial({
        fileName: `${document.title} — ${query}`,
        fileSize: 0,
        fileType: 'book',
        pageCount: document.pageCount,
        concepts: result.sections ?? [],
        topics: gen.topics,
        questions: gen.questions,
        createdAt: new Date().toISOString(),
        isSample: false,
      });
      setLocation('/assignment/quiz');
    } catch (failure) {
      const produced = (failure as any)?.payload?.questions?.length ?? 0;
      setGenError(failure instanceof DocumentError
        ? `${failure.message}${produced > 0 ? ` (${produced} grounded questions are available for this topic.)` : ''}`
        : 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return <Card className="p-6 sm:p-10">
    <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#dceeea]"><FileCheck2 className="size-6 text-primary" /></div><div className="min-w-0"><p className="truncate font-semibold">{document.title}</p><p className="mt-1 text-xs text-muted-foreground">Large document · {document.pageCount} pages · indexed into {document.chunkCount} sections</p></div></div>
      <div className="flex shrink-0 items-center gap-2"><Badge tone="navy">Large document</Badge><button onClick={onDiscard} aria-label="Discard document" className="rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-[#a34d43]"><X className="size-4" /></button></div>
    </div>

    <div className="py-7">
      <p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Search this book</p>
      <h2 className="mt-2 font-serif text-2xl">What do you want to learn?</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Nexora will search the book and use only the relevant sections — the whole book is never sent to the AI. Try a topic, concept, or chapter.</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input data-testid="input-topic-search" aria-label="Search topic" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void runSearch(); }} placeholder="e.g. TCP congestion control" className="flex-1 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
        <ActionButton onClick={() => void runSearch()} disabled={searching || topic.trim() === ''} icon={<Target className="size-4" />}>{searching ? 'Searching…' : 'Search topic'}</ActionButton>
      </div>
      {searchError && <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg border border-[#eac3bd] bg-[#fff2ef] px-4 py-3 text-sm text-[#a34d43]"><X className="size-4 shrink-0" />{searchError}</div>}
    </div>

    {result && !result.topicFound && <div className="rounded-xl border border-[#eddcb4] bg-[#fdf6e6] p-5 text-sm leading-6 text-[#8a6319]">
      <p className="font-semibold">Topic not found</p>
      <p className="mt-1">We couldn't find enough relevant content for “{topic.trim()}”. Try another keyword, a broader topic, or a related concept.</p>
      {(result.suggestions?.length ?? 0) > 0 && <div className="mt-3"><p className="text-xs font-semibold uppercase tracking-[.1em]">Sections in this book</p><div className="mt-2 flex flex-wrap gap-2">{result.suggestions!.map((s) => <button key={s} onClick={() => setTopic(s)} className="rounded-full border border-[#e2cd9a] bg-white/60 px-3 py-1 text-xs text-[#8a6319] hover:bg-white">{s}</button>)}</div></div>}
    </div>}

    {result && result.topicFound && <div className="rounded-xl border border-border">
      <div className="border-b border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Topic found</p><h3 className="mt-1 font-serif text-xl capitalize">{topic.trim()}</h3></div><Badge tone="teal">{result.found} relevant {result.found === 1 ? 'section' : 'sections'}</Badge></div>
        {(result.pageRanges?.length ?? 0) > 0 && <p className="mt-2 text-xs text-muted-foreground">Source pages: {pagesText(result.pageRanges)}</p>}
        {(result.sections?.length ?? 0) > 0 && <div className="mt-3 flex flex-wrap gap-2">{result.sections!.slice(0, 8).map((s) => <span key={s} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">{s}</span>)}</div>}
        {(result.preview?.length ?? 0) > 0 && <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{result.preview![0].snippet}…</p>}
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-2">
        <div><p className="mb-2 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Difficulty</p><div className="grid grid-cols-3 gap-1.5">{(['easy', 'medium', 'hard'] as const).map((level) => <button key={level} type="button" data-testid={`button-large-difficulty-${level}`} onClick={() => setDifficulty(level)} className={`rounded-lg border px-2 py-2 text-xs font-semibold capitalize transition-colors ${difficulty === level ? 'border-primary bg-primary text-white' : 'border-border bg-card text-muted-foreground hover:bg-secondary'}`}>{level}</button>)}</div></div>
        <div><p id="large-qcount-label" className="mb-2 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">How many questions</p><select data-testid="select-large-question-count" aria-labelledby="large-qcount-label" value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary">{[5, 8, 10, 12, 15, 20].map((n) => <option key={n} value={n}>{n} questions</option>)}</select></div>
      </div>
      <div className="border-t border-border p-5">
        <ActionButton className="w-full" onClick={() => void runGenerate()} disabled={generating} icon={<Sparkles className="size-4" />}>{generating ? 'Generating…' : `Generate ${count} MCQs`}</ActionButton>
        {genError && <div role="alert" className="mt-3 rounded-lg border border-[#eddcb4] bg-[#fdf6e6] px-4 py-3 text-sm leading-6 text-[#8a6319]">{genError}</div>}
      </div>
    </div>}
  </Card>;
}

export function Materials() {
  const [, setLocation] = useLocation();
  const material = useMaterial();
  const [work, setWork] = useState<Work | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [count, setCount] = useState(TARGET_QUESTIONS);
  const [classification, setClassification] = useState<MaterialClassification | null>(null);
  const [largeDoc, setLargeDoc] = useState<DocumentRecord | null>(null);
  const [preparing, setPreparing] = useState<{ sent: number; total: number; stage: string } | null>(null);
  const [savedPapers, setSavedPapers] = useState<SavedPaperSummary[] | null>(null);
  const [savingPaper, setSavingPaper] = useState(false);
  const [busyPaperId, setBusyPaperId] = useState('');
  const [paperError, setPaperError] = useState('');
  const [confirmingPaperDelete, setConfirmingPaperDelete] = useState('');
  const [, setTick] = useState(0);
  const waiting = work?.stage === 'questions';
  useEffect(() => {
    if (!waiting) return;
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [waiting]);

  const startProcessing = async (
    meta: { fileName: string; fileSize: number; fileType: string; isSample: boolean },
    read: (onPage: PageProgress) => Promise<{ text: string; pageCount: number; pages?: PageText[] }>,
  ) => {
    setError('');
    setShowQuestions(false);
    setConfirmingDiscard(false);
    setClassification(null);
    setLargeDoc(null);
    setPreparing(null);
    setWork({ ...meta, stage: 'reading', pagesRead: 0, pageCount: 0, conceptCount: 0, questionCount: 0, askedAt: 0, classification: null });
    const advance = async (stage: Stage, extra?: Partial<Work>) => {
      setWork((previous) => (previous ? { ...previous, ...extra, stage } : previous));
      await paint();
    };
    try {
      await paint();
      const { text, pageCount, pages: pageList } = await read((pagesRead, totalPages) => {
        setWork((previous) => (previous ? { ...previous, pagesRead, pageCount: totalPages } : previous));
      });

      try {
        const verdict = await guardMaterial({ text, filename: meta.fileName, pageCount });
        if (verdict.decision === 'reject') {
          setWork(null);
          setPreparing(null);
          setError(verdict.message
            ?? 'This file could not be verified as study material. Please upload a textbook, lecture notes, course material, research paper, or other educational document.');
          return;
        }
      } catch {
        // Could not reach the guard (network / rate-limit / auth). The server enforces the
        // same policy at finalize and generate, so nothing rejected slips past; proceed.
      }

      if (pageList && isLargeDocument(pageCount, text.length)) {
        setWork(null);
        setPreparing({ sent: 0, total: pageCount, stage: 'uploading' });
        const ingest = await ingestLargeDocument(
          { filename: meta.fileName, sizeBytes: meta.fileSize, pages: pageList },
          (sent, total, stage) => setPreparing({ sent, total, stage }),
        );
        setPreparing(null);
        setLargeDoc(ingest.document);
        return;
      }

      await advance('classifying');
      const classification = await classifyDocument(text);
      setClassification(classification);
      await advance('topics', { pageCount, classification });
      const concepts = extractConcepts(text);
      const topics = extractTopics(sentenceList(text));
      await advance('questions', { conceptCount: concepts.length, askedAt: Date.now() });

      const generated = await generateAiQuestions({ text, topics, concepts, questionCount: count, difficulty });

      await advance('checking');
      const seen = new Set<string>();
      const checked = generated.questions.filter((question) => {
        if (question.correct < 0 || question.correct >= question.a.length) return false;
        const stem = question.q.toLowerCase();
        if (seen.has(stem)) return false;
        seen.add(stem);
        return true;
      });
      if (checked.length === 0) {
        throw new Error('The questions that came back could not be checked against this document. Please try again.');
      }
      const scored = generated.topics.filter((topic) => checked.some((question) => question.topic === topic));
      setWork((previous) => (previous ? { ...previous, questionCount: checked.length } : previous));
      await paint();
      setMaterial({ ...meta, pageCount, concepts, topics: scored, questions: checked, createdAt: new Date().toISOString() });
      setWork(null);
    } catch (failure) {
      setWork(null);
      setPreparing(null);
      if (failure instanceof DocumentError) {
        setError(failure.message);
        return;
      }
      if (failure instanceof AiGenerationError) {
        setError(failure.produced > 0
          ? `${failure.message} (${failure.produced} of the ${MIN_QUESTIONS} needed were usable.)`
          : failure.message);
        return;
      }
      setError(failure instanceof Error ? failure.message : 'The document could not be read. Please try another file.');
    }
  };

  const handleFile = (file: File) => {
    setError('');
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
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
      async (onPage) => {
        let ocr: OcrPageFn | undefined;
        let vision: VisionPageFn | undefined;
        if (extension === 'pdf') {
          const [ocrHealth, visionHealth] = await Promise.all([checkOcrAvailable(), checkVisionAvailable()]);
          if (ocrHealth.available) ocr = createOcrTransport();
          if (visionHealth.available) vision = createVisionTransport();
        }
        return readMaterialWithPages(file, onPage, {
          ocr,
          vision,
          onOcr: () => setWork((previous) => (previous ? { ...previous, ocrActive: true } : previous)),
          onVision: () => setWork((previous) => (previous ? { ...previous, ocrActive: true } : previous)),
        });
      },
    );
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) handleFile(file);
  };

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
    setLargeDoc(null);
    setPreparing(null);
  };

  useEffect(() => {
    let cancelled = false;
    listPapers()
      .then((papers) => {
        if (!cancelled) setSavedPapers(papers);
      })
      .catch(() => {
        /* Signed out or unreachable: the section stays hidden. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveCurrentPaper = async () => {
    if (!material || savingPaper || material.savedPaperId) return;
    setSavingPaper(true);
    setPaperError('');
    try {
      const paper = await savePaper({ title: material.fileName, difficulty, questions: material.questions });
      setMaterial({ ...material, savedPaperId: paper.id });
      setSavedPapers((previous) => [paper, ...(previous ?? []).filter((item) => item.id !== paper.id)]);
    } catch (problem) {
      setPaperError(problem instanceof PaperError ? problem.message : 'The set could not be saved. Please try again.');
    } finally {
      setSavingPaper(false);
    }
  };

  const openSavedPaper = async (id: string) => {
    if (busyPaperId !== '') return;
    setBusyPaperId(id);
    setPaperError('');
    try {
      const paper = await getPaper(id);
      setMaterial({
        fileName: paper.title,
        fileSize: 0,
        fileType: 'saved',
        pageCount: 0,
        concepts: [],
        topics: paper.topics,
        questions: paper.questions,
        createdAt: paper.createdAt,
        isSample: false,
        savedPaperId: paper.id,
      });
      setWork(null);
      setShowQuestions(false);
      setConfirmingDiscard(false);
      setError('');
      setLocation('/assignment/quiz');
    } catch (problem) {
      setPaperError(problem instanceof PaperError ? problem.message : 'That set could not be opened.');
    } finally {
      setBusyPaperId('');
    }
  };

  const removeSavedPaper = async (id: string) => {
    if (busyPaperId !== '') return;
    setBusyPaperId(id);
    setPaperError('');
    try {
      await deletePaper(id);
      setSavedPapers((previous) => (previous ?? []).filter((item) => item.id !== id));
      setConfirmingPaperDelete('');
    } catch (problem) {
      setPaperError(problem instanceof PaperError ? problem.message : 'That set could not be deleted.');
    } finally {
      setBusyPaperId('');
    }
  };

  const stageIndex = work ? stageOrder.indexOf(work.stage) : -1;
  const progress = work ? progressFor(work) : 0;
  const stageLabel = work
    ? (work.stage === 'reading' && work.ocrActive ? 'Reading scanned content' : stageLabels[work.stage])
    : '';
  const waitSeconds = work && work.stage === 'questions' && work.askedAt > 0
    ? Math.floor((Date.now() - work.askedAt) / 1000)
    : 0;
  const perTopic = material
    ? material.topics.map((topic) => ({ topic, count: material.questions.filter((question) => question.topic === topic).length }))
    : [];

  return <div className="mx-auto max-w-5xl animate-rise-in">
     <PageIntro eyebrow="Assignment · AI question generation" title="Turn a brief into an assignment." description="Upload a work material and NEXORA AI will extract selectable text in your browser, identify concepts, then write a grounded practice set with AI on the server." action={<Badge tone="navy"><LockKeyhole className="size-3.5" /> Provider key stays on the server</Badge>} />
    {!work && !material && !largeDoc && !preparing && <Card className="p-6 sm:p-10">
      <div onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${isDragging ? 'border-primary bg-[#e3f3ef]' : 'border-[#a9cdca] bg-[#f0f8f6]'}`}>
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#d9ece8] text-primary"><UploadCloud className="size-7" /></div>
        <h2 className="mt-5 font-serif text-2xl">Drop a material here</h2>
         <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Choose a text-based {supportedFormatsSentence} up to {maxMaterialSize}. The file itself is read in this browser; only the text it contains is sent to the NEXORA AI server to write questions.</p>
        <div className="mx-auto mt-6 grid max-w-md gap-4 text-left sm:grid-cols-2">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Difficulty</p>
            <div className="grid grid-cols-3 gap-1.5">{(['easy', 'medium', 'hard'] as const).map((level) => <button key={level} type="button" data-testid={`button-difficulty-${level}`} onClick={() => setDifficulty(level)} className={`rounded-lg border px-2 py-2 text-xs font-semibold capitalize transition-colors ${difficulty === level ? 'border-primary bg-primary text-white' : 'border-border bg-card text-muted-foreground hover:bg-secondary'}`}>{level}</button>)}</div>
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">How many questions</p>
            <select data-testid="select-question-count" value={count} onChange={(event) => setCount(Number(event.target.value))} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">{[5, 8, 10, 12, 15, 20].map((n) => <option key={n} value={n}>{n} questions</option>)}</select>
          </div>
        </div>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#f7ebd1]"><FileCheck2 className="size-6 text-[#8a6319]" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{work.fileName}</p><p className="mt-1 text-xs text-muted-foreground">{work.fileType.toUpperCase()} · {formatFileSize(work.fileSize)} · {stageLabel}...</p></div><Badge tone="amber">Processing</Badge></div>
      <div className="mt-8 space-y-3"><ProgressBar value={progress} color="bg-accent" /><div className="flex justify-between font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground"><span>{stageLabel}{waitSeconds > 0 ? ` · ${waitSeconds}s elapsed` : ''}</span><span>{progress}%</span></div></div>
      {work.classification && <div className={`mt-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-6 ${work.classification.suitable ? 'border-[#b8d8c9] bg-[#eaf5ee] text-[#1a5c3a]' : 'border-[#eac3bd] bg-[#fff2ef] text-[#a34d43]'}`}><span className="mt-0.5 shrink-0 font-mono text-[10px] uppercase tracking-[.12em]">{work.classification.label}</span><div className="flex-1"><p className="font-semibold">{work.classification.reason}</p>{work.classification.summary && <p className="mt-1 text-xs opacity-80">{work.classification.summary}</p>}{work.classification.topics.length > 0 && <p className="mt-1 text-xs opacity-70">Topics: {work.classification.topics.join(', ')}</p>}{!work.classification.suitable && <p className="mt-2 text-xs font-medium">{work.classification.advice}</p>}</div></div>}
       <div className="mt-8 grid gap-3 sm:grid-cols-3">{['Document text', 'Key terms', 'Question blueprint'].map((t, i) => <div key={t} className="rounded-lg border border-border p-4"><div className="mb-4 h-2 w-2/3 animate-pulse rounded bg-secondary" /><p className="text-xs text-muted-foreground">{t}</p><p className="mt-1 text-sm font-semibold">{i === 0 ? (stageIndex > 0 ? `Text extracted · ${work.pageCount} ${work.pageCount === 1 ? 'page' : 'pages'}` : work.pagesRead > 0 ? `${work.pagesRead} of ${work.pageCount} pages read` : 'Working...') : i === 1 ? (stageIndex > 2 ? `${work.conceptCount} concepts found` : 'Working...') : work.questionCount > 0 ? `${work.questionCount} questions ready` : 'Working...'}</p></div>)}</div>
    </Card>}
    {preparing && <Card className="p-6 sm:p-10">
      <div className="flex items-center gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#f7ebd1]"><FileCheck2 className="size-6 text-[#8a6319]" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold">Preparing your book</p><p className="mt-1 text-xs text-muted-foreground">{preparing.stage === 'indexing' ? 'Chunking and indexing the document…' : `Uploading pages · ${preparing.sent} of ${preparing.total}`}</p></div><Badge tone="amber">Working</Badge></div>
      <div className="mt-8 space-y-3"><ProgressBar value={preparing.total > 0 ? Math.round((preparing.sent / preparing.total) * (preparing.stage === 'indexing' ? 100 : 90)) : 10} color="bg-accent" /><p className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{preparing.stage === 'indexing' ? 'Building document index' : 'Uploading in small batches — the whole book is never sent at once'}</p></div>
    </Card>}
    {largeDoc && !material && !preparing && <LargePdfPanel document={largeDoc} initialDifficulty={difficulty} initialCount={count} onDiscard={discard} />}
    {!work && material && <Card className="p-6 sm:p-10">
       <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center"><div className="flex min-w-0 items-center gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#dceeea]"><CheckCircle2 className="size-6 text-primary" /></div><div className="min-w-0"><p className="truncate font-semibold">{material.fileName}</p><p className="mt-1 text-xs text-muted-foreground">{material.fileSize === 0 && material.savedPaperId ? `Reopened from your saved sets · ${material.questions.length} questions · ${material.topics.length} topics` : <>Read in this browser · {formatFileSize(material.fileSize)} · {material.pageCount} {material.pageCount === 1 ? 'page' : 'pages'} · {material.concepts.length} concepts identified</>}</p></div></div><div className="flex shrink-0 flex-wrap items-center gap-2">       {material.isSample && <Badge tone="amber">{sampleMaterialLabel}</Badge>}<Badge tone="teal">Ready to practise</Badge></div></div>
       {classification && <div className={`mt-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-6 ${classification.suitable ? 'border-[#b8d8c9] bg-[#eaf5ee] text-[#1a5c3a]' : 'border-[#eac3bd] bg-[#fff2ef] text-[#a34d43]'}`}><span className="mt-0.5 shrink-0 font-mono text-[10px] uppercase tracking-[.12em]">{classification.label}</span><div className="flex-1"><p className="font-semibold">{classification.reason}</p>{classification.summary && <p className="mt-1 text-xs opacity-80">{classification.summary}</p>}{classification.topics.length > 0 && <p className="mt-1 text-xs opacity-70">Topics: {classification.topics.join(', ')}</p>}{!classification.suitable && <p className="mt-2 text-xs font-medium">{classification.advice}</p>}</div></div>}
       <div className="grid gap-5 py-7 lg:grid-cols-[1fr_260px]"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Extracted intelligence</p><h2 className="mt-2 font-serif text-2xl">Your briefing, made queryable.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Text was extracted from your file in this browser. The questions were then written by AI on the NEXORA AI server, and each one was checked back against a sentence in your document before it was accepted.</p><div className="mt-5 flex flex-wrap gap-2">{material.concepts.map((concept) => <span key={concept} className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground">{concept}</span>)}</div></div><div className="rounded-xl bg-secondary p-5"><p className="text-xs text-muted-foreground">Generated set</p><p className="mt-2 font-serif text-3xl">{material.questions.length} MCQs</p><p className="mt-1 text-xs text-muted-foreground">Every question quotes a sentence from this material, and the quote was verified against it.</p><ActionButton className="mt-4 w-full" onClick={() => setLocation('/assignment/quiz')} icon={<ArrowRight className="size-4" />}>Open generated quiz</ActionButton>{material.savedPaperId ? <p data-testid="text-paper-saved" className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-xs font-semibold text-primary"><Check className="size-3.5" /> Saved to your account</p> : <button data-testid="button-save-paper" onClick={saveCurrentPaper} disabled={savingPaper} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-xs font-semibold transition-colors hover:bg-secondary disabled:opacity-60"><Download className="size-3.5" /> {savingPaper ? 'Saving…' : 'Save this set'}</button>}{paperError !== '' && <p data-testid="text-paper-error" className="mt-2 rounded-lg border border-[#eac3bd] bg-[#fff2ef] p-2.5 text-[11px] leading-5 text-[#a34d43]">{paperError}</p>}{confirmingDiscard ? <div className="mt-3 rounded-lg border border-[#eac3bd] bg-[#fff2ef] p-3"><p className="text-xs leading-5 text-[#a34d43]">Discard this {material.questions.length}-question paper? Rebuilding it needs the file again.</p><div className="mt-3 flex gap-2"><button data-testid="button-confirm-discard-material" onClick={discard} className="flex-1 rounded-lg bg-[#a34d43] py-2 text-xs font-semibold text-white">Discard</button><button data-testid="button-cancel-discard-material" onClick={() => setConfirmingDiscard(false)} className="flex-1 rounded-lg border border-border bg-card py-2 text-xs font-semibold">Keep it</button></div></div> : <button data-testid="button-upload-another-material" onClick={() => setConfirmingDiscard(true)} className="mt-3 w-full py-2 text-xs font-semibold text-primary hover:underline">Upload another material</button>}{!isDurable() && <p className="mt-3 text-[11px] leading-5 text-muted-foreground">Tab storage is blocked in this browser, so the paper is held in memory only and a reload will lose it.</p>}</div></div>
       {material.questions.length < MIN_QUESTIONS && <div role="status" className="mb-6 flex items-start gap-2 rounded-lg border border-[#eddcb4] bg-[#fdf6e6] px-4 py-3 text-sm leading-6 text-[#8a6319]"><TriangleAlert className="mt-0.5 size-4 shrink-0" /><span>This material yielded {material.questions.length} questions, fewer than the {MIN_QUESTIONS} a full check uses. A longer, more prose-heavy document produces more.</span></div>}
       <div className="border-t border-border pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Scored topics</p><h3 className="mt-2 font-serif text-xl">What this paper will measure</h3></div><button data-testid="button-toggle-material-questions" onClick={() => setShowQuestions(!showQuestions)} className="text-xs font-semibold text-primary hover:underline">{showQuestions ? 'Hide the questions' : 'Show the questions'} <ArrowRight className="ml-1 inline size-3" /></button></div>
        <div className="mt-4 divide-y divide-border rounded-xl border border-border">{perTopic.map(({ topic, count }) => <div key={topic} className="flex items-center gap-3 p-4"><ListChecks className="size-4 shrink-0 text-primary" /><span className="flex-1 text-sm font-semibold">{topic}</span><span className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{count} {count === 1 ? 'question' : 'questions'}</span></div>)}</div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Each topic is rated on its own once it has at least {MIN_QUESTIONS_FOR_BAND} answered questions, so the result tells you which topics to revise rather than one overall mark.</p>
        {showQuestions && <div className="mt-5 space-y-3">{material.questions.map((question, index) => <div key={question.q} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, '0')}</span><Badge>{questionKindLabels[question.kind]}</Badge><span className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">{question.topic}</span></div><p className="mt-2 text-sm leading-6">{question.q}</p></div>)}<p className="text-xs leading-5 text-muted-foreground">The options and the answer key stay hidden until the check starts, so reading this list cannot give the answers away.</p></div>}
       </div>
    </Card>}
    {savedPapers !== null && <Card className="mt-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Saved to your account</p>
          <h2 className="mt-2 font-serif text-xl">Your question sets</h2>
        </div>
        <p className="text-xs text-muted-foreground">{savedPapers.length} of {MAX_SAVED_PAPERS} kept</p>
      </div>
      {savedPapers.length === 0
        ? <p data-testid="text-no-saved-papers" className="mt-4 rounded-xl bg-secondary p-4 text-sm leading-6 text-muted-foreground">Nothing saved yet. Generate a set and press <b className="font-semibold text-foreground">Save this set</b> to keep its questions, answers and explanations here.</p>
        : <>
          <div data-testid="list-saved-papers" className="mt-4 divide-y divide-border rounded-xl border border-border">{savedPapers.map((paper) => <div key={paper.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{paper.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{paper.count} questions{paper.difficulty === '' ? '' : ` · ${paper.difficulty}`} · saved {longDate(paper.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button data-testid={`button-open-paper-${paper.id}`} onClick={() => void openSavedPaper(paper.id)} disabled={busyPaperId !== ''} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-secondary disabled:opacity-60">{busyPaperId === paper.id ? 'Opening…' : 'Open'}</button>
                <button data-testid={`button-delete-paper-${paper.id}`} onClick={() => setConfirmingPaperDelete(paper.id)} disabled={busyPaperId !== ''} aria-label="Delete saved set" className="rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-[#a34d43] disabled:opacity-60"><X className="size-4" /></button>
              </div>
            </div>
            {paper.topics.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{paper.topics.slice(0, 6).map((topic) => <span key={topic} className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">{topic}</span>)}</div>}
            {confirmingPaperDelete === paper.id && <div className="mt-3 rounded-lg border border-[#eac3bd] bg-[#fff2ef] p-3">
              <p className="text-xs leading-5 text-[#a34d43]">Delete “{paper.title}”? Its {paper.count} questions and explanations are removed from your account for good.</p>
              <div className="mt-3 flex gap-2">
                <button data-testid={`button-confirm-delete-paper-${paper.id}`} onClick={() => void removeSavedPaper(paper.id)} disabled={busyPaperId !== ''} className="flex-1 rounded-lg bg-[#a34d43] py-2 text-xs font-semibold text-white disabled:opacity-60">{busyPaperId === paper.id ? 'Deleting…' : 'Delete'}</button>
                <button data-testid={`button-cancel-delete-paper-${paper.id}`} onClick={() => setConfirmingPaperDelete('')} className="flex-1 rounded-lg border border-border bg-card py-2 text-xs font-semibold">Keep it</button>
              </div>
            </div>}
          </div>)}</div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Saved sets live on the NEXORA AI server under your account and are readable only by you. Opening one loads its questions straight into the quiz. Past {MAX_SAVED_PAPERS} sets, the oldest is dropped.</p>
        </>}
      {paperError !== '' && material === null && <p data-testid="text-saved-papers-error" className="mt-3 rounded-lg border border-[#eac3bd] bg-[#fff2ef] p-2.5 text-[11px] leading-5 text-[#a34d43]">{paperError}</p>}
    </Card>}
  </div>;
}

function AnswerReveal({ question, pick, className = '' }: { question: MaterialQuestion; pick: Choice; className?: string }) {
  const right = pick !== null && pick === question.correct;
  const tone = pick === null ? 'bg-secondary text-muted-foreground' : right ? 'bg-[#edf8f5] text-[#216b67]' : 'bg-[#f9e5e1] text-[#a34d43]';
  return <div className={`rounded-lg px-4 py-3 text-xs leading-5 ${tone} ${className}`}>
    <b className="font-semibold">{pick === null ? 'Left unanswered.' : right ? 'Correct.' : 'Not this time.'}</b> {question.explanation}
    {question.source.trim().length > 0 && <span className="mt-2 block text-muted-foreground">Source sentence: “{question.source}”</span>}
  </div>;
}

function QuizAnalytics({ graded }: { graded: AttemptResult }) {
  const wrong = Math.max(0, graded.answered - graded.correct);
  const outcome = [
    { name: 'Correct', value: graded.correct, fill: bandColors.strong },
    { name: 'Incorrect', value: wrong, fill: bandColors['needs-work'] },
    { name: 'Unanswered', value: graded.skipped, fill: '#9aa8b0' },
  ].filter((slice) => slice.value > 0);

  const topicData = graded.topics.map((score) => ({
    label: score.topic.length > 22 ? `${score.topic.slice(0, 21)}…` : score.topic,
    percent: score.percent,
    fill: bandColors[score.band],
    correct: score.correct,
    total: score.total,
  }));
  const competencyData = graded.competencies.map((entry) => ({
    label: entry.short,
    percent: entry.percent,
    fill: bandColors[entry.band],
    correct: entry.correct,
    total: entry.total,
  }));

  const topicHeight = Math.max(160, topicData.length * 46);
  const competencyHeight = Math.max(140, competencyData.length * 46);

  return (
    <Card className="mt-6 p-6 sm:p-8" data-testid="quiz-analytics">
      <SectionHeading
        eyebrow="This paper, in charts"
        title="A closer look at how this sitting went"
        description="Drawn from this attempt alone — the same numbers as the report above, shown as the shape of the result."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_1fr]">
        {/* Outcome breakdown: correct vs wrong vs left blank. */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Question outcomes</p>
          <div className="mt-3 h-[200px]" data-testid="quiz-analytics-outcome">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outcome} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2} strokeWidth={0}>
                  {outcome.map((slice) => <Cell key={slice.name} fill={slice.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #dfe9ea', fontSize: 12 }} formatter={(value: number, name: string) => [`${value} ${value === 1 ? 'question' : 'questions'}`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5">
            {outcome.map((slice) => (
              <div key={slice.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-foreground"><span className="size-2.5 rounded-full" style={{ backgroundColor: slice.fill }} />{slice.name}</span>
                <span className="font-mono text-muted-foreground">{slice.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Per-topic score, worst first, each bar coloured by its band. */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Score by topic</p>
          <div className="mt-3" style={{ height: topicHeight }} data-testid="quiz-analytics-topics">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicData} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="#e1e9ea" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718189' }} tickFormatter={(value: number) => `${value}%`} />
                <YAxis type="category" dataKey="label" width={130} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#41525a' }} />
                <Tooltip cursor={{ fill: '#f1f5f6' }} contentStyle={{ borderRadius: 8, border: '1px solid #dfe9ea', fontSize: 12 }} formatter={(value: number, _name: string, entry: { payload?: { correct: number; total: number } }) => [`${value}% · ${entry.payload?.correct ?? 0}/${entry.payload?.total ?? 0} correct`, 'Score']} />
                <Bar dataKey="percent" radius={[0, 4, 4, 0]} barSize={18}>
                  {topicData.map((row, i) => <Cell key={`${row.label}-${i}`} fill={row.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {competencyData.length > 0 && (
        <div className="mt-8 border-t border-border pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Framework competencies this paper touched</p>
          <div className="mt-3" style={{ height: competencyHeight }} data-testid="quiz-analytics-competencies">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competencyData} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="#e1e9ea" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718189' }} tickFormatter={(value: number) => `${value}%`} />
                <YAxis type="category" dataKey="label" width={130} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#41525a' }} />
                <Tooltip cursor={{ fill: '#f1f5f6' }} contentStyle={{ borderRadius: 8, border: '1px solid #dfe9ea', fontSize: 12 }} formatter={(value: number, _name: string, entry: { payload?: { correct: number; total: number } }) => [`${value}% · ${entry.payload?.correct ?? 0}/${entry.payload?.total ?? 0} correct`, 'Score']} />
                <Bar dataKey="percent" radius={[0, 4, 4, 0]} barSize={18}>
                  {competencyData.map((row, i) => <Cell key={`${row.label}-${i}`} fill={row.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Competencies this material never asked about are left out rather than shown as zero.</p>
        </div>
      )}
    </Card>
  );
}

export function KnowledgeCheck() {
  const { live, status, problem, history } = useProgress();
  const [, setLocation] = useLocation();
  const latest = history[0] ?? null;
  const loading = status === 'idle' || status === 'loading';
  return <div className="mx-auto max-w-5xl animate-rise-in">
    <PageIntro
      eyebrow="Knowledge check"
      title="Your competency gaps and recommended courses."
      description="Measured from your most recent knowledge check and matched to real courses in your catalogue. This stays here between visits, until you take another."
      action={<ActionButton variant="amber" onClick={() => setLocation('/assignment')} icon={<ArrowRight className="size-4" />}>New assignment</ActionButton>}
    />
    {loading && <Card className="p-6 sm:p-8"><LoadingBlock label="Loading your latest knowledge check…" /></Card>}
    {status === 'unavailable' && <Card className="p-6 sm:p-8"><EmptyState title="Your results are not available right now" description={problem || 'We could not reach the server to load your knowledge check. Please try again in a moment.'} /></Card>}
    {live && !latest && <Card className="p-6 sm:p-8"><EmptyState title="No knowledge check taken yet" description="Create an assignment from a document, take the knowledge check, and your competency gaps and recommended courses will appear here — and stay." action={<ActionButton onClick={() => setLocation('/assignment')} icon={<ArrowRight className="size-4" />}>Go to Assignment</ActionButton>} /></Card>}
    {live && latest && <Card className="p-6 sm:p-8">
      <SectionHeading eyebrow="Latest result" title="How your most recent check went" description="Saved to your account — server-graded, not from this tab." />
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <div><p className="font-serif text-4xl text-primary">{latest.correct}<span className="text-2xl text-muted-foreground">/{latest.total}</span></p><p className="mt-1 text-xs text-muted-foreground">{latest.percent}% · {latest.label}</p></div>
        <div className="min-w-[160px] flex-1"><ProgressBar value={latest.percent} /></div>
      </div>
    </Card>}
    {live && <CompetencyGapSection scope="latest" />}
    {live && <GapCourseRecommendations scope="latest" />}
  </div>;
}

export function Quiz() {
  const material = useMaterial();
  const { record } = useProgress();
  const materialId = attemptKey(material);
  const [restored] = useState(() => loadAttempt(materialId));
  const [retryPaper, setRetryPaper] = useState<MaterialQuestion[] | null>(restored?.retry ?? null);
  const [started, setStarted] = useState(restored?.done ?? false);
  const [q, setQ] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Choice[]>(restored?.answers ?? []);
  const [answered, setAnswered] = useState(false);
  const [done, setDone] = useState(restored?.done ?? false);
  const [startedAt, setStartedAt] = useState(restored?.startedAt ?? 0);
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

  const seenMaterial = useRef(materialId);
  useEffect(() => {
    if (seenMaterial.current === materialId) return;
    seenMaterial.current = materialId;
    clearAttempt();
    setRetryPaper(null);
    setStarted(false);
    setQ(0);
    setChoice(null);
    setAnswers([]);
    setAnswered(false);
    setDone(false);
    setSaveNote('');
    setShowReview(false);
  }, [materialId]);

  const begin = (questions: MaterialQuestion[] | null) => {
    clearAttempt();
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

  const check = () => {
    if (choice === null || answered) return;
    const next = [...answers];
    next[q] = choice;
    setAnswers(next);
    setAnswered(true);
  };

  const skip = () => {
    if (answered) return;
    const blank = [...answers];
    blank[q] = null;
    setAnswers(blank);
    setChoice(null);
    setAnswered(true);
  };

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
    // The save is what lets the Dashboard's cross-attempt gap analysis and course
    // recommendations include this sitting the next time it is opened. The on-screen
    // charts below need no refetch — they are drawn from this tab's own graded result.
  };

  const advance = () => {
    if (!answered) return;
    if (isLast) {
      setDone(true);
      void save();
      saveAttempt({ materialKey: materialId, answers: [...answers], retry: retryPaper, done: true, startedAt });
      return;
    }
    setQ(q + 1);
    setChoice(null);
    setAnswered(false);
  };

  const practiseMissed = () => {
    const { questions } = buildRetryPaper(paper, plan);
    if (questions.length > 0) begin(questions);
  };

  if (paper.length === 0) return <div className="mx-auto max-w-3xl animate-rise-in"><PageIntro eyebrow="Knowledge check" title="Generate a quiz from your material." description={`Upload a ${supportedFormatsSentence} file on the Assignment page first. NEXORA AI will extract the text and build questions from that source.`} /><Card className="p-8 text-center"><FileCheck2 className="mx-auto size-10 text-primary" /><p className="mt-4 text-sm text-muted-foreground">There is no generated assignment in this browser session yet.</p><Link href="/assignment" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white">Open Assignment <ArrowRight className="size-4" /></Link></Card></div>;
  if (!started) return <div className="mx-auto max-w-3xl animate-rise-in"><PageIntro eyebrow="Grounded quiz · AI generated" title="Test the brief, not your memory." description={`A ${paper.length}-question knowledge check built from extracted text in ${quizTitle}. Each answer points back to a source sentence.`} /><Card className="overflow-hidden"><div className="bg-sidebar p-8 text-sidebar-foreground sm:p-12"><div className="flex items-center justify-between"><Badge tone="amber">{paper.length} questions</Badge><span className="font-mono text-[10px] uppercase tracking-[.14em] text-sidebar-foreground/50">Source-grounded</span></div><h2 className="mt-8 max-w-lg break-words font-serif text-4xl text-white">{quizTitle}</h2><p className="mt-4 max-w-lg text-sm leading-6 text-sidebar-foreground/70">Practise identifying what the uploaded material actually says. Distractors are written to be plausible; the correct answer is the one checked against a sentence in the material.</p><ActionButton variant="amber" className="mt-8" onClick={() => begin(null)} icon={<Play className="size-4" />}>Begin knowledge check</ActionButton></div><div className="grid gap-3 p-6 sm:grid-cols-3">{[['01', 'Recall', 'Find the source statement'], ['02', 'Interpret', 'Read the signal'], ['03', 'Apply', 'Make the call']].map(([n, t, d]) => <div key={n}><p className="font-mono text-xs text-primary">{n}</p><p className="mt-2 text-sm font-semibold">{t}</p><p className="mt-1 text-xs text-muted-foreground">{d}</p></div>)}</div></Card></div>;
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
          <ActionButton variant={plan.retry.length > 0 ? 'outline' : 'primary'} onClick={() => { clearAttempt(); setRetryPaper(null); setStarted(false); setDone(false); setQ(0); setChoice(null); setAnswers([]); setAnswered(false); setShowReview(false); setSaveNote(''); }}>Take the full paper again</ActionButton>
          <Link href="/assignment" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold">Back to assignment</Link>
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

      {/* Your competency gaps and the real dataset courses matched to them live on the
          Knowledge check page, where they persist (server-driven) — so they stay put after
          you open a recommended course, without retaking the quiz. */}
      <Card className="mt-6 p-6 sm:p-8">
        <SectionHeading eyebrow="Next" title="See your gaps and recommended courses" description="Your competency gaps and the courses matched to them are saved to your account and stay on your Knowledge check page." />
        <Link href="/quiz" data-testid="link-quiz-to-knowledge-check" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white">Open Knowledge check <ArrowRight className="size-4" /></Link>
      </Card>

      {/**
        * A graph-rich analytics report of the paper just taken — built entirely from the
        * local `graded` result, so it is exactly this sitting and nothing else. The gaps
        * across every attempt and the real-course recommendations that follow from them
        * live on the Dashboard now; this screen is the single-test picture, drawn.
        */}
      <QuizAnalytics graded={graded} />
      <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
        Want the bigger picture across every paper you have taken — and real courses matched to your gaps?{' '}
        <Link href="/dashboard" className="font-semibold text-primary hover:underline" data-testid="link-quiz-to-dashboard">Open your dashboard <ArrowRight className="inline size-3.5" /></Link>
      </p>

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

export function Profile() {
  const { user } = useSession();
  const { live, progress, preferences, personal, history, setPreferences, setProfileDetails } = useProgress();
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState('');
  const name = user?.name ?? 'Ananya Sharma';
  const email = user?.email ?? 'ananya.sharma@mospi.gov.in';
  const samplePersonal = { phone: '+91 98765 43210', bio: 'Statistical Officer with 6 years of experience in survey design, data quality assurance, and dissemination of national economic indicators.', role: 'Statistical Officer', department: 'Directorate of Economics & Statistics', location: 'Bengaluru, Karnataka' };
  const details = live ? personal : samplePersonal;
  const [form, setForm] = useState(personal);
  useEffect(() => { setForm(personal); }, [personal]);
  const startEdit = () => { setForm(personal); setEditing(true); };
  const cancelEdit = () => { setForm(personal); setEditing(false); };
  const saveDetails = async () => {
    const outcome = await setProfileDetails(form);
    if (outcome.saved) { setEditing(false); setToast('Profile details saved.'); }
    else setToast(outcome.reason);
  };
  const changePref = async (patch: Partial<typeof preferences>) => {
    const outcome = await setPreferences(patch);
    if (!outcome.saved) setToast(outcome.reason);
  };
  const joined = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'March 2021';
  const streak = practiceStreak(history).current;
  const miniStats = live
    ? [{ v: String(progress.attempts), l: 'Assessments' }, { v: `${progress.index}`, l: 'Score' }, { v: `${Math.round(progress.minutes / 60)}h`, l: 'Learning' }]
    : [{ v: '27', l: 'Courses' }, { v: sampleMetrics[0].value, l: 'Score' }, { v: '142h', l: 'Learning' }];

  const skills = live
    ? competencyBars(progress).map((bar) => ({ name: bar.name, level: bar.score }))
    : [
        { name: 'Data Quality', level: 82 },
        { name: 'Statistical Inference', level: 68 },
        { name: 'Data Dissemination', level: 74 },
        { name: 'Leadership', level: 54 },
        { name: 'Digital Tools', level: 61 },
      ];

  const stats = live
    ? [
        { label: 'Assessments taken', value: String(progress.attempts), icon: Target },
        { label: 'Competency index', value: `${progress.index}%`, icon: Award },
        { label: 'Learning hours', value: String(Math.round(progress.minutes / 60)), icon: Clock3 },
        { label: 'Current streak', value: `${streak} ${streak === 1 ? 'day' : 'days'}`, icon: Sparkles },
      ]
    : [
        { label: 'Courses completed', value: '27', icon: Award },
        { label: 'Assessments taken', value: '12', icon: Target },
        { label: 'Learning hours', value: '142', icon: Clock3 },
        { label: 'Current streak', value: '8 days', icon: Sparkles },
      ];

  const inputClass = 'w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-60 disabled:cursor-not-allowed';

  return <div className="mx-auto max-w-5xl animate-rise-in">
    <PageIntro eyebrow="Profile & preferences" title="Your NEXORA AI identity." description="Manage your personal information, professional details, and platform preferences — all in one place." />
    {!live && <div className="mb-6 rounded-lg border border-[#d6e2e7] bg-[#eef4f6] px-4 py-3 text-xs text-[#29485a]"><span className="font-semibold">Sample / Demonstration Data</span> · Sign in to see your own measured profile. The figures and competencies below are illustrative.</div>}

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
          </div>
          <div className="-mt-8 rounded-t-[20px] bg-card px-6 pb-6 pt-8 text-center">
            <h2 className="font-serif text-xl">{name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{details.role || 'Add your role'}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Badge tone="amber">Verified official</Badge>
              <Badge tone="teal">Active</Badge>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-5 text-xs text-muted-foreground">
              {miniStats.map((m) => <div key={m.l} className="text-center"><p className="font-semibold text-foreground">{m.v}</p><p>{m.l}</p></div>)}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Competencies" title="Skill levels" />
          <div className="space-y-4">
            {skills.length === 0 ? <p className="text-sm text-muted-foreground">Take an assessment to measure your competencies — your levels will appear here.</p> : skills.map((s) => <div key={s.name}>
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
            {live && !editing && <button data-testid="button-edit-profile" onClick={startEdit} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-secondary"><Edit3 className="size-3.5" /> Edit</button>}
          </div>
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <span className="flex items-center gap-2 text-sm font-semibold"><Users className="size-3.5 text-muted-foreground" /> Full name</span>
                <p className="mt-2 text-sm">{name}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Managed by your account</p>
              </div>
              <div>
                <span className="flex items-center gap-2 text-sm font-semibold"><Mail className="size-3.5 text-muted-foreground" /> Email address</span>
                <p className="mt-2 break-all text-sm">{email}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Managed by your account</p>
              </div>
            </div>
            {editing ? <div className="grid gap-5 sm:grid-cols-2">
              <label className="block"><span className="flex items-center gap-2 text-sm font-semibold"><Briefcase className="size-3.5 text-muted-foreground" /> Role</span><input data-testid="input-role" type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={`mt-2 ${inputClass}`} /></label>
              <label className="block"><span className="flex items-center gap-2 text-sm font-semibold"><Shield className="size-3.5 text-muted-foreground" /> Department</span><input data-testid="input-department" type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={`mt-2 ${inputClass}`} /></label>
              <label className="block"><span className="flex items-center gap-2 text-sm font-semibold"><MapPin className="size-3.5 text-muted-foreground" /> Location</span><input data-testid="input-location" type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={`mt-2 ${inputClass}`} /></label>
              <label className="block"><span className="flex items-center gap-2 text-sm font-semibold"><Phone className="size-3.5 text-muted-foreground" /> Phone number</span><input data-testid="input-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`mt-2 ${inputClass}`} /></label>
              <label className="block sm:col-span-2"><span className="flex items-center gap-2 text-sm font-semibold"><Edit3 className="size-3.5 text-muted-foreground" /> Bio</span><textarea data-testid="input-bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className={`mt-2 resize-none ${inputClass}`} /></label>
            </div> : <div className="grid gap-5 sm:grid-cols-2">
              <div><p className="flex items-center gap-2 text-xs text-muted-foreground"><Briefcase className="size-3.5" /> Role</p><p className="mt-1.5 text-sm font-semibold">{details.role || '—'}</p></div>
              <div><p className="flex items-center gap-2 text-xs text-muted-foreground"><Shield className="size-3.5" /> Department</p><p className="mt-1.5 text-sm font-semibold">{details.department || '—'}</p></div>
              <div><p className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-3.5" /> Location</p><p className="mt-1.5 text-sm font-semibold">{details.location || '—'}</p></div>
              <div><p className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="size-3.5" /> Phone</p><p className="mt-1.5 text-sm font-semibold">{details.phone || '—'}</p></div>
              <div className="sm:col-span-2"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Edit3 className="size-3.5" /> Bio</p><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{details.bio || 'No bio yet.'}</p></div>
            </div>}
            {editing && <div className="flex gap-3 border-t border-border pt-5">
              <ActionButton onClick={() => void saveDetails()}>Save changes <Check className="size-4" /></ActionButton>
              <ActionButton variant="outline" onClick={cancelEdit}>Cancel</ActionButton>
            </div>}
            <div className="flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><Calendar className="size-3.5" /> Joined {joined}</div>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Preferences" title="How you work" />
          <div className="space-y-6">
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold"><Globe className="size-3.5 text-muted-foreground" /> Preferred language</span>
              <select data-testid="select-language" value={live ? preferences.language : 'English'} disabled={!live} onChange={(e) => void changePref({ language: e.target.value as typeof preferences.language })} className={`mt-2 ${inputClass}`}>
                <option>English</option><option>Hindi</option><option>Kannada</option>
              </select>
              <span className="mt-1.5 block text-xs text-muted-foreground">Saved to your account.</span>
            </label>

            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-semibold">Notifications</span>
                <span className="mt-1 block text-xs text-muted-foreground">Show a feed of your assessment activity and course progress in the bell.</span>
              </span>
              <button data-testid="button-toggle-notifications" role="switch" aria-checked={live ? preferences.notify : true} aria-label="Notifications" onClick={() => void changePref({ notify: !(live ? preferences.notify : true) })} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${(live ? preferences.notify : true) ? 'bg-primary' : 'bg-secondary'}`}><span className={`absolute top-1 size-4 rounded-full bg-card transition-transform ${(live ? preferences.notify : true) ? 'left-6' : 'left-1'}`} /></button>
            </label>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
              <p className="text-xs text-muted-foreground">{live ? 'Preferences save as you change them.' : 'Sign in to change your preferences.'}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
    {toast && <ToastMessage message={toast} onClose={() => setToast('')} />}
  </div>;
}
