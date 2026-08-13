import { describe, expect, it, vi } from 'vitest';

import { createChunkUploader } from './createChunkUploader';

function ok() {
  return { ok: true, status: 200 } as Response;
}

function chunk(size: number) {
  return new Blob([new Uint8Array(size)], { type: 'video/webm' });
}

describe('createChunkUploader', () => {
  it('uploads chunks in order', async () => {
    const seen: string[] = [];
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = init?.body as FormData;
      const entry = body.get('index');
      seen.push(typeof entry === 'string' ? entry : '');
      // Make the first request slow: an unordered implementation would finish it last.
      await new Promise((resolve) => setTimeout(resolve, seen.length === 1 ? 30 : 0));
      return ok();
    }) as unknown as typeof fetch;

    const uploader = createChunkUploader({ fetchImpl, url: 'https://example.test/upload' });
    uploader.enqueue(chunk(10));
    uploader.enqueue(chunk(10));
    uploader.enqueue(chunk(10), true);
    await uploader.complete();

    expect(seen).toEqual(['0', '1', '2']);
    expect(uploader.uploaded).toBe(3);
    expect(uploader.error).toBeNull();
  });

  it('sends the upload id, index and last flag', async () => {
    let captured: FormData | null = null;
    const fetchImpl = vi.fn((_url: string | URL | Request, init?: RequestInit) => {
      captured = init?.body as FormData;
      return Promise.resolve(ok());
    }) as unknown as typeof fetch;

    const uploader = createChunkUploader({
      fetchImpl,
      fields: { sessionId: 'abc' },
      uploadId: 'rec-1',
      url: 'https://example.test/upload',
    });
    uploader.enqueue(chunk(4), true);
    await uploader.complete();

    const body = captured as unknown as FormData;
    expect(body.get('uploadId')).toBe('rec-1');
    expect(body.get('index')).toBe('0');
    expect(body.get('last')).toBe('true');
    expect(body.get('sessionId')).toBe('abc');
    expect(body.get('chunk')).toBeInstanceOf(Blob);
  });

  it('retries a failing chunk and then succeeds', async () => {
    let attempts = 0;
    const fetchImpl = vi.fn(() => {
      attempts += 1;

      if (attempts < 3) {
        return Promise.reject(new Error('network down'));
      }

      return Promise.resolve(ok());
    }) as unknown as typeof fetch;

    const uploader = createChunkUploader({
      fetchImpl,
      retryDelayMs: 1,
      url: 'https://example.test/upload',
    });
    uploader.enqueue(chunk(4), true);
    await uploader.complete();

    expect(attempts).toBe(3);
    expect(uploader.uploaded).toBe(1);
  });

  it('rejects from complete() once retries are exhausted', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve({ ok: false, status: 500 } as Response),
    ) as unknown as typeof fetch;
    const onError = vi.fn();

    const uploader = createChunkUploader({
      fetchImpl,
      maxRetries: 1,
      onError,
      retryDelayMs: 1,
      url: 'https://example.test/upload',
    });
    uploader.enqueue(chunk(4), true);

    await expect(uploader.complete()).rejects.toThrow('status 500');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(uploader.error).not.toBeNull();
  });

  it('stops uploading after a failure instead of corrupting the sequence', async () => {
    let calls = 0;
    const fetchImpl = vi.fn(() => {
      calls += 1;
      return Promise.resolve({ ok: false, status: 500 } as Response);
    }) as unknown as typeof fetch;

    const uploader = createChunkUploader({
      fetchImpl,
      maxRetries: 0,
      retryDelayMs: 1,
      url: 'https://example.test/upload',
    });
    uploader.enqueue(chunk(4));
    uploader.enqueue(chunk(4));
    uploader.enqueue(chunk(4), true);

    await expect(uploader.complete()).rejects.toThrow();
    // Only the first chunk should have been attempted.
    expect(calls).toBe(1);
  });

  it('reports progress and ignores empty chunks', async () => {
    const progress: number[] = [];
    const fetchImpl = vi.fn(() => Promise.resolve(ok())) as unknown as typeof fetch;

    const uploader = createChunkUploader({
      fetchImpl,
      onProgress: (next) => progress.push(next.uploaded),
      url: 'https://example.test/upload',
    });
    uploader.enqueue(chunk(0));
    uploader.enqueue(chunk(8));
    uploader.enqueue(chunk(8), true);
    await uploader.complete();

    expect(progress).toEqual([1, 2]);
  });

  it('falls back to the global fetch when none is passed', () => {
    expect(() => createChunkUploader({ url: 'https://example.test/upload' })).not.toThrow();
  });

  it('throws when no fetch implementation is available at all', () => {
    const originalFetch = globalThis.fetch;
    // @ts-expect-error deliberately removing fetch to simulate an old runtime
    delete globalThis.fetch;

    try {
      expect(() => createChunkUploader({ url: 'https://example.test/upload' })).toThrow(/fetch/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
