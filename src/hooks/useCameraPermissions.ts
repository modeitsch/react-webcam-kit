import { useCallback, useEffect, useRef, useState } from 'react';

import { normalizeMediaError } from '../errors/normalizeMediaError';
import { isMediaDevicesSupported, useIsSupported } from '../support/useIsSupported';
import type {
  CameraError,
  UseCameraPermissionsOptions,
  UseCameraPermissionsResult,
} from '../types';

const isMediaSupported = isMediaDevicesSupported;

function buildConstraints(options: UseCameraPermissionsOptions): MediaStreamConstraints {
  return {
    ...(options.audio ? { audio: options.audioConstraints ?? true } : {}),
    video: options.videoConstraints ?? true,
  };
}

async function queryCameraPermission() {
  if (!isMediaSupported()) {
    return 'unsupported' as const;
  }

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

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

export function useCameraPermissions(
  options: UseCameraPermissionsOptions = {},
): UseCameraPermissionsResult {
  const optionsRef = useRef(options);
  const [error, setError] = useState<CameraError | null>(null);
  const [internalPermission, setPermission] = useState<PermissionState | 'unsupported' | 'unknown'>(
    'unknown',
  );
  // Probed through useSyncExternalStore so the server and the hydrating client agree.
  const isSupported = useIsSupported(isMediaSupported);
  const permission: PermissionState | 'unsupported' | 'unknown' = isSupported
    ? internalPermission
    : 'unsupported';
  optionsRef.current = options;

  const applyPermission = useCallback(
    (nextPermission: PermissionState | 'unsupported' | 'unknown') => {
      setPermission(nextPermission);
      optionsRef.current.onPermissionChange?.(nextPermission);
      return nextPermission;
    },
    [],
  );

  const refresh = useCallback(async () => {
    const nextPermission = await queryCameraPermission();
    return applyPermission(nextPermission);
  }, [applyPermission]);

  const requestPermission = useCallback(async () => {
    if (!isMediaSupported()) {
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
  }, [refresh]);

  return {
    canRequest: isSupported && permission !== 'denied',
    error,
    isSupported,
    permission,
    refresh,
    requestPermission,
  };
}
