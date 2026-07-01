# API Reference

This package exports a component, hooks, capture utilities, error helpers, and shared
TypeScript types.

## Exports

```ts
export { Webcam } from 'react-webcam-kit';
export { RECORDING_QUALITY_PRESETS } from 'react-webcam-kit';
export { blobToFile } from 'react-webcam-kit';
export { createUploadFormData } from 'react-webcam-kit';
export { formatDuration } from 'react-webcam-kit';
export { getRecordingPresetConstraints } from 'react-webcam-kit';
export { useAudioRecorder } from 'react-webcam-kit';
export { useCameraPermissions } from 'react-webcam-kit';
export { useWebcam } from 'react-webcam-kit';
export { useDevices } from 'react-webcam-kit';
export { useDisplayMedia } from 'react-webcam-kit';
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
  switchFacingMode(
    facingMode: VideoFacingModeEnum,
    constraints?: MediaTrackConstraints,
  ): Promise<MediaStream | null>;
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

| Field                   | Type                                            | Description                                   |
| ----------------------- | ----------------------------------------------- | --------------------------------------------- |
| `videoRef`              | `RefObject<HTMLVideoElement \| null>`           | Attach to your video element.                 |
| `status`                | `CameraStatus`                                  | Current lifecycle state.                      |
| `permission`            | `PermissionState \| 'unsupported' \| 'unknown'` | Camera permission state when available.       |
| `error`                 | `CameraError \| null`                           | Last normalized error.                        |
| `stream`                | `MediaStream \| null`                           | Current media stream.                         |
| `devices`               | `MediaDeviceInfo[]`                             | Last enumerated devices.                      |
| `selectedDeviceId`      | `string \| null`                                | Last device ID passed to `switchDevice`.      |
| `selectedFacingMode`    | `VideoFacingModeEnum \| null`                   | Last mode passed to `switchFacingMode`.       |
| `start`                 | function                                        | Request media.                                |
| `stop`                  | function                                        | Stop tracks and clear the video element.      |
| `restart`               | function                                        | Stop then start.                              |
| `switchDevice`          | function                                        | Restart with an exact camera device ID.       |
| `switchFacingMode`      | function                                        | Restart with an ideal front/back camera mode. |
| `refreshDevices`        | function                                        | Refresh device enumeration.                   |
| `applyVideoConstraints` | function                                        | Apply constraints to the active video track.  |
| `getCanvas`             | function                                        | Capture a canvas.                             |
| `getScreenshot`         | function                                        | Capture a Data URL.                           |
| `getScreenshotBlob`     | function                                        | Capture a Blob.                               |

## `useDevices()`

`useDevices()` is a small hook for device selection UIs.

```tsx
const { videoInputs, audioInputs, devicesById, devicesByType, counts, permission, error, refresh } =
  useDevices();
```

Device labels are often empty until the user grants camera permission. Render a generic label before
permission is granted.

Use `devicesById` for fast lookup after a user selects a device ID, `devicesByType.video` and
`devicesByType.audio` for grouped UIs, and `counts.video` or `counts.audio` for compact controls.

## `useCameraPermissions(options)`

Use this hook when a screen needs to show a preflight permission prompt before rendering a full
camera workflow.

```tsx
const cameraPermission = useCameraPermissions({
  audio: true,
  videoConstraints: {
    facingMode: { ideal: 'user' },
  },
});

