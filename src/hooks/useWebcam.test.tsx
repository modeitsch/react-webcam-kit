import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useWebcam } from './useWebcam';

function createTrack(kind: MediaStreamTrack['kind']) {
  const stop = vi.fn();
  return {
    stop,
    track: {
      kind,
      stop,
    } as unknown as MediaStreamTrack,
  };
}

function createStream() {
  const videoTrack = createTrack('video');
  const audioTrack = createTrack('audio');
  return {
    audioTrack: audioTrack.track,
    audioTrackStop: audioTrack.stop,
    stream: {
      getAudioTracks: () => [audioTrack.track],
      getTracks: () => [videoTrack.track, audioTrack.track],
      getVideoTracks: () => [videoTrack.track],
    } as unknown as MediaStream,
    videoTrack: videoTrack.track,
    videoTrackStop: videoTrack.stop,
  };
}

const originalMediaDevices = navigator.mediaDevices;

describe('useWebcam', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    vi.restoreAllMocks();
  });

  it('starts a stream, attaches it to the video element, and stops tracks', async () => {
    const { audioTrackStop, stream, videoTrackStop } = createStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia,
      },
    });

    const { result } = renderHook(() => useWebcam({ audio: true, startOnMount: false }));
    const video = document.createElement('video');

    act(() => {
      result.current.videoRef.current = video;
    });
    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    expect(video.srcObject).toBe(stream);
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true, video: true });

    act(() => {
      result.current.stop();
    });

    expect(videoTrackStop).toHaveBeenCalledTimes(1);
    expect(audioTrackStop).toHaveBeenCalledTimes(1);
    expect(video.srcObject).toBeNull();
    expect(result.current.status).toBe('stopped');
  });

  it('switches devices with an exact deviceId constraint', async () => {
    const first = createStream();
    const second = createStream();
    const getUserMedia = vi
      .fn()
      .mockResolvedValueOnce(first.stream)
      .mockResolvedValueOnce(second.stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia,
      },
    });

    const { result } = renderHook(() => useWebcam({ startOnMount: false }));

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.switchDevice('camera-2');
    });

    expect(first.videoTrackStop).toHaveBeenCalledTimes(1);
    expect(getUserMedia).toHaveBeenLastCalledWith({
      video: { deviceId: { exact: 'camera-2' } },
    });
    expect(result.current.selectedDeviceId).toBe('camera-2');
  });

  it('restarts the stream when audio or video constraints change', async () => {
    const first = createStream();
    const second = createStream();
    const getUserMedia = vi
      .fn()
      .mockResolvedValueOnce(first.stream)
      .mockResolvedValueOnce(second.stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia,
      },
    });

    const { rerender, result } = renderHook(
      ({ audio }: { audio: boolean }) =>
        useWebcam({
          audio,
          videoConstraints: { width: { ideal: 640 } },
        }),
      {
        initialProps: { audio: false },
      },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    rerender({ audio: true });

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(2);
    });
    expect(first.videoTrackStop).toHaveBeenCalledTimes(1);
    expect(getUserMedia).toHaveBeenLastCalledWith({
      audio: true,
      video: { width: { ideal: 640 } },
    });
  });

  it('calls onStop when an active stream is cleaned up on unmount', async () => {
    const active = createStream();
    const onStop = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(active.stream),
      },
    });

    const { result, unmount } = renderHook(() => useWebcam({ onStop }));

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    unmount();

    expect(active.videoTrackStop).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('uses the latest onStop callback when an active stream is cleaned up on unmount', async () => {
    const active = createStream();
    const firstOnStop = vi.fn();
    const latestOnStop = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(active.stream),
      },
    });

    const { rerender, result, unmount } = renderHook(
      ({ onStop }: { onStop: () => void }) => useWebcam({ onStop }),
      {
        initialProps: { onStop: firstOnStop },
      },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    rerender({ onStop: latestOnStop });
    unmount();

    expect(firstOnStop).not.toHaveBeenCalled();
    expect(latestOnStop).toHaveBeenCalledTimes(1);
  });

  it('applies advanced constraints to the active video track', async () => {
    const active = createStream();
    const applyConstraints = vi.fn().mockResolvedValue(undefined);
    Object.assign(active.videoTrack, { applyConstraints });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(active.stream),
      },
    });

    const { result } = renderHook(() => useWebcam());

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    await act(async () => {
      await result.current.applyVideoConstraints({
        advanced: [{ torch: true } as MediaTrackConstraintSet],
      });
    });

    expect(applyConstraints).toHaveBeenCalledWith({
      advanced: [{ torch: true }],
    });
  });
});
