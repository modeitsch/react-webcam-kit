export const DEFAULT_VIDEO_RECORDER_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=h264,opus',
  'video/webm',
  'video/mp4',
];

export const DEFAULT_AUDIO_RECORDER_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

export function isRecorderMimeTypeSupported(mimeType: string) {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof MediaRecorder.isTypeSupported === 'function' &&
    MediaRecorder.isTypeSupported(mimeType)
  );
}

export function getSupportedRecorderMimeTypes(candidates: readonly string[]) {
  return candidates.filter(isRecorderMimeTypeSupported);
}

export function getSupportedVideoMimeTypes(candidates = DEFAULT_VIDEO_RECORDER_MIME_TYPES) {
  return getSupportedRecorderMimeTypes(candidates);
}

export function getSupportedAudioMimeTypes(candidates = DEFAULT_AUDIO_RECORDER_MIME_TYPES) {
  return getSupportedRecorderMimeTypes(candidates);
}

export function isPlaybackMimeTypeSupported(mimeType: string, kind: 'audio' | 'video' = 'video') {
  if (typeof document === 'undefined') {
    return false;
  }

  const element = document.createElement(kind);
  return element.canPlayType(mimeType).length > 0;
}
