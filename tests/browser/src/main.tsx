import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { useWebcam } from '../../../src';

function BrowserSmokeApp() {
  const [captureResult, setCaptureResult] = useState('none');
  const camera = useWebcam({
    audio: false,
    startOnMount: false,
  });

  return (
    <main>
      <video aria-label="Camera preview" ref={camera.videoRef} autoPlay playsInline muted />
      <p aria-label="Camera status">{camera.status}</p>
      <button type="button" onClick={() => void camera.start()}>
        Start
      </button>
      <button type="button" onClick={camera.stop}>
        Stop
      </button>
      <button
        type="button"
        onClick={() => {
          setCaptureResult(camera.getScreenshot({ format: 'image/png' }) ? 'captured' : 'empty');
        }}
      >
        Capture
      </button>
      <p aria-label="Capture result">{captureResult}</p>
      <AutoStartPanel />
    </main>
  );
}

/**
 * Uses the defaults (`startOnMount: true`), which is the configuration where `stop()` used to be
 * undone immediately by the restart effect. Also renders the preview conditionally so the late
 * stream attachment is exercised against a real browser.
 */
function AutoStartPanel() {
  const [getUserMediaCalls, setGetUserMediaCalls] = useState(0);
  const camera = useWebcam({
    audio: false,
    onUserMedia: () => {
      setGetUserMediaCalls((count) => count + 1);
    },
  });

  return (
    <section>
      {camera.status === 'ready' ? (
        <video aria-label="Deferred preview" {...camera.getVideoProps()} />
      ) : null}
      <p aria-label="Deferred status">{camera.status}</p>
      <p aria-label="Deferred acquisitions">{getUserMediaCalls}</p>
      <button type="button" onClick={camera.stop}>
        Halt deferred
      </button>
      <button type="button" onClick={() => void camera.start()}>
        Resume deferred
      </button>
    </section>
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found.');
}

createRoot(root).render(<BrowserSmokeApp />);
