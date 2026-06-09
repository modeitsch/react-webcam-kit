# Recipes

These examples cover the workflows most camera apps need in production.

## Start Only After A User Action

Browsers and users both prefer explicit camera starts. Disable automatic startup with
`startOnMount: false`.

```tsx
import { useWebcam } from 'react-webcam-kit';

export function ManualStart() {
  const camera = useWebcam({ audio: false, startOnMount: false });

  return (
    <>
      <video ref={camera.videoRef} autoPlay playsInline muted />
      <button type="button" onClick={() => void camera.start()}>
        Start camera
      </button>
    </>
  );
}
```

## Show A Permission Fallback

```tsx
import { Webcam } from 'react-webcam-kit';

export function CameraWithFallback() {
  return (
    <Webcam
      audio={false}
      fallback={({ status, error }) => (
        <p role="status">
          {status === 'denied'
            ? 'Camera permission was denied.'
            : error?.message || 'Camera is not available.'}
        </p>
      )}
    />
  );
}
```

## Capture And Upload A Blob

```tsx
const blob = await webcamRef.current?.getScreenshotBlob({
  format: 'image/jpeg',
  quality: 0.86,
  width: 1024,
});

if (blob) {
  const formData = new FormData();
  formData.append('image', blob, 'capture.jpg');
  await fetch('/api/upload', { method: 'POST', body: formData });
}
```

## Record A Short Video

```tsx
import { useMediaRecorder, useWebcam } from 'react-webcam-kit';

export function Recorder() {
  const camera = useWebcam({ audio: true });
  const recorder = useMediaRecorder({
    stream: camera.stream,
    timeslice: 1000,
    videoBitsPerSecond: 1_500_000,
    audioBitsPerSecond: 96_000,
  });

  return (
    <>
      <video ref={camera.videoRef} autoPlay playsInline muted />
      <button type="button" onClick={() => recorder.start()}>
        Start recording
      </button>
      <button type="button" onClick={recorder.stop}>
        Stop recording
      </button>
      {recorder.blob ? <video src={URL.createObjectURL(recorder.blob)} controls /> : null}
    </>
  );
}
```

## Reduce Recorded File Size

Use recorder bitrate options instead of recording at the browser default bitrate.

```tsx
const recorder = useMediaRecorder({
  stream: camera.stream,
  videoBitsPerSecond: 900_000,
  audioBitsPerSecond: 64_000,
});
```

For very small uploads, combine lower recorder bitrate with lower camera constraints:

```tsx
const camera = useWebcam({
  audio: true,
  videoConstraints: {
    width: { ideal: 854 },
    height: { ideal: 480 },
    frameRate: { ideal: 24 },
  },
});
```

## Choose A Recording MIME Type

Browser support varies. Select the first type the browser supports.

```tsx
import { getSupportedMimeType, useMediaRecorder } from 'react-webcam-kit';

const mimeType = getSupportedMimeType([
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
]);

const recorder = useMediaRecorder({
  mimeType: mimeType ?? undefined,
  stream: camera.stream,
});
```

## Capture A Square Avatar

```tsx
const image = webcamRef.current?.getScreenshot({
  format: 'image/jpeg',
  width: 512,
  height: 512,
  imageSmoothing: true,
});
```

For best results, pair this with CSS that displays a square preview. The capture utility scales the
video frame; it does not crop to a face or detect a subject.

## Switch Between Front And Back Cameras

Use `facingMode` when you do not need a specific physical device.

```tsx
const front = await camera.start({
  video: { facingMode: { ideal: 'user' } },
  audio: false,
});

const back = await camera.start({
  video: { facingMode: { ideal: 'environment' } },
  audio: false,
});
```

Use `switchDevice(deviceId)` when the user selected a device from `useDevices()`.

## Stop Cleanly On Modal Close

```tsx
function CameraModal({ open }: { open: boolean }) {
  return (
    <Webcam
      audio={false}
      enabled={open}
      onStop={() => {
        console.log('Camera tracks stopped.');
      }}
    />
  );
}
```

`enabled={false}` stops active tracks and clears the video element.

## Keep Stream Audio While Muting Preview

The `audio` option controls whether microphone tracks are requested. The `muted` video prop controls
local playback.

```tsx
<Webcam audio muted />
```

This requests audio tracks while preventing local echo from the preview element.

## Use Torch When Available

Torch support depends on browser, device, camera, and permission state.

```tsx
const [track] = camera.stream?.getVideoTracks() ?? [];
const capabilities = track?.getCapabilities?.();

if (capabilities && 'torch' in capabilities) {
  await camera.applyVideoConstraints({
    advanced: [{ torch: true } as MediaTrackConstraintSet],
  });
}
```

## Handle Capture Blocking

Some browser privacy modes or extensions block canvas reads from video frames. Always handle `null`.

```tsx
const image = camera.getScreenshot();

if (!image) {
  setMessage('Screenshot capture is blocked by this browser or the camera is not ready yet.');
}
```

## Use Lower Mobile Constraints

High-resolution constraints can fail or produce blank previews on some mobile devices. Start with
`ideal` constraints, then let users opt into higher quality.

```tsx
<Webcam
  audio={false}
  videoConstraints={{
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  }}
/>
```
