export function downloadBlob(blob: Blob | File, fileName?: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName ?? (blob instanceof File ? blob.name : 'recording.webm');
  anchor.style.display = 'none';

  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  // Revoking synchronously can cancel the download before the browser has read the blob
  // (Firefox and Safari in particular). Defer to the next task instead.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
