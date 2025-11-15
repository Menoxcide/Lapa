# Code Snippet Library

**Version**: 1.0.0  
**Status**: ✅ Active  
**Tier**: Free (basic) / Pro (advanced)

---

## Overview

The Code Snippet Library is a personal and team code snippet collection system with semantic search capabilities. It allows developers to store, organize, and quickly retrieve code snippets with intelligent search and filtering.

## Features

- ✅ **Store Code Snippets**: Save code snippets with metadata (title, language, tags, description)
- ✅ **Semantic Search**: Search snippets by query, language, tags, category, and more
- ✅ **Personal & Team Collections**: Support for both personal and team-shared snippets
- ✅ **Usage Tracking**: Track snippet usage and popularity
- ✅ **Access Control**: Private, team, and public snippet visibility
- ✅ **Memory Integration**: Integrates with Memori Engine for persistence
- ✅ **Event-Driven**: Publishes events for snippet lifecycle operations

## Usage

### Creating a Snippet

```typescript
import { CodeSnippetLibrary } from '../orchestrator/code-snippet-library.js';
import { MemoriEngine } from '../local/memori-engine.js';

const memoriEngine = new MemoriEngine();
await memoriEngine.initialize();

const snippetLibrary = new CodeSnippetLibrary(memoriEngine);

const context = {
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    action: 'create',
    title: 'React Component Template',
    code: `function MyComponent() {
  return <div>Hello World</div>;
}`,
    language: 'javascript',
    description: 'A basic React component template',
    tags: ['react', 'component', 'template'],
    category: 'templates',
    isPublic: false
  }
};

const result = await snippetLibrary.execute(context);
if (result.success) {
  console.log('Snippet created:', result.data.snippet.id);
}
```

### Searching Snippets

```typescript
// Search by query
const searchContext = {
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    action: 'search',
    query: 'React component',
    language: 'javascript',
    tags: ['react'],
    limit: 10,
    sortBy: 'relevance'
  }
};

const searchResult = await snippetLibrary.execute(searchContext);
if (searchResult.success) {
  console.log('Found snippets:', searchResult.data.results);
  searchResult.data.results.forEach(result => {
    console.log(`- ${result.snippet.title} (relevance: ${result.relevanceScore})`);
    console.log(`  Match reasons: ${result.matchReasons.join(', ')}`);
  });
}
```

### Getting a Snippet

```typescript
const getContext = {
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    action: 'get',
    snippetId: 'snippet-id-here'
  }
};

const getResult = await snippetLibrary.execute(getContext);
if (getResult.success) {
  const snippet = getResult.data.snippet;
  console.log('Snippet:', snippet.title);
  console.log('Code:', snippet.code);
  console.log('Usage count:', snippet.usageCount);
}
```

### Updating a Snippet

```typescript
const updateContext = {
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    action: 'update',
    snippetId: 'snippet-id-here',
    updates: {
      title: 'Updated Title',
      code: 'updated code here',
      tags: ['updated', 'tags'],
      description: 'Updated description'
    }
  }
};

const updateResult = await snippetLibrary.execute(updateContext);
if (updateResult.success) {
  console.log('Snippet updated successfully');
}
```

### Deleting a Snippet

```typescript
const deleteContext = {
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    action: 'delete',
    snippetId: 'snippet-id-here'
  }
};

const deleteResult = await snippetLibrary.execute(deleteContext);
if (deleteResult.success) {
  console.log('Snippet deleted successfully');
}
```

### Listing Snippets

```typescript
const listContext = {
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    action: 'list',
    language: 'javascript',
    tags: ['react'],
    category: 'templates',
    limit: 20,
    sortBy: 'recent'
  }
};

const listResult = await snippetLibrary.execute(listContext);
if (listResult.success) {
  console.log(`Found ${listResult.data.total} snippets`);
  listResult.data.snippets.forEach(snippet => {
    console.log(`- ${snippet.title} (${snippet.language})`);
  });
}
```

## API Reference

### Actions

#### `create`
Creates a new code snippet.

**Required Parameters:**
- `title` (string): Snippet title
- `code` (string): Code content
- `language` (string): Programming language

**Optional Parameters:**
- `description` (string): Snippet description
- `tags` (string[]): Array of tags
- `category` (string): Category name
- `isPublic` (boolean): Public visibility (default: false)
- `teamId` (string): Team ID for team snippets

**Returns:**
```typescript
{
  success: true,
  data: {
    snippet: CodeSnippet,
    message: 'Snippet created successfully'
  }
}
```

#### `search`
Searches for snippets with optional filters.

**Optional Parameters:**
- `query` (string): Search query
- `language` (string): Filter by language
- `tags` (string[]): Filter by tags
- `authorId` (string): Filter by author
- `teamId` (string): Filter by team
- `category` (string): Filter by category
- `limit` (number): Maximum results (default: 20)
- `sortBy` ('relevance' | 'popularity' | 'recent' | 'alphabetical'): Sort order
- `includePublic` (boolean): Include public snippets (default: true)

