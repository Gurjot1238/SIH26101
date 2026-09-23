/**
 * PostgreSQL backend for the account store, behind the exact same API as the JSON
 * store (server/json-store.mjs), so server/index.mjs never learns which one it got.
 *
 * How it stays API-compatible: index.mjs reads several methods SYNCHRONOUSLY
 * (findUserByEmail, findSession, attemptsForUser, profileForUser, counts, ...), and
 * `pg` is asynchronous, so a read cannot issue a query inline. The JSON store already
 * solved this by holding everything in memory and serving reads from Maps; this store
 * does the same, but every write is ALSO written through to PostgreSQL on a serialized
 * queue. Postgres is the durable source of truth — the in-memory snapshot is rebuilt
 * from it on every boot (so data survives restarts), and writes are ACID.
 *
 * Honest limitation: like the JSON store, the in-memory snapshot assumes ONE server
 * process. Many concurrent users on one server are fully supported; running several
 * server instances against one database would need these reads to hit Postgres
 * directly (drop the cache) so instances don't serve a stale snapshot.
 */

import { getDb, jsonb } from './pool.mjs';

export async function openPostgresStore() {
  const db = await getDb();

  // ---- load the snapshot once, in the order the app expects to read it back ----
  const users = (await db.query('SELECT data FROM users')).rows.map((r) => r.data);
  const sessions = (await db.query('SELECT data FROM sessions')).rows.map((r) => r.data);
  const attemptRows = (await db.query('SELECT user_id, data FROM attempts ORDER BY user_id, seq')).rows;
  const profileRows = (await db.query('SELECT user_id, data FROM profiles')).rows;
  const paperRows = (await db.query('SELECT user_id, data FROM papers ORDER BY user_id, seq')).rows;
  const interactions = (await db.query('SELECT data FROM interactions ORDER BY seq')).rows.map((r) => r.data);

  const byEmail = new Map(users.map((u) => [u.email, u]));
  const byId = new Map(users.map((u) => [u.id, u]));
  const byFingerprint = new Map(sessions.map((s) => [s.fingerprint, s]));

  const attemptsByUser = new Map();
  for (const row of attemptRows) {
    const list = attemptsByUser.get(row.user_id) ?? [];
    list.push(row.data);
    attemptsByUser.set(row.user_id, list);
  }

  const profiles = new Map(profileRows.map((r) => [r.user_id, r.data]));

  const papersByUser = new Map();
  for (const row of paperRows) {
    const list = papersByUser.get(row.user_id) ?? [];
    list.push(row.data);
    papersByUser.set(row.user_id, list);
  }

  // Every write goes through one promise chain, so two concurrent requests can never
  // interleave their SQL and lose each other's changes — same guarantee as the JSON store.
  let queue = Promise.resolve();
  function enqueue(task) {
    const run = queue.then(task, task);
    queue = run.catch(() => {});
    return run;
  }

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
    backend: 'postgresql',
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
      await enqueue(() =>
        db.query('INSERT INTO users (id, email, data) VALUES ($1, $2, $3::jsonb)', [
          user.id,
          user.email,
          jsonb(user),
        ]),
      );
      return user;
    },

    async recordLogin(userId, at) {
      const user = byId.get(userId);
      if (!user) return;
      user.lastLoginAt = at;
      await enqueue(() =>
        db.query('UPDATE users SET data = $2::jsonb WHERE id = $1', [userId, jsonb(user)]),
      );
    },
    findSession(fingerprint) {
      const session = byFingerprint.get(fingerprint);
      if (!session) return null;
      if (session.expiresAt <= Date.now()) {
        byFingerprint.delete(fingerprint);
        void enqueue(() => db.query('DELETE FROM sessions WHERE fingerprint = $1', [fingerprint]));
        return null;
      }
      return session;
    },

    async createSession(session) {
      byFingerprint.set(session.fingerprint, session);
      await enqueue(() =>
        db.query(
          `INSERT INTO sessions (fingerprint, user_id, expires_at, data)
           VALUES ($1, $2, $3, $4::jsonb)
           ON CONFLICT (fingerprint) DO UPDATE
             SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at, data = EXCLUDED.data`,
          [session.fingerprint, session.userId, session.expiresAt, jsonb(session)],
        ),
      );
      return session;
    },

    async touchSession(fingerprint, expiresAt, { persist }) {
      const session = byFingerprint.get(fingerprint);
      if (!session) return;
      session.expiresAt = expiresAt;
      session.lastSeenAt = Date.now();
      if (persist) {
        await enqueue(() =>
          db.query('UPDATE sessions SET expires_at = $2, data = $3::jsonb WHERE fingerprint = $1', [
            fingerprint,
            expiresAt,
            jsonb(session),
          ]),
        );
      }
    },

    async deleteSession(fingerprint) {
      if (!byFingerprint.delete(fingerprint)) return false;
      await enqueue(() => db.query('DELETE FROM sessions WHERE fingerprint = $1', [fingerprint]));
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
      if (removed > 0) await enqueue(() => db.query('DELETE FROM sessions WHERE user_id = $1', [userId]));
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
      if (removed > 0) await enqueue(() => db.query('DELETE FROM sessions WHERE expires_at <= $1', [now]));
      return removed;
    },
    /* ---------------------------------------------------------- attempts */

    attemptsForUser: (userId) => attemptsByUser.get(userId) ?? [],

    async addAttempt(attempt, { maxPerUser }) {
      const list = attemptsByUser.get(attempt.userId) ?? [];
      list.push(attempt);
      const dropped = Math.max(0, list.length - maxPerUser);
      const removed = dropped > 0 ? list.splice(0, dropped) : [];
      attemptsByUser.set(attempt.userId, list);
      await enqueue(async () => {
        await db.query('INSERT INTO attempts (id, user_id, data) VALUES ($1, $2, $3::jsonb)', [
          attempt.id,
          attempt.userId,
          jsonb(attempt),
        ]);
        if (removed.length > 0) {
          await db.query('DELETE FROM attempts WHERE id = ANY($1::text[])', [removed.map((a) => a.id)]);
        }
      });
      return { attempt, dropped };
    },

    async deleteAttemptsForUser(userId) {
      const removed = attemptsByUser.get(userId)?.length ?? 0;
      if (removed === 0) return 0;
      attemptsByUser.delete(userId);
      await enqueue(() => db.query('DELETE FROM attempts WHERE user_id = $1', [userId]));
      return removed;
    },

    /* ---------------------------------------------------------- profiles */

    profileForUser: (userId) => profiles.get(userId) ?? null,

    async saveProfile(userId, profile) {
      profiles.set(userId, profile);
      await enqueue(() =>
        db.query(
          `INSERT INTO profiles (user_id, data) VALUES ($1, $2::jsonb)
           ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data`,
          [userId, jsonb(profile)],
        ),
      );
      return profile;
    },
    /* ------------------------------------------------------------ saved papers */

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
      const removed = dropped > 0 ? list.splice(0, dropped) : [];
      papersByUser.set(paper.userId, list);
      await enqueue(async () => {
        await db.query('INSERT INTO papers (id, user_id, data) VALUES ($1, $2, $3::jsonb)', [
          paper.id,
          paper.userId,
          jsonb(paper),
        ]);
        if (removed.length > 0) {
          await db.query('DELETE FROM papers WHERE id = ANY($1::text[])', [removed.map((p) => p.id)]);
        }
      });
      return { paper, dropped };
    },

    async deletePaper(userId, paperId) {
      const list = papersByUser.get(userId);
      if (!list) return false;
      const index = list.findIndex((paper) => paper.id === paperId);
      if (index === -1) return false;
      list.splice(index, 1);
      if (list.length === 0) papersByUser.delete(userId);
      await enqueue(() => db.query('DELETE FROM papers WHERE id = $1 AND user_id = $2', [paperId, userId]));
      return true;
    },

    async deletePapersForUser(userId) {
      const removed = papersByUser.get(userId)?.length ?? 0;
      if (removed === 0) return 0;
      papersByUser.delete(userId);
      await enqueue(() => db.query('DELETE FROM papers WHERE user_id = $1', [userId]));
      return removed;
    },
    /* -------------------------------------------------- learning interactions */

    interactionCount: () => interactions.length,

    allInteractions: () => interactions,

    async addInteraction(event, { max = 50000 } = {}) {
      interactions.push(event);
      const dropped = Math.max(0, interactions.length - max);
      if (dropped > 0) interactions.splice(0, dropped);
      await enqueue(async () => {
        await db.query('INSERT INTO interactions (data) VALUES ($1::jsonb)', [jsonb(event)]);
        if (dropped > 0) {
          // Trim the same number of oldest rows the memory snapshot just dropped.
          await db.query(
            'DELETE FROM interactions WHERE seq IN (SELECT seq FROM interactions ORDER BY seq ASC LIMIT $1)',
            [dropped],
          );
        }
      });
      return { event, dropped };
    },

    /** Waits for any in-flight write so shutdown cannot lose a queued statement. */
    drain: () => enqueue(() => {}),
  };
}
