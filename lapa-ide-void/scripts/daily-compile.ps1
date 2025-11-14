# Daily Compilation Script for Void IDE (PowerShell)
# Phase 5.1: CompileDaily - YarnComp8m, Lint0, Test100%

$ErrorActionPreference = "Stop"

Write-Host "=== Void IDE Daily Compilation ===" -ForegroundColor Cyan
Write-Host "Started at: $(Get-Date)"

# Track time
$StartTime = Get-Date

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run from lapa-ide-void directory." -ForegroundColor Red
    exit 1
}

# Step 1: Install dependencies if needed
Write-Host "Step 1: Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules") -or (Get-Item "package.json").LastWriteTime -gt (Get-Item "node_modules" -ErrorAction SilentlyContinue).LastWriteTime) {
    Write-Host "Installing dependencies with yarn..."
    yarn install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Dependencies up to date."
}

# Step 2: Compile with yarn
Write-Host "Step 2: Compiling with yarn..." -ForegroundColor Yellow
$CompileStart = Get-Date
yarn compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Compilation failed" -ForegroundColor Red
    exit 1
}
$CompileEnd = Get-Date
$CompileTime = ($CompileEnd - $CompileStart).TotalSeconds

if ($CompileTime -gt 480) {
    Write-Host "Warning: Compilation took ${CompileTime}s (>8 minutes)" -ForegroundColor Red
    exit 1
} else {
    Write-Host "Compilation completed in ${CompileTime}s" -ForegroundColor Green
}

# Step 3: Lint check (must be zero errors)
Write-Host "Step 3: Running lint checks..." -ForegroundColor Yellow
$LintStart = Get-Date
yarn eslint
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: ESLint check failed with errors!" -ForegroundColor Red
    exit 1
}

yarn stylelint
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Stylelint check failed with errors!" -ForegroundColor Red
    exit 1
}

$LintEnd = Get-Date
$LintTime = ($LintEnd - $LintStart).TotalSeconds
Write-Host "Lint checks passed (0 errors) in ${LintTime}s" -ForegroundColor Green

# Step 4: Run tests (must be 100% pass)
Write-Host "Step 4: Running tests..." -ForegroundColor Yellow
$TestStart = Get-Date

# Run node tests
yarn test-node
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Node tests failed!" -ForegroundColor Red
    exit 1
}

# Run browser tests if available
if (Test-Path "test/unit/browser/index.js") {
    yarn test-browser-no-install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Browser tests failed!" -ForegroundColor Red
        exit 1
    }
}

$TestEnd = Get-Date
$TestTime = ($TestEnd - $TestStart).TotalSeconds
Write-Host "All tests passed (100%) in ${TestTime}s" -ForegroundColor Green

# Final summary
$EndTime = Get-Date
$TotalTime = ($EndTime - $StartTime).TotalSeconds

Write-Host ""
Write-Host "=== Daily Compilation Summary ===" -ForegroundColor Cyan
Write-Host "✓ Compilation: ${CompileTime}s" -ForegroundColor Green
Write-Host "✓ Lint: ${LintTime}s (0 errors)" -ForegroundColor Green
Write-Host "✓ Tests: ${TestTime}s (100% pass)" -ForegroundColor Green
Write-Host "Total time: ${TotalTime}s" -ForegroundColor Green
Write-Host "Completed at: $(Get-Date)"
Write-Host ""

if ($TotalTime -gt 480) {
    Write-Host "Warning: Total time exceeded 8 minutes" -ForegroundColor Yellow
    exit 1
}

Write-Host "Daily compilation successful!" -ForegroundColor Green

