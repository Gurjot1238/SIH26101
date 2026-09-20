#!/usr/bin/env bash
# Compiles src/ to plain JavaScript and renders the real route table, twice:
# once with the login gate on, once with it off.
#
# Usage:  npm run ui:test        (or ./scripts/render-test.sh)
#
# Nothing is written inside the project. The compile output goes to a temporary
# directory that is deleted on exit; node_modules is reached through a symlink so
# react, wouter and friends resolve without copying anything.

set -euo pipefail

cd "$(dirname "$0")/.."
APP="$PWD"

WORK="$(mktemp -d)"
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT INT TERM

printf '\n'
"$APP/scripts/compile-src.sh" "$WORK"

STATUS=0

node "$APP/scripts/render-test.mjs" "$WORK/out" || STATUS=1
VITE_REQUIRE_AUTH=false node "$APP/scripts/render-test.mjs" "$WORK/out" || STATUS=1

# Server rendering cannot reach these. The account menu is closed until it is
# clicked, so the sign-out button never appears in static markup. What follows
# are assertions about the source text, not proof that the code ran.
printf '  -- source checks (SSR cannot reach these) -------------------\n'

SP=0
SF=0

src_has() { # src_has <file> <literal> <description>
  if grep -qF -- "$2" "$1"; then
    SP=$((SP + 1))
    printf '  ok    %s\n' "$3"
  else
    SF=$((SF + 1))
    printf '  FAIL  %s\n' "$3"
  fi
}

src_lacks() { # src_lacks <file> <literal> <description>
  if grep -qF -- "$2" "$1"; then
    SF=$((SF + 1))
    printf '  FAIL  %s -- still present: %s\n' "$3" "$2"
  else
    SP=$((SP + 1))
    printf '  ok    %s\n' "$3"
  fi
}

# The course catalogue is wired into the app: a nav item, both routes, and the page
# marking lessons through the progress store rather than local state.
src_has src/components/shell.tsx "{ href: '/catalog', label: 'Course catalogue', icon: Library }" 'the course catalogue has a nav item'
src_has src/App.tsx '<Route path="/catalog" component={CourseCatalog} />' 'the catalogue list route is registered'
src_has src/App.tsx '<Route path="/catalog/:id" component={CatalogCourse} />' 'the catalogue detail route is registered'
src_has src/pages/demo-pages.tsx 'markCourse({ courseId: course.courseId, started: true, completedLessons:' 'marking a lesson writes lesson completion to the account'
src_has src/pages/demo-pages.tsx 'completionPercent(course.lessonIds, completed)' 'the donut is measured from the account, not chosen'
# A lesson now opens in the in-app reader, which is what completes it once read — the old
# manual checkbox and open-in-a-new-tab link are gone.
src_has src/pages/demo-pages.tsx 'onClick={() => setReading(lesson)}' 'a lesson opens in the in-app reader'
src_has src/pages/demo-pages.tsx 'onComplete={(lessonId) => { void completeLesson(lessonId); }}' 'the reader completes the lesson it was reading'
src_lacks src/pages/demo-pages.tsx 'button-lesson-toggle-' 'the manual mark-done checkbox is gone'
src_has src/components/lesson-reader.tsx 'contentUrl(courseId, contentFile)' 'the reader streams the real lesson file for PDFs'
src_has src/components/lesson-reader.tsx 'el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_SLACK' 'a text lesson completes only when scrolled to the end'

src_has src/components/shell.tsx 'data-testid="button-signout-demo"' 'sign-out button keeps its test id'
src_has src/components/shell.tsx 'await signOut()' 'sign-out button calls signOut()'
src_has src/components/shell.tsx "setLocation('/login')" 'signing out lands on /login'
src_has src/components/shell.tsx 'disabled={signingOut}' 'sign-out button disables itself while in flight'
src_has src/components/require-auth.tsx "!== 'false'" 'gate stays on unless VITE_REQUIRE_AUTH is exactly false'

ADOPTS="$(grep -cF 'adopt(user)' src/pages/auth-pages.tsx || true)"
if [ "$ADOPTS" -eq 2 ]; then
  SP=$((SP + 1))
  printf '  ok    both auth pages hand the account to the session (adopt)\n'
else
  SF=$((SF + 1))
  printf '  FAIL  expected adopt(user) in both auth pages, found %s\n' "$ADOPTS"
fi

