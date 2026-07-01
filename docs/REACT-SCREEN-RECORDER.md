# React Screen Recorder

Use `useDisplayMedia()` with `useMediaRecorder()` to build a React screen recorder for browser tabs,
windows, or full-screen capture.

```tsx
import { downloadBlob, useDisplayMedia, useMediaRecorder, useObjectUrl } from 'react-webcam-kit';

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
      {recorder.file ? (
        <button type="button" onClick={() => downloadBlob(recorder.file!)}>
          Download
        </button>
      ) : null}
      {playbackUrl ? <video src={playbackUrl} controls /> : null}
    </>
  );
}
```

## Browser Notes

- Screen capture requires `navigator.mediaDevices.getDisplayMedia`.
- Browsers require display capture to start from a user action.
- Users can stop sharing from the browser UI; `useDisplayMedia()` moves to `stopped` and calls
  `onStop`.
- Display audio support varies by browser and selected surface.
- Pair `useDisplayMedia()` with `useMediaRecorder()` for recording.
- Use `createUploadFormData()` when uploading the final recording Blob or File.
