# React Audio Recorder

Use `useAudioRecorder()` to build microphone-only recording flows without manually wiring
`getUserMedia({ audio: true, video: false })`.

```tsx
import { downloadBlob, useAudioRecorder, useObjectUrl } from 'react-webcam-kit';

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
      <button type="button" onClick={() => void recorder.start()}>
        Record
      </button>
      <button type="button" onClick={recorder.stop}>
        Stop
      </button>
      {recorder.file ? (
        <button type="button" onClick={() => downloadBlob(recorder.file!)}>
          Download
        </button>
      ) : null}
      {playbackUrl ? <audio src={playbackUrl} controls /> : null}
    </>
  );
}
```

## Browser Notes

- Audio recording requires `navigator.mediaDevices.getUserMedia`.
- Recording requires the browser `MediaRecorder` API.
- MIME support varies by browser; the hook defaults to supported audio recorder MIME candidates.
- `mediaStatus` and `mediaError` describe microphone capture.
- `status`, `blob`, `file`, `duration`, `pause()`, `resume()`, and `cancel()` come from the recorder.
- Use `createUploadFormData()` when uploading the final voice note Blob or File.
