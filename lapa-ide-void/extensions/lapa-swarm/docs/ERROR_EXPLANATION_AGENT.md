# Error Explanation Agent (DebugSage)

**Version**: 1.0.0  
**Status**: ✅ Active  
**Tier**: Free  
**Agent Type**: `error-explainer`

---

## Overview

The Error Explanation Agent (DebugSage) is a dedicated agent that explains errors in plain language with actionable fix suggestions. It analyzes error messages, stack traces, and code context to provide clear, understandable explanations that help developers quickly understand and resolve issues.

## Features

- ✅ **Plain Language Explanations**: Converts technical error messages into understandable explanations
- ✅ **Error Categorization**: Automatically categorizes errors (syntax, type, runtime, import, etc.)
- ✅ **Fix Suggestions**: Provides actionable fix suggestions with step-by-step guidance
- ✅ **Code Examples**: Shows before/after code examples for common error patterns
- ✅ **Root Cause Analysis**: Identifies the underlying cause of errors
- ✅ **Severity Assessment**: Categorizes errors by severity (low, medium, high, critical)
- ✅ **Pattern Learning**: Learns from error patterns for improved explanations
- ✅ **Multi-Language Support**: Works with TypeScript, JavaScript, Python, and more

## Usage

### Using the Agent Directly

```typescript
import { ErrorExplainerAgent } from '../agents/error-explainer.js';
import { MemoriEngine } from '../local/memori-engine.js';
import { Task } from '../agents/moe-router.js';

const memoriEngine = new MemoriEngine();
await memoriEngine.initialize();

const agent = new ErrorExplainerAgent(memoriEngine);

const task: Task = {
  id: 'task-1',
  description: 'Explain error',
  type: 'error-explanation',
  priority: 1,
  context: {
    errorMessage: 'TypeError: Cannot read property \'name\' of undefined',
    stackTrace: 'at Object.getUser (file.js:10:5)',
    filePath: 'file.js',
    lineNumber: 10,
    codeSnippet: 'const user = getUser();\nconsole.log(user.name);',
    language: 'javascript'
  }
};

const result = await agent.execute(task);
if (result.success) {
  const explanation = result.result;
  console.log('Explanation:', explanation.plainLanguageExplanation);
  console.log('Fix suggestions:', explanation.fixSuggestions);
}
```

### Using the Agent Tool

```typescript
import { ErrorExplanationTool } from '../agents/error-explainer.js';
import { MemoriEngine } from '../local/memori-engine.js';

const memoriEngine = new MemoriEngine();
await memoriEngine.initialize();

const tool = new ErrorExplanationTool(memoriEngine);

const context = {
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    errorMessage: 'SyntaxError: Unexpected token',
    stackTrace: 'at file.js:5:10',
    filePath: 'file.js',
    lineNumber: 5,
    codeSnippet: 'function test() {',
    language: 'javascript',
    projectType: 'node'
  }
};

const result = await tool.execute(context);
if (result.success) {
  const explanation = result.data;
  console.log('Category:', explanation.category);
  console.log('Severity:', explanation.severity);
  console.log('Explanation:', explanation.plainLanguageExplanation);
  explanation.fixSuggestions.forEach(suggestion => {
    console.log(`- ${suggestion.title}: ${suggestion.description}`);
  });
}
```

## Error Categories

The agent categorizes errors into the following types:

### Syntax Errors
Errors in code structure or format.

**Examples:**
- `SyntaxError: Unexpected token`
- `Parse error: unexpected token`
- Missing brackets, parentheses, or semicolons

**Severity**: Critical

### Type Errors
Type mismatches or undefined types.

**Examples:**
- `Type 'string' is not assignable to type 'number'`
- `Cannot find name 'variable'`
- TypeScript type errors

**Severity**: High

### Runtime Errors
Errors that occur during code execution.

**Examples:**
- `TypeError: Cannot read property 'name' of undefined`
- `TypeError: undefined is not a function`
- `ReferenceError: variable is not defined`

**Severity**: High

