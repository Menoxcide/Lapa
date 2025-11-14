#!/bin/bash
# Daily Compilation Script for Void IDE
# Phase 5.1: CompileDaily - YarnComp8m, Lint0, Test100%

set -e  # Exit on error

echo "=== Void IDE Daily Compilation ==="
echo "Started at: $(date)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track time
START_TIME=$(date +%s)

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from lapa-ide-void directory.${NC}"
    exit 1
fi

# Step 1: Install dependencies if needed
echo -e "${YELLOW}Step 1: Checking dependencies...${NC}"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "Installing dependencies with yarn..."
    yarn install --frozen-lockfile
else
    echo "Dependencies up to date."
fi

# Step 2: Compile with yarn
echo -e "${YELLOW}Step 2: Compiling with yarn...${NC}"
COMPILE_START=$(date +%s)
yarn compile
COMPILE_END=$(date +%s)
COMPILE_TIME=$((COMPILE_END - COMPILE_START))

if [ $COMPILE_TIME -gt 480 ]; then
    echo -e "${RED}Warning: Compilation took ${COMPILE_TIME}s (>8 minutes)${NC}"
else
    echo -e "${GREEN}Compilation completed in ${COMPILE_TIME}s${NC}"
fi

# Step 3: Lint check (must be zero errors)
echo -e "${YELLOW}Step 3: Running lint checks...${NC}"
LINT_START=$(date +%s)
yarn eslint || LINT_ERROR=$?
LINT_END=$(date +%s)
LINT_TIME=$((LINT_END - LINT_START))

if [ -n "$LINT_ERROR" ] && [ $LINT_ERROR -ne 0 ]; then
    echo -e "${RED}Error: Lint check failed with errors!${NC}"
    exit 1
fi

yarn stylelint || STYLE_ERROR=$?
if [ -n "$STYLE_ERROR" ] && [ $STYLE_ERROR -ne 0 ]; then
    echo -e "${RED}Error: Stylelint check failed with errors!${NC}"
    exit 1
fi

echo -e "${GREEN}Lint checks passed (0 errors) in ${LINT_TIME}s${NC}"

# Step 4: Run tests (must be 100% pass)
echo -e "${YELLOW}Step 4: Running tests...${NC}"
TEST_START=$(date +%s)

# Run node tests
yarn test-node || TEST_ERROR=$?
if [ -n "$TEST_ERROR" ] && [ $TEST_ERROR -ne 0 ]; then
    echo -e "${RED}Error: Node tests failed!${NC}"
    exit 1
fi

# Run browser tests if available
if [ -f "test/unit/browser/index.js" ]; then
    yarn test-browser-no-install || BROWSER_TEST_ERROR=$?
    if [ -n "$BROWSER_TEST_ERROR" ] && [ $BROWSER_TEST_ERROR -ne 0 ]; then
        echo -e "${RED}Error: Browser tests failed!${NC}"
        exit 1
    fi
fi

TEST_END=$(date +%s)
TEST_TIME=$((TEST_END - TEST_START))
echo -e "${GREEN}All tests passed (100%) in ${TEST_TIME}s${NC}"

# Final summary
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))

echo ""
echo "=== Daily Compilation Summary ==="
echo -e "${GREEN}✓ Compilation: ${COMPILE_TIME}s${NC}"
echo -e "${GREEN}✓ Lint: ${LINT_TIME}s (0 errors)${NC}"
echo -e "${GREEN}✓ Tests: ${TEST_TIME}s (100% pass)${NC}"
echo -e "${GREEN}Total time: ${TOTAL_TIME}s${NC}"
echo "Completed at: $(date)"
echo ""

if [ $TOTAL_TIME -gt 480 ]; then
    echo -e "${YELLOW}Warning: Total time exceeded 8 minutes${NC}"
    exit 1
fi

echo -e "${GREEN}Daily compilation successful!${NC}"

