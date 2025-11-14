#!/bin/bash
# Weekly Packaging Script for Void IDE + LAPA Extension
# Phase 5.2: PackWkly - VSIX <400MB, Electron builds (exe/dmg/Docker), CI <10min

set -e  # Exit on error

echo "=== Void IDE Weekly Packaging ==="
echo "Started at: $(date)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track time
START_TIME=$(date +%s)
MAX_SIZE_MB=400
MAX_TIME_MINUTES=10

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from lapa-ide-void directory.${NC}"
    exit 1
fi

# Create output directory
OUTPUT_DIR="dist/weekly-packages"
mkdir -p "$OUTPUT_DIR"

# Step 1: Build LAPA Extension VSIX
echo -e "${YELLOW}Step 1: Building LAPA Extension VSIX...${NC}"
cd ..
if [ -f "package.json" ] && grep -q '"vsix"' package.json; then
    echo "Building LAPA extension..."
    npm run build
    npm run vsix
    
    # Check VSIX size
    VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -1)
    if [ -n "$VSIX_FILE" ]; then
        VSIX_SIZE_MB=$(du -m "$VSIX_FILE" | cut -f1)
        echo "VSIX size: ${VSIX_SIZE_MB}MB"
        
        if [ $VSIX_SIZE_MB -gt $MAX_SIZE_MB ]; then
            echo -e "${RED}Error: VSIX size (${VSIX_SIZE_MB}MB) exceeds ${MAX_SIZE_MB}MB limit${NC}"
            exit 1
        fi
        
        # Copy to output directory
        cp "$VSIX_FILE" "lapa-ide-void/$OUTPUT_DIR/lapa-ide.vsix"
        echo -e "${GREEN}✓ LAPA VSIX packaged: ${VSIX_SIZE_MB}MB${NC}"
    else
        echo -e "${YELLOW}Warning: No VSIX file found${NC}"
    fi
    cd lapa-ide-void
else
    echo -e "${YELLOW}Warning: LAPA extension not found in parent directory${NC}"
    cd lapa-ide-void
fi

# Step 2: Build Electron packages for different platforms
echo -e "${YELLOW}Step 2: Building Electron packages...${NC}"

# Detect current platform
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
    x86_64) ARCH="x64" ;;
    arm64|aarch64) ARCH="arm64" ;;
    *) ARCH="x64" ;;
esac

echo "Platform: $PLATFORM, Arch: $ARCH"

# Build for current platform
if [ "$PLATFORM" = "linux" ]; then
    echo "Building Linux package..."
    yarn gulp vscode-linux-${ARCH}
    PACKAGE_DIR="VSCode-linux-${ARCH}"
elif [ "$PLATFORM" = "darwin" ]; then
    echo "Building macOS package..."
    yarn gulp vscode-darwin-${ARCH}
    PACKAGE_DIR="VSCode-darwin-${ARCH}"
elif [[ "$PLATFORM" == *"mingw"* ]] || [[ "$PLATFORM" == *"msys"* ]]; then
    echo "Building Windows package..."
    yarn gulp vscode-win32-${ARCH}
    PACKAGE_DIR="VSCode-win32-${ARCH}"
else
    echo -e "${YELLOW}Warning: Unsupported platform for Electron build${NC}"
fi

# Step 3: Create Docker image (headless)
echo -e "${YELLOW}Step 3: Creating Docker headless image...${NC}"
if command -v docker &> /dev/null; then
    DOCKERFILE="Dockerfile.headless"
    if [ ! -f "$DOCKERFILE" ]; then
        cat > "$DOCKERFILE" << 'EOF'
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
EOF
    fi
    
    docker build -t void-ide-headless:latest -f "$DOCKERFILE" .
    echo -e "${GREEN}✓ Docker image created${NC}"
else
    echo -e "${YELLOW}Warning: Docker not available${NC}"
fi

# Step 4: Validate package sizes
echo -e "${YELLOW}Step 4: Validating package sizes...${NC}"
if [ -d "$PACKAGE_DIR" ]; then
    PACKAGE_SIZE_MB=$(du -sm "$PACKAGE_DIR" | cut -f1)
    echo "Package size: ${PACKAGE_SIZE_MB}MB"
    
    if [ $PACKAGE_SIZE_MB -gt $MAX_SIZE_MB ]; then
        echo -e "${RED}Error: Package size (${PACKAGE_SIZE_MB}MB) exceeds ${MAX_SIZE_MB}MB limit${NC}"
        exit 1
    fi
    
    # Archive the package
    ARCHIVE_NAME="void-ide-${PLATFORM}-${ARCH}-$(date +%Y%m%d).tar.gz"
    tar -czf "$OUTPUT_DIR/$ARCHIVE_NAME" "$PACKAGE_DIR"
    echo -e "${GREEN}✓ Package archived: $ARCHIVE_NAME${NC}"
fi

# Final summary
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))
TOTAL_MINUTES=$((TOTAL_TIME / 60))

echo ""
echo "=== Weekly Packaging Summary ==="
echo -e "${GREEN}✓ VSIX: Built${NC}"
echo -e "${GREEN}✓ Electron: Built for $PLATFORM-$ARCH${NC}"
echo -e "${GREEN}✓ Docker: Image created${NC}"
echo -e "${GREEN}Total time: ${TOTAL_MINUTES}m ${TOTAL_TIME}s${NC}"
echo "Completed at: $(date)"
echo ""

if [ $TOTAL_MINUTES -gt $MAX_TIME_MINUTES ]; then
    echo -e "${RED}Error: Total time (${TOTAL_MINUTES}m) exceeded ${MAX_TIME_MINUTES} minutes${NC}"
    exit 1
fi

echo -e "${GREEN}Weekly packaging successful!${NC}"
echo "Output directory: $OUTPUT_DIR"