# The quiz used to print the source sentence beside the options, and the correct
# option was that same sentence, so every answer was given away. This asserts the
# grounding text only appears once the question has been answered.
if grep -qF 'answered &&' src/pages/demo-pages.tsx && ! grep -qF 'the answer key is based on this extracted source sentence' src/pages/demo-pages.tsx; then
  SP=$((SP + 1))
  printf '  ok    quiz no longer prints the source sentence beside the options\n'
else
  SF=$((SF + 1))
  printf '  FAIL  quiz still leaks the answer key on the question screen\n'
fi

# Stronger form of the same invariant, and the one worth keeping.
#
# The first version of this check counted *lines* that mention the sentence and
# excluded any line that also mentions the gate. Every screen in demo-pages.tsx is
# one very long line, so the gate and an ungated leak sit on the same line and the
# check could not fail — proven by adding a bare {current.source} next to the
# question and watching it still pass. Occurrences are counted instead, and the
# question screen no longer names the sentence at all: it renders <AnswerReveal>,
# which is the only place the sentence and the explanation are written.
BARE="$(grep -o 'current\.source\|current\.explanation' src/pages/demo-pages.tsx | wc -l | tr -d ' ' || true)"
REVEALS="$(grep -o '<AnswerReveal question={current}' src/pages/demo-pages.tsx | wc -l | tr -d ' ' || true)"
GATED="$(grep -o 'answered && <AnswerReveal question={current}' src/pages/demo-pages.tsx | wc -l | tr -d ' ' || true)"
if [ "$BARE" -eq 0 ] && [ "$REVEALS" -eq 1 ] && [ "$GATED" -eq 1 ]; then
  SP=$((SP + 1))
  printf '  ok    the question screen reveals the source sentence only once answered\n'
else
  SF=$((SF + 1))
  printf '  FAIL  answer reveal is not gated (bare=%s reveals=%s gated=%s, want 0/1/1)\n' "$BARE" "$REVEALS" "$GATED"
fi

# The report is the half of the feature SSR cannot reach at all: it needs an
# uploaded document in tab storage and a finished attempt. gradeAttempt and
# buildStudyPlan are covered by engine:test; what these assert is that the page
# still composes them the one way that is correct.
src_has src/pages/demo-pages.tsx 'buildRetryPaper(paper, plan)' 'the retry is built from the paper just graded, not the original'
src_has src/pages/demo-pages.tsx 'gradeAttempt(paper, answers)' 'the report grades the paper the learner actually answered'
src_has src/pages/demo-pages.tsx 'bandLabels[score.band]' 'each topic is reported as a band, not a bare percentage'
src_has src/pages/demo-pages.tsx 'toAttemptPayload(graded, {' 'a finished attempt is recorded through the payload builder'

# The assessment result screen needs a submitted paper, so SSR never sees it. These
# assert the page composes the engine the one way that is correct, and that the four
# invented numbers on the old result screen are gone rather than merely moved.
src_has src/pages/demo-pages.tsx 'await openAssessment()' 'the assessment asks the server for a paper instead of building one'
src_has src/pages/demo-pages.tsx 'sitAssessment({ choices: toChoices(paper, answers), durationSeconds: seconds })' 'a sitting is submitted as option ids, with no score attached'
src_has src/pages/demo-pages.tsx 'setResult(outcome.value.result)' "the report is the server's marking, not a local grading"
src_has src/pages/demo-pages.tsx 'adoptServerScore(gradeAttempt(marked, answers), result)' 'the figures on screen are the ones the server stored'
src_has src/pages/demo-pages.tsx 'sectionOf(paper, step)' 'the stepper reads the section from the dealt paper'
src_has src/pages/demo-pages.tsx '{paper.note}' 'the page prints the disclaimer that came with the paper'
src_has src/pages/demo-pages.tsx '{clockText(elapsed)} elapsed' 'the badge shows time elapsed rather than a countdown'
src_lacks src/pages/demo-pages.tsx 'assessmentPaper()' 'the page no longer builds the paper in the tab'
# Literal, not a fragment: the quiz has its own setShowReview(!showReview), so the
# fragment alone stayed green with the old assessment in place.
src_has src/pages/demo-pages.tsx 'data-testid="button-assessment-review" onClick={() => setShowReview(!showReview)}' 'Review answers now shows the answers instead of wiping the attempt'
src_lacks src/pages/demo-pages.tsx 'setSubmitted(false); setStep(0); setAnswers([]); setSelected(null);' 'Review answers no longer wipes the attempt it was meant to show'
src_has src/pages/demo-pages.tsx 'value={graded.percent} size={138}' 'the result donut reads the real score'
src_lacks src/pages/demo-pages.tsx 'Donut value={78}' 'the donut hardcoded to 78% is gone'
src_lacks src/pages/demo-pages.tsx "['Correct responses', '2 / 3']" 'the hardcoded 2 / 3 result is gone'
src_lacks src/pages/demo-pages.tsx "'Competency movement', '+6 pts'" 'the invented +6 pts movement is gone'
src_lacks src/pages/demo-pages.tsx '[...prev.slice(0, step), index]' 'going back to change an answer no longer discards the later ones'

