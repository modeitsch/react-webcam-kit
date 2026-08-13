import type { CaptureFrameOptions, ScreenshotFormat } from '../types';

const DEFAULT_FORMAT: ScreenshotFormat = 'image/webp';
const DEFAULT_QUALITY = 0.92;

function isVideoReady(video: HTMLVideoElement) {
  return (
    video.readyState > HTMLMediaElement.HAVE_NOTHING &&
    video.videoWidth > 0 &&
    video.videoHeight > 0
  );
}

function resolveDimensions(video: HTMLVideoElement, options: CaptureFrameOptions) {
  let width = video.videoWidth;
  let height = video.videoHeight;

  if (!options.forceSourceSize) {
    const aspectRatio = width / height;
    // `clientWidth` is 0 (not null/undefined) for an element that is hidden or not laid out,
    // so `??` would happily produce a 0x0 canvas. `||` falls through to the intrinsic size.
    const layoutWidth = video.clientWidth || video.videoWidth;

    if (options.width) {
      width = options.width;
      height = options.height ?? width / aspectRatio;
    } else if (options.height) {
      height = options.height;
      width = height * aspectRatio;
    } else {
      width = options.minWidth ? Math.max(layoutWidth, options.minWidth) : layoutWidth;
      height = width / aspectRatio;
    }

    // `minWidth`/`minHeight` are floors, never a forced downscale. They only apply when the
    // caller has not pinned that dimension explicitly.
    if (!options.height && options.minHeight && height < options.minHeight) {
      height = options.minHeight;
      width = height * aspectRatio;
    }

    if (!options.width && options.minWidth && width < options.minWidth) {
      width = options.minWidth;
      height = width / aspectRatio;
    }
  }

  return {
    height: Math.round(height),
    width: Math.round(width),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, format: ScreenshotFormat, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, format, quality);
  });
}

export function captureFrame(
  video: HTMLVideoElement | null,
  options: CaptureFrameOptions & { type: 'blob' },
): Promise<Blob | null>;
export function captureFrame(
  video: HTMLVideoElement | null,
  options: CaptureFrameOptions & { type: 'canvas' },
): HTMLCanvasElement | null;
export function captureFrame(
  video: HTMLVideoElement | null,
  options: CaptureFrameOptions & { type: 'image-data' },
): ImageData | null;
export function captureFrame(
  video: HTMLVideoElement | null,
  options?: CaptureFrameOptions & { type?: 'data-url' },
): string | null;
export function captureFrame(
  video: HTMLVideoElement | null,
  options: CaptureFrameOptions = {},
): HTMLCanvasElement | ImageData | Promise<Blob | null> | string | null {
  if (!video || !isVideoReady(video)) {
    return null;
  }

  const format = options.format ?? DEFAULT_FORMAT;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const { height, width } = resolveDimensions(video, options);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  context.save();
  context.imageSmoothingEnabled = options.imageSmoothing ?? true;

  if (options.mirrored) {
    context.translate(width, 0);
    context.scale(-1, 1);
  }

  try {
    context.drawImage(video, 0, 0, width, height);
  } catch {
    context.restore();
    return null;
  }

  context.restore();

  if (options.type === 'canvas') {
    return canvas;
  }

  if (options.type === 'image-data') {
    try {
      return context.getImageData(0, 0, width, height);
    } catch {
      return null;
    }
  }

  if (options.type === 'blob') {
    return canvasToBlob(canvas, format, quality);
  }

  try {
    return canvas.toDataURL(format, quality);
  } catch {
    return null;
  }
}
