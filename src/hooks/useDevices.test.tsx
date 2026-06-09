import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDevices } from './useDevices';

const originalMediaDevices = navigator.mediaDevices;

describe('useDevices', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    vi.restoreAllMocks();
  });

  it('enumerates video and audio input devices', async () => {
    const enumerateDevices = vi.fn().mockResolvedValue([
      { deviceId: 'camera-1', groupId: 'group-1', kind: 'videoinput', label: 'Front Camera' },
      { deviceId: 'mic-1', groupId: 'group-1', kind: 'audioinput', label: 'Microphone' },
      { deviceId: 'speaker-1', groupId: 'group-1', kind: 'audiooutput', label: 'Speaker' },
    ]);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        enumerateDevices,
      },
    });

    const { result } = renderHook(() => useDevices());

    await waitFor(() => {
      expect(result.current.videoInputs).toHaveLength(1);
    });
    expect(result.current.audioInputs).toHaveLength(1);
    expect(result.current.videoInputs[0]?.label).toBe('Front Camera');
    expect(result.current.devicesById['camera-1']).toMatchObject({
      deviceId: 'camera-1',
      kind: 'videoinput',
      label: 'Front Camera',
    });
    expect(result.current.devicesByType.video).toHaveLength(1);
    expect(result.current.devicesByType.audio).toHaveLength(1);
    expect(result.current.counts.video).toBe(1);
    expect(result.current.counts.audio).toBe(1);
  });
});
