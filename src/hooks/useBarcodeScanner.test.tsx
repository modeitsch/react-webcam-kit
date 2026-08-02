import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useBarcodeScanner } from './useBarcodeScanner';
import type { DetectedBarcode, WebcamElementRef } from '../types';

function makeBarcode(rawValue: string, format = 'qr_code'): DetectedBarcode {
  return {
    boundingBox: new DOMRect(0, 0, 10, 10),
    cornerPoints: [],
    format,
    rawValue,
  };
}

function videoRefWith(readyState = 4): WebcamElementRef<HTMLVideoElement> {
  const video = document.createElement('video');
  Object.defineProperty(video, 'readyState', { configurable: true, value: readyState });
  Object.defineProperty(video, 'requestVideoFrameCallback', {
    configurable: true,
    value: undefined,
  });
  return { current: video };
}

let rafCallbacks: FrameRequestCallback[] = [];

function flushFrames(count = 1) {
  for (let i = 0; i < count; i += 1) {
    const pending = rafCallbacks;
    rafCallbacks = [];
    pending.forEach((callback) => {
      callback(performance.now());
    });
  }
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

describe('useBarcodeScanner', () => {
  it('reports unsupported and stays inert without BarcodeDetector', () => {
    const { result } = renderHook(() => useBarcodeScanner(videoRefWith()));

    expect(result.current.isSupported).toBe(false);
    expect(result.current.isScanning).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  it('detects a code and reports it once', async () => {
    const detect = vi.fn().mockResolvedValue([makeBarcode('https://example.com')]);
    vi.stubGlobal(
      'BarcodeDetector',
      class {
        detect = detect;
      },
    );
    const onDetected = vi.fn<(barcode: DetectedBarcode, all: DetectedBarcode[]) => void>();

    const { result } = renderHook(() => useBarcodeScanner(videoRefWith(), { fps: 0, onDetected }));

    expect(result.current.isSupported).toBe(true);

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });

    flushFrames();
    await waitFor(() => {
      expect(onDetected).toHaveBeenCalledTimes(1);
    });
    expect(onDetected.mock.calls[0]?.[0]?.rawValue).toBe('https://example.com');
    await waitFor(() => {
      expect(result.current.lastResult?.rawValue).toBe('https://example.com');
    });
  });

  it('suppresses the same value while it stays in frame', async () => {
    const detect = vi.fn().mockResolvedValue([makeBarcode('same-code')]);
    vi.stubGlobal(
      'BarcodeDetector',
      class {
        detect = detect;
      },
    );
    const onDetected = vi.fn();

    renderHook(() => useBarcodeScanner(videoRefWith(), { fps: 0, onDetected }));

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });

    // A code sits in frame for many frames; without dedupe this fires on every one.
    for (let i = 0; i < 5; i += 1) {
      flushFrames();
      await Promise.resolve();
    }

    await waitFor(() => {
      expect(onDetected).toHaveBeenCalledTimes(1);
    });
    expect(detect.mock.calls.length).toBeGreaterThan(1);
  });

  it('reports every frame when continuous is set', async () => {
    const detect = vi.fn().mockResolvedValue([makeBarcode('same-code')]);
    vi.stubGlobal(
      'BarcodeDetector',
      class {
        detect = detect;
      },
    );
    const onDetected = vi.fn();

    renderHook(() => useBarcodeScanner(videoRefWith(), { continuous: true, fps: 0, onDetected }));

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });

    for (let i = 0; i < 3; i += 1) {
      flushFrames();
      await Promise.resolve();
      await Promise.resolve();
    }

    await waitFor(() => {
      expect(onDetected.mock.calls.length).toBeGreaterThan(1);
    });
  });

  it('surfaces a detector failure through onError', async () => {
    const detect = vi.fn().mockRejectedValue(new Error('decode exploded'));
    vi.stubGlobal(
      'BarcodeDetector',
      class {
        detect = detect;
      },
    );
    const onError = vi.fn();

    const { result } = renderHook(() => useBarcodeScanner(videoRefWith(), { fps: 0, onError }));

    await waitFor(() => {
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });
    flushFrames();

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(result.current.error?.message).toBe('decode exploded');
    });
  });
});
