import { useCallback, useEffect, useRef, useState } from 'react';

import type { CompositeLayer, UseCompositeStreamOptions, UseCompositeStreamResult } from '../types';

type AudioContextConstructor = new () => AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  const scope = globalThis as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  const candidate = scope.AudioContext ?? scope.webkitAudioContext;
  return typeof candidate === 'function' ? candidate : null;
}

function isSupported() {
  return (
    typeof document !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function'
  );
}

function createVideoElement(stream: MediaStream) {
  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  return video;
}

function resolveRect(
  layer: CompositeLayer,
  canvasWidth: number,
  canvasHeight: number,
  video: HTMLVideoElement,
) {
  const width = layer.width ?? canvasWidth;
  const height = layer.height ?? canvasHeight;
  const x = layer.x ?? 0;
  const y = layer.y ?? 0;

  if (layer.fit === 'cover' && video.videoWidth > 0 && video.videoHeight > 0) {
    // Scale to fill the target box, centring the overflow.
    const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
    const drawWidth = video.videoWidth * scale;
    const drawHeight = video.videoHeight * scale;
    return {
      height: drawHeight,
      width: drawWidth,
      x: x + (width - drawWidth) / 2,
      y: y + (height - drawHeight) / 2,
    };
  }

  if (layer.fit === 'contain' && video.videoWidth > 0 && video.videoHeight > 0) {
    const scale = Math.min(width / video.videoWidth, height / video.videoHeight);
    const drawWidth = video.videoWidth * scale;
    const drawHeight = video.videoHeight * scale;
    return {
      height: drawHeight,
      width: drawWidth,
      x: x + (width - drawWidth) / 2,
      y: y + (height - drawHeight) / 2,
    };
  }

  return { height, width, x, y };
}

/**
 * Composites several media streams into one recordable stream.
 *
 * Video layers are drawn onto a canvas in order (last one on top) and captured with
 * `canvas.captureStream()`; audio from every layer with `audio: true` is mixed through a
 * single `AudioContext` destination. This is what a Loom-style recorder needs: a screen share
 * with a webcam bubble in the corner, the mic and the tab audio, all in one `MediaRecorder`.
 *
 * Pass the result straight to `useMediaRecorder({ stream })`.
 */
export function useCompositeStream(options: UseCompositeStreamOptions): UseCompositeStreamResult {
  const { frameRate = 30, height = 720, layers, width = 1280 } = options;

  // Layers and background are read from the ref inside `start`, so the returned functions stay
  // referentially stable even when the caller passes an inline layer array.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const supported = isSupported();
  // Re-create the pipeline when the set of source streams changes, not on every render.
  const layersKey = layers
    .map((layer) => `${layer.stream?.id ?? 'none'}:${String(layer.audio)}`)
    .join('|');

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;
    setStream(null);

    const context = audioContextRef.current;
    audioContextRef.current = null;
    void context?.close().catch(() => undefined);

    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      const unsupported = new Error('canvas.captureStream() is not supported in this environment.');
      setError(unsupported);
      return null;
    }

    const canvas = canvasRef.current ?? document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      const noContext = new Error('Failed to acquire a 2D canvas context.');
      setError(noContext);
      return null;
    }

    const activeLayers = optionsRef.current.layers
      .filter((layer): layer is CompositeLayer & { stream: MediaStream } => Boolean(layer.stream))
      .map((layer) => ({ layer, video: createVideoElement(layer.stream) }));

    activeLayers.forEach(({ video }) => {
      // play() only returns a promise in modern browsers; older ones (and jsdom) return void.
      const playback = video.play() as Promise<void> | undefined;
      void playback?.catch(() => undefined);
    });

    const draw = () => {
      context.fillStyle = optionsRef.current.backgroundColor ?? '#000000';
      context.fillRect(0, 0, width, height);

      activeLayers.forEach(({ layer, video }) => {
        if (video.readyState < 2 || video.videoWidth === 0) {
          return;
        }

        const rect = resolveRect(layer, width, height, video);
        context.save();

        if (layer.opacity !== undefined) {
          context.globalAlpha = layer.opacity;
        }

        if (layer.mirrored) {
          context.translate(rect.x + rect.width, rect.y);
          context.scale(-1, 1);
          context.drawImage(video, 0, 0, rect.width, rect.height);
        } else {
          context.drawImage(video, rect.x, rect.y, rect.width, rect.height);
        }

        context.restore();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    const compositeStream = canvas.captureStream(frameRate);

    // Mix the audio of every layer that opted in.
    const AudioContextConstructor = getAudioContextConstructor();
    const audioLayers = activeLayers.filter(
      ({ layer }) => layer.audio && layer.stream.getAudioTracks().length > 0,
    );

    if (AudioContextConstructor && audioLayers.length > 0) {
      try {
        const audioContext = new AudioContextConstructor();
        const destination = audioContext.createMediaStreamDestination();

        audioLayers.forEach(({ layer }) => {
          const source = audioContext.createMediaStreamSource(layer.stream);

          if (layer.volume !== undefined) {
            const gain = audioContext.createGain();
            gain.gain.value = layer.volume;
            source.connect(gain);
            gain.connect(destination);
            return;
          }

          source.connect(destination);
        });

        destination.stream.getAudioTracks().forEach((track) => {
          compositeStream.addTrack(track);
        });

        audioContextRef.current = audioContext;
        void audioContext.resume().catch(() => undefined);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError : new Error('Failed to mix layer audio.'),
        );
      }
    }

    streamRef.current = compositeStream;
    setStream(compositeStream);
    setIsRunning(true);
    setError(null);
    return compositeStream;
  }, [frameRate, height, supported, width]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [layersKey, stop]);

  return {
    canvasRef,
    error,
    isRunning,
    isSupported: supported,
    start,
    stop,
    stream,
  };
}
