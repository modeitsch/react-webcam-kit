# Changelog

## Unreleased

### Fixed

- `useWebcam().stop()` no longer restarts the camera. The restart effect depended on `status`, so
  stopping immediately triggered a fresh `getUserMedia` call and the camera indicator stayed on.
- A denied or failed permission no longer retries in a loop. The same effect cycled
  `requesting -> denied -> requesting`; with an inline `onError` handler this produced thousands of
  `getUserMedia` calls per second and a "Maximum update depth exceeded" error.
- `start`, `stop`, `restart`, `switchDevice` and `switchFacingMode` are now referentially stable
  regardless of how callbacks are passed.
- The stream now attaches to a `<video>` that mounts _after_ it was acquired, so a preview rendered
  conditionally (only once `status === 'ready'`) is no longer permanently black.
- `useWebcam()` reports `stopped` when a track ends on its own — camera unplugged, or taken over by
  another application — instead of staying on `ready` with a dead stream.
- Device switching acquires the replacement before tearing down the old stream, so it no longer
  flashes black or fires a spurious `onStop`.
- `captureFrame()` falls back to the intrinsic video size when `clientWidth` is `0`; a hidden or
  unlaid-out video previously produced a blank 0x0 capture.
- `minScreenshotWidth`/`minScreenshotHeight` are floors again rather than exact sizes.
  `minScreenshotWidth={320}` on a 1280x720 camera used to downscale captures to 320x180.
- `useMediaRecorder`, `useDisplayMedia`, `useAudioRecorder` and `useCameraPermissions` render the
  same output on the server and during hydration, fixing hydration mismatches in Next.js.
- `downloadBlob()` no longer revokes the object URL synchronously, which could cancel the download
  in Firefox and Safari.
- A slow initial permission query can no longer overwrite a newer result from `requestPermission()`.
- Permission changes made in browser site settings are now reflected in `useWebcam`, `useDevices`
  and the permission hooks.
- `normalizeMediaError()` keeps `OverconstrainedError.constraint` and handles the non-`Error`
  rejection shape older Firefox used.
- Recording duration uses `performance.now()`, so a clock change cannot skew or reverse it.
- `videoRef` is typed `RefObject<HTMLVideoElement | null>` instead of asserting away the `null`.

### Added

- `useCameraCapabilities()` for torch, optical zoom and focus mode.
- `useBarcodeScanner()` for QR and barcode scanning on the native `BarcodeDetector`.
- `useImageCapture()` for full-resolution stills, with a preview-frame fallback.
- `useAudioLevel()` for volume meters, waveforms and spectrum data.
- `useFrameProcessor()` for per-frame work on `requestVideoFrameCallback`.
- `useCompositeStream()` for screen-plus-webcam picture-in-picture recording with mixed audio.
- `useMediaPermissions()` and `useMicrophonePermissions()` for microphone preflight.
- `createChunkUploader()` for streaming long recordings to a server as they record.
- `useWebcam().getVideoProps()` as the preferred way to wire the preview element.
- `useMediaRecorder().getChunks()` and the `publishChunks` option, which avoids re-rendering the
  consumer tree at the timeslice rate during long recordings.

### Changed

- `peerDependencies` narrowed from `>=18.0.0 || >=19.0.0` (which is just `>=18.0.0`) to
  `^18.0.0 || ^19.0.0`.
- Bundle output is now treeshaken.

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
