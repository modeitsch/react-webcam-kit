/**
 * Server rendering must not throw and must produce a *stable* snapshot: whatever the server
 * emits is also what the client emits on its hydration pass, so React never reports a mismatch.
 * The support probes go through `useSyncExternalStore`, whose server snapshot is `false`, so
 * these hooks render their "not supported yet" state here and upgrade after hydration.
 *
 * See `hydration.test.tsx` for the assertion that hydration is actually clean.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';

import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useCameraPermissions } from './hooks/useCameraPermissions';
import { useDevices } from './hooks/useDevices';
import { useDisplayMedia } from './hooks/useDisplayMedia';
import { useMediaRecorder } from './hooks/useMediaRecorder';
import { useWebcam } from './hooks/useWebcam';

describe('server rendering', () => {
  it('renders useMediaRecorder in its idle state', () => {
    function Probe() {
      const { status, isSupported } = useMediaRecorder();
      return <span>{`${status}|${String(isSupported)}`}</span>;
    }

    expect(renderToString(<Probe />)).toContain('unsupported|false');
  });

  it('renders useDisplayMedia in its idle state', () => {
    function Probe() {
      const { status, isSupported } = useDisplayMedia();
      return <span>{`${status}|${String(isSupported)}`}</span>;
    }

    expect(renderToString(<Probe />)).toContain('unsupported|false');
  });

  it('renders useAudioRecorder in its idle state', () => {
    function Probe() {
      const { mediaStatus, isMediaSupported } = useAudioRecorder();
      return <span>{`${mediaStatus}|${String(isMediaSupported)}`}</span>;
    }

    expect(renderToString(<Probe />)).toContain('unsupported|false');
  });

  it('renders useCameraPermissions in its unknown state', () => {
    function Probe() {
      const { permission, isSupported } = useCameraPermissions();
      return <span>{`${permission}|${String(isSupported)}`}</span>;
    }

    expect(renderToString(<Probe />)).toContain('unsupported|false');
  });

  it('renders useWebcam without touching navigator', () => {
    function Probe() {
      const { status, permission, devices } = useWebcam();
      return <span>{`${status}|${permission}|${String(devices.length)}`}</span>;
    }

    expect(renderToString(<Probe />)).toContain('idle|unknown|0');
  });

  it('renders useDevices without touching navigator', () => {
    function Probe() {
      const { counts, permission } = useDevices();
      return <span>{`${String(counts.video)}|${permission}`}</span>;
    }

    expect(renderToString(<Probe />)).toContain('0|unknown');
  });
});
