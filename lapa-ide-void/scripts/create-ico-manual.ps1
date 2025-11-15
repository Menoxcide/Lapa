# Manual ICO creation helper script
# This script generates PNG files at all required sizes for ICO conversion
# Then provides instructions for creating the ICO file

param(
    [switch]$KeepPNGs
)

$ErrorActionPreference = "Continue"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
Set-Location $rootPath

Write-Host "Generating PNG files for ICO conversion..." -ForegroundColor Cyan

$sizes = @(16, 32, 48, 64, 128, 256)
$outputDir = "resources\win32"
$svgPath = "media\lapa-icon.svg"

if (-not (Test-Path $svgPath)) {
    Write-Host "ERROR: Source SVG not found: $svgPath" -ForegroundColor Red
    exit 1
}

# Check for Node.js and sharp
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "ERROR: Node.js not found" -ForegroundColor Red
    exit 1
}

# Generate PNGs using Node.js
Write-Host "`nGenerating PNG files at required sizes..." -ForegroundColor Green

$tempScript = @"
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sharp = (await import('sharp')).default;
const rootPath = path.join(__dirname, '..');
const svgPath = path.join(rootPath, 'media', 'lapa-icon.svg');
const outputDir = path.join(rootPath, 'resources', 'win32');

const sizes = [16, 32, 48, 64, 128, 256];

for (const size of sizes) {
    const outputPath = path.join(outputDir, \`temp_\${size}.png\`);
    await sharp(svgPath)
        .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
    console.log(\`Generated \${size}x\${size}\`);
}
"@

$tempScriptPath = "$env:TEMP\generate-ico-pngs.mjs"
$tempScript | Out-File -FilePath $tempScriptPath -Encoding UTF8

try {
    Push-Location $rootPath
    node $tempScriptPath
    Pop-Location
} finally {
    Remove-Item $tempScriptPath -ErrorAction SilentlyContinue
}

Write-Host "`n✓ PNG files generated in $outputDir" -ForegroundColor Green
Write-Host "`nNext steps to create ICO file:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: ImageMagick (if installed)" -ForegroundColor Cyan
Write-Host "  magick $outputDir\temp_*.png $outputDir\code.ico" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Online Converter" -ForegroundColor Cyan
Write-Host "  1. Visit: https://convertio.co/png-ico/" -ForegroundColor White
Write-Host "  2. Upload: $outputDir\temp_256.png" -ForegroundColor White
Write-Host "  3. Select sizes: 16, 32, 48, 64, 128, 256" -ForegroundColor White
Write-Host "  4. Download and save as: $outputDir\code.ico" -ForegroundColor White
Write-Host ""
Write-Host "Option 3: Resource Hacker" -ForegroundColor Cyan
Write-Host "  1. Download: http://www.angusj.com/resourcehacker/" -ForegroundColor White
Write-Host "  2. Create new icon project" -ForegroundColor White
Write-Host "  3. Import all PNG files from: $outputDir" -ForegroundColor White
Write-Host "  4. Save as: $outputDir\code.ico" -ForegroundColor White
Write-Host ""

if (-not $KeepPNGs) {
    Write-Host "Note: PNG files will be kept in $outputDir for manual conversion" -ForegroundColor Gray
    Write-Host "Run with -KeepPNGs to keep them after ICO creation" -ForegroundColor Gray
}

