export { captureFrame } from './capture/captureFrame';
export { Webcam, type WebcamHandle, type WebcamProps } from './components/Webcam';
export { normalizeMediaError } from './errors/normalizeMediaError';
export { useAudioLevel } from './hooks/useAudioLevel';
export { useAudioRecorder } from './hooks/useAudioRecorder';
export { useBarcodeScanner } from './hooks/useBarcodeScanner';
export { useCameraCapabilities } from './hooks/useCameraCapabilities';
export { useCameraPermissions } from './hooks/useCameraPermissions';
export { useCompositeStream } from './hooks/useCompositeStream';
export { useDevices } from './hooks/useDevices';
export { useDisplayMedia } from './hooks/useDisplayMedia';
export { useFrameProcessor } from './hooks/useFrameProcessor';
export { useImageCapture } from './hooks/useImageCapture';
export { useMediaPermissions, useMicrophonePermissions } from './hooks/useMediaPermissions';
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
export { createChunkUploader } from './upload/createChunkUploader';
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
  CameraCapabilities,
  CameraCapabilityRange,
  CameraError,
  CameraStatus,
  CaptureFrameOptions,
  CaptureFrameResultType,
  ChunkUploader,
  ChunkUploadProgress,
  CompositeLayer,
  CreateChunkUploaderOptions,
  CreateUploadFormDataOptions,
  DetectedBarcode,
  MediaPermissionKind,
  MediaRecorderError,
  RecordingQualityPreset,
  RecordingQualityPresetConfig,
  RecordingStatus,
  ScreenshotFormat,
  ScreenshotOptions,
  UseAudioLevelOptions,
  UseAudioLevelResult,
  UseAudioRecorderOptions,
  UseAudioRecorderResult,
  UseBarcodeScannerOptions,
  UseBarcodeScannerResult,
  UseCameraCapabilitiesResult,
  UseCameraPermissionsOptions,
  UseCameraPermissionsResult,
  UseCompositeStreamOptions,
  UseCompositeStreamResult,
  UseDevicesResult,
  UseDisplayMediaOptions,
  UseDisplayMediaResult,
  UseFrameProcessorOptions,
  UseFrameProcessorResult,
  UseImageCaptureOptions,
  UseImageCaptureResult,
  UseMediaPermissionsOptions,
  UseMediaPermissionsResult,
  UseMediaRecorderOptions,
  UseMediaRecorderResult,
  UseWebcamOptions,
  UseWebcamResult,
  WebcamChildrenProps,
  WebcamFallback,
  WebcamFallbackProps,
  WebcamVideoElementProps,
  WebcamVideoProps,
} from './types';

export { Webcam as default } from './components/Webcam';
