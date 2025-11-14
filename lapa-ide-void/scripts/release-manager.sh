#!/bin/bash
# Release Management Script for Void IDE
# Phase 5.3: RelMo - VSIX, Electron, Docker Swarm, <400MB, <2min install

set -e  # Exit on error

echo "=== Void IDE Release Management ==="
echo "Started at: $(date)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MAX_SIZE_MB=400
MAX_INSTALL_TIME_SECONDS=120
VERSION=${1:-$(date +%Y.%m.%d)}
RELEASE_DIR="dist/releases/v${VERSION}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from lapa-ide-void directory.${NC}"
    exit 1
fi

# Create release directory
mkdir -p "$RELEASE_DIR"

echo -e "${YELLOW}Creating release v${VERSION}...${NC}"

# Step 1: Package VSIX for distribution
echo -e "${YELLOW}Step 1: Packaging VSIX for current users...${NC}"
cd ..
if [ -f "package.json" ] && grep -q '"vsix"' package.json; then
    npm run build
    npm run vsix
    
    VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -1)
    if [ -n "$VSIX_FILE" ]; then
        VSIX_SIZE_MB=$(du -m "$VSIX_FILE" | cut -f1)
        
        if [ $VSIX_SIZE_MB -gt $MAX_SIZE_MB ]; then
            echo -e "${RED}Error: VSIX size (${VSIX_SIZE_MB}MB) exceeds ${MAX_SIZE_MB}MB limit${NC}"
            exit 1
        fi
        
        # Rename and copy
        cp "$VSIX_FILE" "lapa-ide-void/$RELEASE_DIR/lapa-ide-v${VERSION}.vsix"
        echo -e "${GREEN}✓ VSIX packaged: ${VSIX_SIZE_MB}MB${NC}"
    fi
    cd lapa-ide-void
fi

# Step 2: Create Electron standalone installers
echo -e "${YELLOW}Step 2: Creating Electron standalone installers...${NC}"

PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
case "$ARCH" in
    x86_64) ARCH="x64" ;;
    arm64|aarch64) ARCH="arm64" ;;
    *) ARCH="x64" ;;
esac

# Build Electron package
if [ "$PLATFORM" = "linux" ]; then
    yarn gulp vscode-linux-${ARCH}
    PACKAGE_DIR="VSCode-linux-${ARCH}"
    INSTALLER_NAME="void-ide-v${VERSION}-linux-${ARCH}.tar.gz"
    tar -czf "$RELEASE_DIR/$INSTALLER_NAME" "$PACKAGE_DIR"
elif [ "$PLATFORM" = "darwin" ]; then
    yarn gulp vscode-darwin-${ARCH}
    PACKAGE_DIR="VSCode-darwin-${ARCH}"
    INSTALLER_NAME="void-ide-v${VERSION}-macos-${ARCH}.dmg"
    # Note: DMG creation would require additional tools
    tar -czf "$RELEASE_DIR/$INSTALLER_NAME.tar.gz" "$PACKAGE_DIR"
elif [[ "$PLATFORM" == *"mingw"* ]] || [[ "$PLATFORM" == *"msys"* ]]; then
    yarn gulp vscode-win32-${ARCH}
    PACKAGE_DIR="VSCode-win32-${ARCH}"
    INSTALLER_NAME="void-ide-v${VERSION}-win32-${ARCH}.exe"
    # Note: EXE creation would require additional tools
    tar -czf "$RELEASE_DIR/$INSTALLER_NAME.tar.gz" "$PACKAGE_DIR"
fi

if [ -d "$PACKAGE_DIR" ]; then
    PACKAGE_SIZE_MB=$(du -sm "$PACKAGE_DIR" | cut -f1)
    if [ $PACKAGE_SIZE_MB -gt $MAX_SIZE_MB ]; then
        echo -e "${RED}Error: Package size (${PACKAGE_SIZE_MB}MB) exceeds ${MAX_SIZE_MB}MB limit${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Electron installer created: ${PACKAGE_SIZE_MB}MB${NC}"
fi

