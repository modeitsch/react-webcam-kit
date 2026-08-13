# React QR Barcode Scanner

`react-webcam-kit` ships `useBarcodeScanner()`, a hook over the browser's native `BarcodeDetector`.
It adds no dependency and no bundle weight, because the decoding is done by the browser. Where the
API is missing the hook reports `isSupported: false` and stays inert, so you can fall back to a
userland decoder without paying for one up front.

## When To Use This Package

Use this package for scanner screens when you need:

- QR and barcode scanning with no scanner dependency
- Camera permission preflight before opening a scanner
- Front/back camera switching for mobile scanning
- Torch (flashlight) control for scanning in low light
- Screenshot capture or recording alongside a scanner workflow
- Typed camera errors and predictable stream cleanup

## `useBarcodeScanner()`

```tsx
import { useBarcodeScanner, useCameraCapabilities, useWebcam } from 'react-webcam-kit';

export function Scanner() {
  const [value, setValue] = useState<string | null>(null);
  const camera = useWebcam({
    audio: false,
    videoConstraints: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });
  const controls = useCameraCapabilities(camera.stream);
  const scanner = useBarcodeScanner(camera.videoRef, {
    formats: ['qr_code', 'code_128', 'ean_13'],
    onDetected: (code) => setValue(code.rawValue),
  });

  if (!scanner.isSupported) {
    return <FallbackScanner />;
  }

  return (
    <>
      <video {...camera.getVideoProps()} />
      {controls.supportsTorch && (
        <button type="button" onClick={() => void controls.setTorch(!controls.torch)}>
          {controls.torch ? 'Light off' : 'Light on'}
        </button>
      )}
      <p>{value ?? 'Point the camera at a code'}</p>
    </>
  );
}
```

A code that stays in frame reports once rather than at the scan rate. Pass `continuous: true` for a
callback on every frame, or tune `dedupeIntervalMs`. Lower `fps` (default 10) if decoding is
competing with other work on the main thread.

## Browser `BarcodeDetector` Example

If you would rather drive the detector yourself, the hook is a thin wrapper over this:

```tsx
import { useEffect, useState } from 'react';
import { useWebcam } from 'react-webcam-kit';

export function BrowserBarcodeScanner() {
  const [value, setValue] = useState<string | null>(null);
  const camera = useWebcam({
    audio: false,
    videoConstraints: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });

  useEffect(() => {
    if (!('BarcodeDetector' in window) || camera.status !== 'ready') return;

    const detector = new BarcodeDetector({
      formats: ['qr_code', 'code_128', 'ean_13'],
    });
    let stopped = false;

    async function scan() {
      const video = camera.videoRef.current;

      if (!video || stopped) return;

      const codes = await detector.detect(video);
      const firstCode = codes[0];

      if (firstCode) {
        setValue(firstCode.rawValue);
      }

      requestAnimationFrame(scan);
    }

    void scan();

    return () => {
      stopped = true;
    };
  }, [camera.status, camera.videoRef]);

  return (
    <>
      <video ref={camera.videoRef} autoPlay playsInline muted />
      <p>{value ?? 'Scan a QR code or barcode'}</p>
    </>
  );
}
```

`BarcodeDetector` support varies by browser. Feature-detect it and show a fallback when it is not
available.

## Dedicated Scanner Libraries

For maximum scanner compatibility, use a dedicated decoder package and let it own the camera stream.
Use `useCameraPermissions()` before rendering the scanner so your app can show a consistent
permission prompt and fallback UI.

```tsx
import { useCameraPermissions } from 'react-webcam-kit';

export function ScannerGate({ children }: { children: React.ReactNode }) {
  const cameraPermission = useCameraPermissions();

  if (cameraPermission.permission !== 'granted') {
    return (
      <button type="button" onClick={() => void cameraPermission.requestPermission()}>
        Enable camera
      </button>
    );
  }

  return children;
}
```

Dedicated packages such as `@yudiel/react-qr-scanner` or `react-qr-barcode-scanner` can be rendered
inside that gate. Keep scanner decoding optional unless every user of your app needs it.

## Mobile Scanning Tips

- Prefer the back camera with `facingMode: { ideal: 'environment' }`.
- Start with `ideal` constraints instead of exact width and height.
- Handle denied permission and no-camera states before rendering scanner UI.
- Stop streams when the scanner modal closes.
- Use good lighting and leave enough preview size for users to align the code.
