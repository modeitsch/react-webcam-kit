import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  downloadBlob,
  formatDuration,
  getRecordingPresetConstraints,
  useBarcodeScanner,
  useCameraCapabilities,
  useCameraPermissions,
  useCompositeStream,
  useDisplayMedia,
  useMediaRecorder,
  useObjectUrl,
  useWebcam,
} from '../../src';

import './styles.css';

const navItems = [
  { href: '#demo', label: 'Demo' },
  { href: '#install', label: 'Install' },
  { href: '#api', label: 'API' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#guides', label: 'Guides' },
  { href: '#quality', label: 'Quality' },
];

const featureItems = [
  {
    title: 'Small by design',
    body: 'No runtime dependencies beyond React, a small browser entry, and CI bundle-size budgets for every release.',
  },
  {
    title: 'Drop-in component',
    body: 'A focused <Webcam /> component with ref capture, render-prop access, mirrored preview, and native video props.',
  },
  {
    title: 'Hook-first control',
    body: 'useWebcam() exposes stream status, device and facing-mode switching, teardown, screenshots, and permission-aware error state.',
  },
  {
    title: 'Production capture',
    body: 'Capture Data URLs or Blobs, tune screenshot quality, target custom dimensions, and clean up streams predictably.',
  },
  {
    title: 'Native recording',
    body: 'Record streams with quality presets, browser MIME selection, pause/resume, audio mute, chunks, and final Blob/File output.',
  },
  {
    title: 'Advanced media flows',
    body: 'Barcode scanning, torch and zoom controls, screen-plus-webcam composition, audio meters, and chunked uploads are first-class APIs.',
  },
  {
    title: 'Package checks',
    body: 'ESM, CommonJS, and TypeScript declarations are checked with publint, Are The Types Wrong, and consumer type tests.',
  },
];

const apiRows = [
  [
    '<Webcam />',
    'Preview component with capture, switching, lifecycle callbacks, and video prop passthrough.',
  ],
  ['useWebcam()', 'Composable stream lifecycle hook for custom camera interfaces.'],
  ['useDevices()', 'Enumerates media devices with grouped arrays, maps, counts, and refresh.'],
  ['useAudioRecorder()', 'Requests microphone access and records audio-only streams.'],
  [
    'useMediaRecorder()',
    'Records a MediaStream with duration, max-duration, MIME, bitrate, Blob, and File controls.',
  ],
  ['useDisplayMedia()', 'Captures browser screens, windows, and tabs for screen recorder flows.'],
  ['useCameraPermissions()', 'Permission probe for preflight camera UI and unsupported browsers.'],
  [
    'useCameraCapabilities()',
    'Feature-detected torch, zoom, focus mode, and advanced constraints.',
  ],
  ['useBarcodeScanner()', 'Native QR and barcode scanning with dedupe and fallback states.'],
  ['useImageCapture()', 'Full-resolution still photos with preview-frame fallback.'],
  ['useAudioLevel()', 'RMS, peak, waveform, and frequency data for recording meters.'],
  ['useFrameProcessor()', 'Per-frame video processing without queue buildup.'],
  ['useCompositeStream()', 'Screen plus webcam picture-in-picture streams for recording.'],
  ['useMediaPermissions()', 'Camera and microphone permission preflight with safe probe cleanup.'],
  ['createChunkUploader()', 'Ordered, retried upload queue for long MediaRecorder sessions.'],
  ['formatDuration()', 'Formats recorder durations as compact timer labels.'],
  [
    'getRecordingPresetConstraints()',
    'Returns camera constraints for low, medium, high, HD, and full-HD presets.',
  ],
  ['createUploadFormData()', 'Builds upload-ready FormData for screenshot and recording Blobs.'],
  ['blobToFile()', 'Turns screenshot and recording Blobs into named Files.'],
  ['getSupportedMimeType()', 'Finds the first recorder MIME type supported by the browser.'],
  ['captureFrame()', 'Low-level canvas, Data URL, and Blob capture utility.'],
  ['normalizeMediaError()', 'Typed browser media errors for better user messaging.'],
];

const capabilityItems = [
  'Preview camera streams in React without owning raw media setup on every screen',
  'Capture still frames as Data URLs, Blobs, canvases, or ImageData',
  'Record video streams with bitrate controls, cancel, Blob, and File output',
  'Capture browser tabs, windows, or screens and record them with MediaRecorder',
  'Record microphone-only voice notes with a dedicated audio recorder hook',
  'Use low, medium, high, HD, and full-HD recording quality presets',
  'Build upload-ready FormData from screenshot and recording Blobs',
  'Record audio-only streams with the same MediaRecorder hook',
  'Scan QR codes and barcodes with the native BarcodeDetector where available',
  'Control torch, zoom, and focus mode on devices that expose camera capabilities',
  'Take full-resolution still photos with ImageCapture and a preview fallback',
  'Build Loom-style screen plus webcam composite recordings',
  'Upload long recordings chunk by chunk with ordered retry and progress callbacks',
  'Show audio levels, waveform data, and frequency data during recording',
  'Show recorder duration and enforce max recording duration',
  'Preview recorded Blobs with safe object URL cleanup',
  'Switch cameras by exact device ID after users choose a device',
  'Switch front and back cameras by ideal facing mode',
  'Start, stop, restart, disable, and unmount streams with predictable cleanup',
  'Separate local preview mute from microphone tracks',
  'Apply advanced video track constraints when the browser and device support them',
  'Read typed permission, device, and browser support states',
  'Probe camera permission before rendering full capture workflows',
  'Handle blocked canvas capture and unavailable cameras without crashing the UI',
];

const qualityItems = [
  'TypeScript declarations',
  'ESM and CommonJS output',
  'React 18 and 19 peer range',
  'Zero runtime dependencies beyond React',
  'Bundle-size CI budget',
  'Vitest coverage for public behavior',
  'ESLint 9 and Prettier checks',
  'GitHub Pages workflow',
  'Real browser smoke tests with fake media devices',
  'Security policy and dependency monitoring',
];

const guideItems = [
  ['React webcam capture', './react-webcam-capture/'],
  ['React camera recording', './react-camera-recording/'],
  ['React audio recorder', './react-audio-recorder/'],
  ['React screen recorder', './react-screen-recorder/'],
  ['React QR barcode scanner', './react-qr-barcode-scanner/'],
  ['React camera torch and zoom', './react-camera-capabilities/'],
  ['React composite screen recorder', './react-composite-recorder/'],
  ['React chunk upload recorder', './react-chunk-upload/'],
  ['Front and back camera switching', './react-front-back-camera/'],
  ['React avatar capture', './react-avatar-capture/'],
  ['React getUserMedia hooks', './react-getusermedia-hooks/'],
  [
    'Migration guide',
    'https://github.com/modeitsch/react-webcam-kit/blob/master/docs/MIGRATION.md',
  ],
  [
    'Browser compatibility',
    'https://github.com/modeitsch/react-webcam-kit/blob/master/docs/COMPATIBILITY.md',
  ],
  [
    'Comparison notes',
    'https://github.com/modeitsch/react-webcam-kit/blob/master/docs/COMPARISON.md',
  ],
  ['AI usage guide', 'https://github.com/modeitsch/react-webcam-kit/blob/master/docs/AI-USAGE.md'],
  ['LLM package context', 'https://modeitsch.com/react-webcam-kit/llms.txt'],
];

function LiveDemo() {
  const [capture, setCapture] = useState<Blob | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [chunkCount, setChunkCount] = useState(0);
  const permissions = useCameraPermissions({ audio: true });
  const camera = useWebcam({
    audio: true,
    startOnMount: false,
    videoConstraints: {
      ...getRecordingPresetConstraints('hd'),
      facingMode: { ideal: 'user' },
    },
  });
  const screen = useDisplayMedia({ audio: true, video: true });
  const cameraControls = useCameraCapabilities(camera.stream);
  const scanner = useBarcodeScanner(camera.videoRef, {
    formats: ['qr_code', 'ean_13', 'code_128'],
    onDetected: (code) => {
      setDetectedCode(code.rawValue);
    },
  });
  const compositeLayers = useMemo(
    () => [
      { audio: true, fit: 'contain' as const, stream: screen.stream },
      {
        audio: true,
        fit: 'cover' as const,
        height: 162,
        mirrored: true,
        stream: camera.stream,
        width: 288,
        x: 968,
        y: 526,
      },
    ],
    [camera.stream, screen.stream],
  );
  const composite = useCompositeStream({
    backgroundColor: '#101827',
    height: 720,
    layers: compositeLayers,
    width: 1280,
  });
  const recorder = useMediaRecorder({
    fileName: 'react-webcam-kit-demo',
    fileType: 'webm',
    maxDuration: 10_000,
    quality: 'hd',
    stream: camera.stream,
    timeslice: 2000,
    onDataAvailable(event) {
      if (event.data.size > 0) {
        setChunkCount((count) => count + 1);
      }
    },
  });
  const compositeRecorder = useMediaRecorder({
    fileName: 'react-webcam-kit-composite-demo',
    fileType: 'webm',
    maxDuration: 10_000,
    quality: 'hd',
    stream: composite.stream,
  });
  const captureUrl = useObjectUrl(capture);
  const playbackUrl = useObjectUrl(recorder.blob);
  const compositePlaybackUrl = useObjectUrl(compositeRecorder.blob);
  const zoomRange = cameraControls.capabilities.zoom;

  async function captureFrame() {
    const blob = await camera.getScreenshotBlob({
      format: 'image/jpeg',
      quality: 0.86,
      width: 960,
    });
    setCapture(blob);
  }

  return (
    <section className="section live-demo" id="demo">
      <div className="section__intro">
        <p className="section-label">Live demo</p>
        <h2>Try preview, capture, record, scan, hardware controls, and composite recording.</h2>
      </div>
      <div className="live-demo__layout">
        <div className="live-demo__stage">
          <div className="live-demo__preview">
            <video ref={camera.videoRef} autoPlay playsInline muted />
            {scanner.isScanning ? <span className="scan-badge">Scanner active</span> : null}
            {camera.status !== 'ready' ? (
              <div className="live-demo__placeholder">
                <strong>{camera.status}</strong>
                <span>Camera preview appears here after permission.</span>
              </div>
            ) : null}
          </div>
          <canvas
            ref={composite.canvasRef}
            className="live-demo__canvas"
            aria-label="Composite stream preview"
          />
          <div className="scan-result">
            <strong>Scan result</strong>
            <span>
              {scanner.isSupported
                ? (detectedCode ?? 'Point the camera at a QR code or barcode')
                : 'BarcodeDetector is not available in this browser'}
            </span>
          </div>
        </div>
        <div className="live-demo__panel">
          <dl className="status-list status-list--wide">
            <div>
              <dt>Camera</dt>
              <dd>{camera.status}</dd>
            </div>
            <div>
              <dt>Permission</dt>
              <dd>{permissions.permission}</dd>
            </div>
            <div>
              <dt>Recorder</dt>
              <dd>{recorder.status}</dd>
            </div>
            <div>
              <dt>Timer</dt>
              <dd>{formatDuration(recorder.duration)} / 0:10</dd>
            </div>
            <div>
              <dt>Screen</dt>
              <dd>{screen.status}</dd>
            </div>
            <div>
              <dt>Composite</dt>
              <dd>
                {composite.isRunning ? 'running' : composite.isSupported ? 'ready' : 'unsupported'}
              </dd>
            </div>
            <div>
              <dt>Chunks</dt>
              <dd>{chunkCount}</dd>
            </div>
            <div>
              <dt>Scanner</dt>
              <dd>
                {scanner.isSupported ? (scanner.isScanning ? 'scanning' : 'ready') : 'unsupported'}
              </dd>
            </div>
          </dl>
          <div className="control-grid" aria-label="Camera demo controls">
            <button type="button" onClick={() => void permissions.requestPermission()}>
              Check permission
            </button>
            <button type="button" onClick={() => void camera.start()}>
              Start
            </button>
            <button type="button" onClick={camera.stop}>
              Stop
            </button>
            <button type="button" onClick={() => void captureFrame()}>
              Capture
            </button>
            <button type="button" onClick={() => void camera.switchFacingMode('environment')}>
              Back camera
            </button>
            <button type="button" onClick={() => void camera.switchFacingMode('user')}>
              Front camera
            </button>
            <button
              type="button"
              disabled={!cameraControls.supportsTorch}
              onClick={() => void cameraControls.setTorch(!cameraControls.torch)}
            >
              {cameraControls.torch ? 'Torch off' : 'Torch on'}
            </button>
            <button
              type="button"
              disabled={!scanner.isSupported}
              onClick={() => {
                if (scanner.isScanning) {
                  scanner.stop();
                  return;
                }

                scanner.start();
              }}
            >
              {scanner.isScanning ? 'Stop scan' : 'Scan codes'}
            </button>
            <button
              type="button"
              disabled={!capture}
              onClick={() => {
                if (capture) {
                  downloadBlob(capture, 'react-webcam-kit-capture.jpg');
                }
              }}
            >
              Download photo
            </button>
            <button
              type="button"
              disabled={!camera.stream || recorder.status === 'recording'}
              onClick={() => {
                setChunkCount(0);
                recorder.start();
              }}
            >
              Record
            </button>
            <button
              type="button"
              disabled={recorder.status !== 'recording'}
              onClick={recorder.stop}
            >
              Stop recording
            </button>
            <button
              type="button"
              disabled={!recorder.file}
              onClick={() => {
                if (recorder.file) {
                  downloadBlob(recorder.file);
                }
              }}
            >
              Download video
            </button>
            <button
              type="button"
              disabled={!screen.isSupported}
              onClick={() => void screen.start()}
            >
              Share screen
            </button>
            <button
              type="button"
              disabled={!screen.stream || !camera.stream}
              onClick={() => composite.start()}
            >
              Start composite
            </button>
            <button
              type="button"
              disabled={!composite.stream || compositeRecorder.status === 'recording'}
              onClick={() => compositeRecorder.start()}
            >
              Record composite
            </button>
            <button
              type="button"
              disabled={compositeRecorder.status !== 'recording'}
              onClick={compositeRecorder.stop}
            >
              Stop composite
            </button>
            <button
              type="button"
              disabled={!compositeRecorder.file}
              onClick={() => {
                if (compositeRecorder.file) {
                  downloadBlob(compositeRecorder.file);
                }
              }}
            >
              Download composite
            </button>
          </div>
          {cameraControls.supportsZoom && zoomRange ? (
            <label className="range-control">
              <span>Zoom {cameraControls.zoom ?? zoomRange.min}</span>
              <input
                type="range"
                min={zoomRange.min}
                max={zoomRange.max}
                step={zoomRange.step}
                value={cameraControls.zoom ?? zoomRange.min}
                onChange={(event) => void cameraControls.setZoom(Number(event.target.value))}
              />
            </label>
          ) : null}
          {recorder.recordingTimeLimitReached ? (
            <p className="demo-note">The demo recording stopped at the 10 second limit.</p>
          ) : null}
          {composite.error ? <p className="demo-note">{composite.error.message}</p> : null}
          {captureUrl ? (
            <figure className="capture-result">
              <img src={captureUrl} alt="Captured camera frame" />
              <figcaption>Latest captured Blob preview</figcaption>
            </figure>
          ) : null}
          {playbackUrl ? (
            <figure className="capture-result">
              <video src={playbackUrl} controls />
              <figcaption>Latest recorded video preview</figcaption>
            </figure>
          ) : null}
          {compositePlaybackUrl ? (
            <figure className="capture-result">
              <video src={compositePlaybackUrl} controls />
              <figcaption>Latest composite recording preview</figcaption>
            </figure>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <main>
      <header className="topbar" aria-label="Site header">
        <a className="brand" href="#top" aria-label="react-webcam-kit home">
          <span className="brand__mark" aria-hidden="true" />
          <span>react-webcam-kit</span>
        </a>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero__content">
          <p className="eyebrow">React camera toolkit</p>
          <h1>React webcam capture and recording APIs.</h1>
          <p className="lead">
            A professional React webcam package for camera preview, screenshots, video recording, QR
            and barcode scanning, torch and zoom, screen-plus-webcam recording, chunk uploads,
            getUserMedia cleanup, and typed browser errors.
          </p>
          <div className="actions" aria-label="Primary actions">
            <a className="button button--primary" href="#install">
              <span aria-hidden="true">npm</span>
              Install package
            </a>
            <a className="button button--secondary" href="#api">
              View API
            </a>
          </div>
          <dl className="hero__stats" aria-label="Package status">
            <div>
              <dt>0.9.0</dt>
              <dd>Latest release</dd>
            </div>
            <div>
              <dt>40+</dt>
              <dd>Public exports</dd>
            </div>
            <div>
              <dt>MIT</dt>
              <dd>Open license</dd>
            </div>
          </dl>
        </div>

        <div className="demo-shell" aria-label="Webcam package preview">
          <div className="demo-shell__bar">
            <span className="live-dot" />
            <span>Camera ready</span>
            <span>1920 x 1080</span>
          </div>
          <div className="camera-frame">
            <div className="focus-box">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="subject subject--left" />
            <div className="subject subject--right" />
            <div className="scan-line" />
          </div>
          <div className="demo-shell__controls">
            <span>getScreenshotBlob()</span>
            <span>useBarcodeScanner()</span>
            <span>useCompositeStream()</span>
            <span>createChunkUploader()</span>
          </div>
        </div>
      </section>

      <LiveDemo />

      <section className="section section--features" id="why">
        <div className="section__intro">
          <p className="section-label">Why this package</p>
          <h2>Designed for apps that need camera behavior to be boringly reliable.</h2>
        </div>
        <div className="feature-grid">
          {featureItems.map((item) => (
            <article className="feature-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section install" id="install">
        <div>
          <p className="section-label">Install</p>
          <h2>Small package, familiar React ergonomics.</h2>
          <p>
            Install the package, import the component or hooks, and keep the browser media lifecycle
            under your control for React webcam capture, camera recording, and mobile camera
            switching.
          </p>
        </div>
        <div className="code-stack" aria-label="Installation and usage examples">
          <pre>
            <code>npm install react-webcam-kit</code>
          </pre>
          <pre>
            <code>{`import Webcam from 'react-webcam-kit';

<Webcam
  audio={false}
  screenshotFormat="image/jpeg"
  onUserMedia={(stream) => console.log(stream.id)}
/>`}</code>
          </pre>
        </div>
      </section>

      <section className="section api" id="api">
        <div className="section__intro">
          <p className="section-label">API surface</p>
          <h2>A component API for speed, hooks and utilities for full control.</h2>
        </div>
        <div className="api-table" role="table" aria-label="Public package API">
          {apiRows.map(([name, description]) => (
            <div className="api-row" role="row" key={name}>
              <strong role="cell">{name}</strong>
              <span role="cell">{description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section coverage" id="capabilities">
        <div>
          <p className="section-label">Capabilities</p>
          <h2>The core camera flows your app needs, exposed as clean React APIs.</h2>
          <p>
            Use the component for a fast preview, or compose the hooks and capture utilities into a
            camera experience that matches your product.
          </p>
        </div>
        <ul className="coverage-list">
          {capabilityItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="section quality" id="quality">
        <div className="section__intro">
          <p className="section-label">Package quality</p>
          <h2>Set up like a library people can trust.</h2>
        </div>
        <div className="quality-grid">
          {qualityItems.map((item) => (
            <div className="quality-item" key={item}>
              <span aria-hidden="true" />
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section guides" id="guides">
        <div className="section__intro">
          <p className="section-label">Guides</p>
          <h2>Search-friendly docs for common React camera jobs.</h2>
        </div>
        <div className="guide-grid">
          {guideItems.map(([label, href]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
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
    <App />
  </StrictMode>,
);
