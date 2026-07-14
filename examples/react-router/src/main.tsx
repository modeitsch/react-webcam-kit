import { StrictMode, useRef, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Link, RouterProvider, createBrowserRouter } from 'react-router';

import {
  Webcam,
  downloadBlob,
  formatDuration,
  getRecordingPresetConstraints,
  useMediaRecorder,
  useObjectUrl,
  useWebcam,
} from 'react-webcam-kit';
import type { WebcamHandle } from 'react-webcam-kit';

import './styles.css';

function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="shell">
      <nav className="tabs" aria-label="Example routes">
        <Link to="/">Capture</Link>
        <Link to="/record">Record</Link>
      </nav>
      {children}
    </main>
  );
}

function CaptureRoute() {
  const webcamRef = useRef<WebcamHandle>(null);

  async function captureImage() {
    const blob = await webcamRef.current?.getScreenshotBlob({
      format: 'image/jpeg',
      quality: 0.9,
      width: 1024,
      height: 768,
    });

    if (blob) {
      downloadBlob(blob, 'router-camera-capture.jpg');
    }
  }

  return (
    <Layout>
      <section className="panel">
        <p className="eyebrow">react-webcam-kit</p>
        <h1>Routed camera capture</h1>
        <p className="lede">Use the component API when a route only needs preview and capture.</p>
        <div className="preview">
          <Webcam ref={webcamRef} audio={false} mirrored className="media" />
        </div>
        <div className="actions">
          <button type="button" onClick={() => void captureImage()}>
            Capture image
          </button>
        </div>
      </section>
    </Layout>
  );
}

function RecorderRoute() {
  const camera = useWebcam({
    audio: true,
    startOnMount: false,
    videoConstraints: getRecordingPresetConstraints('hd'),
  });
  const recorder = useMediaRecorder({
    fileName: 'router-camera-recording',
    fileType: 'webm',
    quality: 'hd',
    stream: camera.stream,
  });
  const playbackUrl = useObjectUrl(recorder.blob);

  return (
    <Layout>
      <section className="panel">
        <p className="eyebrow">react-webcam-kit</p>
        <h1>Routed video recording</h1>
        <p className="lede">Use the hooks when a route needs direct stream and recorder control.</p>
        <div className="preview">
          <video ref={camera.videoRef} autoPlay playsInline muted className="media" />
        </div>
        <div className="actions">
          <button type="button" onClick={() => void camera.start()}>
            Start camera
          </button>
          <button type="button" onClick={camera.stop}>
            Stop camera
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
                downloadBlob(recorder.blob, 'router-camera-recording.webm');
              }
            }}
          >
            Download video
          </button>
        </div>
        <p className="status">
          {recorder.status} · {formatDuration(recorder.duration)}
        </p>
        {playbackUrl ? <video className="playback" src={playbackUrl} controls playsInline /> : null}
      </section>
    </Layout>
  );
}

const router = createBrowserRouter([
  { path: '/', element: <CaptureRoute /> },
  { path: '/record', element: <RecorderRoute /> },
]);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
