import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadBlob } from './downloadBlob';

describe('downloadBlob', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('downloads a blob with a temporary object URL and anchor', async () => {
    const blob = new Blob(['recording'], { type: 'video/webm' });
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:download');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(click);

    downloadBlob(blob, 'recording.webm');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a')).toBeNull();

    // The URL must outlive the click: Firefox and Safari cancel the download if it is
    // revoked before the blob has been read.
    expect(revokeObjectURL).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:download');
  });

  it('uses the file name when a File is passed without a filename', () => {
    const file = new File(['recording'], 'custom.webm', { type: 'video/webm' });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:file');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    downloadBlob(file);

    expect(document.querySelector('a')).toBeNull();
  });
});
