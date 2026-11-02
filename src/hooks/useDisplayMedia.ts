import { useCallback, useEffect, useRef, useState } from 'react';

import { normalizeMediaError } from '../errors/normalizeMediaError';
import { isDisplayMediaSupported, useIsSupported } from '../support/useIsSupported';
import type {
  CameraError,
  CameraStatus,
  UseDisplayMediaOptions,
  UseDisplayMediaResult,
} from '../types';

function buildConstraints(options: UseDisplayMediaOptions): DisplayMediaStreamOptions {
  return {
    audio: options.audio ?? false,
    video: options.video ?? true,
  };
}

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

export function useDisplayMedia(options: UseDisplayMediaOptions = {}): UseDisplayMediaResult {
  const optionsRef = useRef(options);
  const cleanupTrackListenersRef = useRef<(() => void) | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);
  const [error, setError] = useState<CameraError | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [internalStatus, setStatus] = useState<CameraStatus>('idle');
  // Probed through useSyncExternalStore so the server and the hydrating client agree.
  const isSupported = useIsSupported(isDisplayMediaSupported);
  const status: CameraStatus = isSupported ? internalStatus : 'unsupported';
  optionsRef.current = options;

  const clearTrackListeners = useCallback(() => {
    cleanupTrackListenersRef.current?.();
    cleanupTrackListenersRef.current = null;
  }, []);

  const watchStreamEnd = useCallback((nextStream: MediaStream) => {
    const handleEnded = () => {
      if (streamRef.current !== nextStream) {
        return;
      }

      cleanupTrackListenersRef.current?.();
      cleanupTrackListenersRef.current = null;
      stopStream(nextStream);
      streamRef.current = null;
      setStream(null);
      setStatus('stopped');
      optionsRef.current.onStop?.();
    };

    nextStream.getTracks().forEach((track) => {
      track.addEventListener?.('ended', handleEnded);
    });

    cleanupTrackListenersRef.current = () => {
      nextStream.getTracks().forEach((track) => {
        track.removeEventListener?.('ended', handleEnded);
      });
    };
  }, []);

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    const currentStream = streamRef.current;

    if (!currentStream) {
      setStatus((currentStatus) => (currentStatus === 'idle' ? 'idle' : 'stopped'));
      return;
    }

    setStatus('stopping');
    clearTrackListeners();
    stopStream(currentStream);
    streamRef.current = null;
    setStream(null);
    setStatus('stopped');
    optionsRef.current.onStop?.();
  }, [clearTrackListeners]);

  const start = useCallback(
    async (constraintsOverride?: DisplayMediaStreamOptions) => {
      if (!isDisplayMediaSupported()) {
        const unsupportedError: CameraError = {
          name: 'NotSupportedError',
          message: 'getDisplayMedia is not supported in this environment.',
          type: 'unsupported',
        };
        setError(unsupportedError);
        setStatus('unsupported');
        optionsRef.current.onError?.(unsupportedError);
        return null;
      }

      setStatus('requesting');
      setError(null);
      const requestId = ++requestIdRef.current;

      try {
        const nextStream = await navigator.mediaDevices.getDisplayMedia(
          constraintsOverride ?? buildConstraints(optionsRef.current),
        );

        if (requestId !== requestIdRef.current) {
          stopStream(nextStream);
          return null;
        }

        if (streamRef.current) {
          clearTrackListeners();
          stopStream(streamRef.current);
        }

        streamRef.current = nextStream;
        watchStreamEnd(nextStream);
        setStream(nextStream);
        setStatus('ready');
        optionsRef.current.onStart?.(nextStream);
        return nextStream;
      } catch (caughtError) {
        if (requestId !== requestIdRef.current) {
          return null;
        }
        const normalizedError = normalizeMediaError(caughtError);
        setError(normalizedError);
        setStatus(normalizedError.type === 'permission-denied' ? 'denied' : 'error');
        optionsRef.current.onError?.(normalizedError);
        return null;
      }
    },
    [clearTrackListeners, watchStreamEnd],
  );

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      const currentStream = streamRef.current;

      if (currentStream) {
        clearTrackListeners();
        stopStream(currentStream);
        streamRef.current = null;
        optionsRef.current.onStop?.();
      }
    };
  }, [clearTrackListeners]);

  return {
    error,
    isSupported,
    start,
    status,
    stop,
    stream,
  };
}
