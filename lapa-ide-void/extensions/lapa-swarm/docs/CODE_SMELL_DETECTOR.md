# Code Smell Detection Agent

**Version**: 1.0.0  
**Status**: ✅ Active  
**Tier**: Free

---

## Overview

The Code Smell Detection Agent automatically identifies code smells and anti-patterns in your codebase. It extends the review agent capabilities with pattern-based detection, severity scoring, and actionable fix suggestions.

## Features

- ✅ **20+ Code Smell Patterns**: Detects common anti-patterns like long methods, god classes, magic numbers
- ✅ **Severity Scoring**: Categorizes smells as low, medium, high, or critical
- ✅ **Fix Suggestions**: Provides actionable recommendations with code examples
- ✅ **Filtering**: Filter by severity threshold or specific smell types
- ✅ **Memory Integration**: Learns from past detections
- ✅ **Performance**: Fast pattern-based detection (<1s for typical files)

## Detected Code Smells

### High Severity
- **God Class**: Class handles too many responsibilities
- **Duplicate Code**: Repeated code blocks that should be extracted

### Medium Severity
- **Long Method**: Methods exceeding 50 lines or high complexity
- **Long Parameter List**: Functions with more than 5 parameters
- **Feature Envy**: Method accesses more external data than its own
- **Switch Statements**: Large switch statements suggesting polymorphism needed

### Low Severity
- **Magic Numbers**: Numeric literals without named constants
- **Primitive Obsession**: Using primitives instead of value objects
- **Comments**: Excessive comments indicating unclear code
- **Dead Code**: Commented-out or unused code

## Usage

### Via Agent Tool

```typescript
import { CodeSmellDetector } from './agents/code-smell-detector.js';

const detector = new CodeSmellDetector(memoriEngine);

const result = await detector.execute({
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    action: 'detect',
    code: codeContent,
    language: 'typescript',
    severityThreshold: 'medium', // Optional: filter by severity
    types: ['long-method', 'god-class'] // Optional: filter by type
  }
});

if (result.success) {
  const smells = result.data.smells;
  const summary = result.data.summary;
  
  console.log(`Found ${summary.total} code smells`);
  smells.forEach(smell => {
    console.log(`${smell.type}: ${smell.description}`);
    console.log(`Suggestion: ${smell.suggestion}`);
  });
}
```

### Detection Options

- `code` (string): Code content to analyze
- `filePath` (string): Path to file (for future file reading)
- `language` (string): Programming language (default: 'typescript')
- `severityThreshold` (SmellSeverity): Only return smells at or above this severity
- `types` (CodeSmellType[]): Only detect specific smell types

## Example Output

```json
{
  "smells": [
    {
      "type": "long-method",
      "severity": "medium",
      "location": {
        "file": "src/utils.ts",
        "line": 15,
        "function": "processOrder"
      },
      "description": "Method is too long (typically > 50 lines or high complexity)",
      "suggestion": "Extract smaller methods with single responsibilities",
      "confidence": 0.85,
      "example": {
        "before": "function processOrder(order) { /* 100 lines */ }",
        "after": "function processOrder(order) {\n  validateOrder(order);\n  calculateTotal(order);\n  processPayment(order);\n}"
      }
    }
  ],
  "summary": {
    "total": 5,
    "bySeverity": {
      "critical": 0,
      "high": 1,
      "medium": 3,
      "low": 1
    },
    "byType": {
      "long-method": 2,
      "magic-numbers": 1,
      "duplicate-code": 1,
      "god-class": 1
    }
  }
}
```

## Integration

The Code Smell Detector integrates with:
- **Review Agent**: Automatically runs during code reviews
- **Memory Engine**: Stores detection history for learning
- **Event Bus**: Publishes `code-smell.detected` events

## Performance

- **Detection Time**: <1s for files up to 1000 lines
- **Memory Usage**: Minimal (pattern-based, no AST parsing)
- **Accuracy**: High confidence for well-defined patterns

## Best Practices

1. **Run Regularly**: Integrate into CI/CD pipeline
2. **Prioritize High Severity**: Focus on critical and high severity smells first
3. **Review Suggestions**: Use fix suggestions as starting points
4. **Track Progress**: Monitor smell count over time

---

**Last Updated**: January 2025

