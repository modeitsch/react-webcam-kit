import { describe, expect, it } from 'vitest';

import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
  it('formats milliseconds as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(9_999)).toBe('0:09');
    expect(formatDuration(65_000)).toBe('1:05');
  });
});
