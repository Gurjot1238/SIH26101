/**
 * The notification feed, built entirely from an account's own measured data.
 *
 * There is no notifications table and no push channel: a feed is *derived* on
 * every read from the same three things the Dashboard already trusts — the
 * account's progress rollup, its saved/started courses, and its profile. That is
 * the whole point of building it this way. A notification can only ever say
 * something that is already true of the account, so the bell can never show a
 * number the rest of the app would contradict. `now` and `seenAt` are injected so
 * the builder is pure and testable.
 *
 * Unread accounting: a dated item is unread when it arrived after the learner last
 * opened the panel (`at > seenAt`); an undated call-to-action (the welcome item)
 * is unread only until the panel is opened for the first time. Opening the panel
 * writes `notificationsSeenAt`, after which a rebuilt feed reports unread = 0.
 */

/** "data-quality" -> "Data Quality", "r-programming" -> "R Programming". */
function titleCase(slug) {
  return String(slug)
    .split('-')
    .filter(Boolean)
    .map((word) => (word.length <= 1 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(' ');
}

/** How a single course record reads, given what the learner has actually done with it. */
function courseItem(course, fallbackAt) {
  const title = titleCase(course.courseId);
  const at = course.updatedAt ?? course.startedAt ?? fallbackAt;
  const worked =
    (Array.isArray(course.completedModules) && course.completedModules.length > 0) ||
    (Array.isArray(course.completedLessons) && course.completedLessons.length > 0);

  if (worked) {
    return { id: `course-${course.courseId}`, kind: 'course', title: `Progress on ${title}`, body: `You've been working through ${title}. Pick up where you left off.`, at };
  }
  if (course.startedAt) {
    return { id: `course-${course.courseId}`, kind: 'course', title: `Started ${title}`, body: `You started ${title}. Keep the momentum going.`, at };
  }
  return { id: `course-${course.courseId}`, kind: 'course', title: `Saved ${title}`, body: `${title} is in your library, ready when you are.`, at };
}

/**
 * Build the feed. Returns `{ items, unread, seenAt }` where every item is
 * `{ id, kind, title, body, at }` and `at` is an ISO string or null.
 */
export function buildNotifications({ progress, courses = [], profile = {}, now }) {
  const nowIso = now instanceof Date ? now.toISOString() : (now ?? new Date().toISOString());
  const seenAt = typeof profile.notificationsSeenAt === 'string' ? profile.notificationsSeenAt : null;
  const items = [];

  const attempts = progress?.attempts ?? 0;
  const lastAt = progress?.lastAttemptAt ?? null;

  if (attempts === 0) {
    // No measured work yet: one honest call to action, undated so it leads the feed
    // and stays until the learner actually sits an assessment (after which it is gone).
    items.push({
      id: 'welcome',
      kind: 'welcome',
      title: 'Welcome to Nexora',
      body: 'Take a practice assessment to see your competency profile and get tailored recommendations.',
      at: null,
    });
  } else {
    // A plain summary of where the account stands, dated to the most recent sitting.
    items.push({
      id: 'summary',
      kind: 'summary',
      title: attempts === 1 ? 'First assessment recorded' : `${attempts} assessments recorded`,
      body: `Your overall index is ${progress.index}% (${progress.correct} of ${progress.questions} correct).`,
      at: lastAt,
    });

    // The single weakest competency worth working on, if any — the same one the
    // Dashboard's focus section surfaces.
    const focus = Array.isArray(progress.focus) ? progress.focus[0] : null;
    if (focus) {
      items.push({
        id: `focus-${focus.id}`,
        kind: 'focus',
        title: `Focus area: ${titleCase(focus.id)}`,
        body: `${titleCase(focus.id)} is your lowest competency at ${focus.percent}%. A short practice set would move it.`,
        at: lastAt,
      });
    }
  }

  // The most recently touched saved/started courses, newest first, capped so the
  // panel stays a glance rather than a backlog.
  const touched = courses
    .filter((c) => c && (c.saved || c.startedAt || (c.completedModules?.length ?? 0) > 0 || (c.completedLessons?.length ?? 0) > 0))
    .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
    .slice(0, 3)
    .map((c) => courseItem(c, lastAt));
  items.push(...touched);

  // Newest first; the undated welcome item sorts to the top as a call to action.
  items.sort((a, b) => {
    if (a.at === null && b.at === null) return 0;
    if (a.at === null) return -1;
    if (b.at === null) return 1;
    return String(b.at).localeCompare(String(a.at));
  });

  const seenMs = seenAt ? Date.parse(seenAt) : 0;
  const unread = items.filter((it) => {
    if (it.at === null) return seenMs === 0;
    const atMs = Date.parse(it.at);
    return Number.isNaN(atMs) ? false : atMs > seenMs;
  }).length;

  return { items: items.slice(0, 8), unread, seenAt };
}