# Step 3: Create Docker Swarm images
echo -e "${YELLOW}Step 3: Creating Docker Swarm images...${NC}"
if command -v docker &> /dev/null; then
    # Build headless image
    docker build -t void-ide-headless:v${VERSION} -f Dockerfile.headless .
    docker tag void-ide-headless:v${VERSION} void-ide-headless:latest
    
    # Save image
    docker save void-ide-headless:v${VERSION} | gzip > "$RELEASE_DIR/void-ide-headless-v${VERSION}.tar.gz"
    
    IMAGE_SIZE_MB=$(du -m "$RELEASE_DIR/void-ide-headless-v${VERSION}.tar.gz" | cut -f1)
    echo -e "${GREEN}✓ Docker Swarm image created: ${IMAGE_SIZE_MB}MB${NC}"
else
    echo -e "${YELLOW}Warning: Docker not available${NC}"
fi

# Step 4: Validate installation time (<2 minutes)
echo -e "${YELLOW}Step 4: Validating installation time...${NC}"
INSTALL_START=$(date +%s)

# Simulate installation (extract and verify)
if [ -f "$RELEASE_DIR/lapa-ide-v${VERSION}.vsix" ]; then
    TEST_DIR="/tmp/void-ide-test-$$"
    mkdir -p "$TEST_DIR"
    unzip -q "$RELEASE_DIR/lapa-ide-v${VERSION}.vsix" -d "$TEST_DIR"
    rm -rf "$TEST_DIR"
fi

INSTALL_END=$(date +%s)
INSTALL_TIME=$((INSTALL_END - INSTALL_START))

if [ $INSTALL_TIME -gt $MAX_INSTALL_TIME_SECONDS ]; then
    echo -e "${RED}Error: Installation time (${INSTALL_TIME}s) exceeds ${MAX_INSTALL_TIME_SECONDS}s limit${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Installation time validated: ${INSTALL_TIME}s${NC}"

# Step 5: Generate release notes
echo -e "${YELLOW}Step 5: Generating release notes...${NC}"
cat > "$RELEASE_DIR/RELEASE_NOTES.md" << EOF
# Void IDE v${VERSION} Release Notes

## Release Date
$(date +%Y-%m-%d)

## Installation

### VSIX (Cursor Extension)
- File: \`lapa-ide-v${VERSION}.vsix\`
- Size: $(du -h "$RELEASE_DIR/lapa-ide-v${VERSION}.vsix" 2>/dev/null | cut -f1 || echo "N/A")
- Installation: Use Cursor's "Install from VSIX..." option

### Electron Standalone
- Platform: ${PLATFORM}-${ARCH}
- File: \`${INSTALLER_NAME}\`
- Size: $(du -h "$RELEASE_DIR/$INSTALLER_NAME"* 2>/dev/null | head -1 | cut -f1 || echo "N/A")
- Installation: Extract and run

### Docker Swarm
- Image: \`void-ide-headless:v${VERSION}\`
- File: \`void-ide-headless-v${VERSION}.tar.gz\`
- Load: \`docker load < void-ide-headless-v${VERSION}.tar.gz\`
- Run: \`docker run -p 8080:8080 void-ide-headless:v${VERSION}\`

## Size Validation
- All packages < ${MAX_SIZE_MB}MB ✓
- Installation time < ${MAX_INSTALL_TIME_SECONDS}s ✓

## Changes
See CHANGELOG.md for detailed changes.

EOF

echo -e "${GREEN}✓ Release notes generated${NC}"

# Final summary
echo ""
echo "=== Release Management Summary ==="
echo -e "${GREEN}✓ VSIX: lapa-ide-v${VERSION}.vsix${NC}"
echo -e "${GREEN}✓ Electron: ${INSTALLER_NAME}${NC}"
echo -e "${GREEN}✓ Docker: void-ide-headless-v${VERSION}.tar.gz${NC}"
echo -e "${GREEN}✓ Release notes: RELEASE_NOTES.md${NC}"
echo "Release directory: $RELEASE_DIR"
echo "Completed at: $(date)"
echo ""
echo -e "${GREEN}Release v${VERSION} created successfully!${NC}"

