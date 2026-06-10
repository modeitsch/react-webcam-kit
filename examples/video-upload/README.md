# Video Upload Example

Record a short video and upload the final Blob.

```tsx
import { useMediaRecorder, useWebcam } from 'react-webcam-kit';

export function VideoUpload() {
  const camera = useWebcam({ audio: true });
  const recorder = useMediaRecorder({
    stream: camera.stream,
    videoBitsPerSecond: 1_200_000,
    audioBitsPerSecond: 96_000,
  });

  async function uploadRecording() {
    if (!recorder.blob) {
      return;
    }

    const formData = new FormData();
    formData.append('video', recorder.blob, 'recording.webm');
    await fetch('/api/video', { method: 'POST', body: formData });
  }

  return (
    <>
      <video ref={camera.videoRef} autoPlay playsInline muted />
      <button type="button" onClick={() => recorder.start()}>
        Record
      </button>
      <button type="button" onClick={recorder.stop}>
        Stop
      </button>
      <button type="button" disabled={!recorder.blob} onClick={() => void uploadRecording()}>
        Upload
      </button>
    </>
  );
}
```
