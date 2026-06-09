# react-webcam-kit

A modern React camera toolkit for webcam preview, still capture, device switching, and media
stream lifecycle control.

`react-webcam-kit` is designed for production React apps that need browser camera access
without fighting low-level `getUserMedia` behavior on every screen. The package is TypeScript-first,
React 18/19 ready, and built around a small hook-based core with a migration-friendly component API.

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

## Quick Start

```tsx
import { Webcam } from 'react-webcam-kit';

export function CameraPreview() {
  return <Webcam audio={false} mirrored />;
}
```

## Screenshot By Ref

```tsx
import { useRef } from 'react';
import { Webcam, type WebcamHandle } from 'react-webcam-kit';

export function AvatarCapture() {
  const webcamRef = useRef<WebcamHandle>(null);

  return (
    <>
      <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" />
      <button
        type="button"
        onClick={() => {
          const image = webcamRef.current?.getScreenshot();
          console.log(image);
        }}
      >
        Capture
      </button>
    </>
  );
}
```

## Screenshot As Blob

```tsx
const blob = await webcamRef.current?.getScreenshotBlob({
  format: 'image/png',
});
```

## Hook Usage

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

## Camera Switching

```tsx
await camera.switchDevice('device-id-from-enumerate-devices');
```

`switchDevice` uses an exact `deviceId` constraint so Chrome and mobile browsers are more likely to
select the intended camera:

```ts
{
  deviceId: {
    exact: deviceId;
  }
}
```

## Advanced Track Constraints

Use `applyVideoConstraints()` when the browser exposes advanced camera capabilities such as torch,
zoom, focus distance, or exposure controls. Browser support varies, so feature-detect with the
underlying video track before relying on a capability.

```tsx
await camera.applyVideoConstraints({
  advanced: [{ torch: true } as MediaTrackConstraintSet],
});
```

## Compatibility With `react-webcam`

`react-webcam-kit` keeps the familiar component shape:

- `audio`
- `audioConstraints`
- `videoConstraints`
- `mirrored`
- `screenshotFormat`
- `screenshotQuality`
- `forceScreenshotSourceSize`
- `imageSmoothing`
- `minScreenshotWidth`
- `minScreenshotHeight`
- `disablePictureInPicture`
- `onUserMedia`
- `onUserMediaError`
- `getScreenshot({ width, height })`
- render-prop children receiving `{ getScreenshot }`

It also adds:

- `useWebcam`
- `useDevices`
- `getScreenshotBlob`
- `applyVideoConstraints`
- `startOnMount`
- `enabled`
- `onStart`
- `onStop`
- `onError`
- `onPermissionChange`

## Upstream Issue And PR Coverage

The first release intentionally absorbs several common `react-webcam` pain points:

| Upstream signal                                               | Covered by                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| PR #411 / issue #400: screenshot Blob output                  | `getScreenshotBlob()`                                          |
| PR #404 / issue #395: separate stream audio from preview mute | native `muted` prop plus `audio` stream control                |
| issue #410: teardown callback                                 | `onStop` on manual stop, disable, restart, switch, and unmount |
| issue #413 / PR #227: reliable camera switching               | `switchDevice()` with exact `deviceId` constraints             |
| issue #387: audio prop changes do not restart stream          | stream restart on audio and constraint changes                 |
| issue #189: flash/torch access                                | `applyVideoConstraints()` escape hatch                         |
| PR #208 / issue #187: unsupported/no-camera error path        | normalized `onError` / `onUserMediaError`                      |

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

- MediaRecorder helper hook
- More browser/device recipes
- Dedicated migration guide examples
- Interactive documentation site demos

## Browser Requirements

Camera access requires `navigator.mediaDevices.getUserMedia`, which is available only in secure
contexts such as HTTPS and localhost. Browser support and device behavior vary, especially on mobile
Safari, Android devices, and privacy-hardened browsers.

For mobile devices, prefer `ideal` constraints over strict high-resolution constraints:

```tsx
<Webcam
  audio={false}
  videoConstraints={{
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: { ideal: 'environment' },
  }}
/>
```

## Publishing

Before publishing:

```bash
npm run verify
npm pack --dry-run
npm publish --dry-run
```

## License

MIT
