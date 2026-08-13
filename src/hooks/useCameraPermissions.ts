import type { UseCameraPermissionsOptions, UseCameraPermissionsResult } from '../types';
import { useMediaPermissions } from './useMediaPermissions';

/**
 * Preflights camera access. Thin wrapper over {@link useMediaPermissions} with
 * `kind: 'camera'`; use that directly (or `useMicrophonePermissions`) for audio-only flows.
 */
export function useCameraPermissions(
  options: UseCameraPermissionsOptions = {},
): UseCameraPermissionsResult {
  return useMediaPermissions({ ...options, kind: 'camera' });
}
