import type { CreateUploadFormDataOptions } from '../types';
import { blobToFile } from './blobToFile';

export function createUploadFormData(
  blob: Blob | File,
  { fields = {}, fieldName = 'file', fileName }: CreateUploadFormDataOptions = {},
) {
  const formData = new FormData();
  const file = blobToFile(blob, fileName);

  Object.entries(fields).forEach(([name, value]) => {
    formData.set(name, value);
  });

  formData.set(fieldName, file);

  return formData;
}
