#!/bin/bash
# Build Validation Script for Void IDE
# Phase 5 I10: Final Integration & Validation

set -e  # Exit on error

echo "=== Void IDE Build Validation ==="
echo "Started at: $(date)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from lapa-ide-void directory.${NC}"
    exit 1
fi

# Validation 1: Build output exists
echo -e "${YELLOW}Validation 1: Checking build output...${NC}"
if [ ! -d "out" ]; then
    echo -e "${RED}✗ Build output directory 'out' not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ Build output directory exists${NC}"
fi

# Validation 2: No TypeScript errors in build
echo -e "${YELLOW}Validation 2: Checking for TypeScript errors...${NC}"
if yarn compile 2>&1 | grep -i "error" > /dev/null; then
    echo -e "${RED}✗ TypeScript compilation errors found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ No TypeScript errors${NC}"
fi

# Validation 3: Lint checks
echo -e "${YELLOW}Validation 3: Running lint checks...${NC}"
yarn eslint > /dev/null 2>&1 || LINT_ERROR=$?
if [ -n "$LINT_ERROR" ] && [ $LINT_ERROR -ne 0 ]; then
    echo -e "${RED}✗ ESLint errors found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ ESLint checks passed${NC}"
fi

yarn stylelint > /dev/null 2>&1 || STYLE_ERROR=$?
if [ -n "$STYLE_ERROR" ] && [ $STYLE_ERROR -ne 0 ]; then
    echo -e "${YELLOW}⚠ Stylelint warnings found${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ Stylelint checks passed${NC}"
fi

# Validation 4: Test suite
echo -e "${YELLOW}Validation 4: Running test suite...${NC}"
yarn test-node > /dev/null 2>&1 || TEST_ERROR=$?
if [ -n "$TEST_ERROR" ] && [ $TEST_ERROR -ne 0 ]; then
    echo -e "${RED}✗ Tests failed${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ Tests passing${NC}"
fi

# Validation 5: Build size check
echo -e "${YELLOW}Validation 5: Checking build size...${NC}"
if [ -d "out" ]; then
    BUILD_SIZE_MB=$(du -sm "out" | cut -f1)
    echo "Build size: ${BUILD_SIZE_MB}MB"
    
    if [ $BUILD_SIZE_MB -gt 500 ]; then
        echo -e "${YELLOW}⚠ Build size (${BUILD_SIZE_MB}MB) is large${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓ Build size acceptable${NC}"
    fi
fi

# Validation 6: Extension integration
echo -e "${YELLOW}Validation 6: Checking extension integration...${NC}"
if [ -d "extensions/lapa-swarm" ]; then
    echo -e "${GREEN}✓ LAPA Swarm extension present${NC}"
    
    if [ -f "extensions/lapa-swarm/package.json" ]; then
        echo -e "${GREEN}✓ Extension package.json exists${NC}"
    else
        echo -e "${RED}✗ Extension package.json missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠ LAPA Swarm extension not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Validation 7: Scripts exist
echo -e "${YELLOW}Validation 7: Checking build scripts...${NC}"
SCRIPTS=("scripts/daily-compile.sh" "scripts/pack-weekly.sh" "scripts/release-manager.sh")
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo -e "${GREEN}✓ $script exists${NC}"
    else
        echo -e "${RED}✗ $script missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# Final summary
echo ""
echo "=== Build Validation Summary ==="
echo -e "${GREEN}Errors: ${ERRORS}${NC}"
echo -e "${YELLOW}Warnings: ${WARNINGS}${NC}"
echo "Completed at: $(date)"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Build validation FAILED with ${ERRORS} error(s)${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Build validation PASSED with ${WARNINGS} warning(s)${NC}"
    exit 0
else
    echo -e "${GREEN}Build validation PASSED with no errors or warnings${NC}"
    exit 0
fi

