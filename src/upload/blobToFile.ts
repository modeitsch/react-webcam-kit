export function blobToFile(blob: Blob | File, fileName?: string) {
  if (blob instanceof File && !fileName) {
    return blob;
  }

  return new File([blob], fileName ?? 'upload.bin', {
    type: blob.type,
  });
}
