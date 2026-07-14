import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import {
  downloadBlob,
  formatDuration,
  getRecordingPresetConstraints,
  useMediaRecorder,
  useObjectUrl,
  useWebcam,
} from 'react-webcam-kit';

import './styles.css';

function App() {
  const camera = useWebcam({
    audio: true,
    startOnMount: false,
    videoConstraints: getRecordingPresetConstraints('hd'),
  });
  const recorder = useMediaRecorder({
    fileName: 'vite-camera-recording',
    fileType: 'webm',
    quality: 'hd',
    stream: camera.stream,
  });
  const playbackUrl = useObjectUrl(recorder.blob);

  async function captureImage() {
    const blob = await camera.getScreenshotBlob({
      format: 'image/png',
      width: 1280,
      height: 720,
    });

    if (blob) {
      downloadBlob(blob, 'vite-camera-capture.png');
    }
  }

  return (
    <main className="shell">
      <section className="panel">
        <div>
          <p className="eyebrow">react-webcam-kit</p>
          <h1>Vite camera starter</h1>
          <p className="lede">
            Preview a camera stream, capture a still image, record video, and download the result.
          </p>
        </div>

        <div className="preview">
          <video ref={camera.videoRef} autoPlay playsInline muted className="previewVideo" />
        </div>

        <div className="actions">
          <button type="button" onClick={() => void camera.start()}>
            Start camera
          </button>
          <button type="button" onClick={camera.stop}>
            Stop camera
          </button>
          <button type="button" onClick={() => void captureImage()}>
            Capture image
          </button>
          <button type="button" disabled={!camera.stream} onClick={() => recorder.start()}>
            Record
          </button>
          <button type="button" disabled={recorder.status === 'idle'} onClick={recorder.stop}>
            Stop recording
          </button>
          <button
            type="button"
            disabled={!recorder.blob}
            onClick={() => {
              if (recorder.blob) {
                downloadBlob(recorder.blob, 'vite-camera-recording.webm');
              }
            }}
          >
            Download video
          </button>
        </div>

        <p className="status">
          Camera: {camera.status} · Recorder: {recorder.status} ·{' '}
          {formatDuration(recorder.duration)}
        </p>

        {camera.error ? <p className="error">{camera.error.message}</p> : null}
        {recorder.error ? <p className="error">{recorder.error.message}</p> : null}

        {playbackUrl ? <video className="playback" src={playbackUrl} controls playsInline /> : null}
      </section>
    </main>
  );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
