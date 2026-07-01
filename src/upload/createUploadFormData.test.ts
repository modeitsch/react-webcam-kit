import { describe, expect, it } from 'vitest';

import { createUploadFormData } from './createUploadFormData';

describe('createUploadFormData', () => {
  it('creates form data with a file field and extra fields', () => {
    const blob = new Blob(['recording'], { type: 'video/webm' });
    const formData = createUploadFormData(blob, {
      fields: {
        userId: '42',
      },
      fieldName: 'video',
      fileName: 'intro.webm',
    });

    expect(formData.get('userId')).toBe('42');
    const file = formData.get('video');
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe('intro.webm');
  });

  it('keeps the file field when an extra field uses the same name', () => {
    const blob = new Blob(['recording'], { type: 'video/webm' });
    const formData = createUploadFormData(blob, {
      fields: {
        video: 'metadata',
      },
      fieldName: 'video',
      fileName: 'intro.webm',
    });

    expect(formData.get('video')).toBeInstanceOf(File);
  });
});
