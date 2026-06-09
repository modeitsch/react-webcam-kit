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
});
