# Mobile Back Camera Example

Use `switchFacingMode()` for simple front/back camera controls on mobile.

```tsx
import { useWebcam } from 'react-webcam-kit';

export function MobileBackCamera() {
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
