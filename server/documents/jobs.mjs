export const JOB_STATUS = Object.freeze(['pending', 'processing', 'completed', 'failed']);

export const DEFAULT_STAGES = Object.freeze(['reading', 'extracting', 'detecting-chapters', 'indexing']);

export function jobProgress(job) {
  const stages = job.stages ?? [];
  const doneStages = stages.filter((s) => s.status === 'completed').length;
  const stagePart = stages.length ? doneStages / stages.length : 1;
  const chunks = job.chunkStatus ?? [];
  const doneChunks = chunks.filter((s) => s === 'completed').length;
  const chunkPart = chunks.length ? doneChunks / chunks.length : 1;
  const value = stages.length && chunks.length ? 0.4 * stagePart + 0.6 * chunkPart : Math.max(stagePart, chunkPart);
  return Number(value.toFixed(3));
}

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

export async function runJob(job, { processChunk, persist = async () => {}, maxChunkRetries = 3 } = {}) {
  job.status = 'processing';
  await persist(job);

  for (const stage of job.stages ?? []) {
    if (stage.name === 'indexing') break;
    stage.status = 'completed';
    await persist(job);
  }

  const indexingStage = (job.stages ?? []).find((s) => s.name === 'indexing');
  if (indexingStage) { indexingStage.status = 'processing'; await persist(job); }

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

export function resumeJob(job) {
  for (let i = 0; i < job.chunkStatus.length; i += 1) {
    if (job.chunkStatus[i] !== 'completed') job.chunkStatus[i] = 'pending';
  }
  job.status = 'pending';
  job.error = null;
  return job;
}
