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
    </main>
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found.');
}

createRoot(root).render(<BrowserSmokeApp />);
