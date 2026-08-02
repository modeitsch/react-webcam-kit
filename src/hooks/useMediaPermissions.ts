import { useCallback, useEffect, useRef, useState } from 'react';

import { normalizeMediaError } from '../errors/normalizeMediaError';
import { isMediaDevicesSupported, useIsSupported } from '../support/useIsSupported';
import type {
  CameraError,
  MediaPermissionKind,
  UseMediaPermissionsOptions,
  UseMediaPermissionsResult,
} from '../types';

function buildConstraints(options: UseMediaPermissionsOptions): MediaStreamConstraints {
  const kind = options.kind ?? 'camera';

  if (kind === 'microphone') {
    return { audio: options.audioConstraints ?? true, video: false };
  }

  return {
    ...(options.audio ? { audio: options.audioConstraints ?? true } : {}),
    video: options.videoConstraints ?? true,
  };
}

async function queryPermissionStatus(kind: MediaPermissionKind) {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return null;
  }

  try {
    return await navigator.permissions.query({ name: kind });
  } catch {
    // Firefox rejects for 'camera'/'microphone' rather than returning a status.
    return null;
  }
}

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Preflights camera or microphone access without holding a stream open.
 *
 * `requestPermission()` opens the browser prompt and immediately stops the resulting tracks, so
 * the indicator light does not stay on while the user is still on a "we need your camera"
 * screen. Pass `kind: 'microphone'` for audio-only flows such as `useAudioRecorder`.
 */
export function useMediaPermissions(
  options: UseMediaPermissionsOptions = {},
): UseMediaPermissionsResult {
  const kind = options.kind ?? 'camera';
  const optionsRef = useRef(options);
  const [error, setError] = useState<CameraError | null>(null);
  const [internalPermission, setPermission] = useState<PermissionState | 'unsupported' | 'unknown'>(
    'unknown',
  );
  // Probed through useSyncExternalStore so the server and the hydrating client agree.
  const isSupported = useIsSupported(isMediaDevicesSupported);
  const permission: PermissionState | 'unsupported' | 'unknown' = isSupported
    ? internalPermission
    : 'unsupported';

  optionsRef.current = options;

  // Every write bumps the counter. A slow `refresh()` that resolves after a newer write (the
  // user answering the prompt, or an out-of-band permission change) must not clobber it.
  const writeCounterRef = useRef(0);
  const permissionRef = useRef(internalPermission);
  permissionRef.current = internalPermission;

  const applyPermission = useCallback(
    (nextPermission: PermissionState | 'unsupported' | 'unknown') => {
      writeCounterRef.current += 1;
      permissionRef.current = nextPermission;
      setPermission(nextPermission);
      optionsRef.current.onPermissionChange?.(nextPermission);
      return nextPermission;
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (!isMediaDevicesSupported()) {
      return applyPermission('unsupported');
    }

    const token = writeCounterRef.current;
    const status = await queryPermissionStatus(optionsRef.current.kind ?? 'camera');

    if (writeCounterRef.current !== token) {
      return permissionRef.current;
    }

    return applyPermission(status?.state ?? 'unknown');
  }, [applyPermission]);

  const requestPermission = useCallback(async () => {
    if (!isMediaDevicesSupported()) {
      const unsupportedError: CameraError = {
        name: 'NotSupportedError',
        message: 'getUserMedia is not supported in this environment.',
        type: 'unsupported',
      };
      setError(unsupportedError);
      applyPermission('unsupported');
      optionsRef.current.onError?.(unsupportedError);
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        buildConstraints(optionsRef.current),
      );
      // Release immediately: this is a preflight, not a capture session.
      stopStream(stream);
      setError(null);
      applyPermission('granted');
      return true;
    } catch (caughtError) {
      const normalizedError = normalizeMediaError(caughtError);
      setError(normalizedError);
      applyPermission(normalizedError.type === 'permission-denied' ? 'denied' : 'unknown');
      optionsRef.current.onError?.(normalizedError);
      return false;
    }
  }, [applyPermission]);

  useEffect(() => {
    void refresh();
  }, [kind, refresh]);

  // Reflect changes made outside the page (browser site settings, OS privacy panel).
  useEffect(() => {
    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;

    const handleChange = () => {
      if (permissionStatus) {
        applyPermission(permissionStatus.state);
      }
    };

    void queryPermissionStatus(kind).then((nextStatus) => {
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
  }, [applyPermission, kind]);

  return {
    canRequest: isSupported && permission !== 'denied',
    error,
    isSupported,
    kind,
    permission,
    refresh,
    requestPermission,
  };
}

/** Convenience wrapper around `useMediaPermissions({ kind: 'microphone' })`. */
export function useMicrophonePermissions(
  options: Omit<UseMediaPermissionsOptions, 'kind'> = {},
): UseMediaPermissionsResult {
  return useMediaPermissions({ ...options, kind: 'microphone' });
}
