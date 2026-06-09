# React Webcam Library Design

Date: 2026-06-09

## Goal

Build a modern npm package for React webcam capture that is easy for existing
`react-webcam` users to adopt while offering a cleaner hook-based foundation,
better TypeScript support, stronger media lifecycle handling, and practical
fixes for common mobile browser pain points.

The first version should prioritize trust, migration, and reliability over a
large feature surface. It should feel familiar to developers who already know
`react-webcam`, but the internals should be structured so the package can grow
without becoming a single component that owns every concern.

## Product Positioning

The package will be a React webcam toolkit with a migration-friendly component
and modern hooks.

The primary audience is React developers who need camera preview, still image
capture, camera switching, permission-aware UI, and predictable cleanup in web
apps. The package should be useful for profile photos, document capture, KYC
flows, simple recording flows, QR or frame-analysis integrations, and internal
tools that need a camera input.

The package should not position itself as a native-camera replacement. Browser
camera APIs have device and browser limits, especially around full-resolution
photo capture, iOS recording formats, Firefox canvas protections, and Android
camera constraints. The library should make those limits explicit and provide
safe defaults and escape hatches.

## Recommended Approach

Use a mostly drop-in compatible `<Webcam />` component backed by a modern
`useWebcam()` hook.

This gives existing `react-webcam` users a low-friction migration path while
also giving new users a hook-first API. The component should expose familiar
props and imperative ref methods where they still make sense. The hook should
own the stream lifecycle, status, errors, capture helpers, and device switching.

Alternative approaches considered:

- Hooks-only package: cleaner for new apps, but weaker for adoption because
  existing users must rewrite their UI.
- Full camera toolkit in v1: attractive, but too broad. Recording, overlays,
  and frame processing should be built on top of a stable stream and capture
  core rather than bundled into the first release.

## Public API

### Package Exports

- `Webcam`: React component with a familiar migration-friendly API.
- `useWebcam`: hook that manages camera stream lifecycle and exposes actions.
- `useDevices`: hook for camera and microphone enumeration.
- `captureFrame`: utility for drawing a video frame to a canvas and returning a
  data URL, Blob, canvas, or ImageData.
- `normalizeMediaError`: utility that converts browser errors into stable
  library error objects.
- TypeScript types for props, hook options, state, errors, devices, capture
  options, and imperative handles.

### Component API

The component should support familiar props:

- `audio`
- `audioConstraints`
- `videoConstraints`
- `mirrored`
- `screenshotFormat`
- `screenshotQuality`
- `forceScreenshotSourceSize`
- `minScreenshotWidth`
- `minScreenshotHeight`
- `imageSmoothing`
- `disablePictureInPicture`
- `onUserMedia`
- `onUserMediaError`

It should add clearer modern props:

- `startOnMount`: defaults to `true`; set to `false` for user-gesture start.
- `enabled`: starts or stops the camera declaratively.
- `muted`: controls the preview video element separately from `audio`.
- `onStart`: called when a stream starts.
- `onStop`: called after tracks are stopped.
- `onError`: called with a normalized media error.
- `onDevicesChanged`: called when available devices change.
- `onPermissionChange`: called when permission state changes if supported.
- `fallback`: optional render node while unsupported, denied, or errored.

The component ref should expose:

- `video`: the underlying `HTMLVideoElement | null`.
- `stream`: the current `MediaStream | null`.
- `start()`: request media.
- `stop()`: stop all active tracks.
- `switchDevice(deviceId, options?)`: switch camera using an exact device ID.
- `getScreenshot(options?)`: return `string | null`.
- `getScreenshotBlob(options?)`: return `Promise<Blob | null>`.
- `getCanvas(options?)`: return `HTMLCanvasElement | null`.

### Hook API

`useWebcam(options)` should expose:

- `videoRef`
- `stream`
- `status`: `idle`, `requesting`, `ready`, `stopping`, `stopped`, `denied`,
  `unsupported`, or `error`
- `error`
- `devices`
- `selectedDeviceId`
- `start`
- `stop`
- `restart`
- `switchDevice`
- `getScreenshot`
- `getScreenshotBlob`
- `getCanvas`
- `refreshDevices`
- `permission`

The hook should be safe under React Strict Mode, avoid duplicate active streams,
and ignore stale async media requests.

## Media Lifecycle

The library must treat stream cleanup as a first-class concern.

Tracks should be stopped when:

- The component unmounts.
- `enabled` changes from `true` to `false`.
- `audioConstraints` or `videoConstraints` change and a new stream is needed.
- `switchDevice` starts a replacement stream.
- `stop()` is called manually.
- A media request resolves after a newer request already superseded it.

Cleanup should stop both audio and video tracks and detach the stream from the
video element. The library should call `onStop` after cleanup.

The hook should track request IDs or abort-like state so stale `getUserMedia`
results cannot overwrite a newer stream.

## Capture Behavior

Still image capture should use canvas because it is the most broadly supported
browser path.

`getScreenshot()` returns a data URL using `screenshotFormat` and
`screenshotQuality`.

`getScreenshotBlob()` returns a Promise that resolves with `Blob | null` using
`canvas.toBlob`. This directly addresses the common need to upload screenshots
without converting base64 data URLs back into Blobs.

