import { StrictMode, useMemo, useState } from 'react';
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

function CameraRecorderStarter() {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const camera = useWebcam({
    audio: true,
    screenshotFormat: 'image/jpeg',
    screenshotQuality: 0.9,
    videoConstraints: getRecordingPresetConstraints('hd'),
  });
  const recorder = useMediaRecorder({
    fileName: () => `camera-recording-${new Date().toISOString().slice(0, 10)}`,
    fileType: 'webm',
    maxDuration: 30_000,
    quality: 'hd',
    stream: camera.stream,
  });
  const playbackUrl = useObjectUrl(recorder.blob);
  const canRecord = Boolean(camera.stream) && recorder.status !== 'recording';
  const canStop = recorder.status === 'recording' || recorder.status === 'paused';
  const statusText = useMemo(() => {
    if (camera.error) {
      return camera.error.message;
    }

    if (recorder.error) {
      return recorder.error.message;
    }

    if (recorder.status === 'recording') {
      return `Recording ${formatDuration(recorder.duration)}`;
    }

    if (recorder.status === 'paused') {
      return `Paused at ${formatDuration(recorder.duration)}`;
    }

    if (recorder.blob) {
      return `Ready to download ${formatDuration(recorder.duration)}`;
    }

    return camera.status === 'ready' ? 'Camera ready' : 'Start the camera to begin';
  }, [
    camera.error,
    camera.status,
    recorder.blob,
    recorder.duration,
    recorder.error,
    recorder.status,
  ]);

  return (
    <main className="page">
      <section className="workspace" aria-label="Camera recorder starter">
        <div className="previewShell">
          <video ref={camera.videoRef} autoPlay playsInline muted className="previewVideo" />
          <div className="statusPill">{statusText}</div>
        </div>

        <div className="controls" aria-label="Recorder controls">
          <button
            type="button"
            onClick={() => void camera.start()}
            disabled={camera.status === 'ready'}
          >
            Start camera
          </button>
          <button type="button" onClick={camera.stop} disabled={!camera.stream}>
            Stop camera
          </button>
          <button
            type="button"
            onClick={() => {
              setScreenshot(camera.getScreenshot({ width: 960, height: 540 }));
            }}
            disabled={!camera.stream}
          >
            Capture
          </button>
          <button type="button" onClick={() => recorder.start()} disabled={!canRecord}>
            Record
          </button>
          <button type="button" onClick={recorder.pause} disabled={recorder.status !== 'recording'}>
            Pause
          </button>
          <button type="button" onClick={recorder.resume} disabled={recorder.status !== 'paused'}>
            Resume
          </button>
          <button type="button" onClick={recorder.stop} disabled={!canStop}>
            Stop
          </button>
          <button
            type="button"
            onClick={recorder.cancel}
            disabled={!recorder.blob && recorder.status === 'idle'}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              if (recorder.file) {
                downloadBlob(recorder.file);
              }
            }}
            disabled={!recorder.file}
          >
            Download
          </button>
        </div>

        <div className="results" aria-label="Capture results">
          <section>
            <h2>Screenshot</h2>
            {screenshot ? (
              <img src={screenshot} alt="Captured camera frame" />
            ) : (
              <p>Captured frames appear here.</p>
            )}
          </section>

          <section>
            <h2>Recording</h2>
            {playbackUrl ? (
              <video src={playbackUrl} controls className="playbackVideo" />
            ) : (
              <p>Recorded video playback appears here.</p>
            )}
          </section>
        </div>
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
    <CameraRecorderStarter />
  </StrictMode>,
);
