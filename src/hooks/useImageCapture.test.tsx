import { renderHook, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useImageCapture } from './useImageCapture';

function createStream() {
  const track = { kind: 'video', stop: vi.fn() } as unknown as MediaStreamTrack;
  return { getVideoTracks: () => [track] } as unknown as MediaStream;
}

function videoRef() {
  const ref = createRef<HTMLVideoElement>();
  const video = {
    clientWidth: 640,
    clientHeight: 360,
    readyState: 4,
    videoHeight: 720,
    videoWidth: 1280,
  } as unknown as HTMLVideoElement;
  ref.current = video;
  return ref;
}

/**
 * Stubs the canvas 2D pipeline on the prototype so a real element is still created. Mocking
 * `document.createElement` wholesale would also intercept the elements React creates.
 */
function mockCanvas(blob: Blob | null) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
    imageSmoothingEnabled: true,
    restore: vi.fn(),
    save: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
    callback(blob);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useImageCapture', () => {
  it('reports unsupported when the browser has no ImageCapture', () => {
    const { result } = renderHook(() => useImageCapture(createStream()));

    expect(result.current.isSupported).toBe(false);
  });

  it('takes a full-resolution photo through ImageCapture', async () => {
    const photo = new Blob(['photo'], { type: 'image/jpeg' });
    const takePhoto = vi.fn().mockResolvedValue(photo);
    vi.stubGlobal(
      'ImageCapture',
      class {
        takePhoto = takePhoto;
        grabFrame = vi.fn();
      },
    );

    const { result } = renderHook(() => useImageCapture(createStream()));

    expect(result.current.isSupported).toBe(true);
    await expect(result.current.takePhoto()).resolves.toBe(photo);
    expect(takePhoto).toHaveBeenCalled();
  });

  it('falls back to a video frame when ImageCapture is missing', async () => {
    const fallbackBlob = new Blob(['frame'], { type: 'image/webp' });
    mockCanvas(fallbackBlob);

    const { result } = renderHook(() => useImageCapture(createStream(), { videoRef: videoRef() }));

    await expect(result.current.takePhoto()).resolves.toBe(fallbackBlob);
  });

  it('falls back to a video frame when takePhoto rejects', async () => {
    // Some Android devices expose ImageCapture but throw on takePhoto.
    vi.stubGlobal(
      'ImageCapture',
      class {
        takePhoto = vi.fn().mockRejectedValue(new Error('takePhoto unavailable'));
        grabFrame = vi.fn();
      },
    );
    const fallbackBlob = new Blob(['frame'], { type: 'image/webp' });
    mockCanvas(fallbackBlob);

    const { result } = renderHook(() => useImageCapture(createStream(), { videoRef: videoRef() }));

    await expect(result.current.takePhoto()).resolves.toBe(fallbackBlob);
    await waitFor(() => {
      expect(result.current.error?.message).toBe('takePhoto unavailable');
    });
  });

  it('rejects instead of falling back when fallbackToFrame is disabled', async () => {
    const { result } = renderHook(() =>
      useImageCapture(createStream(), { fallbackToFrame: false, videoRef: videoRef() }),
    );

    await expect(result.current.takePhoto()).rejects.toThrow('ImageCapture is not supported');
  });

  it('reads photo capabilities when available', async () => {
    vi.stubGlobal(
      'ImageCapture',
      class {
        takePhoto = vi.fn();
        grabFrame = vi.fn();
        getPhotoCapabilities = vi.fn().mockResolvedValue({ imageWidth: { max: 4032, min: 1 } });
      },
    );

    const { result } = renderHook(() => useImageCapture(createStream()));

    await waitFor(() => {
      expect(result.current.photoCapabilities).toEqual({ imageWidth: { max: 4032, min: 1 } });
    });
  });

  it('returns null from grabFrame when unsupported', async () => {
    const { result } = renderHook(() => useImageCapture(createStream()));

    await expect(result.current.grabFrame()).resolves.toBeNull();
  });
});
