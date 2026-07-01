import { useCallback, useEffect, useRef, useState } from 'react';

import { normalizeMediaError } from '../errors/normalizeMediaError';
import { getSupportedAudioMimeTypes } from '../recording/codecSupport';
import type {
  CameraError,
  CameraStatus,
  UseAudioRecorderOptions,
  UseAudioRecorderResult,
} from '../types';
import { useMediaRecorder } from './useMediaRecorder';

function isAudioMediaSupported() {
  return (
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
  );
}

function buildAudioConstraints(options: UseAudioRecorderOptions): MediaStreamConstraints {
  return {
    audio: options.audioConstraints ?? true,
    video: false,
  };
}

function stopMediaStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderResult {
  const optionsRef = useRef(options);
  const streamRef = useRef<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<CameraError | null>(null);
  const [mediaStatus, setMediaStatus] = useState<CameraStatus>(
    isAudioMediaSupported() ? 'idle' : 'unsupported',
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const isMediaSupported = isAudioMediaSupported();
  optionsRef.current = options;

  const recorder = useMediaRecorder({
    ...options,
    mimeType: options.mimeType ?? getSupportedAudioMimeTypes()[0],
    stream,
  });

  const stopStream = useCallback(() => {
    const currentStream = streamRef.current;

    if (!currentStream) {
      setMediaStatus((currentStatus) => (currentStatus === 'idle' ? 'idle' : 'stopped'));
      return;
    }

    setMediaStatus('stopping');
    stopMediaStream(currentStream);
    streamRef.current = null;
    setStream(null);
    setMediaStatus('stopped');
    optionsRef.current.onMediaStop?.();
  }, []);

  const start = useCallback(async () => {
    if (!isAudioMediaSupported()) {
      const unsupportedError: CameraError = {
        name: 'NotSupportedError',
        message: 'getUserMedia is not supported in this environment.',
        type: 'unsupported',
      };
      setMediaError(unsupportedError);
      setMediaStatus('unsupported');
      optionsRef.current.onMediaError?.(unsupportedError);
      return null;
    }

    setMediaStatus('requesting');
    setMediaError(null);

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia(
        buildAudioConstraints(optionsRef.current),
      );

      if (streamRef.current) {
        stopMediaStream(streamRef.current);
      }

      streamRef.current = nextStream;
      setStream(nextStream);
      setMediaStatus('ready');
      optionsRef.current.onMediaStart?.(nextStream);

      const nextRecorder = recorder.start(nextStream);

      if (!nextRecorder) {
        stopMediaStream(nextStream);
        streamRef.current = null;
        setStream(null);
        setMediaStatus('stopped');
      }

      return nextRecorder;
    } catch (caughtError) {
      const normalizedError = normalizeMediaError(caughtError);
      setMediaError(normalizedError);
      setMediaStatus(normalizedError.type === 'permission-denied' ? 'denied' : 'error');
      optionsRef.current.onMediaError?.(normalizedError);
      return null;
    }
  }, [recorder]);

  const stop = useCallback(() => {
    recorder.stop();
    stopStream();
  }, [recorder, stopStream]);

  useEffect(() => {
    return () => {
      const currentStream = streamRef.current;

      if (currentStream) {
        stopMediaStream(currentStream);
        streamRef.current = null;
        optionsRef.current.onMediaStop?.();
      }
    };
  }, []);

  return {
    ...recorder,
    isMediaSupported,
    mediaError,
    mediaStatus,
    start,
    stop,
    stopStream,
    stream,
  };
}
