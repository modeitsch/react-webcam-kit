# Vite Recorder Example

Record camera video, preview the final Blob, and download the File.

```tsx
import { downloadBlob, useMediaRecorder, useObjectUrl, useWebcam } from 'react-webcam-kit';

export function Recorder() {
  const camera = useWebcam({ audio: true });
  const recorder = useMediaRecorder({
    stream: camera.stream,
    fileName: 'camera-recording',
    fileType: 'webm',
    videoBitsPerSecond: 1_500_000,
    audioBitsPerSecond: 96_000,
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
      <button type="button" onClick={recorder.cancel}>
        Discard
      </button>
      <button type="button" onClick={recorder.muteAudio}>
        Mute mic
      </button>
      <button type="button" onClick={recorder.unmuteAudio}>
        Unmute mic
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
