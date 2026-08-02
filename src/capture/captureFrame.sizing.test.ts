import { describe, expect, it, vi } from 'vitest';

import { captureFrame } from './captureFrame';
import type { CaptureFrameOptions } from '../types';

function createVideo(overrides: Partial<HTMLVideoElement> = {}) {
  return {
    videoWidth: 1280,
    videoHeight: 720,
    clientWidth: 640,
    clientHeight: 360,
    readyState: HTMLMediaElement.HAVE_ENOUGH_DATA,
    ...overrides,
  } as HTMLVideoElement;
}

function captureSize(video: HTMLVideoElement, options: CaptureFrameOptions) {
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ({
      drawImage: vi.fn(),
      imageSmoothingEnabled: true,
      restore: vi.fn(),
      save: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
    })),
    toDataURL: vi.fn(() => 'data:,'),
  } as unknown as HTMLCanvasElement;
  vi.spyOn(document, 'createElement').mockReturnValueOnce(canvas);

  captureFrame(video, options);

  return { height: canvas.height, width: canvas.width };
}

describe('captureFrame sizing', () => {
  it('falls back to the intrinsic size when the video is not laid out', () => {
    // clientWidth is 0 for a hidden/offscreen video. `??` treated that as a real value and
    // produced a 0x0 canvas, so every screenshot came back blank.
    const video = createVideo({ clientWidth: 0, clientHeight: 0 });

    expect(captureSize(video, {})).toEqual({ height: 720, width: 1280 });
  });

  it('uses the laid out size when the video is visible', () => {
    expect(captureSize(createVideo(), {})).toEqual({ height: 360, width: 640 });
  });

  it('treats minWidth as a floor rather than an exact size', () => {
    // A 320px floor must not shrink a 640px preview down to 320px.
    expect(captureSize(createVideo(), { minWidth: 320 })).toEqual({ height: 360, width: 640 });
  });

  it('raises the capture up to minWidth when the source is smaller', () => {
    const video = createVideo({ clientWidth: 200, clientHeight: 112 });

    expect(captureSize(video, { minWidth: 640 })).toEqual({ height: 360, width: 640 });
  });

  it('raises the capture up to minHeight when the source is smaller', () => {
    const video = createVideo({ clientWidth: 200, clientHeight: 112 });

    expect(captureSize(video, { minHeight: 720 })).toEqual({ height: 720, width: 1280 });
  });

  it('honours an explicit width and derives the height from the aspect ratio', () => {
    expect(captureSize(createVideo(), { width: 800 })).toEqual({ height: 450, width: 800 });
  });

  it('honours an explicit height and derives the width from the aspect ratio', () => {
    expect(captureSize(createVideo(), { height: 450 })).toEqual({ height: 450, width: 800 });
  });

  it('lets an explicit width win over minWidth', () => {
    expect(captureSize(createVideo(), { minWidth: 1000, width: 320 })).toEqual({
      height: 180,
      width: 320,
    });
  });

  it('captures the intrinsic size when forceSourceSize is set', () => {
    expect(captureSize(createVideo(), { forceSourceSize: true, minWidth: 4000 })).toEqual({
      height: 720,
      width: 1280,
    });
  });
});
