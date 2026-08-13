import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFrameProcessorOptions, UseFrameProcessorResult, WebcamElementRef } from '../types';

/**
 * Declared separately rather than extending HTMLVideoElement: newer TypeScript DOM libs declare
 * these as required members, older ones not at all, so neither `extends` nor an intersection
 * describes "may or may not be present" across versions.
 */
interface VideoFrameCallbackApi {
  requestVideoFrameCallback?: (callback: (now: number, metadata: unknown) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
}

function asFrameCallbackApi(video: HTMLVideoElement | null) {
  return video as unknown as VideoFrameCallbackApi | null;
}

const now =
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? () => performance.now()
    : () => Date.now();

/**
 * Runs a callback for each rendered video frame.
 *
 * Uses `requestVideoFrameCallback` when the browser has it, which fires once per *decoded*
 * frame rather than once per display refresh, and falls back to `requestAnimationFrame`.
 * Frames are dropped rather than queued while `onFrame` is still running, so a slow handler
 * (barcode decoding, an ML model) cannot build up an unbounded backlog.
 */
export function useFrameProcessor(
  videoRef: WebcamElementRef<HTMLVideoElement>,
  options: UseFrameProcessorOptions,
): UseFrameProcessorResult {
  const { enabled = true } = options;
  const optionsRef = useRef(options);
  // Held in a ref so `start`/`stop` stay referentially stable even when the caller passes a
  // freshly created ref object each render. Without this, the auto-start effect would tear the
  // loop down and rebuild it on every render.
  const videoRefRef = useRef(videoRef);
  const runningRef = useRef(false);
  const busyRef = useRef(false);
  const lastFrameAtRef = useRef(0);
  const rafHandleRef = useRef<number | null>(null);
  const videoFrameHandleRef = useRef<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  optionsRef.current = options;
  videoRefRef.current = videoRef;

  const cancelScheduled = useCallback(() => {
    if (rafHandleRef.current !== null) {
      cancelAnimationFrame(rafHandleRef.current);
      rafHandleRef.current = null;
    }

    if (videoFrameHandleRef.current !== null) {
      const handle = videoFrameHandleRef.current;
      videoFrameHandleRef.current = null;
      asFrameCallbackApi(videoRefRef.current.current)?.cancelVideoFrameCallback?.(handle);
    }
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    cancelScheduled();
    setIsRunning(false);
  }, [cancelScheduled]);

  const start = useCallback(() => {
    if (runningRef.current) {
      return;
    }

    runningRef.current = true;
    setIsRunning(true);

    const schedule = () => {
      if (!runningRef.current) {
        return;
      }

      const video = asFrameCallbackApi(videoRefRef.current.current);

      if (typeof video?.requestVideoFrameCallback === 'function') {
        videoFrameHandleRef.current = video.requestVideoFrameCallback((_now, metadata) => {
          videoFrameHandleRef.current = null;
          void tick(metadata);
        });
        return;
      }

      rafHandleRef.current = requestAnimationFrame(() => {
        rafHandleRef.current = null;
        void tick();
      });
    };

    const tick = async (metadata?: unknown) => {
      if (!runningRef.current) {
        return;
      }

      const video = videoRefRef.current.current;
      const { fps, onError, onFrame } = optionsRef.current;
      const minInterval = fps && fps > 0 ? 1000 / fps : 0;
      const timestamp = now();
      // readyState >= HAVE_CURRENT_DATA: there is a frame to read.
      const isReady = video !== null && video.readyState >= 2;

      if (isReady && !busyRef.current && timestamp - lastFrameAtRef.current >= minInterval) {
        lastFrameAtRef.current = timestamp;
        busyRef.current = true;

        try {
          await onFrame(video, metadata);
        } catch (caughtError) {
          onError?.(caughtError);
        } finally {
          busyRef.current = false;
        }
      }

      schedule();
    };

    schedule();
  }, []);

  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [enabled, start, stop]);

  return { isRunning, start, stop };
}
