# React QR Barcode Scanner

`react-webcam-kit` focuses on camera access, permissions, device selection, preview, capture, and
recording. QR and barcode decoding is best kept as an app-level integration so the core package does
not ship scanner dependencies to every webcam user.

## When To Use This Package

Use this package for scanner screens when you need:

- Camera permission preflight before opening a scanner
- Front/back camera switching for mobile scanning
- A reusable camera preview around the browser `BarcodeDetector` API
- Screenshot capture or recording alongside a scanner workflow
- Typed camera errors and predictable stream cleanup

## Browser `BarcodeDetector` Example

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
