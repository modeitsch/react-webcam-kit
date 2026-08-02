import { useCallback, useEffect, useRef, useState } from 'react';

import type { UseAudioLevelOptions, UseAudioLevelResult } from '../types';

type AudioContextConstructor = new () => AudioContext;

/**
 * Inferred rather than written as `Uint8Array`: TypeScript 5.7+ parameterises typed arrays by
 * their backing buffer, and the analyser methods only accept the `ArrayBuffer` instantiation.
 */
function createByteBuffer(length: number) {
  return new Uint8Array(length);
}

type ByteBuffer = ReturnType<typeof createByteBuffer>;

function getAudioContextConstructor(): AudioContextConstructor | null {
  const scope = globalThis as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  const candidate = scope.AudioContext ?? scope.webkitAudioContext;
  return typeof candidate === 'function' ? candidate : null;
}

/**
 * Measures the loudness of an audio stream for meters and waveform displays.
 *
 * `level` is RMS amplitude in 0..1 and `peak` is the loudest sample in the current window.
 * The analyser runs on `requestAnimationFrame` but only pushes to React state at
 * `updateInterval` (default 100ms), so a meter does not re-render the tree 60 times a second.
 */
export function useAudioLevel(
  stream: MediaStream | null | undefined,
  options: UseAudioLevelOptions = {},
): UseAudioLevelResult {
  const {
    enabled = true,
    fftSize = 1024,
    smoothingTimeConstant = 0.8,
    updateInterval = 100,
  } = options;

  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const timeDataRef = useRef<ByteBuffer | null>(null);
  const frequencyDataRef = useRef<ByteBuffer | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastPublishRef = useRef(0);
  const latestRef = useRef({ level: 0, peak: 0 });

  const [{ level, peak }, setLevels] = useState({ level: 0, peak: 0 });
  const [error, setError] = useState<Error | null>(null);

  const isSupported = getAudioContextConstructor() !== null;
  const hasAudio = Boolean(stream?.getAudioTracks().length);
  // Key the audio graph on the stream's identity rather than the object reference: rebuilding
  // an AudioContext is expensive, and a caller re-wrapping the same stream each render would
  // otherwise tear it down and rebuild it on every commit.
  const streamKey = stream?.id ?? stream ?? null;
  const streamRef = useRef(stream);
  streamRef.current = stream;

  const getWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    const data = timeDataRef.current;

    if (!analyser || !data) {
      return null;
    }

    analyser.getByteTimeDomainData(data);
    return data;
  }, []);

  const getFrequencyData = useCallback(() => {
    const analyser = analyserRef.current;
    const data = frequencyDataRef.current;

    if (!analyser || !data) {
      return null;
    }

    analyser.getByteFrequencyData(data);
    return data;
  }, []);

  useEffect(() => {
    const Constructor = getAudioContextConstructor();
    const activeStream = streamRef.current;

    if (!enabled || !activeStream || !hasAudio || !Constructor) {
      setLevels({ level: 0, peak: 0 });
      return undefined;
    }

    let context: AudioContext;

    try {
      context = new Constructor();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError : new Error('Failed to create AudioContext.'),
      );
      return undefined;
    }

    const analyser = context.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothingTimeConstant;

    const source = context.createMediaStreamSource(activeStream);
    source.connect(analyser);

    const timeData = createByteBuffer(analyser.fftSize);
    const frequencyData = createByteBuffer(analyser.frequencyBinCount);

    contextRef.current = context;
    analyserRef.current = analyser;
    sourceRef.current = source;
    timeDataRef.current = timeData;
    frequencyDataRef.current = frequencyData;
    setError(null);

    // Browsers start an AudioContext suspended until a user gesture. Resume is best-effort:
    // a rejection just means the meter stays at zero until the user interacts.
    void context.resume().catch(() => undefined);

    let cancelled = false;

    const measure = () => {
      if (cancelled) {
        return;
      }

      analyser.getByteTimeDomainData(timeData);

      let sumOfSquares = 0;
      let maxDeviation = 0;

      for (const sample of timeData) {
        // Byte time-domain data is centred on 128.
        const deviation = (sample - 128) / 128;
        sumOfSquares += deviation * deviation;
        maxDeviation = Math.max(maxDeviation, Math.abs(deviation));
      }

      const nextLevel = Math.sqrt(sumOfSquares / timeData.length);
      latestRef.current = { level: nextLevel, peak: maxDeviation };

      const timestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();

      if (timestamp - lastPublishRef.current >= updateInterval) {
        lastPublishRef.current = timestamp;
        setLevels({ level: nextLevel, peak: maxDeviation });
      }

      rafRef.current = requestAnimationFrame(measure);
    };

    measure();

    return () => {
      cancelled = true;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      source.disconnect();
      analyserRef.current = null;
      sourceRef.current = null;
      timeDataRef.current = null;
      frequencyDataRef.current = null;
      contextRef.current = null;
      void context.close().catch(() => undefined);
    };
  }, [enabled, fftSize, hasAudio, smoothingTimeConstant, streamKey, updateInterval]);

  return {
    analyser: analyserRef.current,
    error,
    getFrequencyData,
    getLevel: useCallback(() => latestRef.current.level, []),
    getWaveform,
    isSupported,
    level,
    peak,
  };
}
