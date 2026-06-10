# React Webcam Capture

Use `react-webcam-kit` when you need webcam preview and still-image capture in a React app.

```tsx
import { useRef } from 'react';
import { Webcam, type WebcamHandle } from 'react-webcam-kit';

export function AvatarCapture() {
  const webcamRef = useRef<WebcamHandle>(null);

  async function uploadCapture() {
    const blob = await webcamRef.current?.getScreenshotBlob({
      format: 'image/jpeg',
      quality: 0.86,
      width: 1024,
    });

    if (!blob) {
      return;
    }

    const formData = new FormData();
    formData.append('avatar', blob, 'avatar.jpg');
    await fetch('/api/avatar', { method: 'POST', body: formData });
  }

  return (
    <>
      <Webcam ref={webcamRef} audio={false} mirrored />
      <button type="button" onClick={() => void uploadCapture()}>
        Upload avatar
      </button>
    </>
  );
}
```

Prefer Blob capture for uploads. Use Data URLs when you need to preview inline image data.
