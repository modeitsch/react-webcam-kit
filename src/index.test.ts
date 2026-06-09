import { describe, expect, it } from 'vitest';

import type { CameraStatus, ScreenshotOptions } from './index';

describe('public types', () => {
  it('exposes camera status and screenshot option types', () => {
    const status: CameraStatus = 'idle';
    const options: ScreenshotOptions = {
      format: 'image/jpeg',
      quality: 0.92,
    };

    expect(status).toBe('idle');
    expect(options.format).toBe('image/jpeg');
  });
});
