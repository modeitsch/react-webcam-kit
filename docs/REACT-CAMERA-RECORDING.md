# React Camera Recording

`useMediaRecorder()` records an active `MediaStream` and returns chunks, a final Blob, and an optional
File.

```tsx
import {
  createUploadFormData,
  downloadBlob,
  getRecordingPresetConstraints,
  useMediaRecorder,
  useObjectUrl,
  useWebcam,
} from 'react-webcam-kit';

export function VideoRecorder() {
  const camera = useWebcam({
    audio: true,
    videoConstraints: getRecordingPresetConstraints('hd'),
  });
  const recorder = useMediaRecorder({
    stream: camera.stream,
    fileName: 'intro-video',
    fileType: 'webm',
    quality: 'hd',
  });
  const playbackUrl = useObjectUrl(recorder.blob);

  async function upload() {
    const recording = recorder.file ?? recorder.blob;

    if (!recording) return;

    const formData = createUploadFormData(recording, {
      fieldName: 'video',
      fileName: 'intro-video.webm',
    });

    await fetch('/api/videos', {
      method: 'POST',
      body: formData,
    });
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
      {recorder.blob ? (
        <button type="button" onClick={() => void upload()}>
          Upload
        </button>
      ) : null}
      {playbackUrl ? <video src={playbackUrl} controls /> : null}
    </>
  );
}
```

Use `quality` for named bitrate targets. Use `getRecordingPresetConstraints()` to match the camera
request with the recorder target. Use `getSupportedMimeType()` or `getSupportedVideoMimeTypes()` to
choose a format before recording.
