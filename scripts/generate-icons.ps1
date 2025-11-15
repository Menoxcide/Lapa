# Generate binary icon formats from SVG source files
# Requires: ImageMagick or Inkscape

Write-Host "Generating LAPA icons from SVG sources..." -ForegroundColor Cyan

$iconDir = "media"
$outputDirs = @(
  "src\vs\workbench\browser\media",
  "src\vs\workbench\browser\parts\editor\media",
  "resources\win32",
  "resources\linux",
  "resources\darwin"
)

# Check for ImageMagick
if (Get-Command magick -ErrorAction SilentlyContinue) {
    Write-Host "Using ImageMagick..." -ForegroundColor Green
    
    magick "$iconDir\lapa-icon-sm.svg" -background transparent -resize 16x16 "$iconDir\lapa-icon-sm.png"
    magick "$iconDir\lapa-cube-noshadow.svg" -background transparent -resize 256x256 "$iconDir\lapa-cube-noshadow.png"
    magick "$iconDir\lapa-slice.svg" -background transparent -resize 512x512 "$iconDir\lapa-slice.png"
}
elseif (Get-Command inkscape -ErrorAction SilentlyContinue) {
    Write-Host "Using Inkscape..." -ForegroundColor Green
    
    inkscape "$iconDir\lapa-icon-sm.svg" --export-type=png --export-filename="$iconDir\lapa-icon-sm.png" -w 16 -h 16
    inkscape "$iconDir\lapa-cube-noshadow.svg" --export-type=png --export-filename="$iconDir\lapa-cube-noshadow.png" -w 256 -h 256
    inkscape "$iconDir\lapa-slice.svg" --export-type=png --export-filename="$iconDir\lapa-slice.png" -w 512 -h 512
}
else {
    Write-Host "ERROR: Neither ImageMagick nor Inkscape found. Please install one to generate PNG icons." -ForegroundColor Red
    exit 1
}

# Copy icons to appropriate locations
Copy-Item "$iconDir\lapa-icon-sm.png" -Destination "src\vs\workbench\browser\media\" -Force
Copy-Item "$iconDir\lapa-cube-noshadow.png" -Destination "src\vs\workbench\browser\parts\editor\media\" -Force

Write-Host "Icon generation complete!" -ForegroundColor Green
Write-Host "Note: Windows .ico and macOS .icns formats require additional tools:" -ForegroundColor Yellow
Write-Host "  - Windows: Use Resource Hacker or icotool" -ForegroundColor Yellow
Write-Host "  - macOS: Use iconutil or png2icns" -ForegroundColor Yellow

