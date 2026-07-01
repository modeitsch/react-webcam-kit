import { describe, expect, it } from 'vitest';

import type {
  CameraStatus,
  RecordingStatus,
  ScreenshotOptions,
  UseAudioRecorderOptions,
  UseDisplayMediaOptions,
} from './index';

describe('public types', () => {
  it('exposes camera, recorder, and screenshot option types', () => {
    const status: CameraStatus = 'idle';
    const recordingStatus: RecordingStatus = 'recording';
    const options: ScreenshotOptions = {
      format: 'image/jpeg',
      quality: 0.92,
    };
    const displayOptions: UseDisplayMediaOptions = {
      audio: true,
      video: true,
    };
    const audioOptions: UseAudioRecorderOptions = {
      audioConstraints: {
        echoCancellation: true,
      },
    };

    expect(status).toBe('idle');
    expect(recordingStatus).toBe('recording');
    expect(options.format).toBe('image/jpeg');
    expect(displayOptions.video).toBe(true);
    expect(audioOptions.audioConstraints).toEqual({
      echoCancellation: true,
    });
  });
});
