export { captureFrame } from './capture/captureFrame';
export { Webcam, type WebcamHandle, type WebcamProps } from './components/Webcam';
export { normalizeMediaError } from './errors/normalizeMediaError';
export { useDevices } from './hooks/useDevices';
export {
  DEFAULT_RECORDER_MIME_TYPES,
  getSupportedMimeType,
  useMediaRecorder,
} from './hooks/useMediaRecorder';
export { useWebcam } from './hooks/useWebcam';
export type {
  CameraError,
  CameraStatus,
  CaptureFrameOptions,
  CaptureFrameResultType,
  MediaRecorderError,
  RecordingStatus,
  ScreenshotFormat,
  ScreenshotOptions,
  UseDevicesResult,
  UseMediaRecorderOptions,
  UseMediaRecorderResult,
  UseWebcamOptions,
  UseWebcamResult,
  WebcamChildrenProps,
  WebcamFallback,
  WebcamFallbackProps,
  WebcamVideoProps,
} from './types';

export { Webcam as default } from './components/Webcam';
