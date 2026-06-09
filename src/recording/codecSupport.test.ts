import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_AUDIO_RECORDER_MIME_TYPES,
  DEFAULT_VIDEO_RECORDER_MIME_TYPES,
  getSupportedAudioMimeTypes,
  getSupportedRecorderMimeTypes,
  getSupportedVideoMimeTypes,
  isPlaybackMimeTypeSupported,
  isRecorderMimeTypeSupported,
} from './codecSupport';

const OriginalMediaRecorder = globalThis.MediaRecorder;

const MockMediaRecorder = {
  isTypeSupported: vi.fn((mimeType: string) => mimeType.includes('webm')),
};

describe('codecSupport', () => {
  afterEach(() => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: OriginalMediaRecorder,
    });
    vi.restoreAllMocks();
  });

  it('returns recorder-supported MIME candidates', () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });

    expect(getSupportedRecorderMimeTypes(['video/mp4', 'video/webm'])).toEqual(['video/webm']);
    expect(getSupportedVideoMimeTypes()).toEqual(
      DEFAULT_VIDEO_RECORDER_MIME_TYPES.filter((candidate) => candidate.includes('webm')),
    );
    expect(getSupportedAudioMimeTypes()).toEqual(
      DEFAULT_AUDIO_RECORDER_MIME_TYPES.filter((candidate) => candidate.includes('webm')),
    );
  });

  it('checks a single recorder MIME type', () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    });

    expect(isRecorderMimeTypeSupported('video/webm')).toBe(true);
    expect(isRecorderMimeTypeSupported('video/mp4')).toBe(false);
  });

  it('returns false for recorder MIME checks when MediaRecorder is unavailable', () => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: undefined,
    });

    expect(isRecorderMimeTypeSupported('video/webm')).toBe(false);
    expect(getSupportedRecorderMimeTypes(['video/webm'])).toEqual([]);
  });

  it('checks browser playback support with a temporary media element', () => {
    const canPlayType = vi.fn(() => 'probably');
    vi.spyOn(document, 'createElement').mockReturnValue({
      canPlayType,
    } as unknown as HTMLVideoElement);

    expect(isPlaybackMimeTypeSupported('video/webm')).toBe(true);
    expect(canPlayType).toHaveBeenCalledWith('video/webm');
  });
});
