import type { CameraError } from '../types';

const ERROR_TYPE_BY_NAME: Record<string, CameraError['type']> = {
  AbortError: 'not-readable',
  DevicesNotFoundError: 'not-found',
  NotAllowedError: 'permission-denied',
  NotFoundError: 'not-found',
  NotReadableError: 'not-readable',
  OverconstrainedError: 'overconstrained',
  PermissionDeniedError: 'permission-denied',
  SecurityError: 'security',
};

export function normalizeMediaError(error: unknown): CameraError {
  if (error instanceof DOMException || error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message || 'Media device error.',
      type: ERROR_TYPE_BY_NAME[error.name] ?? 'unknown',
      cause: error,
    };
  }

  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
      type: 'unknown',
      cause: error,
    };
  }

  return {
    name: 'Error',
    message: 'Media device error.',
    type: 'unknown',
    cause: error,
  };
}
