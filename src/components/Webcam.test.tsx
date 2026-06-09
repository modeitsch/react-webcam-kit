import { act, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Webcam, type WebcamHandle } from './Webcam';

function createTrack() {
  return {
    stop: vi.fn(),
  } as unknown as MediaStreamTrack;
}

function createStream() {
  const track = createTrack();
  return {
    getAudioTracks: () => [],
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
}

const originalMediaDevices = navigator.mediaDevices;

describe('Webcam', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    vi.restoreAllMocks();
  });

  it('renders a video with mobile-safe defaults and starts on mount', async () => {
    const stream = createStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia,
      },
    });

    render(<Webcam aria-label="Camera preview" audio={false} />);

    const video = screen.getByLabelText('Camera preview');
    expect(video).toHaveProperty('autoplay', true);
    expect(video).toHaveProperty('muted', true);
    expect(video).toHaveProperty('playsInline', true);
    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledWith({ video: true });
    });
  });

  it('exposes compatibility ref methods', async () => {
    const stream = createStream();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    });
    const ref = createRef<WebcamHandle>();

    render(<Webcam ref={ref} startOnMount={false} />);

    await act(async () => {
      await ref.current?.start();
    });
    expect(ref.current?.stream).toBe(stream);
    expect(ref.current?.video).toBeInstanceOf(HTMLVideoElement);
    expect(typeof ref.current?.getScreenshot).toBe('function');
    expect(typeof ref.current?.getScreenshotBlob).toBe('function');
    expect(typeof ref.current?.applyVideoConstraints).toBe('function');
  });

  it('supports the render-prop getScreenshot compatibility API', async () => {
    render(
      <Webcam startOnMount={false}>
        {({ getScreenshot }) => (
          <button type="button" onClick={() => getScreenshot()}>
            Capture
          </button>
        )}
      </Webcam>,
    );

    expect(screen.getByRole('button', { name: 'Capture' })).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
    });
  });
});
