# Releasing LockedIn

Pushing a semantic-version tag (for example, `v1.2.2`) starts the GitHub Actions
release workflow. It builds and validates the browser packages, generates
checksums, and publishes the GitHub release.

The local `scripts/release.sh` command remains available for an interactive
release from a developer machine. Do not run it for a tag that has already been
published or use it together with the automated workflow, because the script
also creates the GitHub release itself.

## One-time setup

Install and authenticate the GitHub CLI:

```bash
# Fedora
sudo dnf install gh

# Authenticate once
gh auth login
```

The account must have permission to create releases in the repository.

## Standard release workflow

1. Update the version in `src/manifest.json`.
2. Add a matching entry at the top of `CHANGELOG.md` using the existing format:

   ```markdown
   ## [1.2.1] - 2026-09-01
   ### Added
   - Describe the user-visible change.

   ### Fixed
   - Describe the bug fix.
   ```

3. Test the changes.
4. Commit the version, changelog, and source changes.
5. Push the commit to GitHub.
6. Create and push the release tag:

   ```bash
   git tag -a v1.2.2 -m "LockedIn v1.2.2"
   git push origin v1.2.2
   ```

GitHub Actions reads the version from `src/manifest.json`, verifies that it
matches the pushed tag, builds the packages, and uploads the ZIP files and
`SHA256SUMS.txt`.

For the local interactive release path, run `./scripts/release.sh` instead of
creating and pushing the tag manually. It performs its own validation and
publishes the release directly.

The release command intentionally requires a clean working tree and refuses to reuse an existing tag. This prevents a release from being made from uncommitted or incorrectly versioned files.

## Reuse existing ZIPs

If the build was already completed and the `dist/` files are correct, skip rebuilding:

```bash
./scripts/release.sh --skip-build
```

## Local release template

When using `scripts/release.sh`, edit `.github/release-template.md` to change
the release format. The GitHub Actions workflow uses GitHub's generated notes
instead. These placeholders are replaced automatically by the local script:

- `{{VERSION}}` becomes the manifest version without the `v` prefix.
- `{{CHANGELOG}}` becomes the matching version section from `CHANGELOG.md`, excluding its `## [version]` heading.

## Instructions for an AI coding agent

For a release request, read this file first. Inspect `src/manifest.json` and `CHANGELOG.md`, confirm the version and changelog entry match, run the relevant tests, commit and push the prepared changes if requested, then run `./scripts/release.sh`. Do not create a release if the working tree is dirty, the changelog entry is missing, the build fails, or the tag already exists. Never use `--skip-build` unless the user explicitly confirms that the existing `dist/` ZIP files are the intended release artifacts.

The script publishes to the GitHub repository configured as the current git remote using the authenticated `gh` account. It does not commit source changes automatically.

## Automated Store Deployments (GitHub Actions)

When a new version is released on `main`, `.github/workflows/release.yml` can automatically deploy the packages to the stores if the following secrets are configured in repository settings (**Settings > Secrets and variables > Actions**):

### 1. Firefox Add-ons (AMO)
- `AMO_JWT_ISSUER`: JWT Issuer / API Key from [AMO API Keys](https://addons.mozilla.org/developers/addon/api/key/)
- `AMO_JWT_SECRET`: JWT Secret from AMO API Keys

### 2. Chrome Web Store
- `CHROME_EXTENSION_ID`: LockedIn extension ID on Chrome Web Store
- `CHROME_CLIENT_ID`: Google OAuth2 Client ID (from Google Cloud Console)
- `CHROME_CLIENT_SECRET`: Google OAuth2 Client Secret
- `CHROME_REFRESH_TOKEN`: Google OAuth2 Refresh Token

### 3. Microsoft Edge Add-ons
- `EDGE_PRODUCT_ID`: Product ID in Microsoft Partner Center
- `EDGE_CLIENT_ID`: Client ID in Microsoft Partner Center
- `EDGE_API_KEY`: API Key / Client Secret in Microsoft Partner Center

