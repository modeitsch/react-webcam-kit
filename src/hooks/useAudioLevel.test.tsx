import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAudioLevel } from './useAudioLevel';

let rafCallbacks: FrameRequestCallback[] = [];
let streamCounter = 0;

function flushFrame() {
  const pending = rafCallbacks;
  rafCallbacks = [];
  pending.forEach((callback) => {
    callback(performance.now());
  });
}

function createStream(withAudio = true) {
  const track = { kind: 'audio', stop: vi.fn() } as unknown as MediaStreamTrack;
  streamCounter += 1;

  return {
    id: `stream-${String(streamCounter)}`,
    getAudioTracks: () => (withAudio ? [track] : []),
    getTracks: () => (withAudio ? [track] : []),
  } as unknown as MediaStream;
}

/** Installs an AudioContext whose analyser emits a constant-amplitude square wave. */
function stubAudioContext(amplitude: number) {
  const close = vi.fn().mockResolvedValue(undefined);
  const disconnect = vi.fn();
  const analyser = {
    fftSize: 1024,
    frequencyBinCount: 512,
    smoothingTimeConstant: 0.8,
    getByteTimeDomainData: (target: Uint8Array) => {
      target.fill(128 + amplitude);
    },
    getByteFrequencyData: (target: Uint8Array) => {
      target.fill(64);
    },
  };

  vi.stubGlobal(
    'AudioContext',
    class {
      close = close;
      createAnalyser = () => analyser;
      createMediaStreamSource = () => ({ connect: vi.fn(), disconnect });
      resume = vi.fn().mockResolvedValue(undefined);
    },
  );

  return { analyser, close, disconnect };
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

describe('useAudioLevel', () => {
  it('reports unsupported without an AudioContext', () => {
    const stream = createStream();
    const { result } = renderHook(() => useAudioLevel(stream));

    expect(result.current.isSupported).toBe(false);
    expect(result.current.level).toBe(0);
  });

  it('stays idle for a stream with no audio tracks', () => {
    stubAudioContext(64);
    const stream = createStream(false);
    const { result } = renderHook(() => useAudioLevel(stream));

    expect(result.current.level).toBe(0);
    expect(rafCallbacks.length).toBe(0);
  });

  it('computes an RMS level from time-domain data', async () => {
    // Every sample sits 64/128 = 0.5 away from the 128 centre, so RMS is 0.5.
    stubAudioContext(64);
    const stream = createStream();

    const { result } = renderHook(() => useAudioLevel(stream, { updateInterval: 0 }));

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });
    flushFrame();

    await waitFor(() => {
      expect(result.current.level).toBeCloseTo(0.5, 5);
    });
    expect(result.current.peak).toBeCloseTo(0.5, 5);
  });

  it('reports silence as zero', async () => {
    stubAudioContext(0);
    const stream = createStream();

    const { result } = renderHook(() => useAudioLevel(stream, { updateInterval: 0 }));

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });
    flushFrame();

    expect(result.current.level).toBe(0);
  });

  it('does not rebuild the audio graph when the same stream is re-passed', async () => {
    const { close } = stubAudioContext(64);
    const stream = createStream();

    const { rerender } = renderHook(() => useAudioLevel(stream));

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });

    rerender();
    rerender();

    expect(close).not.toHaveBeenCalled();
  });

  it('throttles state updates but keeps getLevel() live', async () => {
    stubAudioContext(64);
    const stream = createStream();

    const { result } = renderHook(() =>
      // A long interval means React state should not update during this test...
      useAudioLevel(stream, { updateInterval: 100_000 }),
    );

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });
    flushFrame();

    expect(result.current.level).toBe(0);
    // ...but the imperative read reflects the measurement immediately.
    expect(result.current.getLevel()).toBeCloseTo(0.5, 5);
  });

  it('exposes waveform and frequency buffers', async () => {
    stubAudioContext(64);
    const stream = createStream();

    const { result } = renderHook(() => useAudioLevel(stream));

    await waitFor(() => {
      expect(result.current.getWaveform()).not.toBeNull();
    });
    expect(result.current.getWaveform()?.[0]).toBe(192);
    expect(result.current.getFrequencyData()?.[0]).toBe(64);
  });

  it('tears the audio graph down on unmount', async () => {
    const { close, disconnect } = stubAudioContext(64);
    const stream = createStream();

    const { unmount } = renderHook(() => useAudioLevel(stream));

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });
    unmount();

    expect(disconnect).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
