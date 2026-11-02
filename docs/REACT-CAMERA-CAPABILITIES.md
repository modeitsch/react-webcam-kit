# React Camera Torch, Zoom, And Focus

Use `useCameraCapabilities()` when a React camera screen needs hardware controls such as flashlight,
optical zoom, or focus mode.

These controls are device and browser dependent. The hook reads the active video track, reports what
is actually supported, and applies advanced constraints only when your UI asks for them.

## Torch And Zoom

```tsx
import { useCameraCapabilities, useWebcam } from 'react-webcam-kit';

export function CameraControls() {
  const camera = useWebcam({
    audio: false,
    videoConstraints: {
      facingMode: { ideal: 'environment' },
      height: { ideal: 720 },
      width: { ideal: 1280 },
    },
  });
  const controls = useCameraCapabilities(camera.stream);
  const zoom = controls.capabilities.zoom;

  return (
    <>
      <video {...camera.getVideoProps()} />

      <button
        type="button"
        disabled={!controls.supportsTorch}
        onClick={() => void controls.setTorch(!controls.torch)}
      >
        {controls.torch ? 'Torch off' : 'Torch on'}
      </button>

      {controls.supportsZoom && zoom ? (
        <input
          type="range"
          min={zoom.min}
          max={zoom.max}
          step={zoom.step}
          value={controls.zoom ?? zoom.min}
          onChange={(event) => void controls.setZoom(Number(event.target.value))}
        />
      ) : null}
    </>
  );
}
```

## Apply A Custom Constraint

```tsx
await controls.applyConstraints({
  advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
});
```

## Production Notes

- Desktop webcams usually do not support torch or zoom.
- Mobile browsers may only expose hardware controls after the camera stream is active.
- Branch on `supportsTorch`, `supportsZoom`, and `supportsFocusMode` before showing controls.
- Prefer `ideal` camera constraints so unsupported hardware can still open.
- Catch errors from `setTorch()`, `setZoom()`, and `applyConstraints()`; browsers can reject
  controls when another camera app or OS policy owns the hardware.
