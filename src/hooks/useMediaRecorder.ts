import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  MediaRecorderError,
  RecordingQualityPreset,
  RecordingQualityPresetConfig,
  RecordingStatus,
  UseMediaRecorderOptions,
  UseMediaRecorderResult,
} from '../types';
import {
  DEFAULT_VIDEO_RECORDER_MIME_TYPES,
  getSupportedRecorderMimeTypes,
} from '../recording/codecSupport';
import { isMediaRecorderSupported, useIsSupported } from '../support/useIsSupported';

export const DEFAULT_RECORDER_MIME_TYPES = DEFAULT_VIDEO_RECORDER_MIME_TYPES;

export const RECORDING_QUALITY_PRESETS = {
  low: {
    audioBitsPerSecond: 48_000,
    frameRate: 20,
    height: 360,
    videoBitsPerSecond: 450_000,
    width: 640,
  },
  medium: {
    audioBitsPerSecond: 64_000,
    frameRate: 24,
    height: 480,
    videoBitsPerSecond: 900_000,
    width: 854,
  },
  high: {
    audioBitsPerSecond: 96_000,
    frameRate: 30,
    height: 540,
    videoBitsPerSecond: 1_500_000,
    width: 960,
  },
  hd: {
    audioBitsPerSecond: 128_000,
    frameRate: 30,
    height: 720,
    videoBitsPerSecond: 2_500_000,
    width: 1280,
  },
  'full-hd': {
    audioBitsPerSecond: 160_000,
    frameRate: 30,
    height: 1080,
    videoBitsPerSecond: 4_500_000,
    width: 1920,
  },
} satisfies Record<RecordingQualityPreset, RecordingQualityPresetConfig>;

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
  return getSupportedRecorderMimeTypes(candidates)[0] ?? null;
}

export function getRecordingPresetConstraints(
  quality: RecordingQualityPreset,
): MediaTrackConstraints {
  const preset = RECORDING_QUALITY_PRESETS[quality];

  return {
    frameRate: { ideal: preset.frameRate },
    height: { ideal: preset.height },
    width: { ideal: preset.width },
  };
}

// `performance.now()` is monotonic. `Date.now()` is not: an NTP correction or a suspend/resume
// can make a recording appear to jump forwards or even run backwards.
const getTime =
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? () => performance.now()
    : () => Date.now();

function buildRecorderOptions(options: UseMediaRecorderOptions): MediaRecorderOptions {
  const mimeType = options.mimeType ?? getSupportedMimeType() ?? undefined;
  const preset = options.quality ? RECORDING_QUALITY_PRESETS[options.quality] : null;

  return {
    ...(preset ? { audioBitsPerSecond: preset.audioBitsPerSecond } : {}),
    ...(options.audioBitsPerSecond ? { audioBitsPerSecond: options.audioBitsPerSecond } : {}),
    ...(options.bitsPerSecond ? { bitsPerSecond: options.bitsPerSecond } : {}),
    ...(mimeType ? { mimeType } : {}),
    ...(preset ? { videoBitsPerSecond: preset.videoBitsPerSecond } : {}),
    ...(options.videoBitsPerSecond ? { videoBitsPerSecond: options.videoBitsPerSecond } : {}),
  };
}

function resolveRecordingFileName(options: UseMediaRecorderOptions, blob: Blob) {
  const rawName = typeof options.fileName === 'function' ? options.fileName() : options.fileName;

  if (!rawName) {
    return null;
  }

  const extension = options.fileType ?? blob.type.split('/')[1] ?? 'webm';

  if (rawName.endsWith(`.${extension}`)) {
    return rawName;
  }

  return `${rawName}.${extension}`;
}