# The overview. SSR renders it in sample mode (the provider is still loading on the
# first pass), so the *measured* branch is unreachable there and its arithmetic is
# covered by engine:test instead. What is asserted here is the half neither can see:
# that each fabricated figure was replaced by a derivation rather than moved, and that
# the shipped numbers survive only inside the branch that is labelled sample data.
src_has src/pages/demo-pages.tsx 'const { live, status, problem, progress, history, courses: records } = useProgress();' 'the overview reads the account instead of a literal'
src_lacks src/pages/demo-pages.tsx '<Metric label="Competency index" value="68.4" note="+4.8 pts since last review" />' 'the hardcoded 68.4 competency index is gone'
src_has src/pages/demo-pages.tsx 'progress.index.toFixed(1)' 'the index on screen is the one the server rolled up'
src_has src/pages/demo-pages.tsx 'practiceStreak(history, now)' 'the streak is counted from stored attempt dates'
src_has src/pages/demo-pages.tsx 'monthEffort(history, now)' 'hours this month come from stored durations'
src_has src/pages/demo-pages.tsx 'pathwayProgress(records)' 'pathway completion counts real modules'
src_lacks src/pages/demo-pages.tsx 'eyebrow="Learner overview · Q3 2024"' 'the eyebrow no longer claims Q3 2024'
src_has src/pages/demo-pages.tsx 'quarterLabel(now)' 'the quarter is read from the clock'
src_lacks src/pages/demo-pages.tsx 'Your applied exercises score 18 points higher than recall checks.' 'the invented 18-point insight is gone, in sample mode too'
src_has src/pages/demo-pages.tsx "setLocation(view.signal ? view.signal.href : '/assessment')" 'the signal card goes to the pathway it names'
src_lacks src/pages/demo-pages.tsx "setToast('Insight saved to your learning brief')" 'the signal button no longer toasts instead of acting'
src_lacks src/pages/demo-pages.tsx "setToast('Activity history is up to date')" 'View history no longer claims history it never had'
src_lacks src/pages/demo-pages.tsx "['18 Sep', 'Assessment calibrated', 'Evidence-based Inference', 'teal']" 'the three dated events that never happened are gone'
src_has src/pages/demo-pages.tsx 'Take your first assessment to generate your learning profile.' 'a measured account with no sittings is told what to do'
src_lacks src/pages/demo-pages.tsx 'e.currentTarget.parentElement?.remove()' 'the note closes through React rather than by removing a DOM node'
src_has src/pages/demo-pages.tsx "sample ? '5 of 7 days active'" 'the shipped week figures survive only as labelled sample data'
src_has src/pages/demo-pages.tsx "'Sample / Demonstration Data'" 'sample mode says so where the quarter would be'

# Every figure the sample branch keeps must be reachable only through `sample`. The
# four shipped values live in one array; if any of them reappears loose in the JSX the
# count moves, and a reader could not tell a demo number from a measured one.
for LIT in "'68.4'" "'12 days'" "'7.6'" "'42%'"; do
  SEEN="$(grep -oF -- "$LIT" src/pages/demo-pages.tsx | wc -l | tr -d ' ' || true)"
  if [ "$SEEN" -eq 1 ]; then
    SP=$((SP + 1))
    printf '  ok    the sample figure %s appears once, in the sample table\n' "$LIT"
  else
    SF=$((SF + 1))
    printf '  FAIL  %s appears %s times, so a demo figure may be printed as a measured one\n' "$LIT" "$SEEN"
  fi
done

printf '\n  %s passed, %s failed\n' "$SP" "$SF"
[ "$SF" -eq 0 ] || STATUS=1

if [ "$STATUS" -eq 0 ]; then
  printf '\n  All checks passed.\n\n'
else
  printf '\n  Something failed — see above.\n\n'
fi

exit "$STATUS"