const granted = await cameraPermission.requestPermission();
```

### Options

| Option               | Type                              | Description                                     |
| -------------------- | --------------------------------- | ----------------------------------------------- |
| `audio`              | `boolean`                         | Also request microphone permission when true.   |
| `audioConstraints`   | `MediaStreamConstraints['audio']` | Audio constraints used when `audio` is true.    |
| `videoConstraints`   | `MediaStreamConstraints['video']` | Video constraints for the permission probe.     |
| `onPermissionChange` | `(permission) => void`            | Runs when permission state is known or changes. |
| `onError`            | `(error) => void`                 | Runs with normalized media errors.              |

### Result

| Field               | Type                                            | Description                                                                   |
| ------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `permission`        | `PermissionState \| 'unsupported' \| 'unknown'` | Camera permission state when available.                                       |
| `isSupported`       | `boolean`                                       | Whether `getUserMedia` is available.                                          |
| `canRequest`        | `boolean`                                       | Whether a permission request can be started.                                  |
| `error`             | `CameraError \| null`                           | Last normalized permission error.                                             |
| `refresh`           | function                                        | Re-query permission state.                                                    |
| `requestPermission` | function                                        | Request camera access, stop the probe stream, and return `true` when granted. |

## `useMediaRecorder(options)`

Use this hook to record an active `MediaStream` and produce a Blob.

```tsx
const recorder = useMediaRecorder({
  stream: camera.stream,
  quality: 'hd',
  videoBitsPerSecond: 1_500_000,
  audioBitsPerSecond: 96_000,
  timeslice: 1000,
});
```

### Options

| Option                   | Type                     | Description                                                                       |
| ------------------------ | ------------------------ | --------------------------------------------------------------------------------- |
| `stream`                 | `MediaStream \| null`    | Stream to record. You can also pass a stream to `start(stream)`.                  |
| `mimeType`               | `string`                 | Preferred recorder MIME type. Defaults to the first supported built-in candidate. |
| `fileName`               | `string` or function     | Optional base file name used to create `file` after `stop()`.                     |
| `fileType`               | `string`                 | Optional file extension used with `fileName`.                                     |
| `quality`                | `RecordingQualityPreset` | Preset audio and video bitrate target. Explicit bitrate options override it.      |
| `maxDuration`            | `number`                 | Optional max recording duration in milliseconds.                                  |
| `durationUpdateInterval` | `number`                 | Duration update interval in milliseconds. Defaults to `250`.                      |
| `bitsPerSecond`          | `number`                 | Total target bitrate.                                                             |
| `videoBitsPerSecond`     | `number`                 | Target video bitrate.                                                             |
| `audioBitsPerSecond`     | `number`                 | Target audio bitrate.                                                             |
| `timeslice`              | `number`                 | Optional chunk interval passed to `MediaRecorder.start()`.                        |
| `onDataAvailable`        | `(event) => void`        | Runs for every recorder chunk.                                                    |
| `onStart` / `onStop`     | callbacks                | Runs when recording starts and when the final Blob is assembled.                  |
| `onMaxDuration`          | `(duration) => void`     | Runs when `maxDuration` is reached.                                               |
| `onPause` / `onResume`   | callbacks                | Runs on recorder pause and resume.                                                |
| `onError`                | `(error) => void`        | Runs with normalized recorder errors.                                             |

### Result

| Field                       | Type                         | Description                                           |
| --------------------------- | ---------------------------- | ----------------------------------------------------- |
| `status`                    | `RecordingStatus`            | Current recorder state.                               |
| `isSupported`               | `boolean`                    | Whether `MediaRecorder` exists in this browser.       |
| `mimeType`                  | `string \| null`             | Selected supported MIME type.                         |
| `duration`                  | `number`                     | Active recording duration in milliseconds.            |
| `recordingTimeLimitReached` | `boolean`                    | Whether `maxDuration` stopped the recording.          |
| `isAudioMuted`              | `boolean`                    | Whether recorder audio tracks are currently disabled. |
| `chunks`                    | `Blob[]`                     | Non-empty recorded chunks.                            |
| `blob`                      | `Blob \| null`               | Final Blob after `stop()`.                            |
| `file`                      | `File \| null`               | Final File when `fileName` is provided.               |
| `error`                     | `MediaRecorderError \| null` | Last recorder error.                                  |
| `recorder`                  | `MediaRecorder \| null`      | Current browser recorder instance.                    |
| `start`                     | function                     | Start recording.                                      |
| `stop`                      | function                     | Stop recording and assemble the Blob.                 |
| `cancel`                    | function                     | Stop and discard the active recording.                |
| `muteAudio`                 | function                     | Disable audio tracks on the current stream.           |
| `unmuteAudio`               | function                     | Re-enable audio tracks on the current stream.         |
| `setAudioMuted`             | function                     | Set audio track enabled state from a boolean.         |
| `pause` / `resume`          | functions                    | Pause or resume when supported by the recorder state. |
| `reset`                     | function                     | Clear chunks, Blob, and error state.                  |

`cancel()` stops the active recorder and discards collected chunks. It does not create a final Blob
and does not call `onStop`.

## `useAudioRecorder(options)`

Use this hook when you want microphone capture and recording in one API.

```tsx
const recorder = useAudioRecorder({
  audioConstraints: {
    echoCancellation: true,
    noiseSuppression: true,
  },
  fileName: 'voice-note',
  fileType: 'webm',
});
```

`useAudioRecorder()` returns the `useMediaRecorder()` result with a Promise-based `start()` that
requests an audio-only stream and starts recording. It also returns `mediaStatus`, `mediaError`,
`isMediaSupported`, `stream`, and `stopStream()`.

### Options

`useAudioRecorder()` accepts every `useMediaRecorder()` option except `stream`, plus:

| Option             | Type                              | Description                                     |
| ------------------ | --------------------------------- | ----------------------------------------------- |
| `audioConstraints` | `MediaStreamConstraints['audio']` | Microphone constraints. Defaults to `true`.     |
| `onMediaStart`     | `(stream) => void`                | Runs after microphone capture starts.           |
| `onMediaStop`      | `() => void`                      | Runs after microphone tracks are stopped.       |
| `onMediaError`     | `(error) => void`                 | Runs with normalized microphone capture errors. |

### Result Additions

| Field              | Type                  | Description                                    |
| ------------------ | --------------------- | ---------------------------------------------- |
| `mediaStatus`      | `CameraStatus`        | Microphone capture lifecycle state.            |
| `mediaError`       | `CameraError \| null` | Last normalized microphone capture error.      |
| `isMediaSupported` | `boolean`             | Whether `getUserMedia` is available.           |
| `stream`           | `MediaStream \| null` | Active microphone stream.                      |
| `stopStream`       | function              | Stop microphone tracks without recorder state. |

## `useDisplayMedia(options)`

Use this hook to request screen, window, or tab capture through
`navigator.mediaDevices.getDisplayMedia()`.

```tsx
const screen = useDisplayMedia({
  audio: true,
  video: true,
});

