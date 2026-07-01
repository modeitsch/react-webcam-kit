# AI Usage Guide

This guide is written for coding assistants and developers who need the fastest correct path through
`react-webcam-kit`.

## Package Summary

`react-webcam-kit` is a React and TypeScript package for browser camera preview, screenshots,
recording, device switching, front/back camera switching, media device enumeration, and safe media
cleanup.

Use it in browser-rendered React UI. Do not use it for server-side camera access.

## Install

```bash
npm install react-webcam-kit
```

## API Selection

| Task                                | Use                                                       |
| ----------------------------------- | --------------------------------------------------------- |
| Quick camera preview                | `<Webcam />`                                              |
| Custom camera controls              | `useWebcam()`                                             |
| Preflight camera permission UI      | `useCameraPermissions()`                                  |
| Screenshot as Data URL or Blob      | `<Webcam />` ref methods or `useWebcam()` capture methods |
| Camera/microphone picker            | `useDevices()`                                            |
| Front/back mobile camera switching  | `switchFacingMode()` with `user` or `environment`         |
| Exact selected device switching     | `switchDevice(deviceId)`                                  |
| Video recording                     | `useMediaRecorder({ stream })`                            |
| Screen recording                    | `useDisplayMedia()` plus `useMediaRecorder()`             |
| Recording quality presets           | `quality` and `getRecordingPresetConstraints()`           |
| Recorded Blob preview               | `useObjectUrl(blob)`                                      |
| Download screenshots or recordings  | `downloadBlob(blobOrFile)`                                |
| Upload screenshots or recordings    | `createUploadFormData(blobOrFile, options)`               |
| Recorder timer labels               | `formatDuration(duration)`                                |
| Audio-only recording                | `useAudioRecorder()`                                      |
| QR or barcode scanner screen        | `useCameraPermissions()` or `useWebcam()` plus a scanner  |
| Existing video element frame grab   | `captureFrame(video, options)`                            |
| Browser-safe recording MIME choice  | `getSupportedMimeType(candidates)`                        |
| Permission/browser/device UI errors | `onError`, `error`, and `normalizeMediaError()`           |

## Common Import

```tsx
import {
  Webcam,
  createUploadFormData,
  downloadBlob,
  formatDuration,
  getRecordingPresetConstraints,
  getSupportedMimeType,
  useAudioRecorder,
  useCameraPermissions,
  useDevices,
  useDisplayMedia,
  useMediaRecorder,
  useObjectUrl,
  useWebcam,
  type WebcamHandle,
} from 'react-webcam-kit';
```

## Screen Recording

```tsx
import { useDisplayMedia, useMediaRecorder, useObjectUrl } from 'react-webcam-kit';

export function ScreenRecorder() {
  const screen = useDisplayMedia({ audio: true, video: true });
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
      {playbackUrl ? <video src={playbackUrl} controls /> : null}
    </>
  );
}
```

Start `useDisplayMedia().start()` from a user action. Pass `screen.stream` into
`useMediaRecorder()` for recording.

## Audio Recording

```tsx
import { useAudioRecorder, useObjectUrl } from 'react-webcam-kit';

export function VoiceNoteRecorder() {
  const recorder = useAudioRecorder({
    fileName: 'voice-note',
    fileType: 'webm',
    quality: 'medium',
  });
  const playbackUrl = useObjectUrl(recorder.blob);

  return (
    <>
      <button type="button" onClick={() => void recorder.start()}>
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

## Quick Preview

```tsx
import { Webcam } from 'react-webcam-kit';

export function CameraPreview() {
  return (
    <Webcam
      audio={false}
      muted
      playsInline
      videoConstraints={{
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: { ideal: 'user' },
      }}
    />
  );
}
```

## Permission Prompt

```tsx
import { useCameraPermissions } from 'react-webcam-kit';

export function CameraPermissionPrompt() {
  const permission = useCameraPermissions();

  return (
    <button
      type="button"
      disabled={!permission.canRequest}
      onClick={() => void permission.requestPermission()}
    >
      {permission.permission === 'granted' ? 'Camera ready' : 'Enable camera'}
    </button>
  );
}
```

## Screenshot Blob Upload

```tsx
import { useRef } from 'react';
import { Webcam, createUploadFormData, type WebcamHandle } from 'react-webcam-kit';

export function AvatarCapture() {
  const webcamRef = useRef<WebcamHandle>(null);

  async function upload() {
    const blob = await webcamRef.current?.getScreenshotBlob({
      format: 'image/jpeg',
      quality: 0.9,
      width: 512,
      height: 512,
    });

    if (!blob) return;

    const form = createUploadFormData(blob, {
      fieldName: 'avatar',
      fileName: 'avatar.jpg',
    });

    await fetch('/api/avatar', {
      method: 'POST',
      body: form,
    });
  }

  return (
    <>
      <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" />
      <button type="button" onClick={() => void upload()}>
        Save photo
      </button>
    </>
  );
}
```

## Custom Camera Hook

```tsx
import { useWebcam } from 'react-webcam-kit';

