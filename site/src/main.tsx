import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { downloadBlob, useObjectUrl, useWebcam } from '../../src';

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
    title: 'Recording helper',
    body: 'Record the active stream with bitrate controls, browser MIME selection, pause/resume, audio mute, chunks, and final Blob output.',
  },
];

const apiRows = [
  [
    '<Webcam />',
    'Preview component with capture, switching, lifecycle callbacks, and video prop passthrough.',
  ],
  ['useWebcam()', 'Composable stream lifecycle hook for custom camera interfaces.'],
  ['useDevices()', 'Enumerates media devices with grouped arrays, maps, counts, and refresh.'],
  [
    'useMediaRecorder()',
    'Records a MediaStream with MIME, bitrate, chunk, pause, mute, Blob, and File controls.',
  ],
  ['getSupportedMimeType()', 'Finds the first recorder MIME type supported by the browser.'],
  ['captureFrame()', 'Low-level canvas, Data URL, and Blob capture utility.'],
  ['normalizeMediaError()', 'Typed browser media errors for better user messaging.'],
];

const capabilityItems = [
  'Preview camera streams in React without owning raw media setup on every screen',
  'Capture still frames as Data URLs, Blobs, canvases, or ImageData',
  'Record video streams with bitrate controls, cancel, Blob, and File output',
  'Preview recorded Blobs with safe object URL cleanup',
  'Switch cameras by exact device ID after users choose a device',
  'Switch front and back cameras by ideal facing mode',
  'Start, stop, restart, disable, and unmount streams with predictable cleanup',
  'Separate local preview mute from microphone tracks',
  'Apply advanced video track constraints when the browser and device support them',
  'Read typed permission, device, and browser support states',
  'Handle blocked canvas capture and unavailable cameras without crashing the UI',
];

const qualityItems = [
  'TypeScript declarations',
  'ESM and CommonJS output',
  'React 18 and 19 peer range',
  'Vitest coverage for public behavior',
  'ESLint 9 and Prettier checks',
  'GitHub Pages workflow',
  'Real browser smoke tests with fake media devices',
  'Security policy and dependency monitoring',
];

const guideItems = [
  [
    'React webcam capture',
    'https://github.com/modeitsch/react-webcam-kit/blob/master/docs/REACT-WEBCAM-CAPTURE.md',
  ],
  [
    'React camera recording',
    'https://github.com/modeitsch/react-webcam-kit/blob/master/docs/REACT-CAMERA-RECORDING.md',
  ],
  [
    'Front and back camera switching',
    'https://github.com/modeitsch/react-webcam-kit/blob/master/docs/REACT-FRONT-BACK-CAMERA.md',
  ],
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
  const camera = useWebcam({
    audio: false,
    startOnMount: false,
    videoConstraints: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: { ideal: 'user' },
    },
  });
  const captureUrl = useObjectUrl(capture);

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
        <h2>Try the real camera hooks in the browser.</h2>
      </div>
      <div className="live-demo__layout">
        <div className="live-demo__preview">
          <video ref={camera.videoRef} autoPlay playsInline muted />
          {camera.status !== 'ready' ? (
            <div className="live-demo__placeholder">
              <strong>{camera.status}</strong>
              <span>Camera preview appears here after permission.</span>
            </div>
          ) : null}
        </div>
        <div className="live-demo__panel">
          <dl className="status-list">
            <div>
              <dt>Status</dt>
              <dd>{camera.status}</dd>
            </div>
            <div>
              <dt>Permission</dt>
              <dd>{camera.permission}</dd>
            </div>
            <div>
              <dt>Facing mode</dt>
              <dd>{camera.selectedFacingMode ?? 'default'}</dd>
            </div>
          </dl>
          <div className="control-grid" aria-label="Camera demo controls">
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
              disabled={!capture}
              onClick={() => {
                if (capture) {
                  downloadBlob(capture, 'react-webcam-kit-capture.jpg');
                }
              }}
            >
              Download
            </button>
          </div>
          {captureUrl ? (
            <figure className="capture-result">
              <img src={captureUrl} alt="Captured camera frame" />
              <figcaption>Latest captured Blob preview</figcaption>
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
          <h1>Webcam APIs that feel maintained.</h1>
          <p className="lead">
            A professional React package for camera preview, screenshots, device switching, media
            cleanup, and typed browser errors.
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
              <dt>0.3.2</dt>
              <dd>Latest release</dd>
            </div>
            <div>
              <dt>17</dt>
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
            <span>switchDevice()</span>
            <span>switchFacingMode()</span>
            <span>onStop()</span>
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
            under your control.
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
          <h2>Search-friendly docs for common camera jobs.</h2>
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
