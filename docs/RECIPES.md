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
import { createUploadFormData } from 'react-webcam-kit';

const blob = await webcamRef.current?.getScreenshotBlob({
  format: 'image/jpeg',
  quality: 0.86,
  width: 1024,
});

if (blob) {
  const formData = createUploadFormData(blob, {
    fieldName: 'image',
    fileName: 'capture.jpg',
  });

  await fetch('/api/upload', { method: 'POST', body: formData });
}
```

## Record A Short Video

```tsx
import { downloadBlob, useMediaRecorder, useObjectUrl, useWebcam } from 'react-webcam-kit';

export function Recorder() {
  const camera = useWebcam({ audio: true });
  const recorder = useMediaRecorder({
    fileName: 'camera-recording',
    fileType: 'webm',
    stream: camera.stream,
    timeslice: 1000,
    videoBitsPerSecond: 1_500_000,
    audioBitsPerSecond: 96_000,
  });
  const playbackUrl = useObjectUrl(recorder.blob);

  return (
    <>
      <video ref={camera.videoRef} autoPlay playsInline muted />
      <button type="button" onClick={() => recorder.start()}>
        Start recording
      </button>
      <button type="button" onClick={recorder.stop}>
        Stop recording
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
        Download recording
      </button>
      {playbackUrl ? <video src={playbackUrl} controls /> : null}
    </>
  );
}
```

## Record The Screen

```tsx
import { useDisplayMedia, useMediaRecorder, useObjectUrl } from 'react-webcam-kit';

export function ScreenRecorder() {
  const screen = useDisplayMedia({
    audio: true,
    video: true,
  });
  const recorder = useMediaRecorder({
    fileName: 'screen-recording',
    fileType: 'webm',
    quality: 'hd',
    stream: screen.stream,
  });
  const playbackUrl = useObjectUrl(recorder.blob);

  return (
    <>
      <button type="button" onClick={() => void screen.start()}>
        Share screen
      </button>
      <button type="button" disabled={!screen.stream} onClick={() => recorder.start()}>
        Record
      </button>
      <button type="button" onClick={recorder.stop}>
        Stop recording
      </button>
      <button type="button" onClick={screen.stop}>
        Stop sharing
      </button>
      {playbackUrl ? <video src={playbackUrl} controls /> : null}
    </>
  );
}
```

Browsers require `getDisplayMedia()` to be started from a user action. The hook also handles the user
ending screen sharing from the browser UI.

## Reduce Recorded File Size

Use recorder bitrate options instead of recording at the browser default bitrate.

```tsx
const recorder = useMediaRecorder({
  stream: camera.stream,
  quality: 'high',
  videoBitsPerSecond: 900_000,
  audioBitsPerSecond: 64_000,
});
```

Explicit bitrate options override the selected preset. For very small uploads, combine lower
recorder bitrate with lower camera constraints:

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

## Use A Recording Quality Preset

Use one named preset for camera constraints and recorder bitrate targets.

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

Available presets are `low`, `medium`, `high`, `hd`, and `full-hd`.

## Upload A Recording

```tsx
import { createUploadFormData, useMediaRecorder } from 'react-webcam-kit';

const recorder = useMediaRecorder({
  fileName: 'intro',
  fileType: 'webm',
  stream: camera.stream,
});

async function uploadRecording() {
  const recording = recorder.file ?? recorder.blob;

  if (!recording) return;

  const formData = createUploadFormData(recording, {
    fieldName: 'video',
    fileName: 'intro.webm',
    fields: {
      source: 'camera',
    },
  });

  await fetch('/api/videos', {
    method: 'POST',
    body: formData,
  });
}
```

## Record Audio Only

Use `useAudioRecorder()` when the hook should request the microphone for you.

```tsx
import { useAudioRecorder, useObjectUrl } from 'react-webcam-kit';

export function VoiceNoteRecorder() {
  const recorder = useAudioRecorder({
    audioConstraints: {
      echoCancellation: true,
      noiseSuppression: true,
    },
    fileName: 'voice-note',
    fileType: 'webm',
    quality: 'medium',
  });
  const playbackUrl = useObjectUrl(recorder.blob);

  return (
    <>
      <button type="button" onClick={() => recorder.start()}>
        Record voice note
      </button>
      <button type="button" onClick={recorder.stop}>
        Stop
      </button>
      {playbackUrl ? <audio src={playbackUrl} controls /> : null}
    </>
  );
}
```

Use `mediaStatus`, `mediaError`, and `isMediaSupported` for microphone-specific UI.

## Add QR Or Barcode Scanning

Keep QR/barcode scanning as an app-level feature so the webcam package stays small. Use
`useCameraPermissions()` for permission preflight, or pair `useWebcam()` with the browser
`BarcodeDetector` API when supported.

```tsx
import { useEffect } from 'react';
import { useWebcam } from 'react-webcam-kit';

export function BarcodeScanner() {
  const camera = useWebcam({
    audio: false,
    videoConstraints: { facingMode: { ideal: 'environment' } },
  });

  useEffect(() => {
    if (!('BarcodeDetector' in window) || camera.status !== 'ready') return;

    const detector = new BarcodeDetector({ formats: ['qr_code', 'code_128'] });
    let stopped = false;

    async function scan() {
      const video = camera.videoRef.current;

      if (!video || stopped) return;

      const codes = await detector.detect(video);
      const firstCode = codes[0];

      if (firstCode) {
        console.log(firstCode.rawValue);
      }

      requestAnimationFrame(scan);
    }

    void scan();

    return () => {
      stopped = true;
    };
  }, [camera.status, camera.videoRef]);

  return <video ref={camera.videoRef} autoPlay playsInline muted />;
}
```

For broader barcode support, render a dedicated scanner library after permission is granted. Good
integration points are permission prompts, device selection, and fallback UI.

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

For front/back mobile camera controls, use `switchFacingMode()` instead of tracking a specific
hardware ID:

```tsx
await camera.switchFacingMode('environment');
await camera.switchFacingMode('user');
```

## Mute Recording Audio

`muteAudio()` disables audio tracks on the stream passed to `useMediaRecorder()`. It does not change
the preview element's `muted` prop.

```tsx
<button type="button" onClick={recorder.muteAudio}>
  Mute mic
</button>
<button type="button" onClick={recorder.unmuteAudio}>
  Unmute mic
</button>
```

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
