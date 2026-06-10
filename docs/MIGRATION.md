# Migration Guide

This guide helps move common webcam component patterns to `react-webcam-kit`.

## Component Preview

```tsx
import { Webcam } from 'react-webcam-kit';

export function Preview() {
  return <Webcam audio={false} mirrored />;
}
```

## Imperative Screenshot

```tsx
import { useRef } from 'react';
import { Webcam, type WebcamHandle } from 'react-webcam-kit';

export function Capture() {
  const webcamRef = useRef<WebcamHandle>(null);

  return (
    <>
      <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" />
      <button type="button" onClick={() => console.log(webcamRef.current?.getScreenshot())}>
        Capture
      </button>
    </>
  );
}
```

## Hook-Based Camera UI

```tsx
import { useWebcam } from 'react-webcam-kit';

export function CustomCamera() {
  const camera = useWebcam({ audio: false, startOnMount: false });

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

## Recording

Use `useMediaRecorder()` with the stream returned by `useWebcam()`.

```tsx
const camera = useWebcam({ audio: true });
const recorder = useMediaRecorder({
  stream: camera.stream,
  fileName: 'recording',
  fileType: 'webm',
});
```

## Main Differences

- `muted` controls local preview playback; `audio` controls whether microphone tracks are requested.
- `getScreenshotBlob()` is built in for upload workflows.
- `switchDevice()` uses an exact camera `deviceId`.
- `switchFacingMode()` uses ideal `user` or `environment` facing mode constraints.
- `cancel()` discards active recording chunks without creating a final Blob.
