# React MediaRecorder Chunk Upload

Use `createChunkUploader()` with `useMediaRecorder({ timeslice })` when recordings may be too large
to buffer fully in memory before upload.

Set `retainChunks: false` on the recorder for upload-only sessions. The recorder then exposes no
final Blob/File, and `onStop` receives an empty Blob and array. `publishChunks: false` alone only
disables reactive updates; it does not release media. The uploader queue can still grow on slow
networks. Create a new uploader for each session and handle rejection from `complete()`.

The uploader sends chunks in order, retries failed requests with backoff, and exposes progress for
upload UI. It does not make media chunks randomly seekable; your server should append or store
chunks by index and assemble them in order.

## Client Example

```tsx
import { useRef, useState } from 'react';
import {
  createChunkUploader,
  useMediaRecorder,
  useWebcam,
  type ChunkUploader,
} from 'react-webcam-kit';

export function ChunkUploadRecorder({ uploadId }: { uploadId: string }) {
  const camera = useWebcam({ audio: true });
  const uploader = useRef<ChunkUploader | null>(null);
  const [uploaded, setUploaded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorder = useMediaRecorder({
    onStart: () => {
      setUploaded(0);
      setError(null);
      uploader.current = createChunkUploader({
        fields: { kind: 'camera' },
        onProgress: ({ uploaded }) => setUploaded(uploaded),
        uploadId: `${uploadId}-${crypto.randomUUID()}`,
        url: '/api/recordings/chunks',
      });
    },
    onDataAvailable: (event) => uploader.current?.enqueue(event.data),
    onStop: () => {
      void uploader.current?.complete().catch((error: unknown) => {
        setError(error instanceof Error ? error.message : 'Upload failed.');
      });
    },
    retainChunks: false,
    quality: 'hd',
    stream: camera.stream,
    timeslice: 5000,
  });

  return (
    <>
      <video {...camera.getVideoProps()} />
      <button type="button" disabled={!camera.stream} onClick={() => recorder.start()}>
        Record and upload
      </button>
      <button type="button" onClick={recorder.stop}>
        Stop
      </button>
      <p>Uploaded chunks: {uploaded}</p>
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}
```

## Request Shape

Each request is `multipart/form-data`:

- `uploadId`: the upload session ID when provided.
- `index`: zero-based chunk index.
- `last`: `"true"` for the final chunk when you enqueue one that way.
- `chunk`: the media Blob field by default.
- Custom `fields` are included on every request.

## Server Checklist

- Create an upload session before recording starts.
- Store chunks by `uploadId` and `index`.
- Reject duplicate or missing indexes clearly.
- `complete()` only drains the client queue; call your own server finalization endpoint afterward.
- Assemble chunks in numeric order after server finalization.
- Use authentication and per-user authorization on every chunk request.
- Enforce file size, duration, and MIME limits server-side.
