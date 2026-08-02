import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useCameraCapabilities } from './useCameraCapabilities';

function createStream(
  capabilities: Record<string, unknown> | null,
  settings: Record<string, unknown> = {},
) {
  const applyConstraints = vi.fn().mockResolvedValue(undefined);
  const track = {
    applyConstraints,
    getCapabilities: capabilities ? () => capabilities : undefined,
    getSettings: () => settings,
    kind: 'video',
  } as unknown as MediaStreamTrack;

  return {
    applyConstraints,
    stream: { getVideoTracks: () => [track] } as unknown as MediaStream,
  };
}

describe('useCameraCapabilities', () => {
  it('reports no capabilities without a stream', () => {
    const { result } = renderHook(() => useCameraCapabilities(null));

    expect(result.current.supportsTorch).toBe(false);
    expect(result.current.supportsZoom).toBe(false);
    expect(result.current.capabilities.zoom).toBeNull();
  });

  it('normalises torch reported as a boolean', async () => {
    const { stream } = createStream({ torch: true });
    const { result } = renderHook(() => useCameraCapabilities(stream));

    await waitFor(() => {
      expect(result.current.supportsTorch).toBe(true);
    });
  });

  it('normalises torch reported as a boolean sequence', async () => {
    // The spec models torch as a sequence; Chrome reports a plain boolean.
    const { stream } = createStream({ torch: [false, true] });
    const { result } = renderHook(() => useCameraCapabilities(stream));

    await waitFor(() => {
      expect(result.current.supportsTorch).toBe(true);
    });
  });

  it('treats a torch-less camera as unsupported', async () => {
    const { stream } = createStream({ torch: [false] });
    const { result } = renderHook(() => useCameraCapabilities(stream));

    await waitFor(() => {
      expect(result.current.capabilities.raw).not.toBeNull();
    });
    expect(result.current.supportsTorch).toBe(false);
  });

  it('normalises the zoom range and defaults the step', async () => {
    const { stream } = createStream({ zoom: { max: 8, min: 1 } }, { zoom: 2 });
    const { result } = renderHook(() => useCameraCapabilities(stream));

    await waitFor(() => {
      expect(result.current.supportsZoom).toBe(true);
    });
    expect(result.current.capabilities.zoom).toEqual({ max: 8, min: 1, step: 1 });
    expect(result.current.zoom).toBe(2);
  });

  it('applies torch through an advanced constraint', async () => {
    const { applyConstraints, stream } = createStream({ torch: true });
    const { result } = renderHook(() => useCameraCapabilities(stream));

    await act(async () => {
      await result.current.setTorch(true);
    });

    // Browsers ignore or reject torch when it is passed as a top-level constraint.
    expect(applyConstraints).toHaveBeenCalledWith({ advanced: [{ torch: true }] });
  });

  it('applies zoom and focus mode through advanced constraints', async () => {
    const { applyConstraints, stream } = createStream({ zoom: { max: 5, min: 1 } });
    const { result } = renderHook(() => useCameraCapabilities(stream));

    await act(async () => {
      await result.current.setZoom(3);
      await result.current.setFocusMode('continuous');
    });

    expect(applyConstraints).toHaveBeenCalledWith({ advanced: [{ zoom: 3 }] });
    expect(applyConstraints).toHaveBeenCalledWith({ advanced: [{ focusMode: 'continuous' }] });
  });

  it('surfaces an apply failure without throwing on a missing track', async () => {
    const { result } = renderHook(() => useCameraCapabilities(null));

    await expect(result.current.setTorch(true)).rejects.toThrow(
      'No active video track is available.',
    );
  });

  it('survives a track that does not implement getCapabilities', async () => {
    const { stream } = createStream(null);
    const { result } = renderHook(() => useCameraCapabilities(stream));

    await waitFor(() => {
      expect(result.current.capabilities.raw).toBeNull();
    });
    expect(result.current.supportsTorch).toBe(false);
  });
});
