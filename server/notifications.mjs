function titleCase(slug) {
  return String(slug)
    .split('-')
    .filter(Boolean)
    .map((word) => (word.length <= 1 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(' ');
}

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

export function buildNotifications({ progress, courses = [], profile = {}, now }) {
  const nowIso = now instanceof Date ? now.toISOString() : (now ?? new Date().toISOString());
  const seenAt = typeof profile.notificationsSeenAt === 'string' ? profile.notificationsSeenAt : null;
  const items = [];

  const attempts = progress?.attempts ?? 0;
  const lastAt = progress?.lastAttemptAt ?? null;

  if (attempts === 0) {
    items.push({
      id: 'welcome',
      kind: 'welcome',
      title: 'Welcome to Nexora',
      body: 'Take a practice assessment to see your competency profile and get tailored recommendations.',
      at: null,
    });
  } else {
    items.push({
      id: 'summary',
      kind: 'summary',
      title: attempts === 1 ? 'First assessment recorded' : `${attempts} assessments recorded`,
      body: `Your overall index is ${progress.index}% (${progress.correct} of ${progress.questions} correct).`,
      at: lastAt,
    });

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

  const touched = courses
    .filter((c) => c && (c.saved || c.startedAt || (c.completedModules?.length ?? 0) > 0 || (c.completedLessons?.length ?? 0) > 0))
    .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
    .slice(0, 3)
    .map((c) => courseItem(c, lastAt));
  items.push(...touched);

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
