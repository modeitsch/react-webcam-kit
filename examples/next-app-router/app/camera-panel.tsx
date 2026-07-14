'use client';

import {
  downloadBlob,
  formatDuration,
  getRecordingPresetConstraints,
  useMediaRecorder,
  useObjectUrl,
  useWebcam,
} from 'react-webcam-kit';

export function CameraPanel() {
  const camera = useWebcam({
    audio: true,
    startOnMount: false,
    videoConstraints: getRecordingPresetConstraints('hd'),
  });
  const recorder = useMediaRecorder({
    fileName: 'next-camera-recording',
    fileType: 'webm',
    maxDuration: 30_000,
    quality: 'hd',
    stream: camera.stream,
  });
  const playbackUrl = useObjectUrl(recorder.blob);

  async function captureImage() {
    const blob = await camera.getScreenshotBlob({
      format: 'image/jpeg',
      quality: 0.9,
      width: 1280,
      height: 720,
    });

    if (blob) {
      downloadBlob(blob, 'next-camera-capture.jpg');
    }
  }

  return (
    <section className="panel">
      <div>
        <p className="eyebrow">react-webcam-kit</p>
        <h1>Next.js camera starter</h1>
        <p className="lede">
          Use the webcam hooks from a client component and keep server-rendered routes clean.
        </p>
      </div>

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
        <button type="button" disabled={!camera.stream} onClick={() => void captureImage()}>
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
              downloadBlob(recorder.blob, 'next-camera-recording.webm');
            }
          }}
        >
          Download video
        </button>
      </div>

      <p className="status">
        Camera: {camera.status} · Recorder: {recorder.status} · {formatDuration(recorder.duration)}
      </p>

      {camera.error ? <p className="error">{camera.error.message}</p> : null}
      {recorder.error ? <p className="error">{recorder.error.message}</p> : null}

      {playbackUrl ? <video className="playback" src={playbackUrl} controls playsInline /> : null}
    </section>
  );
}