const recorder = useMediaRecorder({
  fileName: 'screen-recording',
  fileType: 'webm',
  stream: screen.stream,
});
```

### Options

| Option    | Type                                 | Description                                       |
| --------- | ------------------------------------ | ------------------------------------------------- |
| `audio`   | `DisplayMediaStreamOptions['audio']` | Whether to request display audio.                 |
| `video`   | `DisplayMediaStreamOptions['video']` | Display video constraints. Defaults to `true`.    |
| `onStart` | `(stream) => void`                   | Runs after display capture starts.                |
| `onStop`  | `() => void`                         | Runs after capture stops or browser sharing ends. |
| `onError` | `(error) => void`                    | Runs with normalized display capture errors.      |

### Result

| Field         | Type                  | Description                                      |
| ------------- | --------------------- | ------------------------------------------------ |
| `status`      | `CameraStatus`        | Display capture lifecycle state.                 |
| `stream`      | `MediaStream \| null` | Active display stream.                           |
| `error`       | `CameraError \| null` | Last normalized display media error.             |
| `isSupported` | `boolean`             | Whether `getDisplayMedia` is available.          |
| `start`       | function              | Request display capture.                         |
| `stop`        | function              | Stop tracks and clear the active display stream. |

## Recording Quality Presets

Use presets when you want a named target instead of hand-picking recorder bitrates.

```tsx
import { getRecordingPresetConstraints, useMediaRecorder, useWebcam } from 'react-webcam-kit';

const camera = useWebcam({
  audio: true,
  videoConstraints: getRecordingPresetConstraints('hd'),
});

const recorder = useMediaRecorder({
  quality: 'hd',
  stream: camera.stream,
});
```

Built-in preset names are `low`, `medium`, `high`, `hd`, and `full-hd`.
`RECORDING_QUALITY_PRESETS` exposes each preset's `width`, `height`, `frameRate`,
`audioBitsPerSecond`, and `videoBitsPerSecond`.

`getRecordingPresetConstraints(quality)` returns ideal `width`, `height`, and `frameRate` video
constraints. Pair it with the same recorder `quality` when you want the camera request and recorder
bitrate to target the same output tier.

## `formatDuration(duration)`

Formats a duration in milliseconds as `m:ss`.

```ts
formatDuration(65_000); // "1:05"
```

## Upload Helpers

`blobToFile(blob, fileName?)` converts a `Blob` into a named `File`. If the input is already a
`File` and no new name is provided, it returns the original file.

```ts
const file = blobToFile(recordingBlob, 'intro.webm');
```

`createUploadFormData(blobOrFile, options?)` creates a `FormData` payload with a configurable file
field, file name, and extra fields.

```ts
const formData = createUploadFormData(recordingBlob, {
  fieldName: 'video',
  fileName: 'intro.webm',
  fields: {
    userId: '123',
  },
});

await fetch('/api/videos', { method: 'POST', body: formData });
```

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
