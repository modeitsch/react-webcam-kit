# React Front And Back Camera Switching

Use `switchFacingMode()` for mobile front/back camera controls.

```tsx
import { useWebcam } from 'react-webcam-kit';

export function MobileCamera() {
  const camera = useWebcam({
    audio: false,
    videoConstraints: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: { ideal: 'user' },
    },
  });

  return (
    <>
      <video ref={camera.videoRef} autoPlay playsInline muted />
      <button type="button" onClick={() => void camera.switchFacingMode('user')}>
        Front
      </button>
      <button type="button" onClick={() => void camera.switchFacingMode('environment')}>
        Back
      </button>
    </>
  );
}
```

Use `switchDevice(deviceId)` when the user picks a specific physical camera from `useDevices()`. Use
`switchFacingMode()` when your UI only needs front/back behavior.
