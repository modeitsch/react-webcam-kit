# Advanced Media Kit Example

A copy-ready Vite example for the advanced `react-webcam-kit` APIs:

- Camera preview with `useWebcam()`
- QR and barcode scanning with `useBarcodeScanner()`
- Torch and zoom controls with `useCameraCapabilities()`
- Screen plus webcam composition with `useCompositeStream()`
- Camera recording chunks wired to `createChunkUploader()`
- Composite recording with `useMediaRecorder()`

```bash
cd examples/advanced-media-kit
npm install
npm run dev
```

The chunk uploader uses a fake `fetchImpl` that resolves locally, so the example runs without a
server. Replace it with your real upload endpoint when you copy the pattern into an app.
