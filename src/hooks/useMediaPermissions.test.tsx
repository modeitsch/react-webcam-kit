import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMediaPermissions, useMicrophonePermissions } from './useMediaPermissions';

const originalMediaDevices = navigator.mediaDevices;
const originalPermissions = navigator.permissions;

function createStream() {
  const stop = vi.fn();
  const track = { kind: 'audio', stop } as unknown as MediaStreamTrack;
  return {
    stop,
    stream: { getTracks: () => [track] } as unknown as MediaStream,
  };
}

function mockEnvironment(
  getUserMedia: ReturnType<typeof vi.fn>,
  permissionState?: PermissionState,
) {
  const query = vi.fn().mockResolvedValue(
    permissionState
      ? {
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          state: permissionState,
        }
      : undefined,
  );

  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: { query },
  });

  return { query };
}

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

describe('useMediaPermissions', () => {
  it('queries the camera by default', async () => {
    const getUserMedia = vi.fn();
    const { query } = mockEnvironment(getUserMedia, 'granted');

    const { result } = renderHook(() => useMediaPermissions());

    await waitFor(() => {
      expect(result.current.permission).toBe('granted');
    });
    expect(result.current.kind).toBe('camera');
    expect(query).toHaveBeenCalledWith({ name: 'camera' });
  });

  it('queries the microphone when asked', async () => {
    const getUserMedia = vi.fn();
    const { query } = mockEnvironment(getUserMedia, 'prompt');

    const { result } = renderHook(() => useMediaPermissions({ kind: 'microphone' }));

    await waitFor(() => {
      expect(result.current.permission).toBe('prompt');
    });
    expect(query).toHaveBeenCalledWith({ name: 'microphone' });
  });

  it('requests audio-only constraints for the microphone', async () => {
    const { stop, stream } = createStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    mockEnvironment(getUserMedia, 'prompt');

    const { result } = renderHook(() => useMicrophonePermissions());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true, video: false });
    // The preflight must not leave the microphone open.
    expect(stop).toHaveBeenCalled();
    expect(result.current.permission).toBe('granted');
  });

  it('requests video constraints for the camera', async () => {
    const { stream } = createStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    mockEnvironment(getUserMedia, 'prompt');

    const { result } = renderHook(() => useMediaPermissions({ kind: 'camera' }));

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(getUserMedia).toHaveBeenCalledWith({ video: true });
  });

  it('reports a denial and blocks further requests', async () => {
    const getUserMedia = vi
      .fn()
      .mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
    mockEnvironment(getUserMedia, 'prompt');

    const { result } = renderHook(() => useMicrophonePermissions());

    await act(async () => {
      const granted = await result.current.requestPermission();
      expect(granted).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.permission).toBe('denied');
    });
    expect(result.current.canRequest).toBe(false);
    expect(result.current.error?.type).toBe('permission-denied');
  });

  it('reacts to a permission change made outside the page', async () => {
    const listeners: (() => void)[] = [];
    const status = {
      addEventListener: (_type: string, handler: () => void) => listeners.push(handler),
      removeEventListener: vi.fn(),
      state: 'prompt' as PermissionState,
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn() },
    });
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: { query: vi.fn().mockResolvedValue(status) },
    });

    const { result } = renderHook(() => useMediaPermissions());

    await waitFor(() => {
      expect(listeners.length).toBeGreaterThan(0);
    });

    // The user flips the toggle in browser site settings.
    status.state = 'denied';
    act(() => {
      listeners.forEach((handler) => {
        handler();
      });
    });

    await waitFor(() => {
      expect(result.current.permission).toBe('denied');
    });
  });
});
