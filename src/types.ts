import type { ComponentPropsWithoutRef, Ref, ReactNode, VideoHTMLAttributes } from 'react';

export type CameraStatus =
  'idle' | 'requesting' | 'ready' | 'stopping' | 'stopped' | 'denied' | 'unsupported' | 'error';

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
  /**
   * The constraint that could not be satisfied. Only present for `OverconstrainedError`
   * (`type: 'overconstrained'`), where it names the failing constraint such as `'facingMode'`.
   */
  constraint?: string;
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

export interface UseDisplayMediaOptions {
  audio?: DisplayMediaStreamOptions['audio'];
  onError?: (error: CameraError) => void;
  onStart?: (stream: MediaStream) => void;
  onStop?: () => void;
  video?: DisplayMediaStreamOptions['video'];
}

export interface UseDisplayMediaResult {
  error: CameraError | null;
  isSupported: boolean;
  start: (constraintsOverride?: DisplayMediaStreamOptions) => Promise<MediaStream | null>;
  status: CameraStatus;
  stop: () => void;
  stream: MediaStream | null;
}

export type UseAudioRecorderOptions = Omit<UseMediaRecorderOptions, 'stream'> & {
  audioConstraints?: MediaStreamConstraints['audio'];
  onMediaError?: (error: CameraError) => void;
  onMediaStart?: (stream: MediaStream) => void;
  onMediaStop?: () => void;
};

export type UseAudioRecorderResult = Omit<UseMediaRecorderResult, 'start' | 'stop'> & {
  isMediaSupported: boolean;
  mediaError: CameraError | null;
  mediaStatus: CameraStatus;
  start: () => Promise<MediaRecorder | null>;
  stop: () => void;
  stopStream: () => void;
  stream: MediaStream | null;
};

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

/**
 * Props accepted by (and returned for) the preview `<video>` element. The `ref` is a callback
 * ref so the active stream is attached the moment the element mounts.
 */
export type WebcamVideoElementProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, 'ref'> & {
  ref?: Ref<HTMLVideoElement>;
};

