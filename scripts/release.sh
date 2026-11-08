#!/usr/bin/env bash
set -Eeuo pipefail

###############################################################################
# LockedIn Release Script
#
# Usage:
#   ./scripts/release.sh
#   ./scripts/release.sh --dry-run
#   ./scripts/release.sh --skip-build
#   ./scripts/release.sh --prerelease
#
# Release source of truth:
#   src/manifest.json  -> version
#   CHANGELOG.md       -> release changes
#
# The script:
#   1. Validates repository state
#   2. Reads version from manifest.json
#   3. Extracts the matching CHANGELOG entry
#   4. Builds browser packages
#   5. Validates every expected package
#   6. Validates manifest version inside every extension ZIP
#   7. Generates SHA256 checksums
#   8. Generates polished GitHub release notes from CHANGELOG.md
#   9. Creates an annotated Git tag
#  10. Pushes the tag
#  11. Creates the GitHub release
#  12. Uploads all release assets
###############################################################################

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

MANIFEST="$ROOT_DIR/src/manifest.json"
CHANGELOG="$ROOT_DIR/CHANGELOG.md"
DIST_DIR="$ROOT_DIR/dist"

REPO="KartikRashmin/LockedIn-YT"
DEFAULT_BRANCH="main"

SKIP_BUILD=false
DRY_RUN=false
PRERELEASE=false

VERSION=""
TAG=""
COMMIT_SHA=""
PREVIOUS_TAG=""

NOTES_FILE=""
CHECKSUM_FILE=""

###############################################################################
# Colors
###############################################################################

if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    BOLD='\033[1m'
    RESET='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    CYAN=''
    BOLD=''
    RESET=''
fi

###############################################################################
# Helpers
###############################################################################

log() {
    echo -e "${BLUE}==>${RESET} $*"
}

success() {
    echo -e "${GREEN}OK:${RESET} $*"
}

warn() {
    echo -e "${YELLOW}WARNING:${RESET} $*"
}

error() {
    echo -e "${RED}ERROR:${RESET} $*" >&2
}

die() {
    error "$*"
    exit 1
}

cleanup() {
    [[ -n "${NOTES_FILE:-}" && -f "$NOTES_FILE" ]] && rm -f "$NOTES_FILE"
}

trap cleanup EXIT

on_error() {
    error "Release failed at line $1."
}

trap 'on_error $LINENO' ERR

usage() {
    cat <<'EOF'

LockedIn Release Tool

Usage:
  ./scripts/release.sh [options]

Options:
  --dry-run
      Validate everything and show the release that would be created.
      Does not build, tag, push, or publish.

  --skip-build
      Reuse the existing dist ZIP files.
      They are still fully validated.

  --prerelease
      Publish the GitHub release as a prerelease.

  -h, --help
      Show this help message.

Examples:
  ./scripts/release.sh
  ./scripts/release.sh --dry-run
  ./scripts/release.sh --prerelease
  ./scripts/release.sh --skip-build

Release source of truth:
  Version:  src/manifest.json
  Changes:  CHANGELOG.md

EOF
}

###############################################################################
# Argument parsing
###############################################################################

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)
            DRY_RUN=true
            shift
            ;;

        --skip-build)
            SKIP_BUILD=true
            shift
            ;;

        --prerelease)
            PRERELEASE=true
            shift
            ;;

        -h|--help)
            usage
            exit 0
            ;;

        *)
            usage
            die "Unknown option: $1"
            ;;
    esac
done

###############################################################################
# Dependency checks
###############################################################################

log "Checking required tools..."

command -v git >/dev/null 2>&1 \
    || die "git is required."

command -v gh >/dev/null 2>&1 \
    || die "GitHub CLI (gh) is required."

command -v python3 >/dev/null 2>&1 \
    || die "python3 is required."

command -v unzip >/dev/null 2>&1 \
    || die "unzip is required."

command -v sha256sum >/dev/null 2>&1 \
    || die "sha256sum is required."

success "Required tools found."

###############################################################################
# Repository setup
###############################################################################

cd "$ROOT_DIR"

log "Checking GitHub authentication..."

gh auth status >/dev/null 2>&1 \
    || die "GitHub CLI is not authenticated. Run: gh auth login"

success "GitHub authentication OK."

###############################################################################
# Repository state
###############################################################################

log "Checking repository state..."

CURRENT_BRANCH="$(git branch --show-current)"

[[ "$CURRENT_BRANCH" == "$DEFAULT_BRANCH" ]] \
    || die "Releases must be created from '$DEFAULT_BRANCH'. Current branch: '$CURRENT_BRANCH'."

if [[ -n "$(git status --porcelain)" ]]; then
    git status --short
    die "Working tree is not clean. Commit all changes before releasing."
fi

success "Working tree is clean."

