# Release Notes Template

## Version: [VERSION]
## Release Date: [DATE]

### Installation

#### VSIX (Cursor Extension)
- **File**: `lapa-ide-v[VERSION].vsix`
- **Size**: <400MB
- **Installation**: 
  1. Open Cursor IDE
  2. Navigate to Extensions view (Ctrl+Shift+X)
  3. Click "..." menu → "Install from VSIX..."
  4. Select the VSIX file
  5. Restart Cursor

#### Electron Standalone
- **Windows**: `void-ide-v[VERSION]-win32-x64.exe` (or .tar.gz)
- **macOS**: `void-ide-v[VERSION]-darwin-x64.dmg` (or .tar.gz)
- **Linux**: `void-ide-v[VERSION]-linux-x64.tar.gz`
- **Size**: <400MB per platform
- **Installation**: Extract and run

#### Docker Swarm
- **Image**: `void-ide-headless:v[VERSION]`
- **File**: `void-ide-headless-v[VERSION].tar.gz`
- **Load**: `docker load < void-ide-headless-v[VERSION].tar.gz`
- **Run**: `docker run -p 8080:8080 void-ide-headless:v[VERSION]`
- **Size**: <400MB

### Validation
- ✅ All packages <400MB
- ✅ Installation time <2 minutes
- ✅ All tests passing
- ✅ Zero lint errors

### Changes
- [List of changes for this release]

### Known Issues
- [List any known issues]

### Upgrade Notes
- [Any special upgrade instructions]

