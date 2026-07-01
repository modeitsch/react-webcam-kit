import { describe, expect, it } from 'vitest';

import { blobToFile } from './blobToFile';

describe('blobToFile', () => {
  it('returns the original file when a file is provided without an override name', () => {
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

    expect(blobToFile(file)).toBe(file);
  });

  it('converts a blob to a file with the requested name and type', () => {
    const blob = new Blob(['avatar'], { type: 'image/jpeg' });
    const file = blobToFile(blob, 'avatar.jpg');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('avatar.jpg');
    expect(file.type).toBe('image/jpeg');
  });
});
