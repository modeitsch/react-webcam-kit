import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  MediaRecorderError,
  RecordingStatus,
  UseMediaRecorderOptions,
  UseMediaRecorderResult,
} from '../types';

export const DEFAULT_RECORDER_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
];

function isMediaRecorderSupported() {
  return typeof MediaRecorder !== 'undefined';
}

function normalizeRecorderError(error: unknown): MediaRecorderError {
  if (error instanceof DOMException || error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message || 'MediaRecorder error.',
      cause: error,
    };
  }

  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
      cause: error,
    };
  }

  return {
    name: 'Error',
    message: 'MediaRecorder error.',
    cause: error,
  };
}

export function getSupportedMimeType(candidates = DEFAULT_RECORDER_MIME_TYPES) {
  if (!isMediaRecorderSupported() || typeof MediaRecorder.isTypeSupported !== 'function') {
    return null;
  }

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? null;
}

function buildRecorderOptions(options: UseMediaRecorderOptions): MediaRecorderOptions {
  const mimeType = options.mimeType ?? getSupportedMimeType() ?? undefined;

  return {
    ...(options.audioBitsPerSecond ? { audioBitsPerSecond: options.audioBitsPerSecond } : {}),
    ...(options.bitsPerSecond ? { bitsPerSecond: options.bitsPerSecond } : {}),
    ...(mimeType ? { mimeType } : {}),
    ...(options.videoBitsPerSecond ? { videoBitsPerSecond: options.videoBitsPerSecond } : {}),
  };
}

export function useMediaRecorder(options: UseMediaRecorderOptions = {}): UseMediaRecorderResult {
  const optionsRef = useRef(options);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [error, setError] = useState<MediaRecorderError | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [status, setStatus] = useState<RecordingStatus>(
    isMediaRecorderSupported() ? 'idle' : 'unsupported',
  );

  optionsRef.current = options;

  const isSupported = isMediaRecorderSupported();
  const mimeType = useMemo(() => options.mimeType ?? getSupportedMimeType(), [options.mimeType]);

  const reset = useCallback(() => {
    chunksRef.current = [];
    setChunks([]);
    setBlob(null);
    setError(null);
    setStatus(isMediaRecorderSupported() ? 'idle' : 'unsupported');
  }, []);

  const start = useCallback((streamOverride?: MediaStream) => {
    if (!isMediaRecorderSupported()) {
      const unsupportedError = {
        name: 'NotSupportedError',
        message: 'MediaRecorder is not supported in this environment.',
      };
      setError(unsupportedError);
      setStatus('unsupported');
      optionsRef.current.onError?.(unsupportedError);
      return null;
    }

    const stream = streamOverride ?? optionsRef.current.stream;

    if (!stream) {
      const streamError = {
        name: 'NotFoundError',
        message: 'No MediaStream was provided for recording.',
      };
      setError(streamError);
      setStatus('error');
      optionsRef.current.onError?.(streamError);
      return null;
    }

    try {
      recorderRef.current?.stop();
      chunksRef.current = [];
      setChunks([]);
      setBlob(null);
      setError(null);

      const nextRecorder = new MediaRecorder(stream, buildRecorderOptions(optionsRef.current));
      recorderRef.current = nextRecorder;
      setRecorder(nextRecorder);

      nextRecorder.addEventListener('dataavailable', (event) => {
        optionsRef.current.onDataAvailable?.(event);

        if (event.data.size === 0) {
          return;
        }

        chunksRef.current = [...chunksRef.current, event.data];
        setChunks(chunksRef.current);
      });

      nextRecorder.addEventListener('error', (event) => {
        const nextError = normalizeRecorderError(event.error);
        setError(nextError);
        setStatus('error');
        optionsRef.current.onError?.(nextError);
      });

      nextRecorder.addEventListener('pause', () => {
        setStatus('paused');
        optionsRef.current.onPause?.();
      });

      nextRecorder.addEventListener('resume', () => {
        setStatus('recording');
        optionsRef.current.onResume?.();
      });

      nextRecorder.addEventListener('start', () => {
        setStatus('recording');
        optionsRef.current.onStart?.(nextRecorder);
      });

      nextRecorder.addEventListener('stop', () => {
        const recordedType =
          nextRecorder.mimeType.length > 0 ? nextRecorder.mimeType : optionsRef.current.mimeType;
        const recordedBlob = new Blob(chunksRef.current, {
          type: recordedType ?? '',
        });
        setBlob(recordedBlob);
        setStatus('stopped');
        optionsRef.current.onStop?.(recordedBlob, chunksRef.current);
      });

      nextRecorder.start(optionsRef.current.timeslice);
      return nextRecorder;
    } catch (caughtError) {
      const nextError = normalizeRecorderError(caughtError);
      setError(nextError);
      setStatus('error');
      optionsRef.current.onError?.(nextError);
      return null;
    }
  }, []);

  const stop = useCallback(() => {
    const currentRecorder = recorderRef.current;

    if (!currentRecorder || currentRecorder.state === 'inactive') {
      return;
    }

    setStatus('stopping');
    currentRecorder.stop();
  }, []);

  const pause = useCallback(() => {
    const currentRecorder = recorderRef.current;

    if (currentRecorder?.state === 'recording') {
      currentRecorder.pause();
    }
  }, []);

  const resume = useCallback(() => {
    const currentRecorder = recorderRef.current;

    if (currentRecorder?.state === 'paused') {
      currentRecorder.resume();
    }
  }, []);

  useEffect(
    () => () => {
      if (recorderRef.current?.state !== 'inactive') {
        recorderRef.current?.stop();
      }
    },
    [],
  );

  return {
    blob,
    chunks,
    error,
    isSupported,
    mimeType,
    pause,
    get recorder() {
      return recorderRef.current ?? recorder;
    },
    reset,
    resume,
    start,
    status,
    stop,
  };
}
