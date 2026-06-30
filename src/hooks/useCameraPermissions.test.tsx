import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCameraPermissions } from './useCameraPermissions';

const originalMediaDevices = navigator.mediaDevices;
const originalPermissions = navigator.permissions;

function createStream() {
  const stop = vi.fn();

  return {
    stop,
    getTracks: () => [{ stop }],
  } as unknown as MediaStream & { stop: ReturnType<typeof vi.fn> };
}

describe('useCameraPermissions', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: originalPermissions,
    });
    vi.restoreAllMocks();
  });

  it('reports the current camera permission state', async () => {
    const query = vi.fn().mockResolvedValue({ state: 'prompt' });
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: { query },
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(),
      },
    });

    const { result } = renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(result.current.permission).toBe('prompt');
    });
    expect(result.current.canRequest).toBe(true);
  });

  it('requests camera permission and stops the probe stream', async () => {
    const stream = createStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    const onPermissionChange = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });

    const { result } = renderHook(() => useCameraPermissions({ onPermissionChange }));

    let granted = false;

    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(true);
    expect(stream.stop).toHaveBeenCalledTimes(1);
    expect(result.current.permission).toBe('granted');
    expect(onPermissionChange).toHaveBeenCalledWith('granted');
    expect(getUserMedia).toHaveBeenCalledWith({ video: true });
  });

  it('normalizes denied permission errors', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')),
      },
    });
    const onError = vi.fn();
    const { result } = renderHook(() => useCameraPermissions({ onError }));

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.permission).toBe('denied');
    expect(result.current.error).toMatchObject({
      type: 'permission-denied',
    });
    expect(result.current.canRequest).toBe(false);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'permission-denied',
      }),
    );
  });
});
