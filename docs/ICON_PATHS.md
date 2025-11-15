# LAPA Icon Paths Reference

This document provides a reference for all LAPA icon file locations and their usage.

## Icon File Locations

### SVG Source Files (in `media/`)
- `media/lapa-icon.svg` - Main LAPA icon with swarm visualization
- `media/lapa-icon-sm.svg` - Small version for UI elements (16x16)
- `media/lapa-cube-noshadow.svg` - Isometric cube representing IDE
- `media/lapa-logo-noshadow.svg` - Professional logo
- `media/lapa-slice.svg` - Angular slice icon

### Deployed Icon Files

#### Browser Media (`src/vs/workbench/browser/media/`)
- `lapa-icon-sm.svg` - Used in:
  - Welcome/getting started pages
  - Walkthrough pages
  - Banner parts
  - Release notes editor
- `lapa-cube-noshadow.svg` - Used in editor group watermarks
- `lapa-icon.svg` - Full-size icon for larger displays

#### Editor Media (`src/vs/workbench/browser/parts/editor/media/`)
- `lapa-cube-noshadow.svg` - Editor group watermark (empty editor groups)

## CSS Path References

### From `src/vs/workbench/browser/parts/editor/media/editorgroupview.css`
Path: `../../../../browser/media/lapa-cube-noshadow.svg`
- Goes up 4 levels: `editor/media` → `parts` → `browser` → `workbench` → `vs`
- Then down: `vs` → `workbench` → `browser` → `media`
- Final: `src/vs/workbench/browser/media/lapa-cube-noshadow.svg` ✅

### From `src/vs/workbench/contrib/welcomeGettingStarted/browser/media/gettingStarted.css`
Path: `../../../../browser/media/lapa-icon-sm.svg`
- Goes up 4 levels: `gettingStarted/media` → `browser` → `contrib` → `workbench` → `vs`
- Then down: `vs` → `workbench` → `browser` → `media`
- Final: `src/vs/workbench/browser/media/lapa-icon-sm.svg` ✅

### From `src/vs/workbench/contrib/welcomeWalkthrough/browser/media/walkThroughPart.css`
Path: `../../../../browser/media/lapa-icon-sm.svg`
- Same relative path structure as above ✅

### From `src/vs/workbench/contrib/update/browser/media/releasenoteseditor.css`
Path: `../../../../browser/media/lapa-icon-sm.svg`
- Same relative path structure as above ✅

### From `src/vs/workbench/browser/parts/banner/media/bannerpart.css`
Path: `../../../../browser/media/lapa-icon-sm.svg`
- Goes up 4 levels: `banner/media` → `parts` → `browser` → `workbench` → `vs`
- Then down: `vs` → `workbench` → `browser` → `media`
- Final: `src/vs/workbench/browser/media/lapa-icon-sm.svg` ✅

## Icon Generation

To generate PNG versions from SVG:

**Windows:**
```powershell
cd lapa-ide-void
.\scripts\generate-icons.ps1
```

**Linux/Mac:**
```bash
cd lapa-ide-void
chmod +x scripts/generate-icons.sh
./scripts/generate-icons.sh
```

## Required Tools

For PNG generation:
- ImageMagick (`magick` command) OR
- Inkscape (`inkscape` command)

For Windows .ico files:
- Resource Hacker or
- `icotool` (from libicns)

For macOS .icns files:
- `iconutil` (built-in) or
- `png2icns`

## Notes

- All icons are currently in SVG format which provides excellent quality at any size
- PNG versions are optional but may be needed for certain build processes
- The CSS files correctly reference the SVG files using relative paths
- Old void icons have been removed from the codebase

