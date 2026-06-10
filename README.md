# react-webcam-kit

[![npm version](https://img.shields.io/npm/v/react-webcam-kit.svg)](https://www.npmjs.com/package/react-webcam-kit)
[![npm downloads](https://img.shields.io/npm/dm/react-webcam-kit.svg)](https://www.npmjs.com/package/react-webcam-kit)
[![CI](https://github.com/modeitsch/react-webcam-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/modeitsch/react-webcam-kit/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

![react-webcam-kit logo](./docs/assets/logo.svg)

A modern React camera toolkit for webcam preview, screenshots, device switching, and safe media
stream cleanup.

`react-webcam-kit` gives React apps a small, typed API over browser camera behavior. Use the
component when you want a ready preview, or the hooks and utilities when you need a custom camera
experience.

## Highlights

- `<Webcam />` preview component with imperative capture methods
- `useWebcam()` hook for stream lifecycle, permission state, and device switching
- `useDevices()` hook for camera and microphone enumeration, maps, and counts
- `useMediaRecorder()` hook for typed video recording and Blob output
- `useObjectUrl()` hook for safe Blob previews
- `downloadBlob()` helper for recording and screenshot downloads
- Recorder `cancel()`, `fileName`, `fileType`, and File output for retry/save flows
- Recorder and playback MIME support helpers
- Data URL, Blob, canvas, and ImageData capture utilities
- Exact `deviceId`, front/back `facingMode` switching, and advanced track constraints
- Predictable stream cleanup on stop, restart, switch, disable, and unmount
- Typed media errors for permission, device, security, and browser support states
- ESM, CommonJS, and TypeScript declaration output
- No required runtime dependency beyond React

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
  return (
    <Webcam
      audio={false}
      mirrored
      videoConstraints={{
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: { ideal: 'user' },
      }}
    />
  );
}
```

## Capture A Screenshot

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
          const image = webcamRef.current?.getScreenshot({
            width: 512,
            height: 512,
            quality: 0.9,
          });
          console.log(image);
        }}
      >
        Capture
      </button>
    </>
  );
}
```

## Capture A Blob

```tsx
const blob = await webcamRef.current?.getScreenshotBlob({
  format: 'image/png',
});

if (blob) {
  const file = new File([blob], 'avatar.png', { type: blob.type });
  console.log(file);
}
```

## Record Video

```tsx
import { downloadBlob, useMediaRecorder, useObjectUrl, useWebcam } from 'react-webcam-kit';

export function CameraRecorder() {
  const camera = useWebcam({ audio: true });
  const recorder = useMediaRecorder({
    fileName: 'camera-recording',
    fileType: 'webm',
    stream: camera.stream,
    videoBitsPerSecond: 1_500_000,
  });
  const playbackUrl = useObjectUrl(recorder.blob);

  return (
    <>
      <video ref={camera.videoRef} autoPlay playsInline muted />
      <button type="button" onClick={() => recorder.start()}>
        Record
      </button>
      <button type="button" onClick={recorder.stop}>
        Stop
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
        Download
      </button>
      {playbackUrl ? <video src={playbackUrl} controls /> : null}
    </>
  );
}
```

Use `videoBitsPerSecond`, `audioBitsPerSecond`, `bitsPerSecond`, `mimeType`, and `timeslice` to tune
output size and browser behavior.

Use `cancel()` when the user wants to discard a recording and retry without creating a final Blob.

Use `muteAudio()` and `unmuteAudio()` to toggle microphone tracks during recording without changing
the preview element.

## Build A Custom UI With `useWebcam`

```tsx
import { useWebcam } from 'react-webcam-kit';

export function CameraControls() {
  const camera = useWebcam({
    audio: false,
    onError(error) {
      console.error(error.type, error.message);
    },
  });

  return (
    <>
      <video ref={camera.videoRef} autoPlay playsInline muted />

      <button type="button" onClick={() => void camera.start()}>
        Start
      </button>
      <button type="button" onClick={camera.stop}>
        Stop
      </button>
      <button
        type="button"
        onClick={() => {
          const image = camera.getScreenshot();
          console.log(image);
        }}
      >
        Capture
      </button>

      <p>Status: {camera.status}</p>
    </>
  );
}
```

## Switch Cameras

Use `useDevices()` to list devices, then pass a video input device ID to `switchDevice()`.

```tsx
import { useDevices, useWebcam } from 'react-webcam-kit';

export function DevicePicker() {
  const devices = useDevices();
  const camera = useWebcam({ audio: false });

  return (
    <select
      value={camera.selectedDeviceId ?? ''}
      onChange={(event) => {
        void camera.switchDevice(event.target.value);
      }}
    >
      <option value="" disabled>
        Select a camera
      </option>
      {devices.videoInputs.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || 'Camera'}
        </option>
      ))}
    </select>
  );
}
```

`switchDevice()` uses an exact `deviceId` constraint:

```ts
{
  video: {
    deviceId: { exact: deviceId },
  },
}
```

For front/back mobile camera flows, use `switchFacingMode()`:

```tsx
await camera.switchFacingMode('environment');
await camera.switchFacingMode('user');
```

## Advanced Camera Controls

Browsers expose hardware-specific controls through `MediaStreamTrack.applyConstraints()`. Use
`applyVideoConstraints()` for capabilities such as torch, zoom, focus distance, or exposure when the
device supports them.

```tsx
const [track] = camera.stream?.getVideoTracks() ?? [];
const capabilities = track?.getCapabilities?.();

if (capabilities && 'torch' in capabilities) {
  await camera.applyVideoConstraints({
    advanced: [{ torch: true } as MediaTrackConstraintSet],
  });
}
```

## Browser Requirements

Camera access requires `navigator.mediaDevices.getUserMedia`. Browsers only expose it in secure
contexts such as HTTPS and localhost.

Mobile devices are sensitive to strict constraints. Prefer `ideal` values for width, height, and
`facingMode` unless your app can gracefully handle `overconstrained` errors.

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

Privacy-focused browsers and extensions may block canvas reads after drawing video frames. In that
case screenshot methods return `null`; show a fallback instead of assuming capture always succeeds.

## API Summary

### `<Webcam />`

| Prop                                         | Type                              | Purpose                                                     |
| -------------------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| `audio`                                      | `boolean`                         | Request microphone tracks when `true`. Defaults to `false`. |
| `audioConstraints`                           | `MediaStreamConstraints['audio']` | Custom audio constraints.                                   |
| `videoConstraints`                           | `MediaStreamConstraints['video']` | Custom video constraints.                                   |
| `enabled`                                    | `boolean`                         | Start or stop the stream declaratively.                     |
| `startOnMount`                               | `boolean`                         | Start automatically on mount. Defaults to `true`.           |
| `mirrored`                                   | `boolean`                         | Mirror the preview and captured frames.                     |
| `muted`                                      | native video prop                 | Mute the preview element without changing stream audio.     |
| `screenshotFormat`                           | `ScreenshotFormat`                | Default screenshot output format.                           |
| `screenshotQuality`                          | `number`                          | Default screenshot quality for JPEG/WebP.                   |
| `forceScreenshotSourceSize`                  | `boolean`                         | Capture from the video source dimensions.                   |
| `imageSmoothing`                             | `boolean`                         | Enable or disable canvas image smoothing.                   |
| `minScreenshotWidth` / `minScreenshotHeight` | `number`                          | Minimum captured frame size.                                |
| `fallback`                                   | `ReactNode` or render function    | Rendered for unsupported, denied, or error states.          |
| `onStart` / `onStop`                         | callbacks                         | Stream lifecycle events.                                    |
| `onUserMedia` / `onUserMediaError`           | callbacks                         | Media request events.                                       |
| `onError`                                    | callback                          | Normalized media error event.                               |
| `onPermissionChange`                         | callback                          | Permission state updates.                                   |
| `onDevicesChanged`                           | callback                          | Device list updates.                                        |

The component also accepts ordinary `<video>` props such as `className`, `style`, `poster`, `muted`,
and `disablePictureInPicture`.

### `WebcamHandle`

| Method                                 | Purpose                                       |
| -------------------------------------- | --------------------------------------------- |
| `start()`                              | Request a stream.                             |
| `stop()`                               | Stop tracks and clear the video element.      |
| `switchDevice(deviceId, constraints?)` | Restart with an exact camera device ID.       |
| `switchFacingMode(mode, constraints?)` | Restart with an ideal front/back camera mode. |
| `applyVideoConstraints(constraints)`   | Apply constraints to the active video track.  |
| `getScreenshot(options?)`              | Return a Data URL or `null`.                  |
| `getScreenshotBlob(options?)`          | Return a `Blob` or `null`.                    |
| `getCanvas(options?)`                  | Return a canvas or `null`.                    |
| `stream`                               | Current `MediaStream`, if active.             |
| `video`                                | Current `HTMLVideoElement`, if mounted.       |

### `useWebcam()`

### `useMediaRecorder()`

`useMediaRecorder(options)` records an active `MediaStream` and returns recording state, chunks, the
final Blob, and controls for `start`, `stop`, `pause`, `resume`, and `reset`.

```tsx
const recorder = useMediaRecorder({
  stream: camera.stream,
  mimeType: 'video/webm',
  videoBitsPerSecond: 1_500_000,
  timeslice: 1000,
});
```

### `getSupportedMimeType()`

`getSupportedMimeType(candidates?)` returns the first MIME type supported by the current browser, or
`null` when `MediaRecorder` is unavailable.

`useWebcam(options)` returns stream state, a `videoRef`, capture methods, device controls, permission
state, and normalized errors.

### `useDevices()`

`useDevices()` returns `videoInputs`, `audioInputs`, `devicesById`, `devicesByType`, `counts`,
`permission`, `error`, and `refresh()`.

### `captureFrame()`

`captureFrame(video, options)` captures from a ready `HTMLVideoElement` and can return a Data URL,
Blob, canvas, or ImageData.

## More Documentation

- [API Reference](./docs/API.md)
- [Recipes](./docs/RECIPES.md)
- [Browser Notes](./docs/BROWSER-NOTES.md)
- [Migration Guide](./docs/MIGRATION.md)
- [Comparison Notes](./docs/COMPARISON.md)
- [Browser Compatibility Matrix](./docs/COMPATIBILITY.md)
- [Security Policy](./SECURITY.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## Examples

- [Basic Vite example](./examples/basic)
- [Avatar capture](./examples/avatar-capture)
- [Video recorder](./examples/vite-recorder)
- [Mobile back camera](./examples/mobile-back-camera)
- [Video upload](./examples/video-upload)

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
- `npm run audit` - check production and development dependencies for high severity advisories
- `npm run verify` - run the full release gate

## Publishing

Before publishing:

```bash
npm run verify
npm pack --dry-run
npm publish --dry-run
```

## License

MIT