export interface UseWebcamResult {
  applyVideoConstraints: (constraints: MediaTrackConstraints) => Promise<void>;
  devices: MediaDeviceInfo[];
  error: CameraError | null;
  getCanvas: (options?: ScreenshotOptions) => HTMLCanvasElement | null;
  getScreenshot: (options?: ScreenshotOptions) => string | null;
  getScreenshotBlob: (options?: ScreenshotOptions) => Promise<Blob | null>;
  /**
   * Spreadable props for the preview element: `<video {...getVideoProps()} />`.
   * Prefer this over `videoRef` — it attaches the stream on mount, so it works even when the
   * element is rendered conditionally (for example only once `status === 'ready'`).
   */
  getVideoProps: (props?: WebcamVideoElementProps) => WebcamVideoElementProps;
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
  'idle' | 'recording' | 'paused' | 'stopping' | 'stopped' | 'unsupported' | 'error';

export interface MediaRecorderError {
  name: string;
  message: string;
  cause?: unknown;
}

export type RecordingQualityPreset = 'low' | 'medium' | 'high' | 'hd' | 'full-hd';

export interface RecordingQualityPresetConfig {
  audioBitsPerSecond: number;
  frameRate: number;
  height: number;
  videoBitsPerSecond: number;
  width: number;
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
  /**
   * Publish each chunk to the reactive `chunks` array as it arrives. Defaults to `true`.
   * Set to `false` for long recordings with a small `timeslice`: the consumer then re-renders
   * once on stop instead of at the timeslice rate. Chunks remain available via
   * `getChunks()` and `onDataAvailable`.
   */
  publishChunks?: boolean;
  quality?: RecordingQualityPreset;
  stream?: MediaStream | null;
  timeslice?: number;
  videoBitsPerSecond?: number;
}

export interface UseFrameProcessorOptions {
  /** Start the loop automatically. Defaults to `true`. */
  enabled?: boolean;
  /** Upper bound on how often `onFrame` runs. Omit to process every frame the browser delivers. */
  fps?: number;
  onError?: (error: unknown) => void;
  /**
   * Called for each frame. Frames that arrive while a previous call is still pending are
   * skipped, so an async handler can safely be slower than the frame rate.
   */
  onFrame: (video: HTMLVideoElement, metadata?: unknown) => void | Promise<void>;
}

export interface UseFrameProcessorResult {
  isRunning: boolean;
  start: () => void;
  stop: () => void;
}

export interface CameraCapabilityRange {
  max: number;
  min: number;
  step: number;
}

export interface CameraCapabilities {
  facingModes: string[];
  focusModes: string[];
  /** The unmodified `getCapabilities()` result, for anything not normalised above. */
  raw: MediaTrackCapabilities | null;
  torch: boolean;
  zoom: CameraCapabilityRange | null;
}

export interface UseCameraCapabilitiesResult {
  applyConstraints: (constraints: MediaTrackConstraints) => Promise<void>;
  capabilities: CameraCapabilities;
  error: Error | null;
  refresh: () => void;
  setFocusMode: (mode: string) => Promise<void>;
  /** Toggles the camera light. No-op on hardware without one — check `supportsTorch` first. */
  setTorch: (on: boolean) => Promise<void>;
  setZoom: (value: number) => Promise<void>;
  settings: MediaTrackSettings;
  supportsFocusMode: boolean;
  supportsTorch: boolean;
  supportsZoom: boolean;
  torch: boolean;
  zoom: number | null;
}

export interface UseImageCaptureOptions {
  /** Capture options used when falling back to a video frame. */
  fallbackOptions?: ScreenshotOptions;
  /**
   * Fall back to capturing the preview frame when ImageCapture is unavailable or fails.
   * Defaults to `true`. Requires `videoRef`.
   */
  fallbackToFrame?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export interface UseImageCaptureResult {
  error: Error | null;
  grabFrame: () => Promise<ImageBitmap | null>;
  /** Whether the browser exposes the ImageCapture API. Safari does not. */
  isSupported: boolean;
  photoCapabilities: Record<string, unknown> | null;
  /** Full-resolution still from the camera hardware, not a downscaled preview frame. */
  takePhoto: (settings?: Record<string, unknown>) => Promise<Blob | null>;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export interface UseAudioLevelOptions {
  enabled?: boolean;
  /** Analyser FFT size. Larger gives finer frequency resolution at more CPU. Defaults to 1024. */
  fftSize?: number;
  smoothingTimeConstant?: number;
  /**
   * How often `level`/`peak` are pushed to React state, in milliseconds. Defaults to 100.
   * Measurement itself runs every animation frame — use `getLevel()` for the live value.
   */
  updateInterval?: number;
}

export interface UseAudioLevelResult {
  analyser: AnalyserNode | null;
  error: Error | null;
  /** Live frequency-domain bytes, for a spectrum display. Reuses one buffer — copy to retain. */
  getFrequencyData: () => Uint8Array | null;
  /** The most recent RMS level without waiting for the next state update. */
  getLevel: () => number;
  /** Live time-domain bytes, for a waveform. Reuses one buffer — copy to retain. */
  getWaveform: () => Uint8Array | null;
  isSupported: boolean;
  /** RMS amplitude in 0..1. */
  level: number;
  /** Loudest sample in the current window, 0..1. */
  peak: number;
}

export interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  cornerPoints: { x: number; y: number }[];
  format: string;
  rawValue: string;
}

export interface UseBarcodeScannerOptions {
  /** Fire `onDetected` on every frame a code is visible, not just on change. Defaults to false. */
  continuous?: boolean;
  /** How long the same value is suppressed for, in milliseconds. Defaults to 1500. */
  dedupeIntervalMs?: number;
  enabled?: boolean;
  /** Detection attempts per second. Defaults to 10; decoding every frame is rarely worth it. */
  fps?: number;
  /** Formats to look for, e.g. `['qr_code', 'ean_13']`. Omit to accept everything supported. */
  formats?: string[];
  onDetected?: (barcode: DetectedBarcode, all: DetectedBarcode[]) => void;
  onError?: (error: Error) => void;
}

export interface UseBarcodeScannerResult {
  error: Error | null;
  isScanning: boolean;
  /** False where the browser has no `BarcodeDetector` — fall back to a userland decoder. */
  isSupported: boolean;
  lastResult: DetectedBarcode | null;
  reset: () => void;
  results: DetectedBarcode[];
  start: () => void;
  stop: () => void;
  supportedFormats: string[];
}

export interface CompositeLayer {
  /** Include this layer's audio tracks in the mixed output. */
  audio?: boolean;
  /** How to scale the source into the target box. Defaults to stretching to fit. */
  fit?: 'contain' | 'cover' | 'fill';
  height?: number;
  mirrored?: boolean;
  opacity?: number;
  stream: MediaStream | null | undefined;
  /** Gain applied to this layer's audio, where 1 is unity. */
  volume?: number;
  width?: number;
  x?: number;
  y?: number;
}

export interface UseCompositeStreamOptions {
  backgroundColor?: string;
  frameRate?: number;
  height?: number;
  /** Drawn in order, so later layers sit on top. */
  layers: CompositeLayer[];
  width?: number;
}

export interface UseCompositeStreamResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  error: Error | null;
  isRunning: boolean;
  isSupported: boolean;
  start: () => MediaStream | null;
  stop: () => void;
  stream: MediaStream | null;
}

export type MediaPermissionKind = 'camera' | 'microphone';

export interface UseMediaPermissionsOptions {
  audio?: boolean;
  audioConstraints?: MediaStreamConstraints['audio'];
  /** Which device to preflight. Defaults to `'camera'`. */
  kind?: MediaPermissionKind;
  onError?: (error: CameraError) => void;
  onPermissionChange?: (permission: PermissionState | 'unsupported' | 'unknown') => void;
  videoConstraints?: MediaStreamConstraints['video'];
}

export interface UseMediaPermissionsResult {
  canRequest: boolean;
  error: CameraError | null;
  isSupported: boolean;
  kind: MediaPermissionKind;
  permission: PermissionState | 'unsupported' | 'unknown';
  refresh: () => Promise<PermissionState | 'unsupported' | 'unknown'>;
  requestPermission: () => Promise<boolean>;
}

export interface ChunkUploadProgress {
  index: number;
  size: number;
  uploaded: number;
}

export interface CreateChunkUploaderOptions {
  /** Extra form fields sent with every chunk. */
  fields?: Record<string, string>;
  /** Form field name for the chunk itself. Defaults to `'chunk'`. */
  fieldName?: string;
  fetchImpl?: typeof fetch;
  headers?: Record<string, string>;
  /** Attempts after the first before giving up. Defaults to 3. */
  maxRetries?: number;
  /** Base backoff between retries in milliseconds; doubles each attempt. Defaults to 500. */
  retryDelayMs?: number;
  onError?: (error: Error) => void;
  onProgress?: (progress: ChunkUploadProgress) => void;
  /** Correlates chunks belonging to one recording; sent as the `uploadId` field. */
  uploadId?: string;
  url: string;
}

export interface ChunkUploader {
  /** Waits for the queue to drain. Rejects with the first unrecoverable upload error. */
  complete: () => Promise<void>;
  /** Queues a chunk. Chunks are uploaded strictly in order. */
  enqueue: (chunk: Blob, isLast?: boolean) => void;
  readonly error: Error | null;
  readonly pending: number;
  readonly uploaded: number;
}

export interface CreateUploadFormDataOptions {
  fields?: Record<string, string | Blob>;
  fieldName?: string;
  fileName?: string;
}

export interface UseMediaRecorderResult {
  blob: Blob | null;
  cancel: () => void;
  chunks: Blob[];
  duration: number;
  error: MediaRecorderError | null;
  file: File | null;
  /** Reads the recorded chunks synchronously, without waiting for a re-render. */
  getChunks: () => Blob[];
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
