import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import type { DetectedBarcode, UseBarcodeScannerOptions, UseBarcodeScannerResult } from '../types';
import { useFrameProcessor } from './useFrameProcessor';

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

function getBarcodeDetectorConstructor(): BarcodeDetectorConstructor | null {
  const candidate = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector;
  return typeof candidate === 'function' ? candidate : null;
}

/**
 * Scans the preview for QR codes and barcodes using the browser's native `BarcodeDetector`.
 *
 * Adds no bundle weight and no dependency: where the API is missing (Safari, Firefox at time
 * of writing) `isSupported` is `false` and the hook stays inert, so callers can fall back to a
 * library of their choice. Pair with `useCameraCapabilities().setTorch(true)` for low light.
 */
export function useBarcodeScanner(
  videoRef: RefObject<HTMLVideoElement | null>,
  options: UseBarcodeScannerOptions = {},
): UseBarcodeScannerResult {
  // `continuous` and `dedupeIntervalMs` are read from optionsRef inside the frame handler so
  // that changing them does not tear down the detection loop.
  const { enabled = true, fps = 10, formats } = options;

  const optionsRef = useRef(options);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const lastValueRef = useRef<{ at: number; value: string } | null>(null);
  const [results, setResults] = useState<DetectedBarcode[]>([]);
  const [lastResult, setLastResult] = useState<DetectedBarcode | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<string[]>([]);

  optionsRef.current = options;

  const isSupported = getBarcodeDetectorConstructor() !== null;
  const formatsKey = formats ? formats.join(',') : '';

  useEffect(() => {
    const Constructor = getBarcodeDetectorConstructor();

    if (!Constructor) {
      detectorRef.current = null;
      return undefined;
    }

    try {
      detectorRef.current = new Constructor(formatsKey ? { formats: formatsKey.split(',') } : {});
      setError(null);
    } catch (caughtError) {
      detectorRef.current = null;
      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error('Failed to construct BarcodeDetector.'),
      );
    }

    let cancelled = false;

    void Constructor.getSupportedFormats?.()
      .then((next) => {
        if (!cancelled) {
          setSupportedFormats(next);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      detectorRef.current = null;
    };
  }, [formatsKey]);

  const handleFrame = useCallback(async (video: HTMLVideoElement) => {
    const detector = detectorRef.current;

    if (!detector) {
      return;
    }

    const detected = await detector.detect(video);

    if (detected.length === 0) {
      return;
    }

    setResults(detected);

    const first = detected[0];

    if (!first) {
      return;
    }

    const timestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const previous = lastValueRef.current;
    const isRepeat =
      previous !== null &&
      previous.value === first.rawValue &&
      timestamp - previous.at < (optionsRef.current.dedupeIntervalMs ?? 1500);

    // A code stays in frame for many frames; without this the callback fires ~10x/second for
    // the same value and callers end up debouncing it themselves.
    if (isRepeat && !optionsRef.current.continuous) {
      return;
    }

    lastValueRef.current = { at: timestamp, value: first.rawValue };
    setLastResult(first);
    optionsRef.current.onDetected?.(first, detected);
  }, []);

  const handleError = useCallback((caughtError: unknown) => {
    const nextError =
      caughtError instanceof Error ? caughtError : new Error('Barcode detection failed.');
    setError(nextError);
    optionsRef.current.onError?.(nextError);
  }, []);

  const processor = useFrameProcessor(videoRef, {
    enabled: enabled && isSupported,
    fps,
    onError: handleError,
    onFrame: handleFrame,
  });

  const reset = useCallback(() => {
    lastValueRef.current = null;
    setResults([]);
    setLastResult(null);
  }, []);

  return {
    error,
    isScanning: processor.isRunning,
    isSupported,
    lastResult,
    reset,
    results,
    start: processor.start,
    stop: processor.stop,
    supportedFormats,
  };
}
