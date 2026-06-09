import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useObjectUrl } from './useObjectUrl';

describe('useObjectUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an object URL for a blob and revokes it on unmount', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const blob = new Blob(['video'], { type: 'video/webm' });

    const { result, unmount } = renderHook(() => useObjectUrl(blob));

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(result.current).toBe('blob:test');

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });

  it('revokes the previous URL when the blob changes', () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:first')
      .mockReturnValueOnce('blob:second');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const { rerender, result } = renderHook(
      ({ blob }: { blob: Blob | null }) => useObjectUrl(blob),
      {
        initialProps: { blob: new Blob(['first']) },
      },
    );

    expect(result.current).toBe('blob:first');

    rerender({ blob: new Blob(['second']) });

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first');
    expect(result.current).toBe('blob:second');
  });

  it('returns null and does not create a URL when the source is null', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL');

    const { result } = renderHook(() => useObjectUrl(null));

    expect(result.current).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
