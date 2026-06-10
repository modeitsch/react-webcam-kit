# Changelog

## 0.3.1

- Added README badges, expanded npm keywords, and updated repository metadata topics.
- Added contribution docs, issue templates, a pull request template, and a code of conduct.
- Added a GitHub Actions npm publish workflow for future provenance releases.
- Added migration, comparison, compatibility, and search-focused camera guides.
- Added focused example guides for avatar capture, video recording, mobile back camera, and video
  upload.
- Added a live camera demo to the GitHub Pages site.

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
