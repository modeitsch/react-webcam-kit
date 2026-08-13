import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useWebcam } from './useWebcam';

const originalMediaDevices = navigator.mediaDevices;

function createStream() {
  const listeners = new Map<string, Set<() => void>>();
  const track = {
    kind: 'video' as const,
    stop: vi.fn(),
    addEventListener: (type: string, handler: () => void) => {
      const set = listeners.get(type) ?? new Set();
      set.add(handler);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, handler: () => void) => {
      listeners.get(type)?.delete(handler);
    },
  };

  return {
    emit: (type: string) => {
      listeners.get(type)?.forEach((handler) => {
        handler();
      });
    },
    stream: {
      getAudioTracks: () => [],
      getTracks: () => [track],
      getVideoTracks: () => [track],
    } as unknown as MediaStream,
    track,
  };
}

function mockMediaDevices(getUserMedia: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      addEventListener: vi.fn(),
      enumerateDevices: vi.fn().mockResolvedValue([]),
      getUserMedia,
      removeEventListener: vi.fn(),
    },
  });
}

afterEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: originalMediaDevices,
  });
  vi.restoreAllMocks();
});

describe('useWebcam lifecycle', () => {
  it('stays stopped after an explicit stop() and does not reacquire the camera', async () => {
    const getUserMedia = vi.fn().mockImplementation(() => Promise.resolve(createStream().stream));
    mockMediaDevices(getUserMedia);

    const { result } = renderHook(() => useWebcam());
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    const callsWhenReady = getUserMedia.mock.calls.length;

    act(() => {
      result.current.stop();
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.status).toBe('stopped');
    expect(result.current.stream).toBeNull();
    expect(getUserMedia.mock.calls.length).toBe(callsWhenReady);
  });

  it('restarts on demand after stop()', async () => {
    const getUserMedia = vi.fn().mockImplementation(() => Promise.resolve(createStream().stream));
    mockMediaDevices(getUserMedia);

    const { result } = renderHook(() => useWebcam());
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    act(() => {
      result.current.stop();
    });
    await waitFor(() => {
      expect(result.current.status).toBe('stopped');
    });

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('ready');
  });

  it('does not retry in a loop when permission is denied', async () => {
    const getUserMedia = vi
      .fn()
      .mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
    mockMediaDevices(getUserMedia);

    const { result } = renderHook(() => useWebcam());
    await waitFor(() => {
      expect(result.current.status).toBe('denied');
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(getUserMedia.mock.calls.length).toBe(1);
  });

  it('does not retry in a loop when the caller passes inline callbacks', async () => {
    const getUserMedia = vi
      .fn()
      .mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
    mockMediaDevices(getUserMedia);

    const { result } = renderHook(() =>
      // Inline handlers get a new identity on every render, which used to make `start`
      // unstable and drive an unbounded getUserMedia retry loop.
      useWebcam({ onError: () => undefined, onUserMediaError: () => undefined }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe('denied');
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(getUserMedia.mock.calls.length).toBe(1);
  });

  it('does not retry in a loop when the device is busy', async () => {
    const getUserMedia = vi
      .fn()
      .mockRejectedValue(new DOMException('Device in use', 'NotReadableError'));
    mockMediaDevices(getUserMedia);

    const { result } = renderHook(() => useWebcam());
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(getUserMedia.mock.calls.length).toBe(1);
  });

  it('keeps start and stop referentially stable across renders', async () => {
    const getUserMedia = vi.fn().mockImplementation(() => Promise.resolve(createStream().stream));
    mockMediaDevices(getUserMedia);

    const { result, rerender } = renderHook(() => useWebcam({ onError: () => undefined }));
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    const { start, stop, restart, switchDevice } = result.current;
    rerender();

    expect(result.current.start).toBe(start);
    expect(result.current.stop).toBe(stop);
    expect(result.current.restart).toBe(restart);
    expect(result.current.switchDevice).toBe(switchDevice);
  });

  it('attaches the stream to a video element that mounts after the stream is ready', async () => {
    const { stream } = createStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    mockMediaDevices(getUserMedia);

    const { result, rerender } = renderHook(() => useWebcam());
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    // Simulates `{status === 'ready' && <video ref={videoRef} />}` — the element only exists
    // after the stream resolved, so the ref was still null when the stream was acquired.
    const video = document.createElement('video');
    act(() => {
      result.current.videoRef.current = video;
    });
    rerender();

    await waitFor(() => {
      expect(video.srcObject).toBe(stream);
    });
  });

  it('attaches the stream through getVideoProps on mount', async () => {
    const { stream } = createStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    mockMediaDevices(getUserMedia);

    const { result } = renderHook(() => useWebcam());
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    const video = document.createElement('video');
    const props = result.current.getVideoProps();

    expect(props.autoPlay).toBe(true);
    expect(props.playsInline).toBe(true);

    act(() => {
      (props.ref as (node: HTMLVideoElement | null) => void)(video);
    });

    expect(video.srcObject).toBe(stream);
  });

  it('reports a stopped stream when the underlying track ends', async () => {
    const { emit, stream } = createStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    mockMediaDevices(getUserMedia);
    const onStop = vi.fn();

    const { result } = renderHook(() => useWebcam({ onStop }));
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    // Camera unplugged, or grabbed by another application.
    act(() => {
      emit('ended');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('stopped');
    });
    expect(result.current.stream).toBeNull();
    expect(onStop).toHaveBeenCalled();
  });

  it('keeps the previous stream alive until the replacement is live when switching devices', async () => {
    const first = createStream();
    const second = createStream();
    const getUserMedia = vi
      .fn()
      .mockResolvedValueOnce(first.stream)
      .mockImplementationOnce(
        () =>
          new Promise<MediaStream>((resolve) => {
            setTimeout(() => {
              // The old track must still be running while the new one is being acquired.
              expect(first.track.stop).not.toHaveBeenCalled();
              resolve(second.stream);
            }, 20);
          }),
      );
    mockMediaDevices(getUserMedia);

    const { result } = renderHook(() => useWebcam());
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    await act(async () => {
      await result.current.switchDevice('camera-2');
    });

    expect(result.current.stream).toBe(second.stream);
    expect(first.track.stop).toHaveBeenCalled();
    expect(result.current.selectedDeviceId).toBe('camera-2');
  });

  it('resumes the previous run state when enabled is toggled off and back on', async () => {
    const getUserMedia = vi.fn().mockImplementation(() => Promise.resolve(createStream().stream));
    mockMediaDevices(getUserMedia);

    const { result, rerender } = renderHook(({ enabled }) => useWebcam({ enabled }), {
      initialProps: { enabled: true },
    });
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    rerender({ enabled: false });
    await waitFor(() => {
      expect(result.current.status).toBe('stopped');
    });

    rerender({ enabled: true });
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
  });

  it('does not auto-start when the consumer stopped the camera before disabling it', async () => {
    const getUserMedia = vi.fn().mockImplementation(() => Promise.resolve(createStream().stream));
    mockMediaDevices(getUserMedia);

    const { result, rerender } = renderHook(({ enabled }) => useWebcam({ enabled }), {
      initialProps: { enabled: true },
    });
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    act(() => {
      result.current.stop();
    });
    const callsAfterStop = getUserMedia.mock.calls.length;

    rerender({ enabled: false });
    rerender({ enabled: true });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(getUserMedia.mock.calls.length).toBe(callsAfterStop);
    expect(result.current.status).toBe('stopped');
  });
});
