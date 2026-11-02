# Release Guide

Use this checklist when publishing a new `react-webcam-kit` version.

## Trusted Publishing Setup

Configure trusted publishing once in the npm package settings:

1. Open the package settings on npm.
2. Find **Trusted Publisher**.
3. Select **GitHub Actions**.
4. Use these values:
   - Organization or user: `modeitsch`
   - Repository: `react-webcam-kit`
   - Workflow filename: `publish.yml`
   - Environment: leave blank unless the workflow is later changed to use a named environment
   - Allowed action: `npm publish`
5. Save the trusted publisher.

The publish workflow uses GitHub OIDC with `id-token: write`, Node 24, npm latest, and npm
provenance. No long-lived npm publish token is required.

If npm returns `404 Not Found` during `npm publish --provenance`, the package usually does not have
a matching Trusted Publisher entry yet. Recheck the owner, repository, and workflow filename values.
The workflow filename is only `publish.yml`, not `.github/workflows/publish.yml`.

## Publish A Version

1. Update `package.json` and `CHANGELOG.md`.
2. Run the full local check:

   ```bash
   npm run clean
   npm run verify
   npm run audit
   npm run site:build
   npm pack --dry-run
   ```

3. Commit the release changes.
4. Create and push a matching tag:

   ```bash
   git tag v0.7.2
   git push origin master --tags
   ```

5. Watch the **Publish to npm** workflow.

The workflow validates that the tag matches `package.json`, skips publishing if the version already
exists on npm, publishes with provenance, and creates a GitHub release for tag builds.

## Manual Recovery

If a release workflow fails before publishing, fix the issue and rerun the workflow. If npm already
has the version, bump to a new patch version; npm versions are immutable.

## TypeScript Major Upgrades

Keep the package on the current TypeScript major until the lint and type-test stack officially
supports the next major. For TypeScript 7, wait until `typescript-eslint`, ESLint, `tsup`, `vitest`,
and the consumer type tests all pass without peer-dependency warnings or compatibility overrides.
