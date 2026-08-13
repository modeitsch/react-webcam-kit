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

function readConstraint(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('constraint' in error)) {
    return undefined;
  }

  const { constraint } = error as { constraint?: unknown };
  return typeof constraint === 'string' && constraint.length > 0 ? constraint : undefined;
}

export function normalizeMediaError(error: unknown): CameraError {
  if (error instanceof DOMException || error instanceof Error) {
    const constraint = readConstraint(error);

    return {
      name: error.name || 'Error',
      message: error.message || 'Media device error.',
      type: ERROR_TYPE_BY_NAME[error.name] ?? 'unknown',
      ...(constraint ? { constraint } : {}),
      cause: error,
    };
  }

  // Firefox historically rejected with a plain `OverconstrainedError` object that is not an
  // `Error` instance, so fall back to duck-typing before giving up on the name.
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const { name, message } = error as { name?: unknown; message?: unknown };

    if (typeof name === 'string' && name.length > 0) {
      const constraint = readConstraint(error);

      return {
        name,
        message: typeof message === 'string' && message ? message : 'Media device error.',
        type: ERROR_TYPE_BY_NAME[name] ?? 'unknown',
        ...(constraint ? { constraint } : {}),
        cause: error,
      };
    }
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