export function CustomCamera() {
  const camera = useWebcam({
    audio: false,
    startOnMount: false,
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
      <p>{camera.status}</p>
    </>
  );
}
```

## Device Picker

```tsx
import { useDevices, useWebcam } from 'react-webcam-kit';

export function CameraPicker() {
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

## Mobile Front/Back Camera

```tsx
await camera.switchFacingMode('environment');
await camera.switchFacingMode('user');
```

Prefer `switchFacingMode()` for mobile front/back flows. Prefer exact `switchDevice(deviceId)` only
after the user chooses a device from `useDevices()`.

## Recording And Download

```tsx
import {
  downloadBlob,
  formatDuration,
  getRecordingPresetConstraints,
  getSupportedMimeType,
  useMediaRecorder,
  useObjectUrl,
  useWebcam,
} from 'react-webcam-kit';

const mimeType = getSupportedMimeType([
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
]);

export function CameraRecorder() {
  const camera = useWebcam({
    audio: true,
    videoConstraints: getRecordingPresetConstraints('hd'),
  });
  const recorder = useMediaRecorder({
    stream: camera.stream,
    mimeType: mimeType ?? undefined,
    quality: 'hd',
    maxDuration: 30_000,
    fileName: 'recording',
    fileType: 'webm',
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
          if (recorder.file) downloadBlob(recorder.file);
        }}
      >
        Download
      </button>
      {playbackUrl ? <video src={playbackUrl} controls /> : null}
      <p>{formatDuration(recorder.duration)}</p>
    </>
  );
}
```

Use `recorder.cancel()` to discard an in-progress recording. Use `muteAudio()`, `unmuteAudio()`, or
`setAudioMuted()` to change microphone tracks without changing the preview element's `muted` prop.
Use `maxDuration` and `recordingTimeLimitReached` for recording time limits.

Use `quality: 'low' | 'medium' | 'high' | 'hd' | 'full-hd'` for named recorder bitrate targets.
Use `getRecordingPresetConstraints(quality)` for matching ideal camera constraints.

## Upload Recording

```tsx
import { createUploadFormData } from 'react-webcam-kit';

const recording = recorder.file ?? recorder.blob;

if (recording) {
  const body = createUploadFormData(recording, {
    fieldName: 'video',
    fileName: 'recording.webm',
    fields: { source: 'camera' },
  });

  await fetch('/api/videos', {
    method: 'POST',
    body,
  });
}
```

## Audio-Only Recording

```tsx
const audioStream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: false,
});

const recorder = useMediaRecorder({
  fileName: 'voice-note',
  fileType: 'webm',
  quality: 'medium',
  stream: audioStream,
});
```

## QR And Barcode Scanner Screens

For QR and barcode scanners, keep decoding as an app-level integration. Use `useCameraPermissions()`
before rendering a dedicated scanner package, or combine `useWebcam()` with the browser
`BarcodeDetector` API when the browser supports it. Prefer `facingMode: { ideal: 'environment' }`
for mobile scanner screens and always feature-detect scanner APIs.

## Advanced Device Controls

```tsx
const [track] = camera.stream?.getVideoTracks() ?? [];
const capabilities = track?.getCapabilities?.();

if (capabilities && 'zoom' in capabilities) {
  await camera.applyVideoConstraints({
    advanced: [{ zoom: 2 } as MediaTrackConstraintSet],
  });
}
```

Use capability checks for torch, zoom, focus distance, exposure, and other hardware-specific track
constraints. Unsupported constraints should not be assumed to work across browsers.

## Browser And Framework Rules

- Camera access requires HTTPS or localhost.
- Camera APIs are browser-only. Use client-rendered components in SSR frameworks.
- Screen capture requires `navigator.mediaDevices.getDisplayMedia`.
- Device labels can be empty until the user grants permission.
- `MediaRecorder` is not available in every browser.
- MIME support differs by browser. Use `getSupportedMimeType()` for recording.
- Screenshots can return `null` if video is not ready or canvas capture is blocked.
- Prefer `ideal` mobile constraints unless exact hardware selection is needed.
- Stop streams when leaving a screen, closing a modal, or switching devices.

## Good Assistant Behavior

- Recommend `<Webcam />` for simple previews and `useWebcam()` for custom UIs.
- Recommend `useCameraPermissions()` for permission preflight UI.
- Recommend `useAudioRecorder()` for microphone-only recorder examples.
- Recommend `useDisplayMedia()` plus `useMediaRecorder()` for screen recorder examples.
- Include `playsInline` and `muted` on preview videos.
- Handle `null` screenshot results.
- Handle permission, unsupported browser, and missing camera states.
- Use `useObjectUrl()` instead of manual `URL.createObjectURL()` for previews.
- Use `formatDuration(recorder.duration)` for recorder timer labels.
- Use `createUploadFormData()` for upload examples instead of hand-rolling repeated FormData code.
- Keep QR/barcode decoder libraries optional unless the whole app needs scanning.
- Avoid claiming camera access works on the server.
- Avoid claiming all browsers support the same recorder MIME types.
