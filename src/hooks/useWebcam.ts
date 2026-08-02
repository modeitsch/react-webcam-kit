import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { captureFrame } from '../capture/captureFrame';
import { normalizeMediaError } from '../errors/normalizeMediaError';
import type {
  CameraError,
  CameraStatus,
  ScreenshotOptions,
  UseWebcamOptions,
  UseWebcamResult,
  WebcamVideoElementProps,
} from '../types';

const stoppedTracks = new WeakSet<MediaStreamTrack>();

function isMediaSupported() {
  return (
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
  );
}

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    if (!stoppedTracks.has(track)) {
      stoppedTracks.add(track);
      track.stop();
    }
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

function getMediaRequestKey(options: UseWebcamOptions, override?: MediaStreamConstraints) {
  return JSON.stringify(override ?? buildConstraints(options));
}

async function queryCameraPermissionStatus() {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return null;
  }

  try {
    return await navigator.permissions.query({ name: 'camera' as PermissionName });
  } catch {
    return null;
  }
}

async function queryCameraPermission() {
  const status = await queryCameraPermissionStatus();
  return status?.state ?? ('unknown' as const);
}

export function useWebcam(options: UseWebcamOptions = {}): UseWebcamResult {
  const {
    audio = false,
    enabled = true,
    forceScreenshotSourceSize = false,
    imageSmoothing = true,
    mirrored = false,
    screenshotFormat = 'image/webp',
    screenshotQuality = 0.92,
    startOnMount = true,
  } = options;

  const mountedRef = useRef(false);
  const inFlightRequestKeyRef = useRef<string | null>(null);
  const inFlightRequestRef = useRef<Promise<MediaStream | null> | null>(null);
  const optionsRef = useRef(options);
  const requestIdRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Tracks whether the consumer *wants* the camera running. `stop()` clears it so that
  // nothing (status changes, re-renders, errors) can silently restart the stream.
  const shouldRunRef = useRef(startOnMount);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<CameraError | null>(null);
  const [permission, setPermission] = useState<PermissionState | 'unsupported' | 'unknown'>(
    'unknown',
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedFacingMode, setSelectedFacingMode] = useState<VideoFacingModeEnum | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [stream, setStreamState] = useState<MediaStream | null>(null);
  const constraintsKey = JSON.stringify({
    audio: options.audio,
    audioConstraints: options.audioConstraints,
    videoConstraints: options.videoConstraints,
  });
  const previousConstraintsKeyRef = useRef(constraintsKey);

  optionsRef.current = options;

  const setStream = useCallback((nextStream: MediaStream | null) => {
    streamRef.current = nextStream;
    setStreamState(nextStream);
  }, []);

  const attachVideoNode = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;

    if (node && node.srcObject !== streamRef.current) {
      node.srcObject = streamRef.current;
    }
  }, []);

  const getVideoProps = useCallback(
    (props: WebcamVideoElementProps = {}): WebcamVideoElementProps => ({
      autoPlay: true,
      muted: !audio,
      playsInline: true,
      ...props,
      ref: attachVideoNode,
    }),
    [attachVideoNode, audio],
  );

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      setDevices([]);
      return;
    }

    try {
      const nextDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(nextDevices);
      optionsRef.current.onDevicesChanged?.(nextDevices);
    } catch {
      setDevices([]);
    }
  }, []);

  const applyPermission = useCallback(
    async (fallback?: PermissionState | 'unsupported' | 'unknown') => {
      const nextPermission = fallback ?? (await queryCameraPermission());
      setPermission(nextPermission);
      optionsRef.current.onPermissionChange?.(nextPermission);
    },
    [],
  );

  const teardown = useCallback(() => {
    requestIdRef.current += 1;
    const currentStream = streamRef.current;

    if (!currentStream) {
      setStatus((currentStatus) => (currentStatus === 'idle' ? 'idle' : 'stopped'));
      return;
    }

    setStatus('stopping');
    stopMediaStream(currentStream);
    setStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus('stopped');
    optionsRef.current.onStop?.();
  }, [setStream]);

  const stop = useCallback(() => {
    shouldRunRef.current = false;
    teardown();
  }, [teardown]);

  const start = useCallback(
    async (constraintsOverride?: MediaStreamConstraints) => {
      const currentOptions = optionsRef.current;
      const mediaRequestKey = getMediaRequestKey(currentOptions, constraintsOverride);

      shouldRunRef.current = true;

      if (inFlightRequestKeyRef.current === mediaRequestKey && inFlightRequestRef.current) {
        return inFlightRequestRef.current;
      }

      if (!isMediaSupported()) {
        const unsupportedError: CameraError = {
          name: 'NotSupportedError',
          message: 'getUserMedia is not supported in this environment.',
          type: 'unsupported',
        };
        setError(unsupportedError);
        setStatus('unsupported');
        currentOptions.onError?.(unsupportedError);
        currentOptions.onUserMediaError?.(unsupportedError);
        void applyPermission('unsupported');
        return null;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setStatus('requesting');
      setError(null);

      const request = (async () => {
        try {
          const nextStream = await navigator.mediaDevices.getUserMedia(
            buildConstraints(currentOptions, constraintsOverride),
          );

          if (!mountedRef.current || requestId !== requestIdRef.current) {
            stopMediaStream(nextStream);
            return null;
          }

          // Swap the previous stream out only after the new one is live so device
          // switching does not flash a black frame.
          const previousStream = streamRef.current;
          setStream(nextStream);

          if (previousStream && previousStream !== nextStream) {
            stopMediaStream(previousStream);
          }

          if (videoRef.current) {
            videoRef.current.srcObject = nextStream;
          }

          setStatus('ready');
          void refreshDevices();
          void applyPermission('granted');
          optionsRef.current.onStart?.(nextStream);
          optionsRef.current.onUserMedia?.(nextStream);
          return nextStream;
        } catch (caughtError) {
          const normalizedError = normalizeMediaError(caughtError);
          setError(normalizedError);
          setStatus(normalizedError.type === 'permission-denied' ? 'denied' : 'error');
          void applyPermission(normalizedError.type === 'permission-denied' ? 'denied' : undefined);
          optionsRef.current.onError?.(normalizedError);
          optionsRef.current.onUserMediaError?.(normalizedError);
          return null;
        }
      })();

      inFlightRequestKeyRef.current = mediaRequestKey;
      inFlightRequestRef.current = request;

      try {
        return await request;
      } finally {
        if (inFlightRequestRef.current === request) {
          inFlightRequestKeyRef.current = null;
          inFlightRequestRef.current = null;
        }
      }
    },
    [applyPermission, refreshDevices, setStream],
  );

  const restart = useCallback(async () => {
    teardown();
    return start();
  }, [start, teardown]);

  const switchDevice = useCallback(
    async (deviceId: string, constraints: MediaTrackConstraints = {}) => {
      const currentOptions = optionsRef.current;
      setSelectedDeviceId(deviceId);
      setSelectedFacingMode(null);

      return start({
        ...(currentOptions.audio ? { audio: currentOptions.audioConstraints ?? true } : {}),
        video: {
          ...constraints,
          deviceId: { exact: deviceId },
        },
      });
    },
    [start],
  );

  const switchFacingMode = useCallback(
    async (facingMode: VideoFacingModeEnum, constraints: MediaTrackConstraints = {}) => {
      const currentOptions = optionsRef.current;
      setSelectedDeviceId(null);
      setSelectedFacingMode(facingMode);

      return start({
        ...(currentOptions.audio ? { audio: currentOptions.audioConstraints ?? true } : {}),
        video: {
          facingMode: { ideal: facingMode },
          ...constraints,
        },
      });
    },
    [start],
  );

  const applyVideoConstraints = useCallback(async (constraints: MediaTrackConstraints) => {
    const [videoTrack] = streamRef.current?.getVideoTracks() ?? [];

    if (!videoTrack) {
      throw new Error('No active video track is available.');
    }

    await videoTrack.applyConstraints(constraints);
  }, []);

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
      const currentStream = streamRef.current;
      mountedRef.current = false;
      requestIdRef.current += 1;
      stopMediaStream(currentStream);
      streamRef.current = null;

      if (currentStream) {
        optionsRef.current.onStop?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the video element in sync with the active stream. This runs after every commit so
  // a `<video>` that mounts later (e.g. rendered only once `status === 'ready'`) still gets
  // the stream attached instead of staying black.
  useEffect(() => {
    const video = videoRef.current;

    if (video && video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
    }
  });

  useEffect(() => {
    if (!mountedRef.current) {
      return;
    }

    if (previousConstraintsKeyRef.current === constraintsKey) {
      return;
    }

    previousConstraintsKeyRef.current = constraintsKey;

    if (enabled && shouldRunRef.current && streamRef.current) {
      void start();
    }
  }, [constraintsKey, enabled, start]);

  // Only reacts to `enabled`. Deliberately does NOT depend on `status`: doing so restarted
  // the stream every time it changed, which made `stop()` a no-op and turned a denied
  // permission into an unbounded getUserMedia retry loop.
  useEffect(() => {
    if (!mountedRef.current) {
      return;
    }

    if (!enabled) {
      const wasRunning = shouldRunRef.current;
      teardown();
      // Preserve intent so flipping `enabled` back on resumes the previous state.
      shouldRunRef.current = wasRunning;
      return;
    }

    if (shouldRunRef.current && !streamRef.current) {
      void start();
    }
  }, [enabled, start, teardown]);

  // Surface tracks that end on their own (device unplugged, taken over by another app,
  // revoked by the browser) instead of leaving `status` stuck on 'ready'.
  useEffect(() => {
    if (!stream) {
      return undefined;
    }

    const tracks = stream.getTracks();
    const handleEnded = () => {
      if (streamRef.current !== stream) {
        return;
      }

      stopMediaStream(stream);
      setStream(null);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setStatus('stopped');
      optionsRef.current.onStop?.();
    };

    tracks.forEach((track) => {
      track.addEventListener?.('ended', handleEnded);
    });

    return () => {
      tracks.forEach((track) => {
        track.removeEventListener?.('ended', handleEnded);
      });
    };
  }, [setStream, stream]);

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

  // Reflect permission changes made outside the page (browser site settings, OS privacy panel).
  useEffect(() => {
    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;

    const handleChange = () => {
      if (!permissionStatus) {
        return;
      }

      setPermission(permissionStatus.state);
      optionsRef.current.onPermissionChange?.(permissionStatus.state);
    };

    void queryCameraPermissionStatus().then((nextStatus) => {
      if (cancelled || !nextStatus) {
        return;
      }

      permissionStatus = nextStatus;
      nextStatus.addEventListener?.('change', handleChange);
    });

    return () => {
      cancelled = true;
      permissionStatus?.removeEventListener?.('change', handleChange);
    };
  }, []);

  return {
    applyVideoConstraints,
    devices,
    error,
    getCanvas,
    getScreenshot,
    getScreenshotBlob,
    getVideoProps,
    permission,
    refreshDevices,
    restart,
    selectedDeviceId,
    selectedFacingMode,
    start,
    status,
    stop,
    get stream() {
      return streamRef.current;
    },
    switchDevice,
    switchFacingMode,
    videoRef: videoRef as RefObject<HTMLVideoElement | null>,
  };
}