###############################################################################
# Read version from manifest
###############################################################################

log "Reading version from manifest..."

VERSION="$(
    python3 - "$MANIFEST" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as f:
    data = json.load(f)

version = data.get("version")

if not isinstance(version, str):
    raise SystemExit("Manifest does not contain a valid version.")

print(version)
PY
)"

[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] \
    || die "Invalid manifest version: '$VERSION'. Expected MAJOR.MINOR.PATCH."

TAG="v$VERSION"

success "Version: $VERSION"
success "Tag: $TAG"

###############################################################################
# Verify manifest name
###############################################################################

MANIFEST_NAME="$(
    python3 - "$MANIFEST" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as f:
    data = json.load(f)

print(data.get("name", "Unknown"))
PY
)"

log "Extension: $MANIFEST_NAME"

###############################################################################
# Extract CHANGELOG entry
###############################################################################

log "Reading CHANGELOG.md..."

CHANGELOG_ENTRY="$(
    python3 - "$CHANGELOG" "$VERSION" <<'PY'
import pathlib
import re
import sys

path = pathlib.Path(sys.argv[1])
version = sys.argv[2]

text = path.read_text(encoding="utf-8")

pattern = rf"(?ms)^## \[{re.escape(version)}\].*?(?=^## \[|\Z)"

match = re.search(pattern, text)

if not match:
    raise SystemExit(
        f"No CHANGELOG.md entry found for [{version}]."
    )

entry = match.group(0).strip()

if entry == f"## [{version}]":
    raise SystemExit(
        f"CHANGELOG.md entry for [{version}] is empty."
    )

print(entry)
PY
)" || die "Could not extract CHANGELOG entry."

success "CHANGELOG entry found."

###############################################################################
# Extract release summary and category information
###############################################################################

log "Analyzing release changes..."

RELEASE_INFO="$(
    python3 - "$CHANGELOG_ENTRY" <<'PY'
import re
import sys

text = sys.argv[1]

lines = text.splitlines()

# Remove the version heading.
body = []
for line in lines[1:]:
    body.append(line)

body = "\n".join(body).strip()

categories = []
category_items = {}

current_category = None

for line in body.splitlines():
    heading = re.match(r"^###\s+(.+?)\s*$", line)

    if heading:
        current_category = heading.group(1).strip()
        categories.append(current_category)
        category_items[current_category] = []
        continue

    bullet = re.match(r"^\s*[-*]\s+(.+?)\s*$", line)

    if bullet and current_category:
        category_items[current_category].append(bullet.group(1).strip())

# Determine a useful summary.
summary = ""

priority = [
    "Added",
    "Changed",
    "Improved",
    "Fixed",
    "Security",
    "Removed",
]

for category in priority:
    if category in category_items and category_items[category]:
        summary = category_items[category][0]
        break

if not summary:
    for category in categories:
        if category_items.get(category):
            summary = category_items[category][0]
            break

if not summary:
    summary = "Maintenance update"

# Clean common markdown.
summary = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", summary)
summary = re.sub(r"`([^`]+)`", r"\1", summary)
summary = re.sub(r"\*\*(.*?)\*\*", r"\1", summary)

# Keep GitHub title reasonably short.
if len(summary) > 70:
    summary = summary[:67].rstrip() + "..."

print("SUMMARY=" + summary)
print("CATEGORIES=" + ",".join(categories))

for category in categories:
    for item in category_items.get(category, []):
        print(f"ITEM\t{category}\t{item}")
PY
)"

RELEASE_SUMMARY="$(printf '%s\n' "$RELEASE_INFO" | sed -n 's/^SUMMARY=//p')"
RELEASE_CATEGORIES="$(printf '%s\n' "$RELEASE_INFO" | sed -n 's/^CATEGORIES=//p')"

success "Detected changes: $RELEASE_SUMMARY"

###############################################################################
# Verify release tag does not already exist locally
###############################################################################

if git rev-parse "$TAG" >/dev/null 2>&1; then
    die "Git tag $TAG already exists locally."
fi

###############################################################################
# Verify remote tag does not already exist
###############################################################################

log "Checking remote tag..."

if git ls-remote --tags origin "refs/tags/$TAG" | grep -q "refs/tags/$TAG"; then
    die "Remote Git tag $TAG already exists."
fi

success "Tag $TAG is available."

###############################################################################
# Verify GitHub release does not already exist
###############################################################################

log "Checking GitHub release..."

if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
    die "GitHub release $TAG already exists."
fi

success "GitHub release $TAG is available."

###############################################################################
# Find previous release tag
###############################################################################

PREVIOUS_TAG="$(
    git tag --sort=-version:refname |
    grep '^v[0-9]\+\.[0-9]\+\.[0-9]\+$' |
    head -n 1 || true
)"

