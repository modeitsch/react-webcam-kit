export { captureFrame } from './capture/captureFrame';
export { Webcam, type WebcamHandle, type WebcamProps } from './components/Webcam';
export { normalizeMediaError } from './errors/normalizeMediaError';
export { useAudioRecorder } from './hooks/useAudioRecorder';
export { useCameraPermissions } from './hooks/useCameraPermissions';
export { useDevices } from './hooks/useDevices';
export { useDisplayMedia } from './hooks/useDisplayMedia';
export {
  DEFAULT_RECORDER_MIME_TYPES,
  getRecordingPresetConstraints,
  getSupportedMimeType,
  RECORDING_QUALITY_PRESETS,
  useMediaRecorder,
} from './hooks/useMediaRecorder';
export { useObjectUrl } from './hooks/useObjectUrl';
export { useWebcam } from './hooks/useWebcam';
export { downloadBlob } from './recording/downloadBlob';
export { formatDuration } from './recording/formatDuration';
export { blobToFile } from './upload/blobToFile';
export { createUploadFormData } from './upload/createUploadFormData';
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
  CreateUploadFormDataOptions,
  MediaRecorderError,
  RecordingQualityPreset,
  RecordingQualityPresetConfig,
  RecordingStatus,
  ScreenshotFormat,
  ScreenshotOptions,
  UseAudioRecorderOptions,
  UseAudioRecorderResult,
  UseCameraPermissionsOptions,
  UseCameraPermissionsResult,
  UseDevicesResult,
  UseDisplayMediaOptions,
  UseDisplayMediaResult,
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
