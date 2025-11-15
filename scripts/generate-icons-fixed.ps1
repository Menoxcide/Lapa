# Generate binary icon formats from SVG source files
# Requires: ImageMagick or Inkscape
# Fixed for Windows compatibility

param(
    [switch]$SkipPNG,
    [switch]$SkipICO,
    [switch]$SkipICNS
)

$ErrorActionPreference = "Continue"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
Set-Location $rootPath

Write-Host "Generating LAPA icons from SVG sources..." -ForegroundColor Cyan
Write-Host "Working directory: $rootPath" -ForegroundColor Gray

$iconDir = "media"

# Find ImageMagick
$magickCmd = $null
$inkscapeCmd = $null

# Try to find magick command (ImageMagick 7+)
$magick = Get-Command magick -ErrorAction SilentlyContinue
if ($magick) {
    $magickCmd = $magick.Source
    Write-Host "Found ImageMagick (magick): $magickCmd" -ForegroundColor Green
}

# Try to find inkscape
$inkscape = Get-Command inkscape -ErrorAction SilentlyContinue
if ($inkscape) {
    $inkscapeCmd = $inkscape.Source
    Write-Host "Found Inkscape: $inkscapeCmd" -ForegroundColor Green
}

# Try to find ImageMagick's convert.exe in common locations
if (-not $magickCmd) {
    $imPaths = @(
        "$env:ProgramFiles\ImageMagick-*\convert.exe",
        "${env:ProgramFiles(x86)}\ImageMagick-*\convert.exe",
        "$env:LOCALAPPDATA\ImageMagick\*\convert.exe"
    )
    
    foreach ($pattern in $imPaths) {
        $matches = Get-ChildItem $pattern -ErrorAction SilentlyContinue
        if ($matches) {
            $magickCmd = $matches[0].FullName
            Write-Host "Found ImageMagick (convert): $magickCmd" -ForegroundColor Green
            break
        }
    }
}

