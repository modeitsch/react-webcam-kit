import { useCallback, useEffect, useState } from 'react';

import { normalizeMediaError } from '../errors/normalizeMediaError';
import type { CameraError, UseDevicesResult } from '../types';

function hasMediaDevices() {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.enumerateDevices === 'function'
  );
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

export function useDevices(): UseDevicesResult {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<CameraError | null>(null);
  const [permission, setPermission] = useState<PermissionState | 'unsupported' | 'unknown'>(
    'unknown',
  );
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);

  const refresh = useCallback(async () => {
    if (!hasMediaDevices()) {
      setPermission('unsupported');
      setError({
        name: 'NotSupportedError',
        message: 'Media devices are not supported in this environment.',
        type: 'unsupported',
      });
      return;
    }

    try {
      const [devices, permissionState] = await Promise.all([
        navigator.mediaDevices.enumerateDevices(),
        queryCameraPermission(),
      ]);
      setAudioInputs(devices.filter((device) => device.kind === 'audioinput'));
      setVideoInputs(devices.filter((device) => device.kind === 'videoinput'));
      setPermission(permissionState);
      setError(null);
    } catch (caughtError) {
      setError(normalizeMediaError(caughtError));
    }
  }, []);

  useEffect(() => {
    void refresh();

    if (!hasMediaDevices()) {
      return undefined;
    }

    const mediaDevices = navigator.mediaDevices;
    const handleDeviceChange = () => {
      void refresh();
    };

    mediaDevices.addEventListener?.('devicechange', handleDeviceChange);
    return () => {
      mediaDevices.removeEventListener?.('devicechange', handleDeviceChange);
    };
  }, [refresh]);

  return {
    audioInputs,
    error,
    permission,
    refresh,
    videoInputs,
  };
}
