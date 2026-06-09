import { describe, expect, it, vi } from 'vitest';

import { captureFrame } from './captureFrame';

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

describe('captureFrame', () => {
  it('returns null when the video is not ready', () => {
    const video = createVideo({ readyState: HTMLMediaElement.HAVE_NOTHING });

    expect(captureFrame(video)).toBeNull();
  });

  it('captures a data URL using requested dimensions and format', () => {
    const drawImage = vi.fn();
    const toDataURL = vi.fn(() => 'data:image/jpeg;base64,abc');
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        drawImage,
        imageSmoothingEnabled: true,
        restore: vi.fn(),
        save: vi.fn(),
        scale: vi.fn(),
        translate: vi.fn(),
      })),
      toDataURL,
    } as unknown as HTMLCanvasElement;
    vi.spyOn(document, 'createElement').mockReturnValueOnce(canvas);

    const result = captureFrame(createVideo(), {
      height: 480,
      format: 'image/jpeg',
      quality: 0.8,
      type: 'data-url',
      width: 640,
    });

    expect(result).toBe('data:image/jpeg;base64,abc');
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(480);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 640, 480);
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);
  });

  it('captures a Blob with canvas.toBlob', async () => {
    const blob = new Blob(['abc'], { type: 'image/png' });
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
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(blob);
      }),
    } as unknown as HTMLCanvasElement;
    vi.spyOn(document, 'createElement').mockReturnValueOnce(canvas);

    await expect(captureFrame(createVideo(), { format: 'image/png', type: 'blob' })).resolves.toBe(
      blob,
    );
  });
});
