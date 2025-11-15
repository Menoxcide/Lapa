# LAPA Branding Changes

This document tracks all branding changes made to replace Void branding with LAPA branding.

## Summary

All Void icons, labels, and proprietary code references have been replaced with LAPA-specific branding throughout the codebase.

## Changes Made

### 1. Icon Files Created

Created LAPA-specific SVG icons in `media/` directory:
- `lapa-icon.svg` - Main LAPA icon with swarm visualization
- `lapa-icon-sm.svg` - Small version for UI elements
- `lapa-cube-noshadow.svg` - Isometric cube representing IDE
- `lapa-logo-noshadow.svg` - Professional logo
- `lapa-slice.svg` - Angular slice icon

### 2. CSS Updates

Updated all CSS files to reference LAPA icons:
- `src/vs/workbench/browser/parts/editor/media/editorgroupview.css` - Updated `.void-void-icon` to `.lapa-icon`
- `src/vs/workbench/browser/parts/banner/media/bannerpart.css` - Updated to `lapa-icon-sm.svg`
- `src/vs/workbench/contrib/welcomeGettingStarted/browser/media/gettingStarted.css` - Updated icon reference
- `src/vs/workbench/contrib/welcomeWalkthrough/browser/media/walkThroughPart.css` - Updated icon reference
- `src/vs/workbench/contrib/update/browser/media/releasenoteseditor.css` - Updated icon reference

### 3. TypeScript/React Updates

- `src/vs/workbench/contrib/void/browser/react/src/void-onboarding/VoidOnboarding.tsx` - Changed class from `@@void-void-icon` to `lapa-icon`
- `extensions/lapa-swarm/src/extension.ts` - Updated comments from "VoidChassis" to "LAPA IDE"
- `src/vs/workbench/contrib/void/common/lapaConfigService.ts` - Updated comments from "Void" to "LAPA IDE"

### 4. Configuration Files

- `product.json` - Updated all references:
  - `nameShort`: "LAPA-VOID" → "LAPA IDE"
  - `nameLong`: "LAPA-VOID: Swarm-Powered IDE" → "LAPA IDE: Swarm-Powered IDE"
  - All `lapa-void-*` → `lapa-ide-*`
  - All `void-*` references → `lapa-ide-*` or removed
  - `darwinBundleIdentifier`: "com.lapa.void" → "com.lapa.ide"
  - `win32AppUserModelId`: "LAPA.Void" → "com.lapa.ide"

### 5. Documentation

- `README.md`:
  - Title: "LAPA-VOID" → "LAPA IDE"
  - Icon reference: `void_icons/slice_of_void.png` → `media/lapa-slice.svg`
  - Removed references to "fork of Void IDE"
  - Updated all "Void IDE" → "LAPA IDE"
  - Updated installation instructions
  - Removed Void IDE acknowledgments

- `extensions/lapa-swarm/package.json`:
  - Description: "VoidChassis extension" → "LAPA IDE extension"

### 6. Icon Generation Scripts

Created scripts to generate binary icon formats:
- `scripts/generate-icons.sh` - Bash script for Linux/Mac
- `scripts/generate-icons.ps1` - PowerShell script for Windows

These scripts use ImageMagick or Inkscape to convert SVG icons to PNG format.

## Remaining Void References

Some references remain in upstream code that we've forked from. These are typically:
- Deep in the `src/vs/workbench/contrib/void/` directory (Void-specific features)
- URLs pointing to voideditor.com (update service, documentation links)
- Extension files (`open-remote-ssh`, `open-remote-wsl`) that download Void binaries

These can be updated incrementally as needed, but the core branding is now LAPA.

## Next Steps

1. Run `scripts/generate-icons.ps1` (Windows) or `scripts/generate-icons.sh` (Linux/Mac) to generate PNG versions
2. For Windows: Generate `.ico` files using Resource Hacker or similar tool
3. For macOS: Generate `.icns` files using `iconutil` or `png2icns`
4. Update any remaining voideditor.com URLs in Void-specific features if needed
5. Test that all icons display correctly in the IDE

## Icon Locations

- SVG sources: `media/`
- Browser media: `src/vs/workbench/browser/media/`
- Editor media: `src/vs/workbench/browser/parts/editor/media/`
- Windows resources: `resources/win32/` (needs .ico files)
- macOS resources: `resources/darwin/` (needs .icns files)
- Linux resources: `resources/linux/` (needs .png files)

