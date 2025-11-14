#!/bin/bash
/**
 * Git Pre-Commit Hook for Automatic Test Generation
 * 
 * This hook automatically generates test files for new modules before commit.
 * 
 * Installation:
 *   cp scripts/git-hook-test-generator.sh .git/hooks/pre-commit
 *   chmod +x .git/hooks/pre-commit
 */

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep '\.ts$' | grep -v '\.d\.ts$' | grep -v '\.test\.ts$' | grep -v '\.spec\.ts$' | grep -v '__tests__')

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

echo "🔍 Checking for new modules that need test files..."

# Run test generator for each new file
for file in $STAGED_FILES; do
  if [[ "$file" == src/*.ts ]]; then
    # Check if test file exists
    test_file="${file%.ts}.test.ts"
    test_file="src/__tests__/${test_file#src/}"
    
    if [ ! -f "$test_file" ]; then
      echo "📝 Generating test file for: $file"
      npm run test:generate -- "$file"
      
      # Stage the generated test file
      if [ -f "$test_file" ]; then
        git add "$test_file"
        echo "✅ Test file generated and staged: $test_file"
      fi
    fi
  fi
done

echo "✅ Pre-commit hook complete!"

