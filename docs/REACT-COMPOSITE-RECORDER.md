# React Composite Screen Recorder

Use `useCompositeStream()` to combine screen sharing, webcam picture-in-picture, and audio into one
recordable `MediaStream`.

This is useful for Loom-style recorders, course creators, bug reports, async standups, and support
tools where the final file should contain both the shared screen and the presenter camera.

## Screen Plus Webcam Recording

```tsx
import { useMemo } from 'react';
import {
  useCompositeStream,
  useDisplayMedia,
  useMediaRecorder,
  useObjectUrl,
  useWebcam,
} from 'react-webcam-kit';

export function CompositeRecorder() {
  const screen = useDisplayMedia({ audio: true, video: true });
  const camera = useWebcam({ audio: true, videoConstraints: { facingMode: { ideal: 'user' } } });
  const layers = useMemo(
    () => [
      { audio: true, fit: 'contain' as const, stream: screen.stream },
      {
        audio: true,
        fit: 'cover' as const,
        height: 180,
        mirrored: true,
        stream: camera.stream,
        width: 320,
        x: 940,
        y: 520,
      },
    ],
    [camera.stream, screen.stream],
  );
  const composite = useCompositeStream({ height: 720, layers, width: 1280 });
  const recorder = useMediaRecorder({
    fileName: 'screen-with-camera',
    fileType: 'webm',
    quality: 'hd',
    stream: composite.stream,
  });
  const playbackUrl = useObjectUrl(recorder.blob);

  return (
    <>
      <video {...camera.getVideoProps()} />
      <canvas ref={composite.canvasRef} />
      <button type="button" onClick={() => void screen.start()}>
        Share screen
      </button>
      <button type="button" disabled={!screen.stream || !camera.stream} onClick={composite.start}>
        Start composite
      </button>
      <button type="button" disabled={!composite.stream} onClick={() => recorder.start()}>
        Record
      </button>
      <button type="button" onClick={recorder.stop}>
        Stop
      </button>
      {playbackUrl ? <video src={playbackUrl} controls /> : null}
    </>
  );
}
```

## Layer Options

- Layers are drawn in order. Put the screen first and the camera bubble last.
- Use `fit: 'contain'` for the shared screen so the full surface stays visible.
- Use `fit: 'cover'` for the camera bubble so it fills its rectangle cleanly.
- Set `audio: true` on each layer whose audio should be mixed into the output.
- Use `volume` per layer when you need to lower tab audio or camera microphone audio.

## Browser Notes

`canvas.captureStream()` and `getDisplayMedia()` must be available for composite recording. Screen
sharing also needs a user gesture, and browser support for tab/system audio varies by platform.