Capture should return `null` when:

- No stream is active.
- The video element is missing.
- The video is not ready enough to provide dimensions.
- Canvas access is blocked by browser privacy protections.

The implementation should support:

- Source-size capture.
- Min width and height.
- Explicit output dimensions.
- Mirrored preview with optional mirrored or non-mirrored capture.
- Image smoothing controls.

The docs should explain that browser canvas capture can be lower quality than
native camera capture and that unsupported requested constraints may be ignored
or adjusted by the browser.

## Devices And Permissions

`useDevices()` should enumerate media devices and expose:

- `videoInputs`
- `audioInputs`
- `refresh`
- `permission`
- `error`

Device labels may be empty before permission is granted. The docs and examples
should show this clearly.

When switching cameras by device ID, the library should prefer:

```ts
{ deviceId: { exact: deviceId } }
```

This avoids a known class of Chrome issues where a plain string device ID does
not reliably select the intended device.

Permission handling should use the Permissions API where available and degrade
gracefully when unsupported.

## Mobile And Browser Reliability

The package should set practical video defaults:

- `autoPlay`
- `playsInline`
- `muted` defaults to `true` for preview safety unless explicitly overridden.
- `disablePictureInPicture` support where the browser accepts it.

The docs and examples should cover:

- Android and Samsung blank preview issues caused by overly strict or high
  resolution constraints.
- Using `ideal` constraints for mobile-friendly resolution negotiation.
- iOS and Safari quirks around recording formats and inline playback controls.
- Firefox or privacy-extension canvas protections that can block reading pixels.
- The need for HTTPS or localhost for `getUserMedia`.

The first release should not attempt to solve every browser bug automatically.
It should provide safer defaults, clear error objects, good docs, and APIs that
let application code react well.

## Recording Scope

Video recording should not be a core v1 feature of the `<Webcam />` component.

The v1 docs may include an example that uses the exposed `stream` with the
browser `MediaRecorder` API. A dedicated `useMediaRecorder` hook can be a later
minor release after the stream and capture APIs are stable.

This keeps v1 focused and avoids taking ownership of browser-specific recording
format behavior before the package has enough test coverage and real-world
feedback.

## Architecture

The package should be organized as small modules:

- `src/components/Webcam.tsx`: compatibility component and imperative ref.
- `src/hooks/useWebcam.ts`: stream lifecycle and actions.
- `src/hooks/useDevices.ts`: device enumeration and devicechange handling.
- `src/capture/captureFrame.ts`: canvas capture logic.
- `src/errors/normalizeMediaError.ts`: stable error mapping.
- `src/types.ts`: public shared types.
- `src/index.ts`: public exports.

The component should be thin. It should pass options into `useWebcam`, render a
video element, and expose an imperative handle. It should not duplicate stream
lifecycle logic.

## Build And Package

Use a modern TypeScript library setup:

- TypeScript source.
- ESM and CJS output.
- Generated `.d.ts` files.
- Peer dependencies on React and React DOM.
- No runtime dependencies unless a strong reason appears.
- Package exports map for modern bundlers and Node resolution.
- Vite example app for local testing and documentation demos.

Use this tooling for v1:

- `tsup` for library builds.
- `vitest` and React Testing Library for tests.
- `vite` for the example app.
- `eslint` and `prettier` if the setup remains lightweight.

## Testing Strategy

Unit tests should mock browser media APIs and cover:

- Unsupported `getUserMedia`.
- Successful start and video element attachment.
- Error normalization.
- Stop and cleanup of audio and video tracks.
- Stale media request cleanup.
- Constraint changes restarting the stream.
- Device switching with exact device ID constraints.
- Screenshot returning `null` before video readiness.
- Blob capture using `canvas.toBlob`.

Component tests should cover:

- Ref methods.
- Default video props.
- `startOnMount={false}` behavior.
- `enabled` stopping and starting.
- Event callbacks.

The example app provides manual browser QA for real camera behavior.

## Documentation

The README should include:

- Installation.
- Quick start with `<Webcam />`.
- Hook-first example with `useWebcam`.
- Migration guide from `react-webcam`.
- Screenshot data URL and Blob examples.
- Camera switching example.
- Manual permission/start example.
- Mobile constraints guide.
- Browser support and known limitations.

The docs should be honest about browser behavior. Clear explanations are part
of the product quality, especially for webcam APIs where many failures are
environment-dependent.

## Out Of Scope For V1

- Built-in video recorder component or recorder hook.
- Face detection, QR scanning, filters, overlays, or ML frame processing.
- Native camera-quality still capture guarantees.
- Server upload helpers.
- Styling system or opinionated camera UI.
- Support for very old React versions.

## Success Criteria

The v1 package is successful when:

- A developer can replace common `react-webcam` usage with minimal changes.
- New users can build with the hook API without using imperative component refs.
- Streams are reliably stopped under unmount, disable, restart, and switch flows.
- Screenshots can be obtained as both data URLs and Blobs.
- Device switching works with exact device ID constraints.
- The package builds ESM, CJS, and type declarations.
- Tests cover the lifecycle and capture edge cases that do not require real
  hardware.
- The example app demonstrates the core flows with a real camera.
