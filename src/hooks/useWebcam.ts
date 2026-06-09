import { useCallback, useEffect, useRef, useState } from 'react';

import { captureFrame } from '../capture/captureFrame';
import { normalizeMediaError } from '../errors/normalizeMediaError';
import type {
  CameraError,
  CameraStatus,
  ScreenshotOptions,
  UseWebcamOptions,
  UseWebcamResult,
} from '../types';

function isMediaSupported() {
  return (
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
  );
}

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

function buildConstraints(
  options: UseWebcamOptions,
  override?: MediaStreamConstraints,
): MediaStreamConstraints {
  if (override) {
    return override;
  }

  const constraints: MediaStreamConstraints = {
    video: options.videoConstraints ?? true,
  };

  if (options.audio) {
    constraints.audio = options.audioConstraints ?? true;
  }

  return constraints;
}

async function queryCameraPermission() {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return 'unknown' as const;
  }

  try {
    const status = await navigator.permissions.query({ name: 'camera' });
    return status.state;
  } catch {
    return 'unknown' as const;
  }
}

export function useWebcam(options: UseWebcamOptions = {}): UseWebcamResult {
  const {
    enabled = true,
    forceScreenshotSourceSize = false,
    imageSmoothing = true,
    mirrored = false,
    onDevicesChanged,
    onError,
    onPermissionChange,
    onStart,
    onStop,
    onUserMedia,
    onUserMediaError,
    screenshotFormat = 'image/webp',
    screenshotQuality = 0.92,
    startOnMount = true,
  } = options;

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<CameraError | null>(null);
  const [permission, setPermission] = useState<PermissionState | 'unsupported' | 'unknown'>(
    'unknown',
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [, setStream] = useState<MediaStream | null>(null);

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      setDevices([]);
      return;
    }

    try {
      const nextDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(nextDevices);
      onDevicesChanged?.(nextDevices);
    } catch {
      setDevices([]);
    }
  }, [onDevicesChanged]);

  const applyPermission = useCallback(
    async (fallback?: PermissionState | 'unsupported' | 'unknown') => {
      const nextPermission = fallback ?? (await queryCameraPermission());
      setPermission(nextPermission);
      onPermissionChange?.(nextPermission);
    },
    [onPermissionChange],
  );

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    const currentStream = streamRef.current;

    if (!currentStream) {
      setStatus((currentStatus) => (currentStatus === 'idle' ? 'idle' : 'stopped'));
      return;
    }

    setStatus('stopping');
    stopMediaStream(currentStream);
    streamRef.current = null;
    setStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus('stopped');
    onStop?.();
  }, [onStop]);

  const start = useCallback(
    async (constraintsOverride?: MediaStreamConstraints) => {
      if (!isMediaSupported()) {
        const unsupportedError: CameraError = {
          name: 'NotSupportedError',
          message: 'getUserMedia is not supported in this environment.',
          type: 'unsupported',
        };
        setError(unsupportedError);
        setStatus('unsupported');
        onError?.(unsupportedError);
        onUserMediaError?.(unsupportedError);
        void applyPermission('unsupported');
        return null;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setStatus('requesting');
      setError(null);

      try {
        const nextStream = await navigator.mediaDevices.getUserMedia(
          buildConstraints(options, constraintsOverride),
        );

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          stopMediaStream(nextStream);
          return null;
        }

        stopMediaStream(streamRef.current);
        streamRef.current = nextStream;
        setStream(nextStream);

        if (videoRef.current) {
          videoRef.current.srcObject = nextStream;
        }

        setStatus('ready');
        void refreshDevices();
        void applyPermission('granted');
        onStart?.(nextStream);
        onUserMedia?.(nextStream);
        return nextStream;
      } catch (caughtError) {
        const normalizedError = normalizeMediaError(caughtError);
        setError(normalizedError);
        setStatus(normalizedError.type === 'permission-denied' ? 'denied' : 'error');
        void applyPermission(normalizedError.type === 'permission-denied' ? 'denied' : undefined);
        onError?.(normalizedError);
        onUserMediaError?.(normalizedError);
        return null;
      }
    },
    [applyPermission, onError, onStart, onUserMedia, onUserMediaError, options, refreshDevices],
  );

  const restart = useCallback(async () => {
    stop();
    return start();
  }, [start, stop]);

  const switchDevice = useCallback(
    async (deviceId: string, constraints: MediaTrackConstraints = {}) => {
      setSelectedDeviceId(deviceId);
      stop();
      return start({
        ...(options.audio ? { audio: options.audioConstraints ?? true } : {}),
        video: {
          ...constraints,
          deviceId: { exact: deviceId },
        },
      });
    },
    [options.audio, options.audioConstraints, start, stop],
  );

  const withCaptureDefaults = useCallback(
    (captureOptions: ScreenshotOptions = {}) => ({
      forceSourceSize: forceScreenshotSourceSize,
      format: screenshotFormat,
      imageSmoothing,
      mirrored,
      quality: screenshotQuality,
      ...captureOptions,
    }),
    [forceScreenshotSourceSize, imageSmoothing, mirrored, screenshotFormat, screenshotQuality],
  );

  const getCanvas = useCallback(
    (captureOptions?: ScreenshotOptions) =>
      captureFrame(videoRef.current, {
        ...withCaptureDefaults(captureOptions),
        type: 'canvas',
      }),
    [withCaptureDefaults],
  );

  const getScreenshot = useCallback(
    (captureOptions?: ScreenshotOptions) =>
      captureFrame(videoRef.current, {
        ...withCaptureDefaults(captureOptions),
        type: 'data-url',
      }),
    [withCaptureDefaults],
  );

  const getScreenshotBlob = useCallback(
    (captureOptions?: ScreenshotOptions) =>
      captureFrame(videoRef.current, {
        ...withCaptureDefaults(captureOptions),
        type: 'blob',
      }),
    [withCaptureDefaults],
  );

  useEffect(() => {
    mountedRef.current = true;
    void applyPermission();
    void refreshDevices();

    if (enabled && startOnMount) {
      void start();
    }

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      return;
    }

    if (!enabled) {
      stop();
      return;
    }

    if (startOnMount && !streamRef.current && status !== 'requesting') {
      void start();
    }
  }, [enabled, start, startOnMount, status, stop]);

  useEffect(() => {
    if (!isMediaSupported()) {
      return undefined;
    }

    const mediaDevices = navigator.mediaDevices;
    const handleDeviceChange = () => {
      void refreshDevices();
    };

    mediaDevices.addEventListener?.('devicechange', handleDeviceChange);
    return () => {
      mediaDevices.removeEventListener?.('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

  return {
    devices,
    error,
    getCanvas,
    getScreenshot,
    getScreenshotBlob,
    permission,
    refreshDevices,
    restart,
    selectedDeviceId,
    start,
    status,
    stop,
    get stream() {
      return streamRef.current;
    },
    switchDevice,
    videoRef,
  };
}
