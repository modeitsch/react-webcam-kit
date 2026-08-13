import { act } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCameraPermissions } from './hooks/useCameraPermissions';
import { useDisplayMedia } from './hooks/useDisplayMedia';
import { useMediaRecorder } from './hooks/useMediaRecorder';

function RecorderProbe() {
  const { status, isSupported } = useMediaRecorder();
  return <span>{`${status}|${String(isSupported)}`}</span>;
}

function DisplayProbe() {
  const { status, isSupported } = useDisplayMedia();
  return <span>{`${status}|${String(isSupported)}`}</span>;
}

function PermissionsProbe() {
  const { permission, isSupported } = useCameraPermissions();
  return <span>{`${permission}|${String(isSupported)}`}</span>;
}

/**
 * Hydrates `element` against markup the server produced, and reports any recoverable errors.
 * React 19 surfaces hydration mismatches through `onRecoverableError`, not `console.error`.
 */
async function hydrate(serverHtml: string, element: React.ReactElement) {
  const container = document.createElement('div');
  container.innerHTML = serverHtml;
  document.body.append(container);

  const recoverableErrors: string[] = [];
  const root = await act(async () => {
    const nextRoot = hydrateRoot(container, element, {
      onRecoverableError: (error) => {
        recoverableErrors.push(String(error));
      },
    });
    await Promise.resolve();
    return nextRoot;
  });

  return {
    cleanup: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
    hydrationErrors: recoverableErrors.filter((entry) => /hydrat/i.test(entry)),
    text: container.textContent,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('hydration', () => {
  it('detects a real mismatch (guards the assertions below from being vacuous)', async () => {
    function Mismatched() {
      return <span>idle|true</span>;
    }

    const { cleanup, hydrationErrors } = await hydrate(
      '<span>unsupported|false</span>',
      <Mismatched />,
    );

    expect(hydrationErrors.length).toBeGreaterThan(0);
    cleanup();
  });

  it('hydrates useMediaRecorder cleanly and upgrades to supported', async () => {
    // The client has MediaRecorder; the server markup was produced without it. Probing support
    // in a useState initialiser made these disagree and React reported a hydration mismatch.
    const MediaRecorderStub = function MediaRecorderStub() {
      // Only feature detection and isTypeSupported are exercised here.
    } as unknown as typeof MediaRecorder;
    MediaRecorderStub.isTypeSupported = () => true;
    vi.stubGlobal('MediaRecorder', MediaRecorderStub);

    const { cleanup, hydrationErrors, text } = await hydrate(
      '<span>unsupported|false</span>',
      <RecorderProbe />,
    );

    expect(hydrationErrors).toEqual([]);
    expect(text).toBe('idle|true');
    cleanup();
  });

  it('hydrates useDisplayMedia cleanly and upgrades to supported', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getDisplayMedia: vi.fn() },
    });

    const { cleanup, hydrationErrors, text } = await hydrate(
      '<span>unsupported|false</span>',
      <DisplayProbe />,
    );

    expect(hydrationErrors).toEqual([]);
    expect(text).toBe('idle|true');
    cleanup();
  });

  it('hydrates useCameraPermissions cleanly and upgrades to supported', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn() },
    });

    const { cleanup, hydrationErrors } = await hydrate(
      '<span>unsupported|false</span>',
      <PermissionsProbe />,
    );

    expect(hydrationErrors).toEqual([]);
    cleanup();
  });
});