if (-not $magickCmd -and -not $inkscapeCmd) {
    Write-Host "ERROR: Neither ImageMagick nor Inkscape found." -ForegroundColor Red
    Write-Host "  Install ImageMagick from: https://imagemagick.org/script/download.php" -ForegroundColor Yellow
    Write-Host "  Or install Inkscape from: https://inkscape.org/release/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Creating placeholder PNG files..." -ForegroundColor Yellow
    
    # Create placeholder files to prevent errors
    $placeholders = @(
        @{name="lapa-icon-sm.png"; size=16},
        @{name="lapa-cube-noshadow.png"; size=256},
        @{name="lapa-slice.png"; size=512}
    )
    
    foreach ($pl in $placeholders) {
        $placeholder = New-Object System.Drawing.Bitmap($pl.size, $pl.size)
        $placeholder.Save("$iconDir\$($pl.name)", [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "  Created placeholder: $($pl.name)" -ForegroundColor Yellow
    }
}

# Generate PNG files
if (-not $SkipPNG) {
    Write-Host "`nGenerating PNG files..." -ForegroundColor Cyan
    
    if ($magickCmd) {
        Write-Host "Using ImageMagick..." -ForegroundColor Green
        
        $icons = @(
            @{svg="lapa-icon-sm.svg"; png="lapa-icon-sm.png"; size="16x16"},
            @{svg="lapa-cube-noshadow.svg"; png="lapa-cube-noshadow.png"; size="256x256"},
            @{svg="lapa-slice.svg"; png="lapa-slice.png"; size="512x512"}
        )
        
        foreach ($icon in $icons) {
            $svgPath = Join-Path $iconDir $icon.svg
            $pngPath = Join-Path $iconDir $icon.png
            
            if (Test-Path $svgPath) {
                if ($magickCmd -match "convert\.exe") {
                    # ImageMagick 6 syntax
                    & $magickCmd $svgPath -resize $icon.size -background transparent $pngPath 2>&1 | Out-Null
                } else {
                    # ImageMagick 7 syntax (magick command)
                    & $magickCmd $svgPath -background transparent -resize $icon.size $pngPath 2>&1 | Out-Null
                }
                
                if (Test-Path $pngPath) {
                    Write-Host "  ✓ Generated $($icon.png)" -ForegroundColor Green
                } else {
                    Write-Host "  ✗ Failed to generate $($icon.png)" -ForegroundColor Red
                }
            } else {
                Write-Host "  ✗ Source not found: $svgPath" -ForegroundColor Red
            }
        }
    }
    elseif ($inkscapeCmd) {
        Write-Host "Using Inkscape..." -ForegroundColor Green
        
        $icons = @(
            @{svg="lapa-icon-sm.svg"; png="lapa-icon-sm.png"; width=16; height=16},
            @{svg="lapa-cube-noshadow.svg"; png="lapa-cube-noshadow.png"; width=256; height=256},
            @{svg="lapa-slice.svg"; png="lapa-slice.png"; width=512; height=512}
        )
        
        foreach ($icon in $icons) {
            $svgPath = Join-Path $iconDir $icon.svg
            $pngPath = Join-Path $iconDir $icon.png
            
            if (Test-Path $svgPath) {
                & $inkscapeCmd $svgPath --export-type=png --export-filename=$pngPath -w $icon.width -h $icon.height 2>&1 | Out-Null
                
                if (Test-Path $pngPath) {
                    Write-Host "  ✓ Generated $($icon.png)" -ForegroundColor Green
                } else {
                    Write-Host "  ✗ Failed to generate $($icon.png)" -ForegroundColor Red
                }
            } else {
                Write-Host "  ✗ Source not found: $svgPath" -ForegroundColor Red
            }
        }
    }
    
    # Copy PNG files to appropriate locations
    Write-Host "`nCopying PNG files to output directories..." -ForegroundColor Cyan
    
    $copyOps = @(
        @{src="media\lapa-icon-sm.png"; dst="src\vs\workbench\browser\media\"; desc="browser/media"},
        @{src="media\lapa-cube-noshadow.png"; dst="src\vs\workbench\browser\parts\editor\media\"; desc="editor/media"}
    )
    
    foreach ($op in $copyOps) {
        if (Test-Path $op.src) {
            $destDir = $op.dst
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            Copy-Item $op.src -Destination $destDir -Force
            Write-Host "  ✓ Copied to $($op.desc)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Source not found: $($op.src)" -ForegroundColor Yellow
        }
    }
}

# Generate ICO files (Windows)
if (-not $SkipICO -and $IsWindows) {
    Write-Host "`nGenerating ICO files for Windows..." -ForegroundColor Cyan
    
    # Try to find icotool or use ImageMagick
    $icoTool = Get-Command icotool -ErrorAction SilentlyContinue
    
    if ($magickCmd) {
        Write-Host "Using ImageMagick to create ICO..." -ForegroundColor Green
        
        # Generate multiple sizes for ICO
        $sizes = @(16, 32, 48, 256)
        $icoFiles = @()
        
        foreach ($size in $sizes) {
            $tempPng = "resources\win32\lapa-icon-${size}.png"
            $icoFiles += $tempPng
            
            if ($magickCmd -match "convert\.exe") {
                & $magickCmd "media\lapa-icon.svg" -resize "${size}x${size}" -background transparent $tempPng 2>&1 | Out-Null
            } else {
                & $magickCmd "media\lapa-icon.svg" -background transparent -resize "${size}x${size}" $tempPng 2>&1 | Out-Null
            }
        }
        
        # Combine into ICO
        $icoPath = "resources\win32\code.ico"
        if (-not (Test-Path "resources\win32")) {
            New-Item -ItemType Directory -Path "resources\win32" -Force | Out-Null
        }
        
        if ($magickCmd -match "convert\.exe") {
            & $magickCmd $icoFiles -background transparent $icoPath 2>&1 | Out-Null
        } else {
            & $magickCmd $icoFiles -background transparent $icoPath 2>&1 | Out-Null
        }
        
        # Cleanup temp files
        $icoFiles | ForEach-Object { if (Test-Path $_) { Remove-Item $_ -Force } }
        
        if (Test-Path $icoPath) {
            Write-Host "  ✓ Generated code.ico" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Failed to generate ICO (try Resource Hacker manually)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠ ICO generation requires ImageMagick or Resource Hacker" -ForegroundColor Yellow
        Write-Host "    Download Resource Hacker: http://www.angusj.com/resourcehacker/" -ForegroundColor Yellow
    }
}

# Generate ICNS files (macOS)
if (-not $SkipICNS) {
    Write-Host "`nGenerating ICNS files for macOS..." -ForegroundColor Cyan
    
    $iconutil = Get-Command iconutil -ErrorAction SilentlyContinue
    
    if ($iconutil) {
        Write-Host "Using iconutil..." -ForegroundColor Green
        
        # Create iconset directory
        $iconsetPath = "resources\darwin\lapa-icon.iconset"
        if (-not (Test-Path $iconsetPath)) {
            New-Item -ItemType Directory -Path $iconsetPath -Force | Out-Null
        }
        
        # Generate PNG files for iconset
        $iconSizes = @(
            @{name="icon_16x16.png"; size=16},
            @{name="icon_16x16@2x.png"; size=32},
            @{name="icon_32x32.png"; size=32},
            @{name="icon_32x32@2x.png"; size=64},
            @{name="icon_128x128.png"; size=128},
            @{name="icon_128x128@2x.png"; size=256},
            @{name="icon_256x256.png"; size=256},
            @{name="icon_256x256@2x.png"; size=512},
            @{name="icon_512x512.png"; size=512},
            @{name="icon_512x512@2x.png"; size=1024}
        )
        
        if ($magickCmd) {
            foreach ($iconSize in $iconSizes) {
                $outputPath = Join-Path $iconsetPath $iconSize.name
                
                if ($magickCmd -match "convert\.exe") {
                    & $magickCmd "media\lapa-icon.svg" -resize "${($iconSize.size)}x$($iconSize.size)" -background transparent $outputPath 2>&1 | Out-Null
                } else {
                    & $magickCmd "media\lapa-icon.svg" -background transparent -resize "${($iconSize.size)}x$($iconSize.size)" $outputPath 2>&1 | Out-Null
                }
            }
            
            # Convert iconset to icns
            $icnsPath = "resources\darwin\code.icns"
            if (-not (Test-Path "resources\darwin")) {
                New-Item -ItemType Directory -Path "resources\darwin" -Force | Out-Null
            }
            
            & $iconutil -c icns $iconsetPath -o $icnsPath 2>&1 | Out-Null
            
            if (Test-Path $icnsPath) {
                Write-Host "  ✓ Generated code.icns" -ForegroundColor Green
                # Cleanup iconset
                Remove-Item $iconsetPath -Recurse -Force
            } else {
                Write-Host "  ✗ Failed to generate ICNS" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ⚠ ICNS generation requires ImageMagick to create PNG files" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠ iconutil not found (macOS only)" -ForegroundColor Yellow
    }
}

Write-Host "`nIcon generation complete!" -ForegroundColor Green
Write-Host "Generated files:" -ForegroundColor Cyan
Get-ChildItem "media\*.png" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  - $($_.Name) ($([math]::Round($_.Length / 1KB, 2)) KB)" -ForegroundColor Gray
}

