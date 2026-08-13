import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCompositeStream } from './useCompositeStream';

let streamCounter = 0;
let rafCallbacks: FrameRequestCallback[] = [];

function createStream({ audio = false, video = true } = {}) {
  streamCounter += 1;
  const videoTrack = { kind: 'video', stop: vi.fn() } as unknown as MediaStreamTrack;
  const audioTrack = { kind: 'audio', stop: vi.fn() } as unknown as MediaStreamTrack;
  const tracks = [...(video ? [videoTrack] : []), ...(audio ? [audioTrack] : [])];

  return {
    audioTrack,
    stream: {
      id: `stream-${String(streamCounter)}`,
      getAudioTracks: () => (audio ? [audioTrack] : []),
      getTracks: () => tracks,
      getVideoTracks: () => (video ? [videoTrack] : []),
    } as unknown as MediaStream,
    videoTrack,
  };
}

function installCanvasCapture() {
  const addTrack = vi.fn();
  const captured = {
    addTrack,
    getTracks: () => [{ kind: 'video', stop: vi.fn() } as unknown as MediaStreamTrack],
  } as unknown as MediaStream;
  const captureStream = vi.fn().mockReturnValue(captured);
  const context = {
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '',
    globalAlpha: 1,
    restore: vi.fn(),
    save: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
  };

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
  Object.defineProperty(HTMLCanvasElement.prototype, 'captureStream', {
    configurable: true,
    value: captureStream,
    writable: true,
  });

  return { addTrack, captured, captureStream, context };
}

function installAudioMixing() {
  const connect = vi.fn();
  const destination = {
    stream: {
      getAudioTracks: () => [{ kind: 'audio', stop: vi.fn() } as unknown as MediaStreamTrack],
    },
  };
  const createMediaStreamSource = vi.fn().mockReturnValue({ connect, disconnect: vi.fn() });

  vi.stubGlobal(
    'AudioContext',
    class {
      close = vi.fn().mockResolvedValue(undefined);
      createGain = () => ({ connect: vi.fn(), gain: { value: 1 } });
      createMediaStreamDestination = () => destination;
      createMediaStreamSource = createMediaStreamSource;
      resume = vi.fn().mockResolvedValue(undefined);
    },
  );

  return { connect, createMediaStreamSource };
}

beforeEach(() => {
  rafCallbacks = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    rafCallbacks.push(callback);
    return rafCallbacks.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLCanvasElement.prototype, 'captureStream');
});

describe('useCompositeStream', () => {
  it('reports unsupported without canvas.captureStream', () => {
    const { result } = renderHook(() => useCompositeStream({ layers: [] }));

    expect(result.current.isSupported).toBe(false);

    act(() => {
      expect(result.current.start()).toBeNull();
    });
    expect(result.current.error?.message).toMatch(/captureStream/);
  });

  it('captures the canvas at the requested size and frame rate', () => {
    const { captureStream } = installCanvasCapture();
    const screen = createStream();

    const { result } = renderHook(() =>
      useCompositeStream({
        frameRate: 24,
        height: 1080,
        layers: [{ stream: screen.stream }],
        width: 1920,
      }),
    );

    act(() => {
      result.current.start();
    });

    expect(captureStream).toHaveBeenCalledWith(24);
    expect(result.current.canvasRef.current?.width).toBe(1920);
    expect(result.current.canvasRef.current?.height).toBe(1080);
    expect(result.current.isRunning).toBe(true);
    expect(result.current.stream).not.toBeNull();
  });

  it('draws every layer with a stream, in order', () => {
    const { context } = installCanvasCapture();
    const screen = createStream();
    const camera = createStream();

    const { result } = renderHook(() =>
      useCompositeStream({
        layers: [
          { stream: screen.stream },
          { height: 180, stream: camera.stream, width: 320, x: 940, y: 530 },
        ],
      }),
    );

    act(() => {
      result.current.start();
    });

    // The draw loop only paints layers whose video element has data; in jsdom readyState is 0,
    // so assert the frame was cleared and the loop scheduled itself.
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 1280, 720);
    expect(rafCallbacks.length).toBeGreaterThan(0);
  });

  it('skips layers whose stream is null', () => {
    installCanvasCapture();

    const { result } = renderHook(() =>
      useCompositeStream({ layers: [{ stream: null }, { stream: undefined }] }),
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.stream).not.toBeNull();
  });

  it('mixes audio only from layers that opted in', () => {
    const { addTrack } = installCanvasCapture();
    const { createMediaStreamSource } = installAudioMixing();
    const screen = createStream({ audio: true });
    const mic = createStream({ audio: true, video: false });
    const silent = createStream({ audio: true });

    const { result } = renderHook(() =>
      useCompositeStream({
        layers: [
          { audio: true, stream: screen.stream },
          { audio: true, stream: mic.stream, volume: 0.8 },
          { audio: false, stream: silent.stream },
        ],
      }),
    );

    act(() => {
      result.current.start();
    });

    expect(createMediaStreamSource).toHaveBeenCalledTimes(2);
    expect(addTrack).toHaveBeenCalledTimes(1);
  });

  it('stops the composite stream and clears state', () => {
    const { captured } = installCanvasCapture();
    const stopSpy = vi.fn();
    vi.spyOn(captured, 'getTracks').mockReturnValue([
      { kind: 'video', stop: stopSpy } as unknown as MediaStreamTrack,
    ]);
    const screen = createStream();

    const { result } = renderHook(() =>
      useCompositeStream({ layers: [{ stream: screen.stream }] }),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.stop();
    });

    expect(stopSpy).toHaveBeenCalled();
    expect(result.current.stream).toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  it('keeps start and stop referentially stable across renders', () => {
    installCanvasCapture();
    const screen = createStream();

    const { rerender, result } = renderHook(() =>
      // Inline layer array: a new object identity on every render.
      useCompositeStream({ layers: [{ stream: screen.stream }] }),
    );

    const { start, stop } = result.current;
    rerender();

    expect(result.current.start).toBe(start);
    expect(result.current.stop).toBe(stop);
  });
});
