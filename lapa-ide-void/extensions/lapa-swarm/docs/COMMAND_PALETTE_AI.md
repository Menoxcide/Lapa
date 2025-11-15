# Command Palette AI

**Version**: 1.0.0  
**Status**: ✅ Active  
**Tier**: Free

---

## Overview

Command Palette AI enables natural language command discovery in Void IDE. Instead of remembering exact command names, users can search using natural language queries like "How do I run tests?" or "Save file".

## Features

- ✅ **Natural Language Search**: Find commands using plain English
- ✅ **Semantic Matching**: Intelligent command matching based on keywords, aliases, and descriptions
- ✅ **Command Suggestions**: Get helpful suggestions for common tasks
- ✅ **Quick Execution**: Execute commands directly from search results
- ✅ **Category Filtering**: Filter commands by category
- ✅ **Relevance Scoring**: Results ranked by relevance to your query

## Usage

### Via Command Palette

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type: `LAPA: AI Command Search`
3. Enter your natural language query
4. Select from matching commands
5. Command executes automatically

### Examples

**Query**: "How do I start a swarm?"  
**Results**: "Start Swarm" command

**Query**: "save file"  
**Results**: "Save", "Save As" commands

**Query**: "open terminal"  
**Results**: "New Terminal" command

**Query**: "git commit"  
**Results**: "Commit", "Generate Git Commit Message" commands

## API Usage

```typescript
import { CommandPaletteAI, searchCommands, suggestCommand } from './orchestrator/command-palette-ai.js';

// Search commands
const ai = new CommandPaletteAI();
const result = await ai.execute({
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    action: 'search',
    query: 'how do I run tests',
    limit: 5
  }
});

// Or use standalone functions
const commands = await searchCommands('save file', 5);
const suggestions = await suggestCommand('how do I debug');
```

## Supported Commands

The AI indexes commands from:
- LAPA Swarm commands (start, stop, pause, resume, status)
- File operations (new, save, save as)
- Search commands (find, replace)
- Terminal commands
- Git commands
- Debug commands
- Settings commands

## Implementation

The Command Palette AI uses:
- Keyword indexing for fast lookup
- Alias matching for common phrases
- Description matching for semantic search
- Relevance scoring for result ranking

---

**Last Updated**: January 2025

