# LAPA-VOID Testing Checklist

## Manual Testing Checklist

### Extension Activation
- [ ] Extension activates on IDE startup
- [ ] No console errors on activation
- [ ] Feature gate initializes correctly
- [ ] License validation runs (free tier works without license)

### Command Palette
- [ ] `lapa.swarm.start` - Accessible and functional
- [ ] `lapa.swarm.stop` - Accessible and functional
- [ ] `lapa.swarm.pause` - Accessible and functional
- [ ] `lapa.swarm.resume` - Accessible and functional
- [ ] `lapa.swarm.configure` - Opens settings
- [ ] `lapa.swarm.status` - Shows status correctly
- [ ] `lapa.swarm.upgrade` - Opens upgrade dialog
- [ ] `lapa.swarm.activateLicense` - License activation works

### Swarm Functionality
- [ ] Start swarm with goal input
- [ ] Swarm starts successfully (free tier: 4 agents max)
- [ ] Swarm stops correctly
- [ ] Swarm pause/resume works
- [ ] Status shows correct information
- [ ] Feature gate enforces max agents (4 for free, 16 for pro)

### Webview Panels
- [ ] Swarm dashboard renders in activity bar
- [ ] Auxiliary view renders correctly
- [ ] React components load without errors
- [ ] Webview retains context when hidden

### MCP Integration
- [ ] MCP provider registers correctly
- [ ] MCP tools accessible
- [ ] `start-swarm` tool works
- [ ] `stop-swarm` tool works

### Premium Features (License Required)
- [ ] License activation via command works
- [ ] License stored in `~/.lapa/licenses/`
- [ ] Premium features gated correctly
- [ ] Upgrade dialog shows free/pro comparison
- [ ] Cloud inference blocked without license
- [ ] Advanced memory features gated
- [ ] E2B sandbox gated

### Free Tier Verification
- [ ] Free tier works without license
- [ ] Max 4 agents enforced
- [ ] Local inference only (no cloud)
- [ ] Basic memory (85% recall target)
- [ ] No premium features accessible

### Integration Points
- [ ] LAPA config service loads from `~/.lapa/config.json`
- [ ] Text document provider works (RAG search)
- [ ] Status bar integration (thermal gauge, ROI)
- [ ] Void IDE inline edits still work
- [ ] Agent modes still functional
- [ ] Local models (Ollama/NIM) work

## Automated Testing

### Unit Tests
- [ ] Extension activation test passes
- [ ] Feature gate tests pass
- [ ] License manager tests pass
- [ ] Swarm manager tests pass

### Integration Tests
- [ ] E2E user journey test passes
- [ ] Premium features integration test passes
- [ ] MCP integration test passes
- [ ] A2A mediator test passes

### Performance Tests
- [ ] Build time < 8 minutes
- [ ] VSIX size < 400MB
- [ ] Extension activation < 2 seconds
- [ ] Swarm start < 1 second

## Test Results Template

```
Test Date: [DATE]
Tester: [NAME]
Environment: [OS, Node Version, IDE Version]

### Extension Activation
Status: [PASS/FAIL]
Notes: [Any issues]

### Command Palette
Status: [PASS/FAIL]
Notes: [Any issues]

### Swarm Functionality
Status: [PASS/FAIL]
Notes: [Any issues]

### Webview Panels
Status: [PASS/FAIL]
Notes: [Any issues]

### Premium Features
Status: [PASS/FAIL]
Notes: [Any issues]

### Free Tier
Status: [PASS/FAIL]
Notes: [Any issues]

### Critical Issues Found
[List any critical issues]

### Recommendations
[List any recommendations]
```

## Known Issues

- None at this time

## Test Coverage Target

- **Unit Tests**: >95% coverage
- **Integration Tests**: All critical paths covered
- **E2E Tests**: User journey complete
- **Manual Tests**: All checklist items verified

