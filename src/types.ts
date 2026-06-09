import type { ReactNode } from 'react';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'stopping'
  | 'stopped'
  | 'denied'
  | 'unsupported'
  | 'error';

export type ScreenshotFormat = 'image/webp' | 'image/png' | 'image/jpeg';

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  format?: ScreenshotFormat;
  quality?: number;
  mirrored?: boolean;
  imageSmoothing?: boolean;
  forceSourceSize?: boolean;
  minWidth?: number;
  minHeight?: number;
}

export interface CameraError {
  name: string;
  message: string;
  type:
    | 'unsupported'
    | 'permission-denied'
    | 'not-found'
    | 'not-readable'
    | 'overconstrained'
    | 'security'
    | 'unknown';
  cause?: unknown;
}

export interface WebcamFallbackProps {
  status: CameraStatus;
  error: CameraError | null;
}

export type WebcamFallback = ReactNode | ((props: WebcamFallbackProps) => ReactNode);