export function useMediaRecorder(options: UseMediaRecorderOptions = {}): UseMediaRecorderResult {
  const optionsRef = useRef(options);
  const activeSessionIdRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedBeforeCurrentRunRef = useRef(0);
  const maxDurationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const sessionIdRef = useRef(0);
  const chunksRef = useRef<Blob[]>([]);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<MediaRecorderError | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTimeLimitReached, setRecordingTimeLimitReached] = useState(false);
  const [internalStatus, setStatus] = useState<RecordingStatus>('idle');

  optionsRef.current = options;

  // Probed through useSyncExternalStore so the server and the hydrating client agree.
  const isSupported = useIsSupported(isMediaRecorderSupported);
  const status: RecordingStatus = isSupported ? internalStatus : 'unsupported';
  const mimeType = useMemo(
    () => options.mimeType ?? (isSupported ? getSupportedMimeType() : null),
    [isSupported, options.mimeType],
  );

  const clearDurationTimers = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
  }, []);

  const getDuration = useCallback(() => {
    const startedAt = recordingStartedAtRef.current;

    if (startedAt === null) {
      return elapsedBeforeCurrentRunRef.current;
    }

    return elapsedBeforeCurrentRunRef.current + getTime() - startedAt;
  }, []);

  const publishDuration = useCallback(() => {
    const nextDuration = getDuration();
    setDuration(nextDuration);
    return nextDuration;
  }, [getDuration]);

  const stopCurrentRecorder = useCallback(() => {
    const currentRecorder = recorderRef.current;

    if (!currentRecorder || currentRecorder.state === 'inactive') {
      return;
    }

    setStatus('stopping');
    currentRecorder.stop();
  }, []);

  const scheduleMaxDuration = useCallback(() => {
    if (!optionsRef.current.maxDuration) {
      return;
    }

    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
    }

    const remainingDuration = optionsRef.current.maxDuration - getDuration();

    if (remainingDuration <= 0) {
      const nextDuration = publishDuration();
      setRecordingTimeLimitReached(true);
      optionsRef.current.onMaxDuration?.(nextDuration);
      stopCurrentRecorder();
      return;
    }

    maxDurationTimeoutRef.current = setTimeout(() => {
      const nextDuration = publishDuration();
      setRecordingTimeLimitReached(true);
      optionsRef.current.onMaxDuration?.(nextDuration);
      stopCurrentRecorder();
    }, remainingDuration);
  }, [getDuration, publishDuration, stopCurrentRecorder]);

  const startDurationTracking = useCallback(() => {
    clearDurationTimers();
    recordingStartedAtRef.current = getTime();
    durationIntervalRef.current = setInterval(
      publishDuration,
      optionsRef.current.durationUpdateInterval ?? 250,
    );
    scheduleMaxDuration();
  }, [clearDurationTimers, publishDuration, scheduleMaxDuration]);

  const pauseDurationTracking = useCallback(() => {
    elapsedBeforeCurrentRunRef.current = getDuration();
    recordingStartedAtRef.current = null;
    clearDurationTimers();
    setDuration(elapsedBeforeCurrentRunRef.current);
  }, [clearDurationTimers, getDuration]);

  const resetDurationTracking = useCallback(() => {
    clearDurationTimers();
    elapsedBeforeCurrentRunRef.current = 0;
    recordingStartedAtRef.current = null;
    setDuration(0);
    setRecordingTimeLimitReached(false);
  }, [clearDurationTimers]);

  const reset = useCallback(() => {
    const currentRecorder = recorderRef.current;

    resetDurationTracking();
    activeSessionIdRef.current = null;
    chunksRef.current = [];
    recorderRef.current = null;
    setRecorder(null);
    setChunks([]);
    setBlob(null);
    setFile(null);
    setError(null);
    setStatus('idle');

    if (currentRecorder && currentRecorder.state !== 'inactive') {
      currentRecorder.stop();
    }
  }, [resetDurationTracking]);

  const cancel = reset;

  const setAudioMuted = useCallback((muted: boolean) => {
    const currentStream = recorderRef.current?.stream ?? optionsRef.current.stream;

    currentStream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });

    setIsAudioMuted(muted);
  }, []);

  const muteAudio = useCallback(() => {
    setAudioMuted(true);
  }, [setAudioMuted]);

  const unmuteAudio = useCallback(() => {
    setAudioMuted(false);
  }, [setAudioMuted]);

  const start = useCallback(
    (streamOverride?: MediaStream) => {
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
        const previousRecorder = recorderRef.current;

        if (previousRecorder && previousRecorder.state !== 'inactive') {
          activeSessionIdRef.current = null;
          previousRecorder.stop();
        }

        const sessionId = sessionIdRef.current + 1;
        const sessionChunks: Blob[] = [];
        sessionIdRef.current = sessionId;
        activeSessionIdRef.current = sessionId;
        chunksRef.current = [];
        resetDurationTracking();
        setChunks([]);
        setBlob(null);
        setFile(null);
        setError(null);

        const nextRecorder = new MediaRecorder(stream, buildRecorderOptions(optionsRef.current));
        recorderRef.current = nextRecorder;
        setRecorder(nextRecorder);

        nextRecorder.addEventListener('dataavailable', (event) => {
          if (sessionId !== activeSessionIdRef.current) {
            return;
          }

          optionsRef.current.onDataAvailable?.(event);

          if (event.data.size === 0) {
            return;
          }

          sessionChunks.push(event.data);
          chunksRef.current = sessionChunks;

          // Publishing a fresh array on every chunk re-renders the consumer tree at the
          // timeslice rate (10x/s for `timeslice: 100`). Callers streaming chunks should use
          // `onDataAvailable` or `getChunks()` and opt out with `publishChunks: false`.
          if (optionsRef.current.publishChunks !== false) {
            setChunks([...sessionChunks]);
          }
        });

        nextRecorder.addEventListener('error', (event) => {
          if (sessionId !== activeSessionIdRef.current) {
            return;
          }

          const nextError = normalizeRecorderError(event.error);
          setError(nextError);
          setStatus('error');
          optionsRef.current.onError?.(nextError);
        });

        nextRecorder.addEventListener('pause', () => {
          if (sessionId !== activeSessionIdRef.current) {
            return;
          }

          pauseDurationTracking();
          setStatus('paused');
          optionsRef.current.onPause?.();
        });

        nextRecorder.addEventListener('resume', () => {
          if (sessionId !== activeSessionIdRef.current) {
            return;
          }

          startDurationTracking();
          setStatus('recording');
          optionsRef.current.onResume?.();
        });

        nextRecorder.addEventListener('start', () => {
          if (sessionId !== activeSessionIdRef.current) {
            return;
          }

          startDurationTracking();
          setStatus('recording');
          optionsRef.current.onStart?.(nextRecorder);
        });

        nextRecorder.addEventListener('stop', () => {
          if (sessionId !== activeSessionIdRef.current) {
            return;
          }

          activeSessionIdRef.current = null;
          pauseDurationTracking();
          const recordedType =
            nextRecorder.mimeType.length > 0 ? nextRecorder.mimeType : optionsRef.current.mimeType;
          const finalChunks = [...sessionChunks];
          chunksRef.current = finalChunks;
          const recordedBlob = new Blob(finalChunks, {
            type: recordedType ?? '',
          });
          const fileName = resolveRecordingFileName(optionsRef.current, recordedBlob);
          const recordedFile = fileName
            ? new File([recordedBlob], fileName, { type: recordedBlob.type })
            : null;
          setChunks(finalChunks);
          setBlob(recordedBlob);
          setFile(recordedFile);
          setStatus('stopped');
          optionsRef.current.onStop?.(recordedBlob, finalChunks);
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
    },
    [pauseDurationTracking, resetDurationTracking, startDurationTracking],
  );

  const stop = useCallback(() => {
    stopCurrentRecorder();
  }, [stopCurrentRecorder]);

  const getChunks = useCallback(() => chunksRef.current, []);

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
      clearDurationTimers();
      if (recorderRef.current?.state !== 'inactive') {
        recorderRef.current?.stop();
      }
    },
    [clearDurationTimers],
  );

  return {
    blob,
    cancel,
    chunks,
    duration,
    error,
    file,
    getChunks,
    isAudioMuted,
    isSupported,
    mimeType,
    muteAudio,
    pause,
    get recorder() {
      return recorderRef.current ?? recorder;
    },
    reset,
    resume,
    recordingTimeLimitReached,
    setAudioMuted,
    start,
    status,
    stop,
    unmuteAudio,
  };
}
