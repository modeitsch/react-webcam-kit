# Security Policy

## Supported Versions

Security fixes are provided for the latest published version of `react-webcam-kit`.

## Reporting A Vulnerability

Please report security issues privately by emailing the maintainer or by opening a private GitHub
security advisory when the repository is available.

Do not open a public issue for vulnerabilities that could expose users, devices, or application data.

When reporting, include:

- A short description of the issue
- A minimal reproduction or affected API
- Browser and operating system details
- Any known impact on camera, microphone, screenshot, or permission behavior

## Package Security Notes

`react-webcam-kit` does not send camera, microphone, screenshot, or device data anywhere. The package
only calls browser media APIs from the consuming app.

Applications using this package should still follow these rules:

- Use HTTPS in production.
- Request camera and microphone access only when needed.
- Stop streams when the user leaves a camera flow.
- Avoid logging screenshots, device labels, or stream IDs in production.
- Treat captured images and blobs as user data.
- Validate uploads on the server if captured media is sent to your backend.
- Show clear UI when camera or microphone access is active.

## Maintainer Checks

Release candidates should pass:

```bash
npm run verify
npm run audit
npm pack --dry-run
```
