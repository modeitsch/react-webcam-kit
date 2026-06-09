# Browser Notes

Camera APIs are browser and device APIs. The package keeps React state and stream cleanup
predictable, but browser behavior still matters.

## Secure Contexts

`navigator.mediaDevices.getUserMedia` is available only in secure contexts. Use HTTPS in production.
Localhost is treated as secure for development.

## Permission State

Browsers expose camera permission state differently:

- Some support `navigator.permissions.query({ name: 'camera' })`.
- Some return `unknown` until a user has answered the permission prompt.
- Device labels can be empty until permission is granted.

Use `status`, `permission`, and `error.type` together instead of relying on one signal.

## Mobile Constraints

Mobile cameras can reject strict width, height, frame rate, or facing mode constraints. Prefer
`ideal` constraints for first start:

```tsx
videoConstraints={{
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: { ideal: 'environment' },
}}
```

Use exact constraints only after you know the target device supports them.

## iOS And Android Stop Behavior

The library stops every active track and clears `video.srcObject` when you call `stop()`, switch
devices, disable the component, or unmount. On some mobile browsers the camera indicator can take a
moment to disappear after tracks are stopped.

## Blank Preview Troubleshooting

If the preview is blank:

1. Confirm the page is HTTPS or localhost.
2. Use `playsInline`, which the component sets by default.
3. Try lower or `ideal` video constraints.
4. Avoid starting multiple streams from the same physical camera on constrained devices.
5. Inspect `error.type` for `overconstrained`, `not-readable`, or `permission-denied`.

## Canvas Capture And Privacy Protection

Screenshot capture uses canvas. Privacy-focused browser modes and extensions can block canvas reads
after drawing a video frame. When that happens, `getScreenshot()`, `getScreenshotBlob()`, and
`captureFrame()` return `null`.

Treat `null` as a normal browser outcome and show a fallback message.

## Audio Recording

This package manages preview and capture. It does not currently ship a recorder abstraction. If you
record with `MediaRecorder`, pass `audio: true` when you need microphone tracks, and tune recorder
bitrate options in your app to control output size.

## Multiple Cameras At Once

Desktop browsers can often run multiple streams. Mobile devices are more limited. If your app needs
two previews at the same time, use separate hook/component instances and conservative constraints,
then handle `not-readable` errors when a browser refuses a second stream.