### Import Errors
Module or file import failures.

**Examples:**
- `Cannot find module './utils'`
- `Module not found: Error: Can't resolve 'package'`
- `Import error: cannot resolve module`

**Severity**: Critical

### Permission Errors
File or resource access permission issues.

**Examples:**
- `EACCES: permission denied`
- `Access denied: cannot open file`
- `Permission error: insufficient privileges`

**Severity**: Medium

### Network Errors
Network connectivity or API call failures.

**Examples:**
- `NetworkError: Failed to fetch`
- `Connection timeout`
- `ECONNREFUSED: Connection refused`

**Severity**: Medium

### Logic Errors
Errors in program logic (often detected from stack traces).

**Examples:**
- Infinite loops
- Incorrect algorithm implementation
- Wrong conditional logic

**Severity**: Low

## API Reference

### ErrorExplainerAgent

#### Constructor
```typescript
constructor(memoriEngine: MemoriEngine)
```

#### Methods

##### `execute(task: Task): Promise<{ success: boolean; result: ErrorExplanation | null; error?: string }>`
Executes error explanation task.

**Parameters:**
- `task`: Task object with error context

**Returns:**
- `success`: Whether explanation was successful
- `result`: Error explanation object
- `error`: Error message if failed

### ErrorExplanationTool

#### Constructor
```typescript
constructor(memoriEngine: MemoriEngine)
```

#### Methods

##### `execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult>`
Executes error explanation tool.

**Parameters:**
- `context`: Tool execution context with error parameters

**Required Parameters:**
- `errorMessage` (string): The error message to explain

**Optional Parameters:**
- `stackTrace` (string): Stack trace if available
- `filePath` (string): File path where error occurred
- `lineNumber` (number): Line number where error occurred
- `codeSnippet` (string): Code snippet around the error
- `language` (string): Programming language
- `projectType` (string): Project type (e.g., 'node', 'react')

**Returns:**
- `success`: Whether explanation was successful
- `data`: Error explanation object
- `executionTime`: Execution time in milliseconds

## Data Structures

### ErrorExplanation

```typescript
interface ErrorExplanation {
  errorMessage: string;
  category: ErrorCategory;
  plainLanguageExplanation: string;
  rootCause: string;
  fixSuggestions: FixSuggestion[];
  codeExamples?: CodeExample[];
  relatedErrors?: string[];
  confidence: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
}
```

### FixSuggestion

```typescript
interface FixSuggestion {
  title: string;
  description: string;
  codeFix?: string;
  steps: string[];
  confidence: number; // 0-1
}
```

### CodeExample

```typescript
interface CodeExample {
  before: string;
  after: string;
  explanation: string;
}
```

### ErrorContext

```typescript
interface ErrorContext {
  errorMessage: string;
  stackTrace?: string;
  filePath?: string;
  lineNumber?: number;
  codeSnippet?: string;
  language?: string;
  projectType?: string;
}
```

## Examples

### Example 1: Runtime Error

**Input:**
```typescript
{
  errorMessage: "TypeError: Cannot read property 'name' of undefined",
  codeSnippet: "const user = getUser();\nconsole.log(user.name);",
  language: "javascript"
}
```

**Output:**
```typescript
{
  category: "runtime",
  severity: "high",
  plainLanguageExplanation: "A runtime error happened while your code was executing...",
  rootCause: "Accessing property or method on undefined/null value",
  fixSuggestions: [
    {
      title: "Add null/undefined checks",
      description: "Add checks before accessing properties or methods.",
      codeFix: "const user = getUser();\nconsole.log(user?.name);",
      steps: [
        "Identify where undefined/null values might occur",
        "Add optional chaining (?.) or null checks",
        "Provide default values where appropriate"
      ],
      confidence: 0.85
    }
  ],
  codeExamples: [
    {
      before: "const user = getUser();\nconsole.log(user.name);",
      after: "const user = getUser();\nconsole.log(user?.name);",
      explanation: "Use optional chaining (?.) to safely access properties."
    }
  ]
}
```

