import { useEffect, useState } from 'react';

export function useObjectUrl(source: Blob | MediaSource | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!source) {
      setUrl(null);
      return undefined;
    }

    const nextUrl = URL.createObjectURL(source);
    setUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [source]);

  return url;
}
