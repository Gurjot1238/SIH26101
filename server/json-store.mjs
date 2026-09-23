/**
 * Persistence. A few JSON files on disk, written atomically.
 *
 * This is deliberately the smallest thing that can hold real data safely. It is
 * the only module that knows about storage, so swapping in SQLite or Postgres
 * later means rewriting this file and nothing else.
 *
 * Separate files rather than one, because every write rewrites a whole file: saving
 * a quiz attempt should not rewrite the password hashes, and sliding a session
 * expiry should not rewrite the attempt history.
 *
 *   users.json      accounts, including the scrypt hash
 *   sessions.json   live sessions, by HMAC fingerprint
 *   attempts.json   quiz attempts: topic names and counts, never document text
 *   profiles.json   preferences and course progress, one record per account
 *   papers.json     saved MCQ sets: the learner's own questions, answers and
 *                   explanations, kept by choice and readable only by their account
 *   interactions.json  anonymised learning-interaction events (see recommend/interactions.mjs):
 *                   an append-only training-data source keyed by an HMAC of the user id,
 *                   never the account — carries learning signals, never PII or document text
 *
 * Honest limitation: a single-file JSON store is fine for a prototype, a demo,
 * or a few thousand accounts. It rewrites the whole file on every write, so it
 * is not what you would run for a real user base.
 */

import { constants } from 'node:fs';
import { access, chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/** Owner-only permissions: password hashes should not be world-readable. */
const FILE_MODE = 0o600;
const DIR_MODE = 0o700;

async function readJsonFile(path, fallback) {
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return structuredClone(fallback);
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') return structuredClone(fallback);
    // A corrupt file should stop the server loudly rather than silently wipe accounts.
    throw new Error(`Cannot read ${path}: ${error.message}`);
  }
}

/**
 * Write to a sibling temp file, then rename over the target. rename() is atomic
 * within a filesystem, so a crash mid-write leaves the previous file intact
 * instead of a half-written one.
 */
async function writeJsonFile(path, value) {
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: FILE_MODE });
  await rename(tmp, path);
  try {
    await chmod(path, FILE_MODE);
  } catch {
    /* best effort — some filesystems do not support it */
  }
}

