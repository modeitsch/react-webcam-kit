import { forwardRef, useImperativeHandle, useMemo } from 'react';

import { useWebcam } from '../hooks/useWebcam';
import type {
  ScreenshotFormat,
  ScreenshotOptions,
  UseWebcamOptions,
  WebcamChildrenProps,
  WebcamFallback,
  WebcamVideoProps,
} from '../types';

export interface WebcamHandle {
  applyVideoConstraints: (constraints: MediaTrackConstraints) => Promise<void>;
  getCanvas: (options?: ScreenshotOptions) => HTMLCanvasElement | null;
  getScreenshot: (options?: ScreenshotOptions) => string | null;
  getScreenshotBlob: (options?: ScreenshotOptions) => Promise<Blob | null>;
  start: () => Promise<MediaStream | null>;
  stop: () => void;
  stream: MediaStream | null;
  switchDevice: (
    deviceId: string,
    constraints?: MediaTrackConstraints,
  ) => Promise<MediaStream | null>;
  switchFacingMode: (
    facingMode: VideoFacingModeEnum,
    constraints?: MediaTrackConstraints,
  ) => Promise<MediaStream | null>;
  video: HTMLVideoElement | null;
}

export type WebcamProps = WebcamVideoProps & {
  audio?: boolean;
  audioConstraints?: MediaStreamConstraints['audio'];
  children?: (props: WebcamChildrenProps) => React.ReactNode;
  disablePictureInPicture?: boolean;
  enabled?: boolean;
  fallback?: WebcamFallback;
  forceScreenshotSourceSize?: boolean;
  imageSmoothing?: boolean;
  minScreenshotHeight?: number;
  minScreenshotWidth?: number;
  mirrored?: boolean;
  onDevicesChanged?: (devices: MediaDeviceInfo[]) => void;
  onError?: UseWebcamOptions['onError'];
  onPermissionChange?: UseWebcamOptions['onPermissionChange'];
  onStart?: (stream: MediaStream) => void;
  onStop?: () => void;
  onUserMedia?: (stream: MediaStream) => void;
  onUserMediaError?: UseWebcamOptions['onUserMediaError'];
  screenshotFormat?: ScreenshotFormat;
  screenshotQuality?: number;
  startOnMount?: boolean;
  videoConstraints?: MediaStreamConstraints['video'];
};

function renderFallback(
  fallback: WebcamFallback | undefined,
  props: Parameters<Exclude<WebcamFallback, React.ReactNode>>[0],
) {
  if (typeof fallback === 'function') {
    return fallback(props);
  }

  return fallback ?? null;
}

export const Webcam = forwardRef<WebcamHandle, WebcamProps>(function Webcam(props, ref) {
  const {
    audio = false,
    audioConstraints,
    children,
    disablePictureInPicture = false,
    enabled,
    fallback,
    forceScreenshotSourceSize = false,
    imageSmoothing = true,
    minScreenshotHeight,
    minScreenshotWidth,
    mirrored = false,
    muted,
    onDevicesChanged,
    onError,
    onPermissionChange,
    onStart,
    onStop,
    onUserMedia,
    onUserMediaError,
    screenshotFormat = 'image/webp',
    screenshotQuality = 0.92,
    startOnMount,
    style,
    videoConstraints,
    ...videoProps
  } = props;

  const hookOptions = useMemo<UseWebcamOptions>(
    () => ({
      audio,
      audioConstraints,
      enabled,
      forceScreenshotSourceSize,
      imageSmoothing,
      mirrored,
      onDevicesChanged,
      onError,
      onPermissionChange,
      onStart,
      onStop,
      onUserMedia,
      onUserMediaError,
      screenshotFormat,
      screenshotQuality,
      startOnMount,
      videoConstraints,
    }),
    [
      audio,
      audioConstraints,
      enabled,
      forceScreenshotSourceSize,
      imageSmoothing,
      mirrored,
      onDevicesChanged,
      onError,
      onPermissionChange,
      onStart,
      onStop,
      onUserMedia,
      onUserMediaError,
      screenshotFormat,
      screenshotQuality,
      startOnMount,
      videoConstraints,
    ],
  );
  const webcam = useWebcam(hookOptions);

  useImperativeHandle(
    ref,
    () => ({
      applyVideoConstraints: webcam.applyVideoConstraints,
      getCanvas: (captureOptions) =>
        webcam.getCanvas({
          height: minScreenshotHeight,
          minHeight: minScreenshotHeight,
          minWidth: minScreenshotWidth,
          width: minScreenshotWidth,
          ...captureOptions,
        }),
      getScreenshot: (captureOptions) =>
        webcam.getScreenshot({
          height: minScreenshotHeight,
          minHeight: minScreenshotHeight,
          minWidth: minScreenshotWidth,
          width: minScreenshotWidth,
          ...captureOptions,
        }),
      getScreenshotBlob: (captureOptions) =>
        webcam.getScreenshotBlob({
          height: minScreenshotHeight,
          minHeight: minScreenshotHeight,
          minWidth: minScreenshotWidth,
          width: minScreenshotWidth,
          ...captureOptions,
        }),
      start: () => webcam.start(),
      stop: webcam.stop,
      get stream() {
        return webcam.stream;
      },
      switchDevice: webcam.switchDevice,
      switchFacingMode: webcam.switchFacingMode,
      get video() {
        return webcam.videoRef.current;
      },
    }),
    [minScreenshotHeight, minScreenshotWidth, webcam],
  );

  const videoStyle = mirrored
    ? {
        ...style,
        transform: `${style?.transform ? `${style.transform} ` : ''}scaleX(-1)`,
      }
    : style;

  const shouldRenderFallback =
    webcam.status === 'unsupported' || webcam.status === 'denied' || webcam.status === 'error';

  return (
    <>
      <video
        autoPlay
        disablePictureInPicture={disablePictureInPicture}
        muted={muted ?? !audio}
        playsInline
        ref={webcam.videoRef}
        style={videoStyle}
        {...videoProps}
      />
      {children?.({ getScreenshot: webcam.getScreenshot })}
      {shouldRenderFallback
        ? renderFallback(fallback, { error: webcam.error, status: webcam.status })
        : null}
    </>
  );
});

Webcam.displayName = 'Webcam';
