import { useCallback, useEffect, useMemo, useState } from 'react';

import { normalizeMediaError } from '../errors/normalizeMediaError';
import type { CameraError, UseDevicesResult } from '../types';

function hasMediaDevices() {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.enumerateDevices === 'function'
  );
}

async function queryCameraPermissionStatus() {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return null;
  }

  try {
    return await navigator.permissions.query({ name: 'camera' });
  } catch {
    return null;
  }
}

async function queryCameraPermission() {
  const status = await queryCameraPermissionStatus();
  return status?.state ?? ('unknown' as const);
}

export function useDevices(): UseDevicesResult {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<CameraError | null>(null);
  const [permission, setPermission] = useState<PermissionState | 'unsupported' | 'unknown'>(
    'unknown',
  );
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const devicesById = useMemo(
    () =>
      [...audioInputs, ...videoInputs].reduce<Record<string, MediaDeviceInfo>>(
        (devices, device) => {
          devices[device.deviceId] = device;
          return devices;
        },
        {},
      ),
    [audioInputs, videoInputs],
  );
  const devicesByType = useMemo(
    () => ({
      audio: audioInputs,
      video: videoInputs,
    }),
    [audioInputs, videoInputs],
  );

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

  // Granting or revoking camera access in browser site settings also changes which device
  // labels are readable, so re-read both when the permission state changes.
  useEffect(() => {
    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;
    const handleChange = () => {
      void refresh();
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
  }, [refresh]);

  return {
    audioInputs,
    counts: {
      audio: audioInputs.length,
      video: videoInputs.length,
    },
    devicesById,
    devicesByType,
    error,
    permission,
    refresh,
    videoInputs,
  };
}
