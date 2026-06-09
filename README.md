# react-webcam-kit

A modern React camera toolkit for webcam preview, still capture, device switching, and media
stream lifecycle control.

`react-webcam-kit` is designed for production React apps that need browser camera access
without fighting low-level `getUserMedia` behavior on every screen. The package is TypeScript-first,
React 18/19 ready, and built around a small hook-based core with a migration-friendly component API.

> This package is in early development. The project foundation is ready; the camera API is being
> implemented next.

## Why This Package

Browser webcam work looks simple until it reaches real devices. Camera permissions, mobile browser
constraints, screenshot quality, stream cleanup, and device switching all have sharp edges.

This package aims to make those flows predictable:

- React component and hook APIs
- Strict TypeScript types
- Safe stream cleanup
- Data URL and Blob screenshot capture
- Camera and microphone device enumeration
- Mobile-friendly constraints guidance
- ESM and CommonJS builds
- No required runtime dependencies beyond React

## Install

```bash
npm install react-webcam-kit
```

```bash
pnpm add react-webcam-kit
```

```bash
yarn add react-webcam-kit
```

## Planned Quick Start

```tsx
import { Webcam } from 'react-webcam-kit';

export function CameraPreview() {
  return <Webcam audio={false} mirrored />;
}
```

## Planned Hook Usage

```tsx
import { useWebcam } from 'react-webcam-kit';

export function CameraControls() {
  const camera = useWebcam({ audio: false });

  return (
    <>
      <video ref={camera.videoRef} autoPlay playsInline muted />
      <button type="button" onClick={() => void camera.start()}>
        Start
      </button>
      <button type="button" onClick={camera.stop}>
        Stop
      </button>
    </>
  );
}
```

## Development

```bash
npm install
npm run verify
```

Available scripts:

- `npm run build` - build ESM, CommonJS, and type declarations
- `npm run typecheck` - run TypeScript without emitting files
- `npm run lint` - run ESLint with zero warnings
- `npm run format:check` - verify Prettier formatting
- `npm run test` - run Vitest
- `npm run verify` - run the full release gate

## Roadmap

- `Webcam` component
- `useWebcam` hook
- `useDevices` hook
- `getScreenshot()` and `getScreenshotBlob()`
- Device switching with exact `deviceId` constraints
- Normalized media errors
- Mobile browser reliability examples
- Migration guide for common `react-webcam` usage

## Browser Requirements

Camera access requires `navigator.mediaDevices.getUserMedia`, which is available only in secure
contexts such as HTTPS and localhost. Browser support and device behavior vary, especially on mobile
Safari, Android devices, and privacy-hardened browsers.

## License

MIT
