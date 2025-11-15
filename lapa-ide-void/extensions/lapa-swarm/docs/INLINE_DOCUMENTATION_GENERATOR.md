# Inline Documentation Generator

**Version**: 1.0.0  
**Status**: ✅ Active  
**Tier**: Free

---

## Overview

The Inline Documentation Generator automatically creates JSDoc/TSDoc comments for functions, classes, methods, interfaces, types, and enums. It analyzes code structure, infers parameter and return types, and generates comprehensive documentation.

## Features

- ✅ **Automatic Documentation**: Generates JSDoc/TSDoc for code elements
- ✅ **Multiple Formats**: Supports both JSDoc and TSDoc styles
- ✅ **Type Inference**: Automatically infers parameter and return types
- ✅ **Code Analysis**: Detects functions, classes, methods, interfaces, types, enums
- ✅ **Example Generation**: Creates usage examples automatically
- ✅ **Parameter Documentation**: Documents all parameters with types and descriptions
- ✅ **Return Documentation**: Documents return types and descriptions

## Supported Code Elements

- **Functions**: Regular functions, arrow functions, async functions
- **Classes**: Class declarations with methods
- **Methods**: Class methods (public, private, protected)
- **Interfaces**: TypeScript interface definitions
- **Types**: Type aliases
- **Enums**: Enumeration declarations

## Usage

### Via Agent Tool

```typescript
import { InlineDocumentationGenerator } from './orchestrator/inline-documentation-generator.js';

const generator = new InlineDocumentationGenerator();

const result = await generator.execute({
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    action: 'generate',
    code: codeContent,
    style: 'jsdoc', // or 'tsdoc'
    language: 'typescript',
    includeExamples: true,
    includeTags: true
  }
});

if (result.success) {
  const documentation = result.data.documentation;
  documentation.forEach(doc => {
    console.log(doc.documentation);
    // Insert into code at doc.element.location.line
  });
}
```

### Standalone Function

```typescript
import { generateDocumentation } from './orchestrator/inline-documentation-generator.js';

const docs = await generateDocumentation(
  codeContent,
  'jsdoc', // style
  'typescript' // language
);

docs.forEach(doc => {
  console.log(`Documentation for ${doc.element.name}:`);
  console.log(doc.documentation);
});
```

## Example

### Input Code

```typescript
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}
```

### Generated JSDoc

```typescript
/**
 * Executes calculate total.
 * @param {number} price - The price parameter.
 * @param {number} quantity - The quantity parameter.
 * @returns {number} Returns the result of calculate total.
 * @example
 * calculateTotal(price, quantity);
 */
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}
```

### Generated TSDoc

```typescript
/**
 * Executes calculate total.
 * @param price - The price parameter. - Type: number
 * @param quantity - The quantity parameter. - Type: number
 * @returns - Type: number - Returns the result of calculate total.
 * @example
 * calculateTotal(price, quantity);
 */
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}
```

## Options

- `code` (string, required): Code content to analyze
- `style` (DocumentationStyle): 'jsdoc' or 'tsdoc' (default: 'jsdoc')
- `language` (string): Programming language (default: 'typescript')
- `includeExamples` (boolean): Include usage examples (default: true)
- `includeTags` (boolean): Include additional tags like @class, @private (default: true)

## Output Format

```typescript
interface GeneratedDocumentation {
  element: {
    name: string;
    type: CodeElementType;
    signature: string;
    location: { line: number; column: number };
  };
  documentation: string; // Generated JSDoc/TSDoc comment
  style: DocumentationStyle;
  parameters?: ParameterDoc[];
  returns?: ReturnDoc;
  examples?: string[];
  tags?: Record<string, string>;
}
```

## Integration

The Documentation Generator integrates with:
- **Code Editor**: Can insert documentation at correct locations
- **Event Bus**: Publishes `documentation.generated` events
- **Agent Tools**: Available as agent tool for automated documentation

## Best Practices

1. **Review Generated Docs**: Always review and refine generated documentation
2. **Add Context**: Supplement with domain-specific context
3. **Keep Updated**: Re-generate when code changes
4. **Use Examples**: Include examples for complex functions

## Performance

- **Generation Time**: <100ms for typical files
- **Accuracy**: High for well-structured code
- **Coverage**: Detects all major code elements

---

**Last Updated**: January 2025

