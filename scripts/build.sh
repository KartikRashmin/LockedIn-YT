#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT_DIR/src"
DIST_DIR="$ROOT_DIR/dist"

# Get the version from manifest.json
VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$SRC_DIR/manifest.json" | head -n1 | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)"/\1/')

FIREFOX_ZIP="lockedin-v$VERSION-firefox.zip"
CHROMIUM_ZIP="lockedin-v$VERSION-chromium.zip"
OPERA_ZIP="lockedin-v$VERSION-opera.zip"
SOURCE_ZIP="lockedin-v$VERSION-source.zip"

echo "========================================="
echo "Building LockedIn Extension v$VERSION"
echo "========================================="

# Clean old builds
mkdir -p "$DIST_DIR"
rm -f "$DIST_DIR/lockedin-"*.zip

echo "Verifying source files..."
required_files=(
  "$SRC_DIR/manifest.json"
  "$SRC_DIR/background.js"
  "$SRC_DIR/content/index.js"
  "$SRC_DIR/popup/popup.html"
  "$SRC_DIR/popup/popup.css"
  "$SRC_DIR/popup/popup.js"
  "$SRC_DIR/assets/icons/icon48.png"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "ERROR: Required file missing: $file"
    exit 1
  fi
  echo "  ✓ ${file#$ROOT_DIR/}"
done

# 1. BUILD FIREFOX (Directly from src)
echo "Preparing Firefox build in a temporary folder..."
TEMP_FIREFOX_DIR="$ROOT_DIR/temp-firefox-build"

rm -rf "$TEMP_FIREFOX_DIR"
mkdir -p "$TEMP_FIREFOX_DIR"
cp -r "$SRC_DIR/"* "$TEMP_FIREFOX_DIR/"

python - "$TEMP_FIREFOX_DIR/manifest.json" <<'PY'
import json
import pathlib
import sys

manifest_path = pathlib.Path(sys.argv[1])
data = json.loads(manifest_path.read_text(encoding='utf-8'))
data['name'] = 'LockedIn'

manifest_path.write_text(
  json.dumps(data, ensure_ascii=False, indent=2) + "\n",
  encoding='utf-8'
)
PY

echo "Creating Firefox extension ZIP..."
(cd "$TEMP_FIREFOX_DIR" && zip -q -r "$DIST_DIR/$FIREFOX_ZIP" . -x "*.DS_Store" "*/__MACOSX/*")

rm -rf "$TEMP_FIREFOX_DIR"
echo "  ✓ Cleaned up temporary build files."

# 2. BUILD CHROMIUM / EDGE (Using a temporary ghost folder)
echo "Preparing Chromium build in a temporary folder..."
TEMP_DIR="$ROOT_DIR/temp-chrome-build"

# Create temp folder and copy source code
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
cp -r "$SRC_DIR/"* "$TEMP_DIR/"

# Convert manifest to Chromium-safe JSON (service worker + remove Firefox-only keys)
python - "$TEMP_DIR/manifest.json" <<'PY'
import json
import pathlib
import sys

manifest_path = pathlib.Path(sys.argv[1])
data = json.loads(manifest_path.read_text(encoding='utf-8'))

bg = data.get('background', {})
if isinstance(bg, dict):
  if 'scripts' in bg and isinstance(bg['scripts'], list) and bg['scripts']:
    data['background'] = {'service_worker': bg['scripts'][0]}
  elif 'service_worker' not in bg:
    data['background'] = {'service_worker': 'background.js'}
else:
  data['background'] = {'service_worker': 'background.js'}

data.pop('browser_specific_settings', None)

manifest_path.write_text(
  json.dumps(data, ensure_ascii=False, indent=2) + "\n",
  encoding='utf-8'
)
PY

echo "Creating Chromium extension ZIP..."
(cd "$TEMP_DIR" && zip -q -r "$DIST_DIR/$CHROMIUM_ZIP" . -x "*.DS_Store" "*/__MACOSX/*")

# CLEANUP: Delete the temporary folder immediately!
rm -rf "$TEMP_DIR"
echo "  ✓ Cleaned up temporary build files."

# 2b. BUILD OPERA (Chromium-compatible with shorter name)
echo "Preparing Opera build in a temporary folder..."
OPERA_DIR="$ROOT_DIR/temp-opera-build"

rm -rf "$OPERA_DIR"
mkdir -p "$OPERA_DIR"
cp -r "$SRC_DIR/"* "$OPERA_DIR/"

python - "$OPERA_DIR/manifest.json" <<'PY'
import json
import pathlib
import sys

manifest_path = pathlib.Path(sys.argv[1])
data = json.loads(manifest_path.read_text(encoding='utf-8'))

bg = data.get('background', {})
if isinstance(bg, dict):
  if 'scripts' in bg and isinstance(bg['scripts'], list) and bg['scripts']:
    data['background'] = {'service_worker': bg['scripts'][0]}
  elif 'service_worker' not in bg:
    data['background'] = {'service_worker': 'background.js'}
else:
  data['background'] = {'service_worker': 'background.js'}

data.pop('browser_specific_settings', None)

# Shorter name for Opera packaging
data['name'] = 'LockedIn - Remove YouTube Shorts & More'

manifest_path.write_text(
  json.dumps(data, ensure_ascii=False, indent=2) + "\n",
  encoding='utf-8'
)
PY

echo "Creating Opera extension ZIP..."
(cd "$OPERA_DIR" && zip -q -r "$DIST_DIR/$OPERA_ZIP" . -x "*.DS_Store" "*/__MACOSX/*")

rm -rf "$OPERA_DIR"
echo "  ✓ Cleaned up temporary build files."

# 3. BUILD SOURCE CODE
echo "Creating source ZIP..."
(cd "$ROOT_DIR" && zip -q -r "$DIST_DIR/$SOURCE_ZIP" \
  src/ scripts/ tests/ project-docs/ \
  README.md CHANGELOG.md CONTRIBUTING.md PRIVACY.md LICENSE .gitignore \
  -x "*.DS_Store" "*/__MACOSX/*" "*/.git/*" "dist/*" "temp-chrome-build/*")

echo ""
echo "========================================="
echo "✓ Build complete! Repository remains clean."
echo "========================================="
echo "📦 Firefox: dist/$FIREFOX_ZIP"
echo "📦 Chrome/Edge: dist/$CHROMIUM_ZIP"
echo "📦 Opera: dist/$OPERA_ZIP"
echo "📦 Source: dist/$SOURCE_ZIP"
