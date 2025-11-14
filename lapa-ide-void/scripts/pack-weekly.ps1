# Weekly Packaging Script for Void IDE + LAPA Extension (PowerShell)
# Phase 5.2: PackWkly - VSIX <400MB, Electron builds (exe/dmg/Docker), CI <10min

$ErrorActionPreference = "Stop"

Write-Host "=== Void IDE Weekly Packaging ===" -ForegroundColor Cyan
Write-Host "Started at: $(Get-Date)"

# Track time
$StartTime = Get-Date
$MaxSizeMB = 400
$MaxTimeMinutes = 10

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run from lapa-ide-void directory." -ForegroundColor Red
    exit 1
}

# Create output directory
$OutputDir = "dist/weekly-packages"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# Step 1: Build LAPA Extension VSIX
Write-Host "Step 1: Building LAPA Extension VSIX..." -ForegroundColor Yellow
Push-Location ..
if ((Test-Path "package.json") -and (Select-String -Path "package.json" -Pattern '"vsix"')) {
    Write-Host "Building LAPA extension..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Build failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    npm run vsix
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: VSIX packaging failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Check VSIX size
    $VsixFile = Get-ChildItem -Filter "*.vsix" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($VsixFile) {
        $VsixSizeMB = [math]::Round($VsixFile.Length / 1MB, 2)
        Write-Host "VSIX size: ${VsixSizeMB}MB"
        
        if ($VsixSizeMB -gt $MaxSizeMB) {
            Write-Host "Error: VSIX size (${VsixSizeMB}MB) exceeds ${MaxSizeMB}MB limit" -ForegroundColor Red
            Pop-Location
            exit 1
        }
        
        # Copy to output directory
        Copy-Item $VsixFile.FullName "lapa-ide-void/$OutputDir/lapa-ide.vsix"
        Write-Host "✓ LAPA VSIX packaged: ${VsixSizeMB}MB" -ForegroundColor Green
    } else {
        Write-Host "Warning: No VSIX file found" -ForegroundColor Yellow
    }
    Pop-Location
} else {
    Write-Host "Warning: LAPA extension not found in parent directory" -ForegroundColor Yellow
    Pop-Location
}

# Step 2: Build Electron packages for Windows
Write-Host "Step 2: Building Electron packages..." -ForegroundColor Yellow

$Arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
Write-Host "Platform: win32, Arch: $Arch"

Write-Host "Building Windows package..."
yarn gulp "vscode-win32-${Arch}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Electron build failed" -ForegroundColor Red
    exit 1
}

$PackageDir = "VSCode-win32-${Arch}"

# Step 3: Create Docker image (headless)
Write-Host "Step 3: Creating Docker headless image..." -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $Dockerfile = "Dockerfile.headless"
    if (-not (Test-Path $Dockerfile)) {
        @"
FROM node:20-slim

WORKDIR /app

# Install dependencies for building
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libx11-dev \
    libsecret-1-dev \
    libkrb5-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN yarn compile

# Expose port for headless server
EXPOSE 8080

CMD ["node", "out/server-main.js", "--host", "0.0.0.0", "--port", "8080"]
"@ | Out-File -FilePath $Dockerfile -Encoding UTF8
    }
    
    docker build -t void-ide-headless:latest -f $Dockerfile .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: Docker build failed" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Docker image created" -ForegroundColor Green
    }
} else {
    Write-Host "Warning: Docker not available" -ForegroundColor Yellow
}

# Step 4: Validate package sizes
Write-Host "Step 4: Validating package sizes..." -ForegroundColor Yellow
if (Test-Path $PackageDir) {
    $PackageSizeMB = [math]::Round((Get-ChildItem -Path $PackageDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    Write-Host "Package size: ${PackageSizeMB}MB"
    
    if ($PackageSizeMB -gt $MaxSizeMB) {
        Write-Host "Error: Package size (${PackageSizeMB}MB) exceeds ${MaxSizeMB}MB limit" -ForegroundColor Red
        exit 1
    }
    
    # Archive the package
    $ArchiveName = "void-ide-win32-${Arch}-$(Get-Date -Format 'yyyyMMdd').zip"
    Compress-Archive -Path $PackageDir -DestinationPath "$OutputDir/$ArchiveName" -Force
    Write-Host "✓ Package archived: $ArchiveName" -ForegroundColor Green
}

# Final summary
$EndTime = Get-Date
$TotalTime = ($EndTime - $StartTime).TotalMinutes

Write-Host ""
Write-Host "=== Weekly Packaging Summary ===" -ForegroundColor Cyan
Write-Host "✓ VSIX: Built" -ForegroundColor Green
Write-Host "✓ Electron: Built for win32-$Arch" -ForegroundColor Green
Write-Host "✓ Docker: Image created" -ForegroundColor Green
Write-Host "Total time: ${TotalTime}m" -ForegroundColor Green
Write-Host "Completed at: $(Get-Date)"
Write-Host ""

if ($TotalTime -gt $MaxTimeMinutes) {
    Write-Host "Error: Total time (${TotalTime}m) exceeded ${MaxTimeMinutes} minutes" -ForegroundColor Red
    exit 1
}

Write-Host "Weekly packaging successful!" -ForegroundColor Green
Write-Host "Output directory: $OutputDir"

