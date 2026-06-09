import { describe, expect, it } from 'vitest';

import { normalizeMediaError } from './normalizeMediaError';

describe('normalizeMediaError', () => {
  it('maps permission errors to a stable permission-denied type', () => {
    const error = new DOMException('Permission denied', 'NotAllowedError');

    expect(normalizeMediaError(error)).toMatchObject({
      name: 'NotAllowedError',
      message: 'Permission denied',
      type: 'permission-denied',
      cause: error,
    });
  });

  it('maps missing camera errors to not-found', () => {
    expect(normalizeMediaError(new DOMException('No camera', 'NotFoundError'))).toMatchObject({
      type: 'not-found',
    });
  });

  it('preserves unknown thrown values with a useful message', () => {
    expect(normalizeMediaError('camera failed')).toEqual({
      name: 'Error',
      message: 'camera failed',
      type: 'unknown',
      cause: 'camera failed',
    });
  });
});
