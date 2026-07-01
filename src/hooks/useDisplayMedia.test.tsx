import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDisplayMedia } from './useDisplayMedia';

const originalMediaDevices = navigator.mediaDevices;

function createStream() {
  const stop = vi.fn();
  let endedListener: (() => void) | null = null;
  const addEventListener = vi.fn((eventName: string, listener: () => void) => {
    if (eventName === 'ended') {
      endedListener = listener;
    }
  });
  const removeEventListener = vi.fn();
  const track = {
    addEventListener,
    removeEventListener,
    stop,
  };

  return {
    addEventListener,
    removeEventListener,
    stop,
    getTracks: () => [track],
    triggerEnded: () => endedListener?.(),
  } as unknown as MediaStream & {
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    triggerEnded: () => void;
  };
}

describe('useDisplayMedia', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    vi.restoreAllMocks();
  });

  it('reports unsupported browsers', () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {},
    });

    const { result } = renderHook(() => useDisplayMedia());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.status).toBe('unsupported');
  });

  it('starts screen capture with default video constraints', async () => {
    const stream = createStream();
    const getDisplayMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getDisplayMedia },
    });
    const onStart = vi.fn();

    const { result } = renderHook(() => useDisplayMedia({ onStart }));

    await act(async () => {
      await result.current.start();
    });

    expect(getDisplayMedia).toHaveBeenCalledWith({ audio: false, video: true });
    expect(result.current.stream).toBe(stream);
    expect(result.current.status).toBe('ready');
    expect(result.current.error).toBeNull();
    expect(onStart).toHaveBeenCalledWith(stream);
  });

  it('uses configured display media constraints', async () => {
    const stream = createStream();
    const getDisplayMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getDisplayMedia },
    });

    const { result } = renderHook(() =>
      useDisplayMedia({
        audio: true,
        video: {
          displaySurface: 'browser',
        },
      }),
    );

    await act(async () => {
      await result.current.start();
    });

    expect(getDisplayMedia).toHaveBeenCalledWith({
      audio: true,
      video: {
        displaySurface: 'browser',
      },
    });
  });

  it('stops the active screen stream', async () => {
    const stream = createStream();
    const getDisplayMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getDisplayMedia },
    });
    const onStop = vi.fn();

    const { result } = renderHook(() => useDisplayMedia({ onStop }));

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    expect(stream.stop).toHaveBeenCalledTimes(1);
    expect(result.current.stream).toBeNull();
    expect(result.current.status).toBe('stopped');
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('reacts when browser display sharing ends', async () => {
    const stream = createStream();
    const getDisplayMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getDisplayMedia },
    });
    const onStop = vi.fn();

    const { result } = renderHook(() => useDisplayMedia({ onStop }));

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      stream.triggerEnded();
    });

    expect(result.current.stream).toBeNull();
    expect(result.current.status).toBe('stopped');
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('normalizes display capture errors', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getDisplayMedia: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')),
      },
    });
    const onError = vi.fn();

    const { result } = renderHook(() => useDisplayMedia({ onError }));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('denied');
    expect(result.current.error).toMatchObject({
      type: 'permission-denied',
    });
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'permission-denied',
      }),
    );
  });
});
