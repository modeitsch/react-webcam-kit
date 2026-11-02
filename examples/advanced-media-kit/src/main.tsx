import { StrictMode, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  createChunkUploader,
  downloadBlob,
  formatDuration,
  useBarcodeScanner,
  useCameraCapabilities,
  useCompositeStream,
  useDisplayMedia,
  useMediaRecorder,
  useObjectUrl,
  useWebcam,
  type ChunkUploader,
} from 'react-webcam-kit';

import './styles.css';

function AdvancedMediaKit() {
  const [scanValue, setScanValue] = useState<string | null>(null);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const camera = useWebcam({
    audio: true,
    startOnMount: false,
    videoConstraints: {
      facingMode: { ideal: 'user' },
      height: { ideal: 720 },
      width: { ideal: 1280 },
    },
  });
  const controls = useCameraCapabilities(camera.stream);
  const scanner = useBarcodeScanner(camera.videoRef, {
    formats: ['qr_code', 'ean_13', 'code_128'],
    onDetected: (code) => setScanValue(code.rawValue),
  });
  const screen = useDisplayMedia({ audio: true, video: true });
  const layers = useMemo(
    () => [
      { audio: true, fit: 'contain' as const, stream: screen.stream },
      {
        audio: true,
        fit: 'cover' as const,
        height: 180,
        mirrored: true,
        stream: camera.stream,
        width: 320,
        x: 940,
        y: 520,
      },
    ],
    [camera.stream, screen.stream],
  );
  const composite = useCompositeStream({
    backgroundColor: '#0f172a',
    height: 720,
    layers,
    width: 1280,
  });
  const uploader = useRef<ChunkUploader | null>(null);
  function startUploadSession() {
    setUploadedChunks(0);
    setUploadError(null);
    uploader.current = createChunkUploader({
      fetchImpl: async () => {
        await new Promise((resolve) => setTimeout(resolve, 180));
        return new Response(null, { status: 204 });
      },
      onProgress: ({ uploaded }) => setUploadedChunks(uploaded),
      uploadId: crypto.randomUUID(),
      onError: (error) => setUploadError(error.message),
      url: '/api/recordings/chunks',
    });
  }
  const cameraRecorder = useMediaRecorder({
    fileName: 'camera-upload-demo',
    fileType: 'webm',
    onStart: startUploadSession,
    onDataAvailable: (event) => uploader.current?.enqueue(event.data),
    onStop: () => {
      void uploader.current?.complete().catch((error: unknown) => {
        setUploadError(error instanceof Error ? error.message : 'Upload failed.');
      });
    },
    quality: 'hd',
    stream: camera.stream,
    timeslice: 3000,
  });
  const compositeRecorder = useMediaRecorder({
    fileName: 'screen-camera-demo',
    fileType: 'webm',
    quality: 'hd',
    stream: composite.stream,
  });
  const cameraPlaybackUrl = useObjectUrl(cameraRecorder.blob);
  const compositePlaybackUrl = useObjectUrl(compositeRecorder.blob);
  const zoomRange = controls.capabilities.zoom;

  return (
    <main className="page">
      <section className="preview">
        <video ref={camera.videoRef} autoPlay playsInline muted />
        <canvas ref={composite.canvasRef} />
      </section>

      <section className="panel" aria-label="Advanced media controls">
        <div className="statusGrid">
          <span>Camera: {camera.status}</span>
          <span>Screen: {screen.status}</span>
          <span>Scanner: {scanner.isSupported ? 'ready' : 'unsupported'}</span>
          <span>Uploaded chunks: {uploadedChunks}</span>
        </div>

        <div className="buttons">
          <button type="button" onClick={() => void camera.start()}>
            Start camera
          </button>
          <button type="button" onClick={camera.stop} disabled={!camera.stream}>
            Stop camera
          </button>
          <button
            type="button"
            onClick={() => void controls.setTorch(!controls.torch)}
            disabled={!controls.supportsTorch}
          >
            {controls.torch ? 'Torch off' : 'Torch on'}
          </button>
          <button type="button" onClick={() => void screen.start()} disabled={!screen.isSupported}>
            Share screen
          </button>
          <button
            type="button"
            onClick={composite.start}
            disabled={!screen.stream || !camera.stream}
          >
            Start composite
          </button>
          <button
            type="button"
            onClick={() => cameraRecorder.start()}
            disabled={!camera.stream || cameraRecorder.status === 'recording'}
          >
            Record upload demo
          </button>
          <button
            type="button"
            onClick={cameraRecorder.stop}
            disabled={cameraRecorder.status !== 'recording'}
          >
            Stop upload demo
          </button>
          <button
            type="button"
            onClick={() => compositeRecorder.start()}
            disabled={!composite.stream || compositeRecorder.status === 'recording'}
          >
            Record composite
          </button>
          <button
            type="button"
            onClick={compositeRecorder.stop}
            disabled={compositeRecorder.status !== 'recording'}
          >
            Stop composite
          </button>
        </div>

        {controls.supportsZoom && zoomRange ? (
          <label className="range">
            Zoom
            <input
              type="range"
              min={zoomRange.min}
              max={zoomRange.max}
              step={zoomRange.step}
              value={controls.zoom ?? zoomRange.min}
              onChange={(event) => void controls.setZoom(Number(event.target.value))}
            />
          </label>
        ) : null}

        <div className="results">
          {uploadError ? <p role="alert">{uploadError}</p> : null}
          <p>Scan result: {scanValue ?? 'Point the camera at a QR code or barcode'}</p>
          <p>
            Camera recorder: {cameraRecorder.status} {formatDuration(cameraRecorder.duration)}
          </p>
          <p>Composite recorder: {compositeRecorder.status}</p>
        </div>

        {cameraPlaybackUrl ? <video className="playback" src={cameraPlaybackUrl} controls /> : null}
        {compositePlaybackUrl ? (
          <>
            <video className="playback" src={compositePlaybackUrl} controls />
            <button
              type="button"
              onClick={() => {
                if (compositeRecorder.file) {
                  downloadBlob(compositeRecorder.file);
                }
              }}
            >
              Download composite
            </button>
          </>
        ) : null}
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
    <AdvancedMediaKit />
  </StrictMode>,
);
