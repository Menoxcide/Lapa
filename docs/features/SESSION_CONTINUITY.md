# Session Continuity (SwarmPersistence)

## Overview

Session Continuity enables Lapa-VOID to resume swarm sessions across IDE restarts with full context preservation. This feature ensures that your swarm work is never lost, even if the IDE crashes or you need to restart.

## Features

- **Automatic Session Saving**: Sessions are automatically saved every 30 seconds
- **Full Context Preservation**: Agents, tasks, memory, and conversation history are preserved
- **Graceful Recovery**: Sessions can be restored after crashes or restarts
- **Session History**: View and restore from previous sessions
- **Memory Snapshots**: Full memory state is preserved for context restoration
- **Free Tier**: Available in free tier (core functionality)

## How It Works

### Automatic Saving

Sessions are automatically saved:
- Every 30 seconds (configurable)
- On session creation
- On task completion
- On agent handoffs
- On session updates

### Session State

The following is preserved:
- **Participants**: All users and agents in the session
- **Tasks**: Active tasks with their status and context
- **Agent States**: Agent workload, expertise, and recent tasks
- **Memory**: Entity relationships and episodic memories
- **Conversation History**: Recent agent interactions
- **Goals**: Session goals and progress
- **Veto Sessions**: Active voting sessions
- **A2A Handshakes**: Agent-to-agent handshake states

## Usage

### Restoring a Session

1. Open Command Palette: `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type: `LAPA: Restore Session`
3. Select a session from the list
4. Session will be restored with full context

### Listing Saved Sessions

1. Command Palette: `LAPA: List Saved Sessions`
2. View count of saved sessions
3. Use "Restore Session" to restore one

### Automatic Restoration

On IDE startup, Lapa-VOID will:
1. Check for active/paused sessions
2. Prompt you to restore them
3. Restore context automatically

## Configuration

### Session Persistence Settings

```typescript
{
  enabled: true,                    // Enable session persistence
  autoSaveInterval: 30000,          // Auto-save interval (ms)
  maxSessions: 50,                  // Maximum saved sessions
  persistencePath: '~/.lapa/sessions', // Storage path
  enableMemorySnapshots: true,       // Save memory snapshots
  enableContextCompression: true     // Compress context
}
```

## Session Storage

Sessions are stored in:
- **File System**: `~/.lapa/sessions/[sessionId].json`
- **Memory Snapshots**: `~/.lapa/sessions/[sessionId].memory.json`
- **SQLite** (optional): In Memori SQLite database

## Limitations

- **WebRTC Connections**: WebRTC peer connections cannot be restored (will reconnect)
- **Large Sessions**: Very large sessions (>100MB) may take longer to restore
- **Memory Limits**: Old sessions may be cleaned up if max sessions exceeded

## Recovery Scenarios

### IDE Crash
1. Restart IDE
2. Lapa-VOID detects saved sessions
3. Prompt to restore
4. Full context restored

### Manual Restart
1. Sessions automatically saved before shutdown
2. On restart, use "Restore Session" command
3. Select session to restore

### Session Cleanup
- Old sessions (beyond max limit) are automatically cleaned up
- Most recent sessions are preserved
- Cleanup runs on startup

## Technical Details

### Session State Structure

```typescript
interface PersistedSessionState {
  sessionId: string;
  hostUserId: string;
  status: 'active' | 'paused' | 'closed';
  createdAt: string;
  lastActivity: string;
  config: SessionConfig;
  participants: SerializedParticipant[];
  activeTasks: SerializedTask[];
  vetoSessions: Array<{ taskId: string; votingSessionId: string }>;
  a2aHandshakes: Array<{ agentPair: string; handshakeId: string }>;
  context: SessionContext;
  version: string;
}
```

### Memory Snapshots

Memory snapshots include:
- Entity relationships
- Recent memories
- Context associations
- Temporal indexing

## Integration

### With Memori Engine

Session continuity integrates with:
- **Memori Engine**: For entity and relationship storage
- **Episodic Memory**: For temporal context
- **SQLite**: For persistent storage

### With Swarm Manager

- Automatically saves on session events
- Restores sessions on startup
- Maintains session state consistency

## Best Practices

1. **Regular Saves**: Sessions auto-save, but you can manually trigger saves
2. **Session Cleanup**: Periodically clean up old sessions
3. **Memory Management**: Large sessions may impact performance
4. **Backup**: Session files can be backed up manually

## Troubleshooting

### "Session not found"
- Session may have been cleaned up
- Check session list to verify
- Sessions older than max limit are removed

### "Failed to restore session"
- Check session file integrity
- Verify memory snapshots exist
- Check logs for detailed error

### "Context not fully restored"
- Memory snapshots may be incomplete
- Some context may need to be rebuilt
- Agent states are restored, but connections may need re-establishment

## Related Features

- **Swarm Sessions**: Core session management
- **Memori Engine**: Memory persistence
- **Session History**: View past sessions
- **Auto-Save**: Automatic session saving

## Support

For issues or feature requests:
https://github.com/Menoxcide/Lapa/issues

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

