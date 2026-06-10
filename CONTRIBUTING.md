# Contributing

Thanks for helping improve `react-webcam-kit`.

## Development

```bash
npm install
npm run verify
```

`npm run verify` is the release gate. It runs TypeScript, ESLint, Prettier, Vitest, Playwright, and
the package build.

## Pull Requests

- Keep changes focused and small enough to review.
- Add or update tests for behavior changes.
- Update README or docs when public APIs change.
- Run `npm run verify` before opening a pull request.

## Browser Bugs

Camera and recording behavior differs across browsers and devices. Please include:

- Browser and version
- Operating system and device
- Whether the page is served from HTTPS or localhost
- Camera/microphone permissions state
- A minimal reproduction when possible

## Release Notes

User-facing changes should update `CHANGELOG.md`.
