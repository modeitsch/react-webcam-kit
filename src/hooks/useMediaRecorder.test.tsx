import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getSupportedMimeType, useMediaRecorder } from './useMediaRecorder';

class MockMediaRecorder extends EventTarget {
  static isTypeSupported = vi.fn((mimeType: string) => mimeType === 'video/webm');
  static stopDispatch: 'sync' | 'manual' = 'sync';

  mimeType: string;
  state: RecordingState = 'inactive';
  stream: MediaStream;
  start = vi.fn((timeslice?: number) => {
    this.state = 'recording';
    this.timeslice = timeslice;
    this.dispatchEvent(new Event('start'));
  });
  stop = vi.fn(() => {
    this.state = 'inactive';

    if (MockMediaRecorder.stopDispatch === 'sync') {
      this.flushStop();
    }
  });
  pause = vi.fn(() => {
    this.state = 'paused';
    this.dispatchEvent(new Event('pause'));
  });
  resume = vi.fn(() => {
    this.state = 'recording';
    this.dispatchEvent(new Event('resume'));
  });
  timeslice?: number;

  constructor(stream: MediaStream, options: MediaRecorderOptions = {}) {
    super();
    this.stream = stream;
    this.mimeType = options.mimeType ?? '';
  }

  emitChunk(blob: Blob) {
    const event = new Event('dataavailable') as BlobEvent;
    Object.defineProperty(event, 'data', {
      value: blob,
    });
    this.dispatchEvent(event);
  }

  flushStop() {
    this.dispatchEvent(new Event('stop'));
  }
}

const OriginalMediaRecorder = globalThis.MediaRecorder;

function createStream() {
  return {
    getTracks: () => [],
  } as unknown as MediaStream;
}

describe('useMediaRecorder', () => {
  afterEach(() => {
    MockMediaRecorder.stopDispatch = 'sync';
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: OriginalMediaRecorder,
    });
    vi.restoreAllMocks();
  });

  it('selects the first supported MIME type', () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });

    expect(getSupportedMimeType(['video/mp4', 'video/webm'])).toBe('video/webm');
  });

  it('records chunks and exposes the final blob on stop', () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });
    const onStop = vi.fn();
    const { result } = renderHook(() =>
      useMediaRecorder({
        onStop,
        stream: createStream(),
        timeslice: 250,
      }),
    );

    let recorder: MockMediaRecorder | undefined;

    act(() => {
      recorder = result.current.start() as unknown as MockMediaRecorder;
    });

    expect(result.current.status).toBe('recording');
    expect(recorder?.timeslice).toBe(250);

    act(() => {
      recorder?.emitChunk(new Blob(['chunk'], { type: 'video/webm' }));
      recorder?.emitChunk(new Blob([], { type: 'video/webm' }));
    });

    expect(result.current.chunks).toHaveLength(1);

    act(() => {
      result.current.stop();
    });

    expect(result.current.status).toBe('stopped');
    expect(result.current.blob).toBeInstanceOf(Blob);
    expect(onStop).toHaveBeenCalledWith(result.current.blob, result.current.chunks);
  });

  it('pauses, resumes, and resets recorder state after the recorder is inactive', () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });
    const { result } = renderHook(() => useMediaRecorder({ stream: createStream() }));

    act(() => {
      result.current.start();
      result.current.pause();
    });

    expect(result.current.status).toBe('paused');

    act(() => {
      result.current.resume();
    });

    expect(result.current.status).toBe('recording');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.blob).toBeNull();
    expect(result.current.chunks).toEqual([]);
  });

  it('stops and discards an active recording when reset is called', () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });
    const onStop = vi.fn();
    const { result } = renderHook(() =>
      useMediaRecorder({
        onStop,
        stream: createStream(),
      }),
    );

    let recorder: MockMediaRecorder | undefined;

    act(() => {
      recorder = result.current.start() as unknown as MockMediaRecorder;
      recorder?.emitChunk(new Blob(['discarded'], { type: 'video/webm' }));
    });

    expect(result.current.status).toBe('recording');

    act(() => {
      result.current.reset();
    });

    expect(recorder?.stop).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('idle');
    expect(result.current.blob).toBeNull();
    expect(result.current.chunks).toEqual([]);
    expect(onStop).not.toHaveBeenCalled();
  });

  it('ignores late stop events from a recorder replaced by a new session', () => {
    MockMediaRecorder.stopDispatch = 'manual';
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });
    const onStop = vi.fn();
    const { result } = renderHook(() =>
      useMediaRecorder({
        onStop,
        stream: createStream(),
      }),
    );

    let firstRecorder: MockMediaRecorder | undefined;
    let secondRecorder: MockMediaRecorder | undefined;

    act(() => {
      firstRecorder = result.current.start() as unknown as MockMediaRecorder;
      firstRecorder?.emitChunk(new Blob(['first'], { type: 'video/webm' }));
      secondRecorder = result.current.start() as unknown as MockMediaRecorder;
      secondRecorder?.emitChunk(new Blob(['second'], { type: 'video/webm' }));
    });

    expect(firstRecorder?.stop).toHaveBeenCalledTimes(1);

    act(() => {
      firstRecorder?.flushStop();
    });

    expect(onStop).not.toHaveBeenCalled();
    expect(result.current.status).toBe('recording');
    expect(result.current.blob).toBeNull();
    expect(result.current.chunks).toHaveLength(1);

    act(() => {
      result.current.stop();
      secondRecorder?.flushStop();
    });

    expect(result.current.status).toBe('stopped');
    expect(result.current.blob).toBeInstanceOf(Blob);
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledWith(result.current.blob, result.current.chunks);
  });

  it('creates a File from the final recording when fileName is provided', () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });
    const { result } = renderHook(() =>
      useMediaRecorder({
        fileName: 'intro',
        fileType: 'webm',
        stream: createStream(),
      }),
    );

    let recorder: MockMediaRecorder | undefined;

    act(() => {
      recorder = result.current.start() as unknown as MockMediaRecorder;
      recorder?.emitChunk(new Blob(['chunk'], { type: 'video/webm' }));
      result.current.stop();
    });

    expect(result.current.file).toBeInstanceOf(File);
    expect(result.current.file?.name).toBe('intro.webm');
    expect(result.current.file?.type).toBe('video/webm');
  });

  it('cancels an active recording without creating a blob or calling onStop', () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });
    const onStop = vi.fn();
    const { result } = renderHook(() =>
      useMediaRecorder({
        onStop,
        stream: createStream(),
      }),
    );

    let recorder: MockMediaRecorder | undefined;

    act(() => {
      recorder = result.current.start() as unknown as MockMediaRecorder;
      recorder?.emitChunk(new Blob(['discarded'], { type: 'video/webm' }));
      result.current.cancel();
    });

    expect(recorder?.stop).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('idle');
    expect(result.current.blob).toBeNull();
    expect(result.current.file).toBeNull();
    expect(result.current.chunks).toEqual([]);
    expect(onStop).not.toHaveBeenCalled();
  });

  it('reports unsupported environments', () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: undefined,
    });
    const onError = vi.fn();
    const { result } = renderHook(() => useMediaRecorder({ onError }));

    act(() => {
      result.current.start(createStream());
    });

    expect(result.current.isSupported).toBe(false);
    expect(result.current.status).toBe('unsupported');
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'NotSupportedError',
      }),
    );
  });

  it('reports a missing stream before recording starts', () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });
    const onError = vi.fn();
    const { result } = renderHook(() => useMediaRecorder({ onError }));

    act(() => {
      result.current.start();
    });

    expect(result.current.status).toBe('error');
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'NotFoundError',
      }),
    );
  });
});
