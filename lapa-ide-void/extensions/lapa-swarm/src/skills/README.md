# LAPA Skills Directory

This directory contains all LAPA skills that extend the core functionality of the system.

## Skill Structure

Each skill should follow this structure:

```
skill-name/
├── index.ts              # Main skill implementation
├── skill.yaml           # Optional metadata (can be embedded in index.ts)
└── __tests__/           # Unit tests
    └── skill.test.ts
```

## Skill Requirements

### Metadata Schema

Each skill must export metadata matching this schema:

```typescript
export const skillMetadata: SkillMetadata = {
  id: 'skill-id',
  name: 'Skill Name',
  description: 'Skill description',
  version: '1.0.0',
  author: 'Author Name',
  category: 'code' | 'test' | 'debug' | 'review' | 'integrate' | 'other',
  inputs: [
    {
      name: 'inputName',
      type: 'string',
      required: true,
      description: 'Input description'
    }
  ],
  outputs: [
    {
      name: 'outputName',
      type: 'string',
      description: 'Output description'
    }
  ],
  dependencies: ['optional', 'dependencies'],
  tags: ['tag1', 'tag2']
};
```

### Execute Function

Each skill must export an `execute` function:

```typescript
export async function execute(
  inputs: Record<string, unknown>,
  context?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Skill implementation
  return {
    result: 'Skill output'
  };
}
```

## Skill Categories

- **code**: Code generation and manipulation
- **test**: Testing and validation
- **debug**: Debugging and analysis
- **review**: Code review and quality checks
- **integrate**: Integration with external systems
- **other**: Other functionality

## Discovery

Skills are automatically discovered from this directory by the SkillManager. Skills can be:
- TypeScript files ending in `.skill.ts`
- Directories containing `index.ts` with metadata

## Examples

See individual skill directories for implementation examples:
- `webapp-testing/` - UI testing with Playwright
- `document/` - Document manipulation (PDF, DOCX, PPTX, XLSX)
- `internal-comms/` - Structured reports and FAQs

