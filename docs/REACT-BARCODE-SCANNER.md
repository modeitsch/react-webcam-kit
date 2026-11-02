# React Barcode Scanner

Build a React QR code and barcode scanner with `useWebcam()`, `useBarcodeScanner()`, and optional
camera torch control.

`useBarcodeScanner()` uses the browser-native `BarcodeDetector` API. That keeps the package small:
there is no bundled scanner engine, worker, or WASM decoder. Browsers without `BarcodeDetector`
report `isSupported: false`, so your UI can show a fallback scanner only where it is needed.

## Basic Scanner

```tsx
import { useState } from 'react';
import { useBarcodeScanner, useWebcam } from 'react-webcam-kit';

export function BarcodeScanner() {
  const [value, setValue] = useState<string | null>(null);
  const camera = useWebcam({
    audio: false,
    videoConstraints: {
      facingMode: { ideal: 'environment' },
      height: { ideal: 720 },
      width: { ideal: 1280 },
    },
  });
  const scanner = useBarcodeScanner(camera.videoRef, {
    formats: ['qr_code', 'ean_13', 'code_128'],
    onDetected: (code) => setValue(code.rawValue),
  });

  if (!scanner.isSupported) {
    return <p>This browser does not support native barcode scanning.</p>;
  }

  return (
    <>
      <video {...camera.getVideoProps()} />
      <p>{value ?? 'Point the camera at a QR code or barcode'}</p>
      <button type="button" onClick={scanner.reset}>
        Clear result
      </button>
    </>
  );
}
```

## Torch For Low Light

```tsx
import { useBarcodeScanner, useCameraCapabilities, useWebcam } from 'react-webcam-kit';

export function ScannerWithTorch() {
  const camera = useWebcam({
    audio: false,
    videoConstraints: { facingMode: { ideal: 'environment' } },
  });
  const controls = useCameraCapabilities(camera.stream);
  const scanner = useBarcodeScanner(camera.videoRef);

  return (
    <>
      <video {...camera.getVideoProps()} />
      <button
        type="button"
        disabled={!controls.supportsTorch}
        onClick={() => void controls.setTorch(!controls.torch)}
      >
        {controls.torch ? 'Turn light off' : 'Turn light on'}
      </button>
      <p>{scanner.lastResult?.rawValue ?? 'Scanning...'}</p>
    </>
  );
}
```

## Scanner Notes

- Prefer `facingMode: { ideal: 'environment' }` for mobile scanner screens.
- Use `formats` to narrow scanning work when you only need QR codes or one barcode type.
- `dedupeIntervalMs` prevents the same code from firing repeatedly while it stays in frame.
- Pass `continuous: true` when you want a callback for every matching frame.
- Lower `fps` if scanning competes with other UI work.
- Always show a fallback when `scanner.isSupported` is false.
