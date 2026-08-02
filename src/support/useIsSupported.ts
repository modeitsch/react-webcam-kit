import { useSyncExternalStore } from 'react';

function subscribe() {
  // Feature support never changes for the lifetime of a document, so there is nothing to
  // subscribe to. `useSyncExternalStore` is used purely for its server/client snapshot split.
  return () => undefined;
}

function getServerSnapshot() {
  return false;
}

/**
 * Feature-detects a browser capability without breaking hydration.
 *
 * Probing the DOM inside a `useState` initialiser makes the server render `unsupported` and
 * the client render `idle`, which React reports as a hydration mismatch. `useSyncExternalStore`
 * renders the server snapshot during hydration and then re-renders with the real value.
 */
export function useIsSupported(probe: () => boolean) {
  return useSyncExternalStore(subscribe, probe, getServerSnapshot);
}

export function isMediaDevicesSupported() {
  return (
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
  );
}

export function isDisplayMediaSupported() {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getDisplayMedia === 'function'
  );
}

export function isMediaRecorderSupported() {
  return typeof MediaRecorder !== 'undefined';
}
