import { createElement, type ReactNode } from 'react';

import Webcam, {
  DEFAULT_AUDIO_RECORDER_MIME_TYPES,
  DEFAULT_RECORDER_MIME_TYPES,
  DEFAULT_VIDEO_RECORDER_MIME_TYPES,
  RECORDING_QUALITY_PRESETS,
  blobToFile,
  captureFrame,
  createUploadFormData,
  downloadBlob,
  formatDuration,
  getRecordingPresetConstraints,
  getSupportedAudioMimeTypes,
  getSupportedMimeType,
  getSupportedRecorderMimeTypes,
  getSupportedVideoMimeTypes,
  isPlaybackMimeTypeSupported,
  isRecorderMimeTypeSupported,
  normalizeMediaError,
  useAudioRecorder,
  useCameraPermissions,
  useDevices,
  useDisplayMedia,
  useMediaRecorder,
  useObjectUrl,
  useWebcam,
  type CameraError,
  type CaptureFrameOptions,
  type CaptureFrameResultType,
  type CreateUploadFormDataOptions,
  type MediaRecorderError,
  type RecordingQualityPreset,
  type RecordingStatus,
  type ScreenshotOptions,
  type UseAudioRecorderResult,
  type UseMediaRecorderResult,
  type UseWebcamResult,
  type WebcamHandle,
  type WebcamProps,
} from 'react-webcam-kit';

function assertType<T>(value: T): T {
  return value;
}

const webcamElement: ReactNode = createElement<WebcamProps>(Webcam, {
  audio: false,
  mirrored: true,
  screenshotFormat: 'image/jpeg',
  videoConstraints: getRecordingPresetConstraints('hd'),
});

void assertType<ReactNode>(webcamElement);
assertType<readonly string[]>(DEFAULT_RECORDER_MIME_TYPES);
assertType<readonly string[]>(DEFAULT_AUDIO_RECORDER_MIME_TYPES);
assertType<readonly string[]>(DEFAULT_VIDEO_RECORDER_MIME_TYPES);
assertType<RecordingQualityPreset>('full-hd');
assertType<number>(RECORDING_QUALITY_PRESETS.hd.videoBitsPerSecond);
assertType<MediaTrackConstraints>(getRecordingPresetConstraints('medium'));
assertType<string | null>(getSupportedMimeType());
assertType<string[]>(getSupportedRecorderMimeTypes(DEFAULT_RECORDER_MIME_TYPES));
assertType<string[]>(getSupportedAudioMimeTypes());
assertType<string[]>(getSupportedVideoMimeTypes());
assertType<boolean>(isRecorderMimeTypeSupported('video/webm'));
assertType<boolean>(isPlaybackMimeTypeSupported('video/webm'));
assertType<string>(formatDuration(1234));
assertType<CameraError>(normalizeMediaError(new Error('denied')));

const screenshotOptions: ScreenshotOptions = {
  format: 'image/png',
  height: 720,
  quality: 0.9,
  width: 1280,
};
const captureOptions: CaptureFrameOptions = {
  ...screenshotOptions,
  type: 'blob',
};
const captureType: CaptureFrameResultType = 'image-data';
const uploadOptions: CreateUploadFormDataOptions = {
  fieldName: 'file',
  fileName: 'camera.png',
  fields: {
    folder: 'avatars',
  },
};

assertType<CaptureFrameOptions>(captureOptions);
assertType<CaptureFrameResultType>(captureType);
assertType<CreateUploadFormDataOptions>(uploadOptions);
assertType<File>(blobToFile(new Blob(['x']), 'camera.txt'));
assertType<FormData>(createUploadFormData(new Blob(['x']), uploadOptions));
downloadBlob(new Blob(['x']), 'camera.txt');

function HooksConsumer() {
  const webcam = useWebcam({ audio: true, startOnMount: false });
  const recorder = useMediaRecorder({
    fileName: 'camera-recording',
    fileType: 'webm',
    maxDuration: 30_000,
    quality: 'hd',
    stream: webcam.stream,
  });
  const audioRecorder = useAudioRecorder({ fileName: 'voice-note' });
  const display = useDisplayMedia({ audio: true, video: true });
  const devices = useDevices();
  const permissions = useCameraPermissions({ audio: true });
  const playbackUrl = useObjectUrl(recorder.blob);

  assertType<UseWebcamResult>(webcam);
  assertType<UseMediaRecorderResult>(recorder);
  assertType<UseAudioRecorderResult>(audioRecorder);
  assertType<RecordingStatus>(recorder.status);
  assertType<string | null>(playbackUrl);
  assertType<MediaDeviceInfo[]>(devices.videoInputs);
  void assertType<Promise<boolean>>(permissions.requestPermission());
  void assertType<Promise<MediaStream | null>>(display.start());
  assertType<MediaRecorder | null>(recorder.start());
  void assertType<Promise<MediaRecorder | null>>(audioRecorder.start());
  void assertType<Promise<Blob | null>>(webcam.getScreenshotBlob(screenshotOptions));

  return null;
}

void assertType<ReactNode>(createElement(HooksConsumer));

declare const handle: WebcamHandle;
assertType<HTMLCanvasElement | null>(handle.getCanvas());
assertType<string | null>(handle.getScreenshot());
void assertType<Promise<Blob | null>>(handle.getScreenshotBlob());
void assertType<Promise<MediaStream | null>>(handle.switchFacingMode('environment'));
void assertType<Promise<MediaStream | null>>(handle.switchDevice('camera-1'));

declare const mediaElement: HTMLVideoElement;
assertType<HTMLCanvasElement | null>(captureFrame(mediaElement, { type: 'canvas' }));

const recorderError: MediaRecorderError = {
  name: 'NotAllowedError',
  message: 'Permission denied.',
};

assertType<MediaRecorderError>(recorderError);