**Returns:**
```typescript
{
  success: true,
  data: {
    results: SnippetSearchResult[],
    total: number,
    query?: string,
    filters: {
      language?: string,
      tags?: string[],
      category?: string
    }
  }
}
```

#### `get`
Retrieves a specific snippet by ID.

**Required Parameters:**
- `snippetId` (string): Snippet ID

**Returns:**
```typescript
{
  success: true,
  data: {
    snippet: CodeSnippet
  }
}
```

#### `update`
Updates an existing snippet.

**Required Parameters:**
- `snippetId` (string): Snippet ID
- `updates` (Partial<CodeSnippet>): Fields to update

**Returns:**
```typescript
{
  success: true,
  data: {
    snippet: CodeSnippet,
    message: 'Snippet updated successfully'
  }
}
```

#### `delete`
Deletes a snippet.

**Required Parameters:**
- `snippetId` (string): Snippet ID

**Returns:**
```typescript
{
  success: true,
  data: {
    message: 'Snippet deleted successfully',
    snippetId: string
  }
}
```

#### `list`
Lists snippets with optional filters.

**Optional Parameters:**
- `language` (string): Filter by language
- `tags` (string[]): Filter by tags
- `authorId` (string): Filter by author
- `teamId` (string): Filter by team
- `category` (string): Filter by category
- `limit` (number): Maximum results (default: 50)
- `sortBy` ('relevance' | 'popularity' | 'recent' | 'alphabetical'): Sort order
- `includePublic` (boolean): Include public snippets (default: true)

**Returns:**
```typescript
{
  success: true,
  data: {
    snippets: CodeSnippet[],
    total: number,
    filters: {
      language?: string,
      tags?: string[],
      category?: string
    }
  }
}
```

## Data Structures

### CodeSnippet

```typescript
interface CodeSnippet {
  id: string;
  title: string;
  code: string;
  language: string;
  description?: string;
  tags: string[];
  authorId?: string;
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  lastUsed?: Date;
  isPublic: boolean;
  category?: string;
  relatedSnippets?: string[];
}
```

### SnippetSearchResult

```typescript
interface SnippetSearchResult {
  snippet: CodeSnippet;
  relevanceScore: number; // 0-1
  matchReasons: string[];
}
```

## Events

The snippet library publishes the following events:

- `snippet.created`: When a snippet is created
- `snippet.updated`: When a snippet is updated
- `snippet.deleted`: When a snippet is deleted
- `snippet.used`: When a snippet is accessed (usage tracking)
- `snippet.stored`: When a snippet is stored in memory

## Configuration

```typescript
interface SnippetLibraryConfig {
  maxSnippetsPerUser: number;        // Default: 1000
  maxSnippetsPerTeam: number;        // Default: 5000
  enableSemanticSearch: boolean;     // Default: true
  enableUsageTracking: boolean;      // Default: true
  defaultVisibility: 'private' | 'team' | 'public'; // Default: 'private'
}

const library = new CodeSnippetLibrary(memoriEngine, {
  maxSnippetsPerUser: 2000,
  enableSemanticSearch: true
});
```

## Permissions

- **Private Snippets**: Only the author can view, update, or delete
- **Team Snippets**: Team members can view, but only the author can update/delete
- **Public Snippets**: Anyone can view, but only the author can update/delete

## Integration with Agents

The Code Snippet Library is implemented as an `AgentTool`, making it available to all LAPA swarm agents:

```typescript
// Agents can use the snippet library directly
const agentContext = {
  taskId: 'agent-task-1',
  agentId: 'coder-agent',
  parameters: {
    action: 'search',
    query: 'authentication',
    language: 'typescript'
  }
};

const result = await snippetLibrary.execute(agentContext);
```

## Best Practices

1. **Use Descriptive Titles**: Clear, searchable titles improve discoverability
2. **Add Tags**: Tags help with filtering and organization
3. **Include Descriptions**: Descriptions improve search relevance
4. **Organize by Category**: Use categories to group related snippets
5. **Share Publicly**: Mark useful snippets as public for team benefit
6. **Regular Cleanup**: Delete unused snippets to stay within limits

## Performance

- **Search Performance**: O(n) where n is the number of snippets (optimized with caching)
- **Storage**: Snippets are cached in memory for fast access
- **Memory Usage**: Minimal overhead per snippet (~1-2KB)

## Limitations

- **Free Tier**: 1000 snippets per user
- **Pro Tier**: 5000 snippets per team
- **Search**: Currently uses text matching (semantic search enhancement planned)

## Future Enhancements

- [ ] Full semantic search with vector embeddings
- [ ] Snippet versioning and history
- [ ] Snippet templates and variables
- [ ] Import/export functionality
- [ ] Snippet analytics and insights
- [ ] Integration with code editors for quick insertion

---

**Last Updated**: January 2025  
**Maintainer**: LAPA Feature Agent

