# Changelog

## 0.7.1

- Fixed package export metadata so CommonJS consumers resolve `dist/index.d.cts` instead of the ESM
  declaration file.
- Added `publint` and Are The Types Wrong checks to the release verification gate.
- Added consumer TypeScript tests that import the package through its public export map.
- Added React 18 and React 19 compatibility checks to CI.
- Hardened the npm publish workflow for trusted publishing with provenance.
- Added a bundle-size verification gate for the published ESM and CommonJS entries.
- Added Vite, Next.js App Router, and React Router starter examples.
- Added a release guide for repeatable npm publishing.

## 0.7.0

- Added `useAudioRecorder()` for microphone-only recording with built-in stream lifecycle.
- Added typed audio recorder options and result types.
- Added docs and a crawlable React audio recorder guide.

## 0.6.0

- Added `useDisplayMedia()` for browser screen, window, and tab capture.
- Added typed display media options and result types.
- Added docs and a crawlable React screen recorder guide for pairing display capture with
  `useMediaRecorder()`.

## 0.5.0

- Added recorder quality presets with `quality`, `RECORDING_QUALITY_PRESETS`, and
  `getRecordingPresetConstraints()`.
- Added `blobToFile()` and `createUploadFormData()` helpers for upload-ready screenshot and
  recording flows.
- Added docs for audio-only recording, recording quality choices, upload workflows, and QR/barcode
  scanner integrations.
- Added a crawlable React QR barcode scanner guide to the GitHub Pages site.

## 0.4.0

- Added `useCameraPermissions()` for client-side permission probes and unsupported-browser state.
- Added recorder `duration`, `maxDuration`, `durationUpdateInterval`, `onMaxDuration`, and
  `recordingTimeLimitReached`.
- Added `formatDuration()` for recording timers.
- Expanded the live docs demo with recording, max-duration, playback, and download controls.

## 0.3.3

- Added crawlable GitHub Pages landing pages for React webcam capture, camera recording,
  front/back camera switching, avatar capture, and getUserMedia hooks.
- Added SEO metadata, canonical links, Open Graph tags, Twitter metadata, and JSON-LD to the docs
  site.
- Expanded the sitemap with use-case pages and refreshed README/package discovery wording.

## 0.3.2

- Added `llms.txt` and `llms-full.txt` package context files for AI-assisted discovery.
- Added an AI usage guide with API selection notes, recipes, and browser rules for coding
  assistants.
- Exposed LLM context, `robots.txt`, and `sitemap.xml` from the GitHub Pages site.
- Added AI-facing docs to the npm package contents.

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