###############################################################################
# Build
###############################################################################

if [[ "$SKIP_BUILD" == false ]]; then
    log "Building LockedIn v$VERSION..."

    "$ROOT_DIR/scripts/build.sh"

    success "Build completed."
else
    warn "Skipping build. Existing dist files will be validated."
fi

###############################################################################
# Expected assets
###############################################################################

FIREFOX_ZIP="$DIST_DIR/lockedin-v${VERSION}-firefox.zip"
CHROMIUM_ZIP="$DIST_DIR/lockedin-v${VERSION}-chromium.zip"
OPERA_ZIP="$DIST_DIR/lockedin-v${VERSION}-opera.zip"
SOURCE_ZIP="$DIST_DIR/lockedin-v${VERSION}-source.zip"

ASSETS=(
    "$FIREFOX_ZIP"
    "$CHROMIUM_ZIP"
    "$OPERA_ZIP"
    "$SOURCE_ZIP"
)

###############################################################################
# Validate assets
###############################################################################

log "Validating release assets..."

for asset in "${ASSETS[@]}"; do
    [[ -f "$asset" ]] \
        || die "Missing release asset: ${asset#$ROOT_DIR/}"

    [[ -s "$asset" ]] \
        || die "Release asset is empty: ${asset#$ROOT_DIR/}"

    unzip -t "$asset" >/dev/null \
        || die "Invalid ZIP archive: ${asset#$ROOT_DIR/}"

    SIZE="$(du -h "$asset" | cut -f1)"

    success "$(basename "$asset") ($SIZE)"
done

###############################################################################
# Validate manifest version inside browser packages
###############################################################################

log "Validating manifest versions inside extension packages..."

for asset in "$FIREFOX_ZIP" "$CHROMIUM_ZIP" "$OPERA_ZIP"; do

    ZIP_VERSION="$(
        unzip -p "$asset" manifest.json |
        python3 -c '
import json
import sys

data = json.load(sys.stdin)
print(data.get("version", ""))
'
    )"

    [[ "$ZIP_VERSION" == "$VERSION" ]] \
        || die "Manifest version mismatch in $(basename "$asset"): expected $VERSION, found $ZIP_VERSION."

    success "$(basename "$asset") -> manifest v$ZIP_VERSION"
done

###############################################################################
# Verify expected files in extension packages
###############################################################################

log "Checking extension package contents..."

for asset in "$FIREFOX_ZIP" "$CHROMIUM_ZIP" "$OPERA_ZIP"; do

    unzip -l "$asset" | grep "manifest.json" >/dev/null \
        || die "$(basename "$asset") does not contain manifest.json."

    unzip -l "$asset" | grep "background.js" >/dev/null \
        || die "$(basename "$asset") does not contain background.js."

    unzip -l "$asset" | grep "popup/popup.html" >/dev/null \
        || die "$(basename "$asset") does not contain popup/popup.html."

    success "$(basename "$asset") structure looks valid."
done

###############################################################################
# Generate SHA256 checksums
###############################################################################

CHECKSUM_FILE="$DIST_DIR/lockedin-v${VERSION}-SHA256SUMS.txt"

log "Generating SHA256 checksums..."

rm -f "$CHECKSUM_FILE"

for asset in "${ASSETS[@]}"; do
    sha256sum "$asset" >> "$CHECKSUM_FILE"
done

success "Generated $(basename "$CHECKSUM_FILE")."

###############################################################################
# Generate polished release notes
###############################################################################

NOTES_FILE="$(mktemp)"

log "Generating release notes..."

python3 - \
    "$NOTES_FILE" \
    "$CHANGELOG_ENTRY" \
    "$VERSION" \
    "$RELEASE_SUMMARY" \
    "$PREVIOUS_TAG" \
    "$PRERELEASE" \
    <<'PY'

import pathlib
import re
import sys

notes_path = pathlib.Path(sys.argv[1])
changelog_entry = sys.argv[2]
version = sys.argv[3]
summary = sys.argv[4]
previous_tag = sys.argv[5]
prerelease = sys.argv[6].lower() == "true"

lines = changelog_entry.splitlines()

# Parse CHANGELOG categories.
sections = []
current = None

for line in lines[1:]:
    heading = re.match(r"^###\s+(.+?)\s*$", line)

    if heading:
        current = {
            "name": heading.group(1).strip(),
            "items": []
        }
        sections.append(current)
        continue

    bullet = re.match(r"^\s*[-*]\s+(.+?)\s*$", line)

    if bullet and current:
        current["items"].append(bullet.group(1).strip())


out = []

out.append(f"## Whats new in v{version}")
out.append("")
out.append(f"> {summary}")
out.append("")

if prerelease:
    out.append("> ️ This is a prerelease build and may contain unfinished changes.")
    out.append("")

