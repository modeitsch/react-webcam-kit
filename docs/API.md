# API Reference

This package exports a component, two hooks, a capture utility, an error normalizer, and shared
TypeScript types.

## Exports

```ts
export { Webcam } from 'react-webcam-kit';
export { useWebcam } from 'react-webcam-kit';
export { useDevices } from 'react-webcam-kit';
export { captureFrame } from 'react-webcam-kit';
export { normalizeMediaError } from 'react-webcam-kit';
```

The default export is also `Webcam`.

## `<Webcam />`

`<Webcam />` renders a `<video>` element, requests camera access, attaches the active stream, and
exposes capture controls through a ref.

```tsx
import { useRef } from 'react';
import Webcam, { type WebcamHandle } from 'react-webcam-kit';

export function Example() {
  const ref = useRef<WebcamHandle>(null);

  return <Webcam ref={ref} audio={false} mirrored />;
}
```

### Props

| Prop                        | Type                              | Default        | Description                                          |
| --------------------------- | --------------------------------- | -------------- | ---------------------------------------------------- |
| `audio`                     | `boolean`                         | `false`        | Requests microphone tracks when enabled.             |
| `audioConstraints`          | `MediaStreamConstraints['audio']` | `undefined`    | Audio constraints used when `audio` is true.         |
| `videoConstraints`          | `MediaStreamConstraints['video']` | `true`         | Video constraints for `getUserMedia`.                |
| `enabled`                   | `boolean`                         | `true`         | Stops the stream when false and restarts when true.  |
| `startOnMount`              | `boolean`                         | `true`         | Requests media when the component mounts.            |
| `mirrored`                  | `boolean`                         | `false`        | Mirrors the preview and capture output.              |
| `muted`                     | native video prop                 | `!audio`       | Mutes playback without changing stream audio tracks. |
| `screenshotFormat`          | `ScreenshotFormat`                | `'image/webp'` | Default capture format.                              |
| `screenshotQuality`         | `number`                          | `0.92`         | Default JPEG/WebP quality.                           |
| `forceScreenshotSourceSize` | `boolean`                         | `false`        | Uses video source dimensions for capture.            |
| `imageSmoothing`            | `boolean`                         | `true`         | Controls canvas image smoothing.                     |
| `minScreenshotWidth`        | `number`                          | `undefined`    | Minimum capture width.                               |
| `minScreenshotHeight`       | `number`                          | `undefined`    | Minimum capture height.                              |
| `fallback`                  | `ReactNode` or function           | `null`         | Rendered for unsupported, denied, or error states.   |
| `onStart`                   | `(stream) => void`                | `undefined`    | Runs after a stream starts.                          |
| `onStop`                    | `() => void`                      | `undefined`    | Runs after tracks are stopped.                       |
| `onUserMedia`               | `(stream) => void`                | `undefined`    | Runs after `getUserMedia` succeeds.                  |
| `onUserMediaError`          | `(error) => void`                 | `undefined`    | Runs after `getUserMedia` fails.                     |
| `onError`                   | `(error) => void`                 | `undefined`    | Runs with normalized media errors.                   |
| `onPermissionChange`        | `(permission) => void`            | `undefined`    | Runs when permission state is known.                 |
| `onDevicesChanged`          | `(devices) => void`               | `undefined`    | Runs after device enumeration updates.               |

All normal `<video>` props are supported except `children` and `ref`, which are reserved by the
component API.

### Ref Handle

```ts
interface WebcamHandle {
  applyVideoConstraints(constraints: MediaTrackConstraints): Promise<void>;
  getCanvas(options?: ScreenshotOptions): HTMLCanvasElement | null;
  getScreenshot(options?: ScreenshotOptions): string | null;
  getScreenshotBlob(options?: ScreenshotOptions): Promise<Blob | null>;
  start(): Promise<MediaStream | null>;
  stop(): void;
  switchDevice(deviceId: string, constraints?: MediaTrackConstraints): Promise<MediaStream | null>;
  readonly stream: MediaStream | null;
  readonly video: HTMLVideoElement | null;
}
```

### Render Prop

The component can render a child function that receives `getScreenshot`.

```tsx
<Webcam audio={false}>
  {({ getScreenshot }) => (
    <button type="button" onClick={() => console.log(getScreenshot())}>
      Capture
    </button>
  )}
</Webcam>
```

## `useWebcam(options)`

Use this hook when you want to own the UI.

```tsx
const camera = useWebcam({ audio: false, startOnMount: false });
```

### Options

`useWebcam` accepts the same media, capture, and lifecycle options used by `<Webcam />`.

### Result

| Field                   | Type                                            | Description                                  |
| ----------------------- | ----------------------------------------------- | -------------------------------------------- |
| `videoRef`              | `RefObject<HTMLVideoElement \| null>`           | Attach to your video element.                |
| `status`                | `CameraStatus`                                  | Current lifecycle state.                     |
| `permission`            | `PermissionState \| 'unsupported' \| 'unknown'` | Camera permission state when available.      |
| `error`                 | `CameraError \| null`                           | Last normalized error.                       |
| `stream`                | `MediaStream \| null`                           | Current media stream.                        |
| `devices`               | `MediaDeviceInfo[]`                             | Last enumerated devices.                     |
| `selectedDeviceId`      | `string \| null`                                | Last device ID passed to `switchDevice`.     |
| `start`                 | function                                        | Request media.                               |
| `stop`                  | function                                        | Stop tracks and clear the video element.     |
| `restart`               | function                                        | Stop then start.                             |
| `switchDevice`          | function                                        | Restart with an exact camera device ID.      |
| `refreshDevices`        | function                                        | Refresh device enumeration.                  |
| `applyVideoConstraints` | function                                        | Apply constraints to the active video track. |
| `getCanvas`             | function                                        | Capture a canvas.                            |
| `getScreenshot`         | function                                        | Capture a Data URL.                          |
| `getScreenshotBlob`     | function                                        | Capture a Blob.                              |

## `useDevices()`

`useDevices()` is a small hook for device selection UIs.

```tsx
const { videoInputs, audioInputs, permission, error, refresh } = useDevices();
```

Device labels are often empty until the user grants camera permission. Render a generic label before
permission is granted.

## `captureFrame(video, options)`

Captures a frame from a ready `HTMLVideoElement`.

```ts
const dataUrl = captureFrame(video, { type: 'data-url', format: 'image/jpeg' });
const canvas = captureFrame(video, { type: 'canvas' });
const imageData = captureFrame(video, { type: 'image-data' });
const blob = await captureFrame(video, { type: 'blob', format: 'image/png' });
```

The function returns `null` when the video is not ready, the canvas context cannot be created, or the
browser blocks canvas reads.

## Types

```ts
type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'stopping'
  | 'stopped'
  | 'denied'
  | 'unsupported'
  | 'error';

type ScreenshotFormat = 'image/webp' | 'image/png' | 'image/jpeg';

interface CameraError {
  name: string;
  message: string;
  type:
    | 'unsupported'
    | 'permission-denied'
    | 'not-found'
    | 'not-readable'
    | 'overconstrained'
    | 'security'
    | 'unknown';
  cause?: unknown;
}
```
