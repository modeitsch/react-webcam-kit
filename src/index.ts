export { captureFrame } from './capture/captureFrame';
export { Webcam, type WebcamHandle, type WebcamProps } from './components/Webcam';
export { normalizeMediaError } from './errors/normalizeMediaError';
export { useDevices } from './hooks/useDevices';
export {
  DEFAULT_RECORDER_MIME_TYPES,
  getSupportedMimeType,
  useMediaRecorder,
} from './hooks/useMediaRecorder';
export { useObjectUrl } from './hooks/useObjectUrl';
export { useWebcam } from './hooks/useWebcam';
export { downloadBlob } from './recording/downloadBlob';
export {
  DEFAULT_AUDIO_RECORDER_MIME_TYPES,
  DEFAULT_VIDEO_RECORDER_MIME_TYPES,
  getSupportedAudioMimeTypes,
  getSupportedRecorderMimeTypes,
  getSupportedVideoMimeTypes,
  isPlaybackMimeTypeSupported,
  isRecorderMimeTypeSupported,
} from './recording/codecSupport';
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