# Actual changelog sections.
for section in sections:
    name = section["name"]
    items = section["items"]

    if not items:
        continue


    out.append(f"## {name}")
    out.append("")

    for item in items:
        out.append(f"- {item}")

    out.append("")

# Downloads.
out.append("## 📦 Downloads")
out.append("")
out.append("| Browser | Package |")
out.append("|---|---|")
out.append(f"| Firefox | `lockedin-v{version}-firefox.zip` |")
out.append(f"| Chrome / Edge / Brave | `lockedin-v{version}-chromium.zip` |")
out.append(f"| Opera | `lockedin-v{version}-opera.zip` |")
out.append(f"| Source code | `lockedin-v{version}-source.zip` |")
out.append(f"| Checksums | `lockedin-v{version}-SHA256SUMS.txt` |")
out.append("")

# Update recommendation.
out.append("##  Updating")
out.append("")

if prerelease:
    out.append(
        "This is a prerelease build. Install it only if you want to test "
        "the upcoming changes."
    )
else:
    out.append(
        "This release contains the changes listed above. Existing LockedIn "
        "settings should remain unchanged unless explicitly noted."
    )

out.append("")

# Full changelog link.
if previous_tag:
    out.append(f"**Full Changelog**: https://github.com/KartikRashmin/LockedIn-YT/compare/{previous_tag}...v{version}")
    out.append("")

# Issues.
out.append("##  Found a problem?")
out.append("")
out.append(
    "[Open an issue](https://github.com/KartikRashmin/LockedIn-YT/issues)"
    " if something is not working correctly."
)
out.append("")

notes_path.write_text("\n".join(out).rstrip() + "\n", encoding="utf-8")
PY

success "Release notes generated."

###############################################################################
# Dry run
###############################################################################

if [[ "$DRY_RUN" == true ]]; then

    echo
    echo "============================================================"
    echo "                  RELEASE DRY RUN"
    echo "============================================================"
    echo
    echo "Version:        $VERSION"
    echo "Tag:            $TAG"
    echo "Summary:        $RELEASE_SUMMARY"
    echo "Categories:     ${RELEASE_CATEGORIES:-None}"
    echo "Previous tag:   ${PREVIOUS_TAG:-None}"
    echo "Prerelease:     $PRERELEASE"
    echo
    echo "Assets:"
    printf '   %s\n' "${ASSETS[@]#$ROOT_DIR/}"
    printf '   %s\n' "${CHECKSUM_FILE#$ROOT_DIR/}"
    echo
    echo "Generated release notes:"
    echo "------------------------------------------------------------"
    cat "$NOTES_FILE"
    echo "------------------------------------------------------------"
    echo
    success "Dry run completed successfully."
    exit 0
fi

###############################################################################
# Confirmation
###############################################################################

echo
echo "============================================================"
echo "              READY TO PUBLISH RELEASE"
echo "============================================================"
echo
echo "  Version:   $VERSION"
echo "  Tag:       $TAG"
echo "  Summary:   $RELEASE_SUMMARY"
echo "  Assets:    ${#ASSETS[@]} + checksums"
echo "  Prerelease: $PRERELEASE"
echo

read -r -p "Publish LockedIn v$VERSION? [y/N] " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Release cancelled."
    exit 0
fi

###############################################################################
# Create annotated Git tag
###############################################################################

COMMIT_SHA="$(git rev-parse HEAD)"

log "Creating annotated Git tag $TAG..."

git tag -a "$TAG" "$COMMIT_SHA" -m "LockedIn $TAG: $RELEASE_SUMMARY"

success "Created tag $TAG."

###############################################################################
# Push tag
###############################################################################

log "Pushing tag $TAG to origin..."

git push origin "$TAG"

success "Tag pushed."

###############################################################################
# Create GitHub release
###############################################################################

log "Publishing GitHub release..."

GH_ARGS=(
    release
    create
    "$TAG"
    --repo
    "$REPO"
    --verify-tag
    --title
    "LockedIn v$VERSION - $RELEASE_SUMMARY"
    --notes-file
    "$NOTES_FILE"
)

if [[ "$PRERELEASE" == true ]]; then
    GH_ARGS+=(--prerelease)
fi

gh "${GH_ARGS[@]}" "${ASSETS[@]}" "$CHECKSUM_FILE"

###############################################################################
# Finished
###############################################################################

echo
echo "============================================================"
echo "                  RELEASE PUBLISHED"
echo "============================================================"
echo
success "LockedIn v$VERSION released successfully."
echo
echo "Release:"
echo "https://github.com/$REPO/releases/tag/$TAG"
echo
echo "Assets:"
printf '   %s\n' "${ASSETS[@]#$ROOT_DIR/}"
printf '   %s\n' "${CHECKSUM_FILE#$ROOT_DIR/}"
echo