import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFrameProcessor } from './useFrameProcessor';

let rafCallbacks: FrameRequestCallback[] = [];

function flushFrame() {
  const pending = rafCallbacks;
  rafCallbacks = [];
  pending.forEach((callback) => {
    callback(performance.now());
  });
}

function videoRef(readyState = 4, withVideoFrameCallback = false) {
  const video = document.createElement('video');
  Object.defineProperty(video, 'readyState', { configurable: true, value: readyState });

  if (withVideoFrameCallback) {
    Object.defineProperty(video, 'requestVideoFrameCallback', {
      configurable: true,
      value: (callback: (now: number, metadata: unknown) => void) => {
        rafCallbacks.push(() => {
          callback(performance.now(), { presentedFrames: 1 });
        });
        return rafCallbacks.length;
      },
    });
    Object.defineProperty(video, 'cancelVideoFrameCallback', {
      configurable: true,
      value: () => undefined,
    });
  }

  return { current: video };
}

beforeEach(() => {
  rafCallbacks = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    rafCallbacks.push(callback);
    return rafCallbacks.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useFrameProcessor', () => {
  it('calls onFrame with the video element', async () => {
    const onFrame = vi.fn();
    const ref = videoRef();

    renderHook(() => useFrameProcessor(ref, { fps: 0, onFrame }));

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });
    flushFrame();

    await waitFor(() => {
      expect(onFrame).toHaveBeenCalledWith(ref.current, undefined);
    });
  });

  it('prefers requestVideoFrameCallback and forwards its metadata', async () => {
    const onFrame = vi.fn();
    const ref = videoRef(4, true);

    renderHook(() => useFrameProcessor(ref, { fps: 0, onFrame }));

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });
    flushFrame();

    await waitFor(() => {
      expect(onFrame).toHaveBeenCalledWith(ref.current, { presentedFrames: 1 });
    });
  });

  it('skips frames while the video has no data', async () => {
    const onFrame = vi.fn();

    renderHook(() => useFrameProcessor(videoRef(0), { fps: 0, onFrame }));

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });
    flushFrame();
    flushFrame();

    expect(onFrame).not.toHaveBeenCalled();
  });

  it('drops frames instead of queueing while an async handler is pending', async () => {
    let release: (() => void) | null = null;
    const onFrame = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );

    renderHook(() => useFrameProcessor(videoRef(), { fps: 0, onFrame }));

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });

    flushFrame();
    await waitFor(() => {
      expect(onFrame).toHaveBeenCalledTimes(1);
    });

    // Further frames arrive while the first call is still pending.
    flushFrame();
    flushFrame();
    expect(onFrame).toHaveBeenCalledTimes(1);

    await act(async () => {
      release?.();
      await Promise.resolve();
    });
  });

  it('reports handler errors without stopping the loop', async () => {
    const onError = vi.fn();
    const onFrame = vi.fn().mockRejectedValue(new Error('frame blew up'));

    const { result } = renderHook(() =>
      useFrameProcessor(videoRef(), { fps: 0, onError, onFrame }),
    );

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });
    flushFrame();

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
    expect(result.current.isRunning).toBe(true);
  });

  it('does not start when disabled and starts on demand', async () => {
    const onFrame = vi.fn();

    const { result } = renderHook(() =>
      useFrameProcessor(videoRef(), { enabled: false, fps: 0, onFrame }),
    );

    expect(result.current.isRunning).toBe(false);
    expect(rafCallbacks.length).toBe(0);

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.isRunning).toBe(true);
    });
    flushFrame();
    await waitFor(() => {
      expect(onFrame).toHaveBeenCalled();
    });
  });

  it('stops scheduling after stop()', async () => {
    const onFrame = vi.fn();

    const { result } = renderHook(() => useFrameProcessor(videoRef(), { fps: 0, onFrame }));

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.stop();
    });
    rafCallbacks = [];
    flushFrame();

    expect(result.current.isRunning).toBe(false);
    expect(rafCallbacks.length).toBe(0);
  });
});