export async function openJsonStore(dataDir) {
  await mkdir(dataDir, { recursive: true, mode: DIR_MODE });

  const usersPath = join(dataDir, 'users.json');
  const sessionsPath = join(dataDir, 'sessions.json');
  const attemptsPath = join(dataDir, 'attempts.json');
  const profilesPath = join(dataDir, 'profiles.json');
  const papersPath = join(dataDir, 'papers.json');
  const interactionsPath = join(dataDir, 'interactions.json');

  const userFile = await readJsonFile(usersPath, { version: 1, users: [] });
  const sessionFile = await readJsonFile(sessionsPath, { version: 1, sessions: [] });
  const attemptFile = await readJsonFile(attemptsPath, { version: 1, attempts: [] });
  const profileFile = await readJsonFile(profilesPath, { version: 1, profiles: {} });
  const paperFile = await readJsonFile(papersPath, { version: 1, papers: [] });
  const interactionFile = await readJsonFile(interactionsPath, { version: 1, interactions: [] });

  const users = Array.isArray(userFile.users) ? userFile.users : [];
  const sessions = Array.isArray(sessionFile.sessions) ? sessionFile.sessions : [];
  const attempts = Array.isArray(attemptFile.attempts) ? attemptFile.attempts : [];
  const profiles = new Map(Object.entries(profileFile.profiles ?? {}));
  const papers = Array.isArray(paperFile.papers) ? paperFile.papers : [];
  // Interactions are a flat, append-only list. Unlike attempts/papers they are NOT grouped
  // by account: the learner id stored is already an anonymised HMAC, and training reads the
  // whole log at once, so there is nothing to gain from a per-user map.
  const interactions = Array.isArray(interactionFile.interactions) ? interactionFile.interactions : [];

  const byEmail = new Map(users.map((user) => [user.email, user]));
  const byId = new Map(users.map((user) => [user.id, user]));
  const byFingerprint = new Map(sessions.map((session) => [session.fingerprint, session]));

  /**
   * Attempts are grouped by account in memory so reading one learner's history
   * never walks everybody else's. Each list stays in the order it was written,
   * which is chronological, so nothing needs sorting on read.
   */
  const attemptsByUser = new Map();
  for (const attempt of attempts) {
    const list = attemptsByUser.get(attempt.userId) ?? [];
    list.push(attempt);
    attemptsByUser.set(attempt.userId, list);
  }

  /**
   * Saved MCQ sets, grouped by account exactly like attempts, so reading one
   * learner's saved papers never walks another's. Unlike attempts, a paper carries
   * the full questions, answers and explanations — it is the learner's own document,
   * saved by choice, to their own account.
   */
  const papersByUser = new Map();
  for (const paper of papers) {
    const list = papersByUser.get(paper.userId) ?? [];
    list.push(paper);
    papersByUser.set(paper.userId, list);
  }

  /**
   * Every write goes through this one promise chain, so two concurrent requests
   * can never interleave and lose each other's changes.
   */
  let queue = Promise.resolve();
  function enqueue(task) {
    const run = queue.then(task, task);
    queue = run.catch(() => {});
    return run;
  }

  const flushUsers = () => enqueue(() => writeJsonFile(usersPath, { version: 1, users }));
  const flushSessions = () =>
    enqueue(() => writeJsonFile(sessionsPath, { version: 1, sessions: [...byFingerprint.values()] }));
  /**
   * Written from the per-account map, so the file ends up grouped by account.
   * Order on disk is not load-bearing — each account's own list stays in the
   * order it was written.
   */
  const flushAttempts = () =>
    enqueue(() => writeJsonFile(attemptsPath, { version: 1, attempts: [...attemptsByUser.values()].flat() }));
  const flushProfiles = () =>
    enqueue(() => writeJsonFile(profilesPath, { version: 1, profiles: Object.fromEntries(profiles) }));
  const flushPapers = () =>
    enqueue(() => writeJsonFile(papersPath, { version: 1, papers: [...papersByUser.values()].flat() }));
  const flushInteractions = () =>
    enqueue(() => writeJsonFile(interactionsPath, { version: 1, interactions }));

  const countAttempts = () => {
    let total = 0;
    for (const list of attemptsByUser.values()) total += list.length;
    return total;
  };
  const countPapers = () => {
    let total = 0;
    for (const list of papersByUser.values()) total += list.length;
    return total;
  };

  return {
    paths: { usersPath, sessionsPath, attemptsPath, profilesPath, papersPath, interactionsPath },
    counts: () => ({
      users: users.length,
      sessions: byFingerprint.size,
      attempts: countAttempts(),
      papers: countPapers(),
      interactions: interactions.length,
    }),

    findUserByEmail: (email) => byEmail.get(email) ?? null,
    findUserById: (id) => byId.get(id) ?? null,

    async createUser(user) {
      if (byEmail.has(user.email)) return null;
      users.push(user);
      byEmail.set(user.email, user);
      byId.set(user.id, user);
      await flushUsers();
      return user;
    },

    async recordLogin(userId, at) {
      const user = byId.get(userId);
      if (!user) return;
      user.lastLoginAt = at;
      await flushUsers();
    },

    findSession(fingerprint) {
      const session = byFingerprint.get(fingerprint);
      if (!session) return null;
      if (session.expiresAt <= Date.now()) {
        byFingerprint.delete(fingerprint);
        void flushSessions();
        return null;
      }
      return session;
    },

    async createSession(session) {
      byFingerprint.set(session.fingerprint, session);
      await flushSessions();
      return session;
    },

    /** Rolling expiry, but only persisted occasionally to avoid a write per request. */
    async touchSession(fingerprint, expiresAt, { persist }) {
      const session = byFingerprint.get(fingerprint);
      if (!session) return;
      session.expiresAt = expiresAt;
      session.lastSeenAt = Date.now();
      if (persist) await flushSessions();
    },

    async deleteSession(fingerprint) {
      if (!byFingerprint.delete(fingerprint)) return false;
      await flushSessions();
      return true;
    },

    /** Drops every session for one user — used when signing out everywhere. */
    async deleteSessionsForUser(userId) {
      let removed = 0;
      for (const [fingerprint, session] of byFingerprint) {
        if (session.userId === userId) {
          byFingerprint.delete(fingerprint);
          removed += 1;
        }
      }
      if (removed > 0) await flushSessions();
      return removed;
    },

    async purgeExpiredSessions() {
      const now = Date.now();
      let removed = 0;
      for (const [fingerprint, session] of byFingerprint) {
        if (session.expiresAt <= now) {
          byFingerprint.delete(fingerprint);
          removed += 1;
        }
      }
      if (removed > 0) await flushSessions();
      return removed;
    },

    /* ---------------------------------------------------------- attempts */

    /**
     * One account's attempts, oldest first. Returns the live array, so callers
     * must not mutate it — every reader here only maps and slices.
     */
    attemptsForUser: (userId) => attemptsByUser.get(userId) ?? [],

    /**
     * Append an attempt, dropping the oldest once the per-account cap is hit.
     * Trimming is a deliberate choice: an unbounded list in a whole-file JSON
     * store turns every later save into a slower one.
     */
    async addAttempt(attempt, { maxPerUser }) {
      const list = attemptsByUser.get(attempt.userId) ?? [];
      list.push(attempt);
      const dropped = Math.max(0, list.length - maxPerUser);
      if (dropped > 0) list.splice(0, dropped);
      attemptsByUser.set(attempt.userId, list);
      await flushAttempts();
      return { attempt, dropped };
    },

    /** Clears one account's history. Nobody else's list is touched. */
    async deleteAttemptsForUser(userId) {
      const removed = attemptsByUser.get(userId)?.length ?? 0;
      if (removed === 0) return 0;
      attemptsByUser.delete(userId);
      await flushAttempts();
      return removed;
    },

    /* ---------------------------------------------------------- profiles */

    /** Preferences and course progress for one account, or null when never saved. */
    profileForUser: (userId) => profiles.get(userId) ?? null,

    async saveProfile(userId, profile) {
      profiles.set(userId, profile);
      await flushProfiles();
      return profile;
    },

    /* ------------------------------------------------------------ saved papers */

    /** One account's saved MCQ sets, oldest first. The live array — do not mutate. */
    papersForUser: (userId) => papersByUser.get(userId) ?? [],

    /** One saved paper by id, but only if it belongs to this account. */
    paperForUser(userId, paperId) {
      const list = papersByUser.get(userId);
      if (!list) return null;
      return list.find((paper) => paper.id === paperId) ?? null;
    },

    /**
     * Append a saved paper, dropping the oldest once the per-account cap is hit —
     * same reasoning as attempts: an unbounded list in a whole-file JSON store makes
     * every later save slower.
     */
    async addPaper(paper, { maxPerUser }) {
      const list = papersByUser.get(paper.userId) ?? [];
      list.push(paper);
      const dropped = Math.max(0, list.length - maxPerUser);
      if (dropped > 0) list.splice(0, dropped);
      papersByUser.set(paper.userId, list);
      await flushPapers();
      return { paper, dropped };
    },

    /** Remove one saved paper, but only from its owner's list. Returns true if removed. */
    async deletePaper(userId, paperId) {
      const list = papersByUser.get(userId);
      if (!list) return false;
      const index = list.findIndex((paper) => paper.id === paperId);
      if (index === -1) return false;
      list.splice(index, 1);
      if (list.length === 0) papersByUser.delete(userId);
      await flushPapers();
      return true;
    },

    /** Clears one account's saved papers. Nobody else's list is touched. */
    async deletePapersForUser(userId) {
      const removed = papersByUser.get(userId)?.length ?? 0;
      if (removed === 0) return 0;
      papersByUser.delete(userId);
      await flushPapers();
      return removed;
    },

    /* -------------------------------------------------- learning interactions */

    /**
     * How many interaction events are logged in total. Drives ML activation: the
     * RecommendationService will not let the model rank until this crosses a threshold.
     */
    interactionCount: () => interactions.length,

    /**
     * The whole event log, oldest first — the live array, so callers must not mutate it
     * (the training-row builder only reads). It is safe to expose whole because every row
     * is already anonymised and allow-listed by recommend/interactions.mjs before it lands.
     */
    allInteractions: () => interactions,

    /**
     * Append one already-sanitised event. The caller is responsible for having run it
     * through sanitizeEvent (which drops PII and rebuilds from an allow-list); the store
     * only persists. Oldest events are trimmed past the cap, same as attempts/papers.
     */
    async addInteraction(event, { max = 50000 } = {}) {
      interactions.push(event);
      const dropped = Math.max(0, interactions.length - max);
      if (dropped > 0) interactions.splice(0, dropped);
      await flushInteractions();
      return { event, dropped };
    },

    /** Waits for any in-flight write so shutdown cannot truncate a file. */
    drain: () => enqueue(() => {}),
  };
}

/** True when a path already exists — used by the startup report only. */
export async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export { dirname };
