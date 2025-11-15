#!/bin/bash
# Generate binary icon formats from SVG source files
# Requires: ImageMagick or Inkscape

echo "Generating LAPA icons from SVG sources..."

ICON_DIR="media"
OUTPUT_DIRS=(
  "src/vs/workbench/browser/media"
  "src/vs/workbench/browser/parts/editor/media"
  "resources/win32"
  "resources/linux"
  "resources/darwin"
)

# Generate PNG from SVG (small icon)
if command -v convert &> /dev/null; then
  echo "Using ImageMagick..."
  convert "${ICON_DIR}/lapa-icon-sm.svg" -background transparent -resize 16x16 "${ICON_DIR}/lapa-icon-sm.png"
  convert "${ICON_DIR}/lapa-cube-noshadow.svg" -background transparent -resize 256x256 "${ICON_DIR}/lapa-cube-noshadow.png"
  convert "${ICON_DIR}/lapa-slice.svg" -background transparent -resize 512x512 "${ICON_DIR}/lapa-slice.png"
elif command -v inkscape &> /dev/null; then
  echo "Using Inkscape..."
  inkscape "${ICON_DIR}/lapa-icon-sm.svg" --export-type=png --export-filename="${ICON_DIR}/lapa-icon-sm.png" -w 16 -h 16
  inkscape "${ICON_DIR}/lapa-cube-noshadow.svg" --export-type=png --export-filename="${ICON_DIR}/lapa-cube-noshadow.png" -w 256 -h 256
  inkscape "${ICON_DIR}/lapa-slice.svg" --export-type=png --export-filename="${ICON_DIR}/lapa-slice.png" -w 512 -h 512
else
  echo "ERROR: Neither ImageMagick nor Inkscape found. Please install one to generate PNG icons."
  exit 1
fi

# Copy icons to appropriate locations
cp "${ICON_DIR}/lapa-icon-sm.png" "src/vs/workbench/browser/media/"
cp "${ICON_DIR}/lapa-cube-noshadow.png" "src/vs/workbench/browser/parts/editor/media/"

echo "Icon generation complete!"
echo "Note: Windows .ico and macOS .icns formats require additional tools:"
echo "  - Windows: Use Resource Hacker or icotool"
echo "  - macOS: Use iconutil or png2icns"

