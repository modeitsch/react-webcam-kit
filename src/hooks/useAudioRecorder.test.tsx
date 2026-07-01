import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAudioRecorder } from './useAudioRecorder';

class MockMediaRecorder extends EventTarget {
  static isTypeSupported = vi.fn((mimeType: string) => mimeType === 'audio/webm');

  mimeType: string;
  options: MediaRecorderOptions;
  state: RecordingState = 'inactive';
  stream: MediaStream;
  start = vi.fn((timeslice?: number) => {
    this.state = 'recording';
    this.timeslice = timeslice;
    this.dispatchEvent(new Event('start'));
  });
  stop = vi.fn(() => {
    this.state = 'inactive';
    this.dispatchEvent(new Event('stop'));
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
    this.options = options;
  }
}

const OriginalMediaRecorder = globalThis.MediaRecorder;
const originalMediaDevices = navigator.mediaDevices;

function createAudioStream() {
  const stop = vi.fn();
  const audioTrack = {
    enabled: true,
    stop,
  };

  return {
    audioTrack,
    getAudioTracks: () => [audioTrack],
    getTracks: () => [audioTrack],
  } as unknown as MediaStream & {
    audioTrack: {
      enabled: boolean;
      stop: ReturnType<typeof vi.fn>;
    };
  };
}

describe('useAudioRecorder', () => {
  afterEach(() => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: OriginalMediaRecorder,
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    vi.restoreAllMocks();
  });

  it('reports unsupported microphone capture', async () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {},
    });
    const onMediaError = vi.fn();

    const { result } = renderHook(() => useAudioRecorder({ onMediaError }));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.isMediaSupported).toBe(false);
    expect(result.current.mediaStatus).toBe('unsupported');
    expect(onMediaError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'unsupported',
      }),
    );
  });

  it('requests an audio-only stream and starts recording', async () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });
    const stream = createAudioStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    const onMediaStart = vi.fn();

    const { result } = renderHook(() =>
      useAudioRecorder({
        fileName: 'voice-note',
        onMediaStart,
        quality: 'medium',
      }),
    );

    let recorder: MockMediaRecorder | null = null;

    await act(async () => {
      recorder = (await result.current.start()) as unknown as MockMediaRecorder | null;
    });

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true, video: false });
    expect((recorder as MockMediaRecorder | null)?.stream).toBe(stream);
    expect(result.current.stream).toBe(stream);
    expect(result.current.mediaStatus).toBe('ready');
    expect(result.current.status).toBe('recording');
    expect(onMediaStart).toHaveBeenCalledWith(stream);
  });

  it('uses configured audio constraints', async () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });
    const stream = createAudioStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });

    const { result } = renderHook(() =>
      useAudioRecorder({
        audioConstraints: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      }),
    );

    await act(async () => {
      await result.current.start();
    });

    expect(getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    });
  });

  it('stops recording and microphone tracks', async () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });
    const stream = createAudioStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    const onMediaStop = vi.fn();

    const { result } = renderHook(() => useAudioRecorder({ onMediaStop }));

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    expect(stream.audioTrack.stop).toHaveBeenCalledTimes(1);
    expect(result.current.stream).toBeNull();
    expect(result.current.mediaStatus).toBe('stopped');
    expect(result.current.status).toBe('stopped');
    expect(onMediaStop).toHaveBeenCalledTimes(1);
  });

  it('normalizes microphone permission errors', async () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')),
      },
    });
    const onMediaError = vi.fn();

    const { result } = renderHook(() => useAudioRecorder({ onMediaError }));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.mediaStatus).toBe('denied');
    expect(result.current.mediaError).toMatchObject({
      type: 'permission-denied',
    });
    expect(onMediaError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'permission-denied',
      }),
    );
  });
});
