/**
 * The processing job: staged progress, per-chunk status, retry and resume.
 *
 * A 1000-page book is not processed inside the upload request — the browser would time out
 * and one failure would throw the whole thing away. Instead ingestion is a job: the file is
 * stored, then it moves through stages (reading → extracting → detecting chapters → indexing),
 * and the chunk-building step tracks each chunk's status individually. If chunk 74 of 120
 * fails, only chunk 74 is retried, and a job resumed after a crash picks up from the chunks
 * still marked pending rather than starting at page 1.
 *
 * This module is the pure state machine and a runner; persistence lives in store.mjs (the
 * runner calls back to save progress incrementally). Keeping the logic pure makes it
 * testable without disk or a server, and means the same code drives an in-process run and a
 * future queue worker.
 */

export const JOB_STATUS = Object.freeze(['pending', 'processing', 'completed', 'failed']);

export const DEFAULT_STAGES = Object.freeze(['reading', 'extracting', 'detecting-chapters', 'indexing']);

/** Overall progress 0-1 from stage completion and per-chunk completion combined. */
export function jobProgress(job) {
  const stages = job.stages ?? [];
  const doneStages = stages.filter((s) => s.status === 'completed').length;
  const stagePart = stages.length ? doneStages / stages.length : 1;
  const chunks = job.chunkStatus ?? [];
  const doneChunks = chunks.filter((s) => s === 'completed').length;
  const chunkPart = chunks.length ? doneChunks / chunks.length : 1;
  // Weight chunk work as the bulk of the effort once we reach it.
  const value = stages.length && chunks.length ? 0.4 * stagePart + 0.6 * chunkPart : Math.max(stagePart, chunkPart);
  return Number(value.toFixed(3));
}

/** Human-readable per-stage view for the progress UI (name + status + optional pct). */
export function jobView(job) {
  return {
    jobId: job.id,
    documentId: job.documentId,
    status: job.status,
    progress: jobProgress(job),
    stages: (job.stages ?? []).map((s) => ({ name: s.name, status: s.status })),
    chunks: { total: (job.chunkStatus ?? []).length, done: (job.chunkStatus ?? []).filter((s) => s === 'completed').length, failed: (job.chunkStatus ?? []).filter((s) => s === 'failed').length },
    error: job.error ?? null,
  };
}

/**
 * Run a job to completion, processing each chunk index with `processChunk(i)` and saving
 * progress through `persist(job)` after each meaningful step. Retries a failing chunk up to
 * `maxChunkRetries`; a chunk still failing after that is left marked 'failed' (the job can be
 * resumed later to retry just those). Returns the final job.
 *
 *   job              a job record (from store.createJob) — mutated in place
 *   processChunk     async (index) => void; throws to signal that chunk failed
 *   persist          async (job) => void; called to save incremental progress
 *   maxChunkRetries  attempts per chunk before giving up on it this run
 */
export async function runJob(job, { processChunk, persist = async () => {}, maxChunkRetries = 3 } = {}) {
  job.status = 'processing';
  await persist(job);

  // Advance the non-chunk stages first (reading/extracting/detecting). These are quick and
  // marked complete in order so the progress bar moves before chunk work begins.
  for (const stage of job.stages ?? []) {
    if (stage.name === 'indexing') break; // indexing tracks per-chunk below
    stage.status = 'completed';
    await persist(job);
  }

  const indexingStage = (job.stages ?? []).find((s) => s.name === 'indexing');
  if (indexingStage) { indexingStage.status = 'processing'; await persist(job); }

  // Process only chunks not already completed — this is what makes resume cheap.
  for (let i = 0; i < job.chunkStatus.length; i += 1) {
    if (job.chunkStatus[i] === 'completed') continue;
    let ok = false;
    for (let attempt = 1; attempt <= maxChunkRetries && !ok; attempt += 1) {
      try {
        job.chunkStatus[i] = 'processing';
        // eslint-disable-next-line no-await-in-loop
        await processChunk(i);
        job.chunkStatus[i] = 'completed';
        ok = true;
      } catch (error) {
        job.chunkStatus[i] = 'failed';
        job.error = `chunk ${i}: ${error.message}`;
      }
    }
    // eslint-disable-next-line no-await-in-loop
    await persist(job);
  }

  const anyFailed = job.chunkStatus.some((s) => s === 'failed');
  if (indexingStage) indexingStage.status = anyFailed ? 'failed' : 'completed';
  if (anyFailed) {
    job.status = 'failed';
  } else {
    job.status = 'completed';
    job.error = null;
  }
  await persist(job);
  return job;
}

/**
 * Resume a failed/partial job: reset only the chunks that are not yet completed back to
 * pending so `runJob` reprocesses exactly those, and clears the terminal error. Chunks that
 * already succeeded are never redone (spec §22: do not restart from page 1).
 */
export function resumeJob(job) {
  for (let i = 0; i < job.chunkStatus.length; i += 1) {
    if (job.chunkStatus[i] !== 'completed') job.chunkStatus[i] = 'pending';
  }
  job.status = 'pending';
  job.error = null;
  return job;
}
