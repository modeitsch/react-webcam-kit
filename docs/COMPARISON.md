# Comparison Notes

`react-webcam-kit` focuses on modern React camera workflows with typed hooks, predictable cleanup, and
browser-tested behavior.

## When It Fits

- You need a drop-in webcam preview component.
- You want hooks for custom camera interfaces.
- You need screenshots as Data URLs, Blobs, canvases, or ImageData.
- You need recording helpers with Blob/File output.
- You need device switching, front/back camera switching, and advanced constraints.
- You care about TypeScript declarations and browser smoke tests.

## Design Choices

- Small public API instead of a large UI framework.
- Browser APIs stay visible through `MediaStream`, `MediaStreamTrack`, and native constraints.
- Cleanup is part of the core behavior: stop, restart, switch, disable, and unmount all stop tracks.
- Recorder helpers are built around one active recording session. Multi-session managers can be built
  on top when needed.

## Choosing a Webcam Package

Before choosing any camera package, check:

- Is it maintained?
- Does it support your target browsers?
- Does it clean up tracks on unmount?
- Does it handle permission and unsupported-browser errors?
- Does it expose enough native browser control for your app?
- Does it have tests around stream lifecycle and recording behavior?
