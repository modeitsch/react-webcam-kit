import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';

const compatibilityItems = [
  'Familiar <Webcam /> component',
  'Ref and render-prop capture',
  'Native video props pass-through',
  'Migration guide for existing apps',
];

const upgradeItems = [
  'Hook-based stream lifecycle',
  'Data URL and Blob screenshots',
  'Exact device switching',
  'Typed browser error states',
];

const roadmapItems = [
  'Recorder helper hook',
  'Migration recipes',
  'Live camera demos',
  'Device test matrix',
];

function App() {
  return (
    <main>
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">React camera toolkit</p>
          <h1>react-webcam-kit</h1>
          <p className="lead">
            A polished webcam component and hooks package for React apps that need camera preview,
            capture, device switching, and reliable media cleanup.
          </p>
          <div className="actions" aria-label="Primary actions">
            <a className="button button--primary" href="#install">
              Install
            </a>
            <a className="button button--secondary" href="#roadmap">
              Roadmap
            </a>
          </div>
        </div>

        <div className="camera-panel" aria-label="Camera package preview">
          <div className="camera-panel__top">
            <span className="status-dot" />
            <span>Preview ready</span>
          </div>
          <div className="camera-frame">
            <div className="lens-mark lens-mark--one" />
            <div className="lens-mark lens-mark--two" />
            <div className="scan-line" />
          </div>
          <div className="camera-panel__bottom">
            <span>getScreenshotBlob()</span>
            <span>useDevices()</span>
          </div>
        </div>
      </section>

      <section className="section section--grid" id="why">
        <article>
          <p className="section-label">Migration friendly</p>
          <h2>Built for the apps already using webcam components.</h2>
          <ul>
            {compatibilityItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article>
          <p className="section-label">Modern core</p>
          <h2>Designed around the browser problems teams actually hit.</h2>
          <ul>
            {upgradeItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="section install" id="install">
        <div>
          <p className="section-label">Install</p>
          <h2>Core package API is in place.</h2>
          <p>
            The package includes a compatibility component, hook APIs, Blob capture, strict
            TypeScript, tests, dual package output, and this GitHub Pages site.
          </p>
        </div>
        <pre>
          <code>npm install react-webcam-kit</code>
        </pre>
      </section>

      <section className="section roadmap" id="roadmap">
        <p className="section-label">Roadmap</p>
        <h2>Next up: deeper examples and browser coverage.</h2>
        <div className="roadmap__items">
          {roadmapItems.map((item, index) => (
            <div className="roadmap__item" key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{item}</strong>
            </div>
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
