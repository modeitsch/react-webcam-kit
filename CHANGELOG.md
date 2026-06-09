# Changelog

## 0.3.0

- Added `switchFacingMode()` for front/back camera switching with ideal `facingMode` constraints.
- Added `selectedFacingMode` to `useWebcam()`.
- Added `devicesById`, `devicesByType`, and `counts` to `useDevices()`.
- Added `muteAudio()`, `unmuteAudio()`, `setAudioMuted()`, and `isAudioMuted` to
  `useMediaRecorder()`.
- Updated docs and site copy for camera switching, richer device metadata, and recording audio mute
  controls.

## 0.2.0

- Added `useObjectUrl()` for safe Blob and MediaSource preview URLs.
- Added `downloadBlob()` for recording and screenshot downloads.
- Added recorder MIME helpers for video, audio, recorder support, and playback support checks.
- Added `cancel()`, `fileName`, `fileType`, and `file` output to `useMediaRecorder()`.
- Fixed recorder session isolation so late events from old recorders cannot affect new recordings.
- Fixed active recorder reset behavior so reset stops and discards safely.
- Fixed webcam cleanup so unmount uses the latest `onStop` callback.
- Added Playwright browser smoke testing with fake media devices.
- Removed the unnecessary `react-dom` peer dependency.
- Updated recorder docs to avoid object URL leaks.

## 0.1.1

- Added `useMediaRecorder()` for recording active media streams.
- Added `getSupportedMimeType()` and default recorder MIME candidates.
- Added recorder docs for bitrate tuning, MIME selection, chunks, and Blob output.
- Added an original package logo and included it in the npm package.
- Expanded browser notes around recording, empty chunks, and MIME differences.

## 0.1.0

- Initial release with webcam preview, screenshots, device switching, typed errors, lifecycle cleanup,
  docs, tests, CI, and GitHub Pages.
