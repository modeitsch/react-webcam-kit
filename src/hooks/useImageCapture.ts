import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { captureFrame } from '../capture/captureFrame';
import type { ScreenshotOptions, UseImageCaptureOptions, UseImageCaptureResult } from '../types';

interface ImageCaptureLike {
  takePhoto: (settings?: Record<string, unknown>) => Promise<Blob>;
  grabFrame: () => Promise<ImageBitmap>;
  getPhotoCapabilities?: () => Promise<Record<string, unknown>>;
}

type ImageCaptureConstructor = new (track: MediaStreamTrack) => ImageCaptureLike;

function getImageCaptureConstructor(): ImageCaptureConstructor | null {
  const candidate = (globalThis as unknown as { ImageCapture?: ImageCaptureConstructor })
    .ImageCapture;
  return typeof candidate === 'function' ? candidate : null;
}

/**
 * Captures full-resolution stills through the ImageCapture API.
 *
 * `getScreenshot()` samples the *preview* video, so it is capped at the negotiated stream size
 * (often 720p). `takePhoto()` asks the camera hardware for a still, which on a phone can be an
 * order of magnitude more pixels. Support is patchy — notably absent on Safari — so this falls
 * back to a video-frame capture unless `fallbackToFrame` is disabled.
 */
export function useImageCapture(
  stream: MediaStream | null | undefined,
  options: UseImageCaptureOptions = {},
): UseImageCaptureResult {
  const { fallbackToFrame = true, videoRef } = options;
  const optionsRef = useRef(options);
  const [error, setError] = useState<Error | null>(null);
  const [photoCapabilities, setPhotoCapabilities] = useState<Record<string, unknown> | null>(null);

  optionsRef.current = options;

  const track = useMemo(() => stream?.getVideoTracks()[0] ?? null, [stream]);
  const isSupported = getImageCaptureConstructor() !== null;

  const capture = useMemo(() => {
    const Constructor = getImageCaptureConstructor();

    if (!Constructor || !track) {
      return null;
    }

    try {
      return new Constructor(track);
    } catch {
      return null;
    }
  }, [track]);

  useEffect(() => {
    let cancelled = false;

    if (!capture?.getPhotoCapabilities) {
      setPhotoCapabilities(null);
      return () => {
        cancelled = true;
      };
    }

    void capture
      .getPhotoCapabilities()
      .then((next) => {
        if (!cancelled) {
          setPhotoCapabilities(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPhotoCapabilities(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [capture]);

  const captureFromVideo = useCallback((captureOptions?: ScreenshotOptions) => {
    const video = optionsRef.current.videoRef?.current;

    if (!video) {
      return Promise.resolve(null);
    }

    return captureFrame(video, { ...captureOptions, type: 'blob' });
  }, []);

  const takePhoto = useCallback(
    async (settings?: Record<string, unknown>) => {
      if (capture) {
        try {
          const blob = await capture.takePhoto(settings);
          setError(null);
          return blob;
        } catch (caughtError) {
          const nextError =
            caughtError instanceof Error ? caughtError : new Error('takePhoto failed.');
          setError(nextError);

          if (!fallbackToFrame) {
            throw nextError;
          }
        }
      }

      if (!fallbackToFrame) {
        const unsupported = new Error('ImageCapture is not supported in this environment.');
        setError(unsupported);
        throw unsupported;
      }

      return captureFromVideo(optionsRef.current.fallbackOptions);
    },
    [capture, captureFromVideo, fallbackToFrame],
  );

  const grabFrame = useCallback(async () => {
    if (!capture) {
      return null;
    }

    try {
      const bitmap = await capture.grabFrame();
      setError(null);
      return bitmap;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError : new Error('grabFrame failed.'));
      return null;
    }
  }, [capture]);

  return {
    error,
    grabFrame,
    // `isSupported` reports the API; `takePhoto` still resolves without it when a fallback
    // video element was provided.
    isSupported,
    photoCapabilities,
    takePhoto,
    videoRef,
  };
}