### Example 2: Import Error

**Input:**
```typescript
{
  errorMessage: "Error: Cannot find module './utils'",
  filePath: "src/index.js",
  language: "javascript"
}
```

**Output:**
```typescript
{
  category: "import",
  severity: "critical",
  plainLanguageExplanation: "An import error occurred. The code is trying to use a module...",
  rootCause: "Module not installed or path incorrect",
  fixSuggestions: [
    {
      title: "Install missing package",
      description: "The required package may not be installed.",
      steps: [
        "Check package.json or requirements.txt",
        "Run install command (npm install, pip install, etc.)",
        "Verify package name is correct"
      ],
      confidence: 0.9
    },
    {
      title: "Check import path",
      description: "The import path may be incorrect.",
      steps: [
        "Verify the file/module exists at the specified path",
        "Check relative vs absolute paths",
        "Verify file extensions if required"
      ],
      confidence: 0.8
    }
  ]
}
```

### Example 3: Type Error

**Input:**
```typescript
{
  errorMessage: "Type 'string' is not assignable to type 'number'",
  codeSnippet: "function add(a: number, b: string) { return a + b; }",
  language: "typescript"
}
```

**Output:**
```typescript
{
  category: "type",
  severity: "high",
  plainLanguageExplanation: "A type error occurred. This means you're trying to use...",
  rootCause: "Type mismatch - value type doesn't match expected type",
  fixSuggestions: [
    {
      title: "Check variable types",
      description: "Ensure variables match their expected types.",
      steps: [
        "Verify the type of the variable causing the error",
        "Check if type casting is needed",
        "Ensure imports are correct"
      ],
      confidence: 0.8
    }
  ],
  codeExamples: [
    {
      before: "function add(a: number, b: string) { return a + b; }",
      after: "function add(a: number, b: number) { return a + b; }",
      explanation: "Ensure function parameters match their expected types."
    }
  ]
}
```

## Integration

### With MoE Router

The Error Explainer Agent can be registered with the MoE Router for automatic task routing:

```typescript
import { MoERouter } from './agents/moe-router.js';
import { ErrorExplainerAgent } from './agents/error-explainer.js';

const router = new MoERouter();
const agent = new ErrorExplainerAgent(memoriEngine);

router.registerAgent({
  id: agent.id,
  type: 'error-explainer',
  name: agent.name,
  expertise: agent.expertise,
  workload: agent.workload,
  capacity: agent.capacity
});
```

### With Event Bus

The agent publishes events for error explanations:

- `error.explained`: Published when an error is successfully explained

```typescript
eventBus.subscribe('error.explained', (event) => {
  console.log('Error explained:', event.payload);
});
```

### With Memory Engine

The agent learns from error patterns and stores them in the memory engine for future reference, improving explanation quality over time.

## Best Practices

1. **Provide Context**: Include stack traces, file paths, and code snippets for better explanations
2. **Specify Language**: Always provide the programming language for language-specific suggestions
3. **Include Code**: Code snippets help generate more accurate fix suggestions
4. **Use Tool Wrapper**: Use `ErrorExplanationTool` for easier integration with agent tools
5. **Monitor Events**: Subscribe to `error.explained` events for analytics

## Performance

- **Execution Time**: <1 second for most error explanations
- **Memory Usage**: Minimal overhead per explanation
- **Pattern Learning**: Improves accuracy over time with error pattern storage

## Limitations

- **Language Support**: Best results for TypeScript, JavaScript, Python
- **Complex Errors**: Very complex or domain-specific errors may have lower confidence
- **Context Dependency**: More context (stack trace, code snippet) improves accuracy

## Future Enhancements

- [ ] Enhanced pattern recognition with ML
- [ ] Integration with IDE for inline error explanations
- [ ] Multi-language error pattern database
- [ ] Community-contributed error explanations
- [ ] Real-time error explanation in development environment

---

**Last Updated**: January 2025  
**Maintainer**: LAPA Feature Agent

