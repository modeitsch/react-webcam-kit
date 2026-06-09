import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import 'react-webcam-kit';

function App() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section style={{ maxWidth: 680 }}>
        <p style={{ margin: 0, color: '#2563eb', fontWeight: 700 }}>react-webcam-kit</p>
        <h1 style={{ margin: '12px 0', fontSize: 44, lineHeight: 1.05 }}>Basic example</h1>
        <p style={{ margin: 0, color: '#475569', fontSize: 18, lineHeight: 1.6 }}>
          Camera controls will be added here as the component and hook APIs land.
        </p>
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
