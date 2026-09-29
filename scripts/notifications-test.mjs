#!/usr/bin/env node
import { buildNotifications } from '../server/notifications.mjs';

let passed = 0; let failed = 0;
function check(name, fn) {
  let problem = null;
  try { problem = fn() ?? null; } catch (e) { problem = `threw: ${e.message}`; }
  if (problem) { failed += 1; console.log(`  FAIL  ${name}\n        ${problem}`); }
  else { passed += 1; console.log(`  ok    ${name}`); }
}

const has = (feed, kind) => feed.items.some((it) => it.kind === kind);
const byId = (feed, id) => feed.items.find((it) => it.id === id);

const T_OLD = '2026-09-01T00:00:00.000Z';
const T_NEW = '2026-09-10T00:00:00.000Z';
const SEEN_BEFORE = '2026-08-01T00:00:00.000Z';
const SEEN_AFTER = '2026-12-01T00:00:00.000Z';

console.log('\n  -- buildNotifications  derived feed, honest unread ------------\n');

check('a first-run learner gets exactly one welcome call to action, undated', () => {
  const feed = buildNotifications({ progress: { attempts: 0 }, courses: [], profile: {}, now: T_NEW });
  if (feed.items.length !== 1) return `expected 1 item, got ${feed.items.length}`;
  if (feed.items[0].kind !== 'welcome' || feed.items[0].at !== null) return 'the single item is not an undated welcome';
  if (has(feed, 'summary')) return 'a learner with no attempts should not see a summary';
});

check('the welcome item is unread until the panel is first opened', () => {
  const fresh = buildNotifications({ progress: { attempts: 0 }, courses: [], profile: {}, now: T_NEW });
  if (fresh.unread !== 1) return `unopened welcome should be unread, got unread=${fresh.unread}`;
  const seen = buildNotifications({ progress: { attempts: 0 }, courses: [], profile: { notificationsSeenAt: T_OLD }, now: T_NEW });
  if (seen.unread !== 0) return `an opened welcome should be read, got unread=${seen.unread}`;
});

const returning = {
  progress: { attempts: 3, lastAttemptAt: T_NEW, index: 62, correct: 26, questions: 42, focus: [{ id: 'data-quality', percent: 41 }] },
  courses: [],
};

check('a returning learner sees a real summary, not the welcome', () => {
  const feed = buildNotifications({ ...returning, profile: {}, now: T_NEW });
  if (has(feed, 'welcome')) return 'the welcome CTA should be gone once there are attempts';
  const summary = byId(feed, 'summary');
  if (!summary) return 'no summary item was built';
  if (summary.title !== '3 assessments recorded') return `summary title was "${summary.title}"`;
  if (!summary.body.includes('62%') || !summary.body.includes('26 of 42 correct')) return `summary body was "${summary.body}"`;
});

check('the weakest competency becomes a dated focus item', () => {
  const feed = buildNotifications({ ...returning, profile: {}, now: T_NEW });
  const focus = byId(feed, 'focus-data-quality');
  if (!focus) return 'no focus item for the weakest competency';
  if (focus.kind !== 'focus' || focus.at !== T_NEW) return 'focus item is not dated to the last sitting';
  if (!focus.body.includes('41%')) return `focus body was "${focus.body}"`;
});

check('a single attempt reads "First assessment recorded" and has no focus when none is given', () => {
  const feed = buildNotifications({ progress: { attempts: 1, lastAttemptAt: T_NEW, index: 50, correct: 5, questions: 10, focus: [] }, courses: [], profile: {}, now: T_NEW });
  const summary = byId(feed, 'summary');
  if (!summary || summary.title !== 'First assessment recorded') return `summary title was "${summary?.title}"`;
  if (has(feed, 'focus')) return 'no focus item should exist when focus is empty';
});

check('unread counts only what arrived after the panel was last opened', () => {
  const never = buildNotifications({ ...returning, profile: {}, now: T_NEW });
  if (never.unread !== 2) return `never-opened should have both dated items unread, got ${never.unread}`;
  const after = buildNotifications({ ...returning, profile: { notificationsSeenAt: SEEN_AFTER }, now: T_NEW });
  if (after.unread !== 0) return `opened after the last sitting should be all read, got ${after.unread}`;
  const before = buildNotifications({ ...returning, profile: { notificationsSeenAt: SEEN_BEFORE }, now: T_NEW });
  if (before.unread !== 2) return `opened before the sitting should be unread again, got ${before.unread}`;
});

check('course items describe what the learner actually did, newest first, capped at three', () => {
  const courses = [
    { courseId: 'time-series', saved: true, startedAt: null, updatedAt: T_OLD },
    { courseId: 'data-ethics', startedAt: T_OLD, completedModules: [0, 2], updatedAt: T_NEW },
    { courseId: 'r-programming', startedAt: T_OLD, updatedAt: T_OLD },
    { courseId: 'sampling', saved: true, updatedAt: '2026-07-01T00:00:00.000Z' },
  ];
  const feed = buildNotifications({ progress: { attempts: 2, lastAttemptAt: T_NEW, index: 55, correct: 11, questions: 20, focus: [] }, courses, profile: {}, now: T_NEW });
  const worked = byId(feed, 'course-data-ethics');
  if (!worked || worked.title !== 'Progress on Data Ethics') return `worked course read "${worked?.title}"`;
  const saved = byId(feed, 'course-time-series');
  if (!saved || saved.title !== 'Saved Time Series') return `saved course read "${saved?.title}"`;
  const started = byId(feed, 'course-r-programming');
  if (!started || started.title !== 'Started R Programming') return `started course read "${started?.title}"`;
  if (byId(feed, 'course-sampling')) return 'the fourth-oldest course should have been dropped by the cap of three';
});

check('the feed never exceeds eight items', () => {
  const courses = Array.from({ length: 20 }, (_, i) => ({ courseId: `c-${i}`, saved: true, updatedAt: T_OLD }));
  const feed = buildNotifications({ progress: { attempts: 2, lastAttemptAt: T_NEW, index: 55, correct: 11, questions: 20, focus: [{ id: 'x', percent: 10 }] }, courses, profile: {}, now: T_NEW });
  if (feed.items.length > 8) return `feed had ${feed.items.length} items`;
});

console.log(`\n  ${failed === 0 ? 'All notification-builder checks passed.' : 'SOME CHECKS FAILED.'}  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
