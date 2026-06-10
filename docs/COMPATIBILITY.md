# Browser Compatibility

Camera APIs are browser and device dependent. Use this table as a starting point and test on the
devices your app supports.

| Feature                    | Chrome desktop   | Firefox desktop | Safari desktop             | Chrome Android   | iOS Safari |
| -------------------------- | ---------------- | --------------- | -------------------------- | ---------------- | ---------- |
| Webcam preview             | Supported        | Supported       | Supported                  | Supported        | Supported  |
| Screenshot capture         | Supported        | Supported       | Supported                  | Supported        | Supported  |
| Video recording            | Supported        | Supported       | Partial                    | Supported        | Partial    |
| `deviceId` switching       | Supported        | Supported       | Supported after permission | Supported        | Limited    |
| `facingMode` switching     | Supported        | Supported       | Supported                  | Supported        | Supported  |
| Torch and zoom constraints | Device dependent | Limited         | Limited                    | Device dependent | Limited    |

## Notes

- Camera access requires HTTPS or localhost.
- Device labels are often empty until permission is granted.
- Prefer `ideal` constraints on mobile devices. Strict `exact` constraints can fail on real phones.
- MediaRecorder output formats vary by browser. Use `getSupportedMimeType()` or
  `getSupportedVideoMimeTypes()` before choosing a recording format.
- iOS Safari support changes frequently. Test recording and playback on the actual target iOS version.
