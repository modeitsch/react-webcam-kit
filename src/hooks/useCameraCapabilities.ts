import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  CameraCapabilities,
  CameraCapabilityRange,
  UseCameraCapabilitiesResult,
} from '../types';

/**
 * `torch`, `zoom` and `focusMode` are part of the MediaStream Image Capture spec rather than
 * getUserMedia, and are not in every TypeScript DOM lib, so they are described here instead of
 * relying on the ambient types.
 */
interface ExtendedTrackCapabilities extends MediaTrackCapabilities {
  focusDistance?: { min: number; max: number; step?: number };
  focusMode?: string[];
  torch?: boolean | boolean[];
  zoom?: { min: number; max: number; step?: number };
}

interface ExtendedTrackSettings extends MediaTrackSettings {
  focusMode?: string;
  torch?: boolean;
  zoom?: number;
}

const EMPTY_CAPABILITIES: CameraCapabilities = {
  facingModes: [],
  focusModes: [],
  raw: null,
  torch: false,
  zoom: null,
};

function toRange(range: { min: number; max: number; step?: number } | undefined) {
  if (!range || typeof range.min !== 'number' || typeof range.max !== 'number') {
    return null;
  }

  return { max: range.max, min: range.min, step: range.step ?? 1 } satisfies CameraCapabilityRange;
}

function supportsTorch(capabilities: ExtendedTrackCapabilities) {
  // Chrome reports `torch: true`; the spec says it is a boolean sequence.
  return Array.isArray(capabilities.torch)
    ? capabilities.torch.includes(true)
    : capabilities.torch === true;
}

function readCapabilities(track: MediaStreamTrack | null): CameraCapabilities {
  if (!track || typeof track.getCapabilities !== 'function') {
    return EMPTY_CAPABILITIES;
  }

  let raw: ExtendedTrackCapabilities;

  try {
    raw = track.getCapabilities();
  } catch {
    return EMPTY_CAPABILITIES;
  }

  return {
    facingModes: raw.facingMode ?? [],
    focusModes: raw.focusMode ?? [],
    raw,
    torch: supportsTorch(raw),
    zoom: toRange(raw.zoom),
  };
}

function readSettings(track: MediaStreamTrack | null): ExtendedTrackSettings {
  if (!track || typeof track.getSettings !== 'function') {
    return {};
  }

  try {
    return track.getSettings();
  } catch {
    return {};
  }
}

/**
 * Reads and controls what the active camera track can actually do — torch (flashlight), optical
 * zoom and focus mode. These are the controls scanner and document-capture screens need, and
 * they vary wildly by device, so everything is feature-detected and reported as `false`/`null`
 * when unavailable rather than throwing.
 */
export function useCameraCapabilities(
  stream: MediaStream | null | undefined,
): UseCameraCapabilitiesResult {
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const [capabilities, setCapabilities] = useState<CameraCapabilities>(EMPTY_CAPABILITIES);
  const [settings, setSettings] = useState<ExtendedTrackSettings>({});
  const [error, setError] = useState<Error | null>(null);

  const track = useMemo(() => stream?.getVideoTracks()[0] ?? null, [stream]);
  trackRef.current = track;

  const refresh = useCallback(() => {
    const currentTrack = trackRef.current;
    setCapabilities(readCapabilities(currentTrack));
    setSettings(readSettings(currentTrack));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, track]);

  const applyConstraints = useCallback(
    async (constraints: MediaTrackConstraints) => {
      const currentTrack = trackRef.current;

      if (!currentTrack) {
        throw new Error('No active video track is available.');
      }

      try {
        await currentTrack.applyConstraints(constraints);
        setError(null);
      } catch (caughtError) {
        const nextError =
          caughtError instanceof Error ? caughtError : new Error('Failed to apply constraints.');
        setError(nextError);
        throw nextError;
      } finally {
        refresh();
      }
    },
    [refresh],
  );

  const setTorch = useCallback(
    async (on: boolean) => {
      // `advanced` is required: torch is not a spec-listed constraint, and browsers ignore it
      // (or reject the whole call) when passed at the top level.
      await applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
    },
    [applyConstraints],
  );

  const setZoom = useCallback(
    async (value: number) => {
      await applyConstraints({ advanced: [{ zoom: value } as MediaTrackConstraintSet] });
    },
    [applyConstraints],
  );

  const setFocusMode = useCallback(
    async (mode: string) => {
      await applyConstraints({ advanced: [{ focusMode: mode } as MediaTrackConstraintSet] });
    },
    [applyConstraints],
  );

  return {
    applyConstraints,
    capabilities,
    error,
    refresh,
    setFocusMode,
    setTorch,
    setZoom,
    settings,
    supportsFocusMode: capabilities.focusModes.length > 0,
    supportsTorch: capabilities.torch,
    supportsZoom: capabilities.zoom !== null,
    torch: settings.torch === true,
    zoom: typeof settings.zoom === 'number' ? settings.zoom : null,
  };
}
