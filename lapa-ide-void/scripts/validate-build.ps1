# Build Validation Script for Void IDE (PowerShell)
# Phase 5 I10: Final Integration & Validation

$ErrorActionPreference = "Stop"

Write-Host "=== Void IDE Build Validation ===" -ForegroundColor Cyan
Write-Host "Started at: $(Get-Date)"

$Errors = 0
$Warnings = 0

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run from lapa-ide-void directory." -ForegroundColor Red
    exit 1
}

# Validation 1: Build output exists
Write-Host "Validation 1: Checking build output..." -ForegroundColor Yellow
if (-not (Test-Path "out")) {
    Write-Host "✗ Build output directory 'out' not found" -ForegroundColor Red
    $Errors++
} else {
    Write-Host "✓ Build output directory exists" -ForegroundColor Green
}

# Validation 2: No TypeScript errors in build
Write-Host "Validation 2: Checking for TypeScript errors..." -ForegroundColor Yellow
yarn compile 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ TypeScript compilation errors found" -ForegroundColor Red
    $Errors++
} else {
    Write-Host "✓ No TypeScript errors" -ForegroundColor Green
}

# Validation 3: Lint checks
Write-Host "Validation 3: Running lint checks..." -ForegroundColor Yellow
yarn eslint 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ESLint errors found" -ForegroundColor Red
    $Errors++
} else {
    Write-Host "✓ ESLint checks passed" -ForegroundColor Green
}

yarn stylelint 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Stylelint warnings found" -ForegroundColor Yellow
    $Warnings++
} else {
    Write-Host "✓ Stylelint checks passed" -ForegroundColor Green
}

# Validation 4: Test suite
Write-Host "Validation 4: Running test suite..." -ForegroundColor Yellow
yarn test-node 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Tests failed" -ForegroundColor Red
    $Errors++
} else {
    Write-Host "✓ Tests passing" -ForegroundColor Green
}

# Validation 5: Build size check
Write-Host "Validation 5: Checking build size..." -ForegroundColor Yellow
if (Test-Path "out") {
    $BuildSizeMB = [math]::Round((Get-ChildItem -Path "out" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    Write-Host "Build size: ${BuildSizeMB}MB"
    
    if ($BuildSizeMB -gt 500) {
        Write-Host "⚠ Build size (${BuildSizeMB}MB) is large" -ForegroundColor Yellow
        $Warnings++
    } else {
        Write-Host "✓ Build size acceptable" -ForegroundColor Green
    }
}

# Validation 6: Extension integration
Write-Host "Validation 6: Checking extension integration..." -ForegroundColor Yellow
if (Test-Path "extensions/lapa-swarm") {
    Write-Host "✓ LAPA Swarm extension present" -ForegroundColor Green
    
    if (Test-Path "extensions/lapa-swarm/package.json") {
        Write-Host "✓ Extension package.json exists" -ForegroundColor Green
    } else {
        Write-Host "✗ Extension package.json missing" -ForegroundColor Red
        $Errors++
    }
} else {
    Write-Host "⚠ LAPA Swarm extension not found" -ForegroundColor Yellow
    $Warnings++
}

# Validation 7: Scripts exist
Write-Host "Validation 7: Checking build scripts..." -ForegroundColor Yellow
$Scripts = @("scripts/daily-compile.ps1", "scripts/pack-weekly.ps1", "scripts/release-manager.sh")
foreach ($script in $Scripts) {
    if (Test-Path $script) {
        Write-Host "✓ $script exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $script missing" -ForegroundColor Red
        $Errors++
    }
}

# Final summary
Write-Host ""
Write-Host "=== Build Validation Summary ===" -ForegroundColor Cyan
Write-Host "Errors: $Errors" -ForegroundColor $(if ($Errors -gt 0) { "Red" } else { "Green" })
Write-Host "Warnings: $Warnings" -ForegroundColor $(if ($Warnings -gt 0) { "Yellow" } else { "Green" })
Write-Host "Completed at: $(Get-Date)"
Write-Host ""

if ($Errors -gt 0) {
    Write-Host "Build validation FAILED with $Errors error(s)" -ForegroundColor Red
    exit 1
} elseif ($Warnings -gt 0) {
    Write-Host "Build validation PASSED with $Warnings warning(s)" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "Build validation PASSED with no errors or warnings" -ForegroundColor Green
    exit 0
}

