import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'stopping'
  | 'stopped'
  | 'denied'
  | 'unsupported'
  | 'error';

export type ScreenshotFormat = 'image/webp' | 'image/png' | 'image/jpeg';

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  format?: ScreenshotFormat;
  quality?: number;
  mirrored?: boolean;
  imageSmoothing?: boolean;
  forceSourceSize?: boolean;
  minWidth?: number;
  minHeight?: number;
}

export type CaptureFrameResultType = 'canvas' | 'data-url' | 'blob' | 'image-data';

export type CaptureFrameOptions = ScreenshotOptions & {
  type?: CaptureFrameResultType;
};

export interface CameraError {
  name: string;
  message: string;
  type:
    | 'unsupported'
    | 'permission-denied'
    | 'not-found'
    | 'not-readable'
    | 'overconstrained'
    | 'security'
    | 'unknown';
  cause?: unknown;
}

export interface WebcamFallbackProps {
  status: CameraStatus;
  error: CameraError | null;
}

export type WebcamFallback = ReactNode | ((props: WebcamFallbackProps) => ReactNode);

export interface UseDevicesResult {
  audioInputs: MediaDeviceInfo[];
  counts: {
    audio: number;
    video: number;
  };
  devicesById: Record<string, MediaDeviceInfo>;
  devicesByType: {
    audio: MediaDeviceInfo[];
    video: MediaDeviceInfo[];
  };
  error: CameraError | null;
  permission: PermissionState | 'unsupported' | 'unknown';
  refresh: () => Promise<void>;
  videoInputs: MediaDeviceInfo[];
}

export interface UseCameraPermissionsOptions {
  audio?: boolean;
  audioConstraints?: MediaStreamConstraints['audio'];
  onError?: (error: CameraError) => void;
  onPermissionChange?: (permission: PermissionState | 'unsupported' | 'unknown') => void;
  videoConstraints?: MediaStreamConstraints['video'];
}

export interface UseCameraPermissionsResult {
  canRequest: boolean;
  error: CameraError | null;
  isSupported: boolean;
  permission: PermissionState | 'unsupported' | 'unknown';
  refresh: () => Promise<PermissionState | 'unsupported' | 'unknown'>;
  requestPermission: () => Promise<boolean>;
}

export interface UseWebcamOptions {
  audio?: boolean;
  audioConstraints?: MediaStreamConstraints['audio'];
  enabled?: boolean;
  forceScreenshotSourceSize?: boolean;
  imageSmoothing?: boolean;
  mirrored?: boolean;
  onDevicesChanged?: (devices: MediaDeviceInfo[]) => void;
  onError?: (error: CameraError) => void;
  onPermissionChange?: (permission: PermissionState | 'unsupported' | 'unknown') => void;
  onStart?: (stream: MediaStream) => void;
  onStop?: () => void;
  onUserMedia?: (stream: MediaStream) => void;
  onUserMediaError?: (error: CameraError) => void;
  screenshotFormat?: ScreenshotFormat;
  screenshotQuality?: number;
  startOnMount?: boolean;
  videoConstraints?: MediaStreamConstraints['video'];
}

export interface UseWebcamResult {
  applyVideoConstraints: (constraints: MediaTrackConstraints) => Promise<void>;
  devices: MediaDeviceInfo[];
  error: CameraError | null;
  getCanvas: (options?: ScreenshotOptions) => HTMLCanvasElement | null;
  getScreenshot: (options?: ScreenshotOptions) => string | null;
  getScreenshotBlob: (options?: ScreenshotOptions) => Promise<Blob | null>;
  permission: PermissionState | 'unsupported' | 'unknown';
  refreshDevices: () => Promise<void>;
  restart: () => Promise<MediaStream | null>;
  selectedDeviceId: string | null;
  selectedFacingMode: VideoFacingModeEnum | null;
  start: (constraintsOverride?: MediaStreamConstraints) => Promise<MediaStream | null>;
  status: CameraStatus;
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
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export interface WebcamChildrenProps {
  getScreenshot: (options?: ScreenshotOptions) => string | null;
}

export type WebcamVideoProps = Omit<ComponentPropsWithoutRef<'video'>, 'children' | 'ref'>;

export type RecordingStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'unsupported'
  | 'error';

export interface MediaRecorderError {
  name: string;
  message: string;
  cause?: unknown;
}

export interface UseMediaRecorderOptions {
  audioBitsPerSecond?: number;
  bitsPerSecond?: number;
  durationUpdateInterval?: number;
  fileName?: string | (() => string);
  fileType?: string;
  maxDuration?: number;
  mimeType?: string;
  onDataAvailable?: (chunk: BlobEvent) => void;
  onError?: (error: MediaRecorderError) => void;
  onMaxDuration?: (duration: number) => void;
  onPause?: () => void;
  onResume?: () => void;
  onStart?: (recorder: MediaRecorder) => void;
  onStop?: (blob: Blob, chunks: Blob[]) => void;
  stream?: MediaStream | null;
  timeslice?: number;
  videoBitsPerSecond?: number;
}

export interface UseMediaRecorderResult {
  blob: Blob | null;
  cancel: () => void;
  chunks: Blob[];
  duration: number;
  error: MediaRecorderError | null;
  file: File | null;
  isAudioMuted: boolean;
  isSupported: boolean;
  mimeType: string | null;
  muteAudio: () => void;
  pause: () => void;
  recorder: MediaRecorder | null;
  reset: () => void;
  resume: () => void;
  recordingTimeLimitReached: boolean;
  setAudioMuted: (muted: boolean) => void;
  start: (streamOverride?: MediaStream) => MediaRecorder | null;
  status: RecordingStatus;
  stop: () => void;
  unmuteAudio: () => void;
}
