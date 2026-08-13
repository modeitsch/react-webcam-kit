import type { ChunkUploader, CreateChunkUploaderOptions } from '../types';

/**
 * Uploads recording chunks as they arrive instead of buffering the whole recording in memory.
 *
 * Wire it to `useMediaRecorder({ timeslice, onDataAvailable })`: a one-hour screen recording
 * never has to be held as a single multi-gigabyte Blob, and the upload finishes shortly after
 * the recording does rather than starting from scratch at the end.
 *
 * Chunks are sent strictly in order — a media container is not resumable from an arbitrary
 * byte range, so a reordered chunk would corrupt the file. Each request is retried with
 * exponential backoff; if a chunk ultimately fails the queue stops and `complete()` rejects.
 */
export function createChunkUploader(options: CreateChunkUploaderOptions): ChunkUploader {
  const {
    fetchImpl = globalThis.fetch?.bind(globalThis),
    fieldName = 'chunk',
    fields = {},
    headers = {},
    maxRetries = 3,
    retryDelayMs = 500,
    uploadId,
    url,
  } = options;

  if (typeof fetchImpl !== 'function') {
    throw new TypeError('No fetch implementation is available; pass `fetchImpl`.');
  }

  let index = 0;
  let uploaded = 0;
  let failed: Error | null = null;
  let finished = false;
  // Serialises the queue: each enqueue chains onto the previous upload.
  let queue: Promise<void> = Promise.resolve();

  const delay = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

  async function send(chunk: Blob, chunkIndex: number, isLast: boolean) {
    const body = new FormData();

    Object.entries(fields).forEach(([name, value]) => {
      body.set(name, value);
    });

    if (uploadId) {
      body.set('uploadId', uploadId);
    }

    body.set('index', String(chunkIndex));
    body.set('last', String(isLast));
    body.set(fieldName, chunk, `chunk-${String(chunkIndex)}`);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      if (attempt > 0) {
        await delay(retryDelayMs * 2 ** (attempt - 1));
      }

      try {
        const response = await fetchImpl(url, { body, headers, method: 'POST' });

        if (!response.ok) {
          throw new Error(
            `Chunk ${String(chunkIndex)} upload failed with status ${String(response.status)}.`,
          );
        }

        uploaded += 1;
        options.onProgress?.({ index: chunkIndex, size: chunk.size, uploaded });
        return;
      } catch (caughtError) {
        lastError = caughtError instanceof Error ? caughtError : new Error('Chunk upload failed.');
      }
    }

    const error = lastError ?? new Error('Chunk upload failed.');
    failed = error;
    options.onError?.(error);
    throw error;
  }

  function enqueue(chunk: Blob, isLast = false) {
    if (failed || finished || chunk.size === 0) {
      return;
    }

    const chunkIndex = index;
    index += 1;

    queue = queue.then(async () => {
      if (failed) {
        return;
      }

      await send(chunk, chunkIndex, isLast);
    });

    // Failures are surfaced through complete()/onError; keep the chain from becoming an
    // unhandled rejection here.
    queue.catch(() => undefined);
  }

  return {
    enqueue,
    get error() {
      return failed;
    },
    async complete() {
      finished = true;
      await queue;

      if (failed) {
        throw failed;
      }
    },
    get pending() {
      return index - uploaded;
    },
    get uploaded() {
      return uploaded;
    },
  };
}
