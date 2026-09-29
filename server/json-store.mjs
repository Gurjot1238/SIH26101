import { constants } from 'node:fs';
import { access, chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

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
    throw new Error(`Cannot read ${path}: ${error.message}`);
  }
}

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
  const interactions = Array.isArray(interactionFile.interactions) ? interactionFile.interactions : [];

  const byEmail = new Map(users.map((user) => [user.email, user]));
  const byId = new Map(users.map((user) => [user.id, user]));
  const byFingerprint = new Map(sessions.map((session) => [session.fingerprint, session]));

  const attemptsByUser = new Map();
  for (const attempt of attempts) {
    const list = attemptsByUser.get(attempt.userId) ?? [];
    list.push(attempt);
    attemptsByUser.set(attempt.userId, list);
  }

  const papersByUser = new Map();
  for (const paper of papers) {
    const list = papersByUser.get(paper.userId) ?? [];
    list.push(paper);
    papersByUser.set(paper.userId, list);
  }

  let queue = Promise.resolve();
  function enqueue(task) {
    const run = queue.then(task, task);
    queue = run.catch(() => {});
    return run;
  }

  const flushUsers = () => enqueue(() => writeJsonFile(usersPath, { version: 1, users }));
  const flushSessions = () =>
    enqueue(() => writeJsonFile(sessionsPath, { version: 1, sessions: [...byFingerprint.values()] }));
  const flushAttempts = () =>
    enqueue(() => writeJsonFile(attemptsPath, { version: 1, attempts: [...attemptsByUser.values()].flat() }));
  const flushProfiles = () =>
    enqueue(() => writeJsonFile(profilesPath, { version: 1, profiles: Object.fromEntries(profiles) }));
  const flushPapers = () =>
    enqueue(() => writeJsonFile(papersPath, { version: 1, papers: [...papersByUser.values()].flat() }));
  const flushInteractions = () =>
    enqueue(() => writeJsonFile(interactionsPath, { version: 1, interactions }));

  const profileLocks = new Map();
  const withProfileLock = (userId, fn) => {
    const prev = profileLocks.get(userId) ?? Promise.resolve();
    const run = prev.then(fn, fn);
    profileLocks.set(userId, run.then(() => {}, () => {}));
    return run;
  };

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

    attemptsForUser: (userId) => attemptsByUser.get(userId) ?? [],

    async addAttempt(attempt, { maxPerUser }) {
      const list = attemptsByUser.get(attempt.userId) ?? [];
      list.push(attempt);
      const dropped = Math.max(0, list.length - maxPerUser);
      if (dropped > 0) list.splice(0, dropped);
      attemptsByUser.set(attempt.userId, list);
      await flushAttempts();
      return { attempt, dropped };
    },

    async deleteAttemptsForUser(userId) {
      const removed = attemptsByUser.get(userId)?.length ?? 0;
      if (removed === 0) return 0;
      attemptsByUser.delete(userId);
      await flushAttempts();
      return removed;
    },

    profileForUser: (userId) => profiles.get(userId) ?? null,

    async saveProfile(userId, profile) {
      profiles.set(userId, profile);
      await flushProfiles();
      return profile;
    },

    updateProfile(userId, mutate) {
      return withProfileLock(userId, async () => {
        const current = profiles.get(userId) ?? null;
        const next = await mutate(current);
        if (next === undefined) return current;
        profiles.set(userId, next);
        await flushProfiles();
        return next;
      });
    },

    papersForUser: (userId) => papersByUser.get(userId) ?? [],

    paperForUser(userId, paperId) {
      const list = papersByUser.get(userId);
      if (!list) return null;
      return list.find((paper) => paper.id === paperId) ?? null;
    },

    async addPaper(paper, { maxPerUser }) {
      const list = papersByUser.get(paper.userId) ?? [];
      list.push(paper);
      const dropped = Math.max(0, list.length - maxPerUser);
      if (dropped > 0) list.splice(0, dropped);
      papersByUser.set(paper.userId, list);
      await flushPapers();
      return { paper, dropped };
    },

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

    async deletePapersForUser(userId) {
      const removed = papersByUser.get(userId)?.length ?? 0;
      if (removed === 0) return 0;
      papersByUser.delete(userId);
      await flushPapers();
      return removed;
    },

    interactionCount: () => interactions.length,

    allInteractions: () => interactions,

    async addInteraction(event, { max = 50000 } = {}) {
      interactions.push(event);
      const dropped = Math.max(0, interactions.length - max);
      if (dropped > 0) interactions.splice(0, dropped);
      await flushInteractions();
      return { event, dropped };
    },

    drain: () => enqueue(() => {}),
  };
}

export async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export { dirname };
