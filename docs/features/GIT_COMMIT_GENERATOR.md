# Automated Git Commit Message Generator

## Overview

The Automated Git Commit Message Generator is a Lapa-VOID feature that analyzes your git changes and generates meaningful, well-formatted commit messages automatically. This feature saves time and ensures consistent commit message quality across your project.

## Features

- **AI-Powered Analysis**: Analyzes git diffs to understand code changes
- **Multiple Formats**: Supports conventional commits, descriptive, and detailed formats
- **Smart Detection**: Automatically detects change types (feature, fix, refactor, test, docs, etc.)
- **Confidence Scoring**: Provides confidence scores for generated messages
- **IDE Integration**: Seamlessly integrated into Void IDE command palette
- **Free Tier**: Available in free tier (core functionality)

## Usage

### Via Command Palette

1. Stage your changes: `git add .`
2. Open Command Palette: `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type: `LAPA: Generate Git Commit Message`
4. Select your preferred format:
   - **Conventional Commits**: `feat: add user authentication`
   - **Descriptive**: `Add user authentication with JWT tokens`
   - **Detailed**: Includes full body with change summary
5. Review and edit the generated message
6. Choose to commit now or copy to clipboard

### Via Agent Tool

The commit generator can also be used by Lapa swarm agents:

```typescript
import { GitCommitMessageGenerator } from '../orchestrator/git-commit-generator';

const generator = new GitCommitMessageGenerator();
const result = await generator.execute({
  taskId: 'task-1',
  agentId: 'agent-1',
  parameters: {
    format: 'conventional',
    useConventionalCommits: true
  }
});
```

### Standalone Function

```typescript
import { generateCommitMessage } from '../orchestrator/git-commit-generator';

const result = await generateCommitMessage({
  format: 'conventional',
  includeBody: true,
  maxLength: 72
});

console.log(result.fullMessage);
```

## Configuration Options

### CommitMessageOptions

```typescript
interface CommitMessageOptions {
  format?: 'conventional' | 'descriptive' | 'detailed';
  includeBody?: boolean;
  maxLength?: number; // Default: 72
  useConventionalCommits?: boolean;
  scope?: string; // Optional scope for conventional commits
}
```

## Change Type Detection

The generator automatically detects change types from code patterns:

- **Feature**: New functions, classes, exports
- **Fix**: Bug fixes, error handling
- **Refactor**: Code restructuring, optimization
- **Test**: Test files, test cases
- **Docs**: Documentation, comments
- **Perf**: Performance improvements
- **Style**: Formatting, linting

## Conventional Commits Format

When using conventional commits format, messages follow the pattern:

```
<type>(<scope>): <description>

<body>
```

**Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `perf`, `chore`

**Example**:
```
feat(auth): add JWT token authentication

Changes include: feature. File types: ts, test.
5 insertions, 2 deletions across 2 file(s).
```

## Examples

### Feature Addition
**Changes**: Added new authentication module
**Generated**: `feat(auth): add user authentication system`

### Bug Fix
**Changes**: Fixed null pointer exception
**Generated**: `fix: resolve null pointer exception in user service`

### Refactoring
**Changes**: Restructured API routes
**Generated**: `refactor(api): restructure route organization`

### Test Addition
**Changes**: Added unit tests
**Generated**: `test: add unit tests for authentication module`

## Integration with Swarm Agents

The commit generator integrates with Lapa swarm agents and can be used as a tool:

```typescript
// Agent can use this tool to generate commit messages
const commitTool = new GitCommitMessageGenerator();
agent.addTool(commitTool);
```

## Performance

- **Latency**: <500ms average
- **Memory**: <50MB
- **Accuracy**: 85%+ confidence on well-structured changes

## Limitations

- Requires git repository
- Works best with staged changes
- May need manual review for complex changes
- Confidence decreases with very large diffs (>1000 lines)

## Future Enhancements

- Integration with commit hooks
- Learning from project-specific commit patterns
- Multi-language support
- Custom commit templates
- Integration with issue trackers

## Troubleshooting

### "No changes detected"
- Ensure you have staged changes: `git add .`
- Or have unstaged changes in a git repository

### "Failed to get git diff"
- Verify you're in a git repository
- Check that git is installed and in PATH

### Low confidence scores
- Large, complex changes may have lower confidence
- Consider breaking changes into smaller commits
- Review and edit generated messages

## Related Features

- **Session Continuity**: Commit messages are stored in swarm sessions
- **Swarm Consensus**: Multiple agents can review commit messages
- **Memory System**: Commit patterns are learned over time

## Support

For issues or feature requests, please open an issue on GitHub:
https://github.com/Menoxcide/Lapa/issues

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

