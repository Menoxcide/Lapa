# Release Cleanup Guide

## Files to Exclude from GitHub

### Build Artifacts (Already in .gitignore)
- `dist/`, `dist-*/`, `out/`, `out-*/`, `build/`
- `extension/dist/` (compiled extension)
- `lapa-ide-void/node_modules/`
- `lapa-ide-void/build/`
- `*.vsix` files (except in releases/)
- `*.exe`, `*.dmg`, `*.deb`, `*.rpm`, `*.AppImage`, `*.snap`

### Logs and Temporary Files
- `*.log` files (firebase-debug.log, etc.)
- `logs/` directories
- `test-report-*.json` (temporary test reports)

### Executable Installers
- `python-installer.exe`
- `vs_buildtools.exe`
- Any other `.exe` installers

### User Data and Secrets
- `.lapa/` (user data directory)
- `config/production.json` (may contain secrets)
- Any files with `.secret`, `.private` extensions
- Environment files: `.env`, `.env.local`, `.env.production`

### System Files
- `.DS_Store`, `Thumbs.db`
- `.vscode/`, `.idea/` (IDE settings)
- `*.swp`, `*.swo` (editor swap files)

## Files to Keep on GitHub

### Source Code ✅
- All TypeScript/JavaScript source files
- All React/TSX components
- All configuration files (package.json, tsconfig.json, etc.)
- All test files (they're part of the codebase)

### Documentation ✅
- All markdown files in `docs/`
- README files
- LICENSE files
- CHANGELOG.md, RELEASE_NOTES.md

### Configuration Templates ✅
- Configuration examples (without secrets)
- Build scripts
- GitHub Actions workflows

### Resources ✅
- Icons, images, media files
- Static assets needed for the IDE

## Recommended Action

The current `.gitignore` files are comprehensive and should exclude all necessary files. However, verify these specific files are excluded:

1. Check if `firebase-debug.log` is committed (should be excluded)
2. Check if `python-installer.exe` is committed (should be excluded)
3. Check if `vs_buildtools.exe` is committed (should be excluded)
4. Check if `lapa-core-1.2.0.vsix` is committed (should be excluded)
5. Check if `test-report-phase17-18.json` is committed (should be excluded)
6. Check if `config/production.json` contains secrets (if yes, exclude it)

## Final Verification

Before final commit, run:
```bash
# Check for large files
find . -type f -size +10M -not -path "./.git/*" -not -path "./node_modules/*"

# Check for potential secrets
grep -r "SECRET\|PASSWORD\|API_KEY" --include="*.json" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v ".git"

# Check for build artifacts
find . -type d -name "dist" -o -name "out" -o -name "build" | grep -v node_modules | grep -v ".git"
```

## Decision: Include Source Files

**Recommendation**: ✅ **Include all source files on GitHub**

**Rationale**:
1. **Open Source Philosophy**: The project is MIT licensed and should be fully open source
2. **Community Contribution**: Source code enables community contributions
3. **Transparency**: Builds trust with users and potential customers
4. **Free Tier**: Free tier is fully functional, so source code doesn't compromise revenue
5. **Premium Features**: Premium features are gated via license checks, not code obfuscation

**What to Exclude**:
- Build artifacts (already in .gitignore)
- User data (already in .gitignore)
- Secrets (already in .gitignore)
- Large binaries (already in .gitignore)

## Final Checklist

Before release commit:
- [ ] All source files present
- [ ] All documentation present
- [ ] No secrets in repository
- [ ] No build artifacts
- [ ] No user data
- [ ] No large binaries
- [ ] .gitignore comprehensive
- [ ] README complete
- [ ] LICENSE present
- [ ] Release notes prepared

