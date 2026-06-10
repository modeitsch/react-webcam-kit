# Avatar Capture Example

Capture a square avatar image as a Blob and upload it.

```tsx
import { useRef } from 'react';
import { Webcam, type WebcamHandle } from 'react-webcam-kit';

export function AvatarCapture() {
  const webcamRef = useRef<WebcamHandle>(null);

  async function uploadAvatar() {
    const blob = await webcamRef.current?.getScreenshotBlob({
      format: 'image/jpeg',
      quality: 0.86,
      width: 512,
      height: 512,
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
      <button type="button" onClick={() => void uploadAvatar()}>
        Upload avatar
      </button>
    </>
  );
}
```
