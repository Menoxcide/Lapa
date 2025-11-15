# Generate Windows .ico file using ImageMagick
# Uses full path to magick.exe to avoid PATH issues

param(
    [string]$MagickPath = "C:\Program Files\ImageMagick-7.1.2-Q16\magick.exe"
)

$ErrorActionPreference = "Continue"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
Set-Location $rootPath

Write-Host "Generating Windows .ico file using ImageMagick..." -ForegroundColor Cyan

# Check if ImageMagick exists
if (-not (Test-Path $MagickPath)) {
    Write-Host "ERROR: ImageMagick not found at: $MagickPath" -ForegroundColor Red
    Write-Host "Please update the MagickPath parameter or install ImageMagick" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using ImageMagick: $MagickPath" -ForegroundColor Green

$svgPath = "media\lapa-icon.svg"
$icoPath = "resources\win32\code.ico"

# Ensure output directory exists
$icoDir = Split-Path $icoPath -Parent
if (-not (Test-Path $icoDir)) {
    New-Item -ItemType Directory -Path $icoDir -Force | Out-Null
}

if (-not (Test-Path $svgPath)) {
    Write-Host "ERROR: Source SVG not found: $svgPath" -ForegroundColor Red
    exit 1
}

Write-Host "`nGenerating ICO file with multiple sizes..." -ForegroundColor Green

try {
    # Generate ICO with auto-resize (creates all sizes automatically)
    & $MagickPath $svgPath -define icon:auto-resize=256,128,64,48,32,16 -background transparent $icoPath
    
    if (Test-Path $icoPath) {
        $icoSize = (Get-Item $icoPath).Length
        Write-Host "`n✓ Generated $icoPath ($([math]::Round($icoSize / 1KB, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "`n✗ Failed to generate ICO file" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "`n✗ Error generating ICO: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nIcon generation complete!" -ForegroundColor Green

