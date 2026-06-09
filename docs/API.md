# API Reference

This package exports a component, hooks, capture utilities, error helpers, and shared
TypeScript types.

## Exports

```ts
export { Webcam } from 'react-webcam-kit';
export { useWebcam } from 'react-webcam-kit';
export { useDevices } from 'react-webcam-kit';
export { useMediaRecorder } from 'react-webcam-kit';
export { useObjectUrl } from 'react-webcam-kit';
export { downloadBlob } from 'react-webcam-kit';
export { getSupportedMimeType } from 'react-webcam-kit';
export { getSupportedVideoMimeTypes } from 'react-webcam-kit';
export { getSupportedAudioMimeTypes } from 'react-webcam-kit';
export { isPlaybackMimeTypeSupported } from 'react-webcam-kit';
export { isRecorderMimeTypeSupported } from 'react-webcam-kit';
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

## `useMediaRecorder(options)`

Use this hook to record an active `MediaStream` and produce a Blob.

```tsx
const recorder = useMediaRecorder({
  stream: camera.stream,
  videoBitsPerSecond: 1_500_000,
  audioBitsPerSecond: 96_000,
  timeslice: 1000,
});
```

### Options

| Option                 | Type                  | Description                                                                       |
| ---------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `stream`               | `MediaStream \| null` | Stream to record. You can also pass a stream to `start(stream)`.                  |
| `mimeType`             | `string`              | Preferred recorder MIME type. Defaults to the first supported built-in candidate. |
| `fileName`             | `string` or function  | Optional base file name used to create `file` after `stop()`.                     |
| `fileType`             | `string`              | Optional file extension used with `fileName`.                                     |
| `bitsPerSecond`        | `number`              | Total target bitrate.                                                             |
| `videoBitsPerSecond`   | `number`              | Target video bitrate.                                                             |
| `audioBitsPerSecond`   | `number`              | Target audio bitrate.                                                             |
| `timeslice`            | `number`              | Optional chunk interval passed to `MediaRecorder.start()`.                        |
| `onDataAvailable`      | `(event) => void`     | Runs for every recorder chunk.                                                    |
| `onStart` / `onStop`   | callbacks             | Runs when recording starts and when the final Blob is assembled.                  |
| `onPause` / `onResume` | callbacks             | Runs on recorder pause and resume.                                                |
| `onError`              | `(error) => void`     | Runs with normalized recorder errors.                                             |

### Result

| Field              | Type                         | Description                                           |
| ------------------ | ---------------------------- | ----------------------------------------------------- |
| `status`           | `RecordingStatus`            | Current recorder state.                               |
| `isSupported`      | `boolean`                    | Whether `MediaRecorder` exists in this browser.       |
| `mimeType`         | `string \| null`             | Selected supported MIME type.                         |
| `chunks`           | `Blob[]`                     | Non-empty recorded chunks.                            |
| `blob`             | `Blob \| null`               | Final Blob after `stop()`.                            |
| `file`             | `File \| null`               | Final File when `fileName` is provided.               |
| `error`            | `MediaRecorderError \| null` | Last recorder error.                                  |
| `recorder`         | `MediaRecorder \| null`      | Current browser recorder instance.                    |
| `start`            | function                     | Start recording.                                      |
| `stop`             | function                     | Stop recording and assemble the Blob.                 |
| `cancel`           | function                     | Stop and discard the active recording.                |
| `pause` / `resume` | functions                    | Pause or resume when supported by the recorder state. |
| `reset`            | function                     | Clear chunks, Blob, and error state.                  |

`cancel()` stops the active recorder and discards collected chunks. It does not create a final Blob
and does not call `onStop`.

## `useObjectUrl(source)`

Creates an object URL for a `Blob` or `MediaSource` and revokes it automatically when the source
changes or the component unmounts.

```tsx
const playbackUrl = useObjectUrl(recorder.blob);
```

## `downloadBlob(blob, fileName?)`

Downloads a `Blob` or `File` by creating a temporary object URL and anchor.

```ts
if (recorder.file) {
  downloadBlob(recorder.file);
}
```

## `getSupportedMimeType(candidates?)`

Returns the first MIME type supported by `MediaRecorder.isTypeSupported()`, or `null` when recording
is unavailable.

```ts
const mimeType = getSupportedMimeType(['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4']);
```

Additional MIME helpers:

```ts
const supportedVideoTypes = getSupportedVideoMimeTypes();
const supportedAudioTypes = getSupportedAudioMimeTypes();
const canRecordWebm = isRecorderMimeTypeSupported('video/webm');
const canPlayWebm = isPlaybackMimeTypeSupported('video/webm');
```

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

type RecordingStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'unsupported'
  | 'error';

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

interface MediaRecorderError {
  name: string;
  message: string;
  cause?: unknown;
}
```
