# LAPA Troubleshooting Guide

## Overview

This troubleshooting guide provides solutions for common issues encountered when installing and using LAPA as a Cursor extension. If you encounter problems not covered here, please check the [GitHub Issues](https://github.com/Menoxcide/Lapa/issues) or [GitHub Discussions](https://github.com/Menoxcide/Lapa/discussions).

## Quick Reference

### Common Issues and Solutions

| Issue | Solution | Details |
|-------|----------|---------|
| Extension not appearing | Restart Cursor completely | Section 1.1 |
| Activation errors | Verify Node.js v18+ installation | Section 1.2 |
| Performance issues | Adjust inference settings | Section 2.1 |
| API connection problems | Check network and API keys | Section 3.1 |
| Memory/CPU overload | Configure thermal guards | Section 2.2 |
| Handoff failures | Check agent configuration | Section 4.1 |

## Installation Issues

### 1.1 Extension Not Appearing After Installation

**Symptoms**:
- LAPA icon missing from activity bar
- Extension not listed in Extensions view
- Commands not available in Command Palette

**Solutions**:

#### Solution A: Complete Restart
1. **Close Cursor completely** (all windows)
2. **Restart Cursor** and check for the LAPA icon
3. **Verify installation** in Extensions view (`Ctrl+Shift+X`)

#### Solution B: Reinstall Extension
1. **Uninstall** the extension from Extensions view
2. **Restart Cursor**
3. **Reinstall** the VSIX file
4. **Restart again** to complete activation

#### Solution C: Check Compatibility
1. **Verify Cursor version** (requires 1.85.0+)
2. **Check system requirements** in [ONBOARDING.md](ONBOARDING.md)
3. **Review installation logs** in Cursor Developer Tools (`Ctrl+Shift+I`)

### 1.2 Activation Errors

**Symptoms**:
- Error messages during extension activation
- "Extension host terminated unexpectedly"
- Permission denied errors

**Solutions**:

#### Solution A: Verify Prerequisites
```bash
# Check Node.js version
node --version  # Should be v18+

# Check npm version
npm --version   # Should be compatible with Node.js v18+

# Verify Cursor installation
cursor --version
```

#### Solution B: Check File Permissions
1. **Verify write permissions** in extension directory
2. **Check antivirus/firewall** settings blocking installation
3. **Run as administrator** if permission issues persist

#### Solution C: Debug Mode
1. **Enable verbose logging** in Cursor settings:
   ```json
   "lapa.logLevel": "debug"
   ```
2. **Check Developer Tools** (`Ctrl+Shift+I`) for detailed error messages
3. **Review console output** for specific error codes

## Performance Issues

### 2.1 Slow Response Times

**Symptoms**:
- Delayed agent responses
- High latency in handoffs
- UI lag during swarm operations

**Solutions**:

#### Solution A: Optimize Inference Settings
Configure `~/.lapa/inference.yaml` for better performance:

```yaml
# Optimize for performance
thermalThresholds:
  vram: 75  # Lower threshold for earlier fallback
  ram: 80
  cpu: 85
  temperature: 75

preferredProviders:
  - "ollama"    # Local first for speed
  - "nim"       # GPU-accelerated
  - "openrouter" # Cloud fallback
```

#### Solution B: Enable Local Inference
```bash
# Install Ollama for local models
curl -fsSL https://ollama.ai/install.sh | sh

# Pull optimized models
ollama pull deepseek-coder:latest
ollama pull llama3.1:latest
```

#### Solution C: Reduce Agent Count
Modify `~/.lapa/agents.yaml` to use fewer agents for simpler tasks:

```yaml
globalSettings:
  maxConcurrentAgents: 3  # Reduce from default 5
  enableAutoScaling: true # Scale based on task complexity
```

### 2.2 High Memory/CPU Usage

**Symptoms**:
- System slowdown during LAPA operations
- High resource consumption
- Thermal throttling

**Solutions**:

#### Solution A: Configure Thermal Guards
Create `~/.lapa/flow-guards.yaml` with thermal protection:

```yaml
guards:
  - name: "thermal-safety"
    condition: "system.temperature > 75"
    action:
      type: "route"
      targetAgent: "optimizer"
    priority: "critical"
    blocking: true

  - name: "memory-protection"
    condition: "system.ram > 80"
    action:
      type: "throttle"
      factor: 0.5  # Reduce processing speed by 50%
    priority: "high"
```

#### Solution B: Monitor Resource Usage
```bash
# Install system monitoring tools
npm install -g system-monitor

# Run performance benchmarks
npm run test:performance
```

#### Solution C: Optimize Model Selection
Use smaller, more efficient models for routine tasks:

```yaml
agents:
  routine-coder:
    model: "deepseek-coder:1.3b"  # Smaller model for simple tasks
    capabilities: ["code-generation"]
    
  complex-architect:
    model: "deepseek-coder:6.7b"  # Larger model for complex tasks
    capabilities: ["planning", "architecture"]
```

## API and Connectivity Issues

### 3.1 API Connection Failures

**Symptoms**:
- "API connection failed" errors
- Timeout during cloud inference
- Authentication errors

**Solutions**:

#### Solution A: Verify API Configuration
Check `~/.lapa/inference.yaml` for correct API settings:

```yaml
# Set API keys via environment variables
openrouterApiKey: "${OPENROUTER_API_KEY}"

# Or directly (not recommended for security)
# openrouterApiKey: "your-api-key-here"

fallbackToCloud: true
sensitiveTasksLocalOnly: true
```

#### Solution B: Test Network Connectivity
```bash
# Test API endpoints
curl -I https://openrouter.ai/api/v1
curl -I https://api.openai.com/v1

# Check firewall settings
netsh advfirewall firewall show rule name=all
```

#### Solution C: Configure Proxy Settings
If behind corporate firewall:

```yaml
networkSettings:
  proxy:
    enabled: true
    host: "proxy.company.com"
    port: 8080
    username: "${PROXY_USERNAME}"
    password: "${PROXY_PASSWORD}"
```

### 3.2 Local Inference Problems

**Symptoms**:
- Ollama/NIM connection failures
- Local models not loading
- GPU acceleration not working

**Solutions**:

#### Solution A: Verify Local Installation
```bash
# Check Ollama installation
ollama list
ollama pull deepseek-coder

# Check NVIDIA drivers (for NIM)
nvidia-smi

# Test NIM installation
npm run setup:nim
```

#### Solution B: Configure Local Endpoints
```yaml
localProviders:
  ollama:
    baseUrl: "http://localhost:11434"
    timeout: 30000
    
  nim:
    baseUrl: "http://localhost:8000"
    enabled: true  # Only enable if NVIDIA GPU available
```

## Agent and Swarm Issues

### 4.1 Handoff Failures

**Symptoms**:
- Agents not cooperating on tasks
- Handoff timeouts
- Context loss during agent transitions

**Solutions**:

#### Solution A: Check Agent Configuration
Verify `~/.lapa/agents.yaml` for proper agent definitions:

```yaml
agents:
  architect:
    capabilities: ["planning", "architecture"]
    handoffPoints: ["design-complete"]
    
  coder:
    capabilities: ["code-generation"]
    handoffPoints: ["implementation-ready"]
```

#### Solution B: Enable Debug Logging
```yaml
globalSettings:
  debugMode: true
  logHandoffs: true
  logContextTransfers: true
```

#### Solution C: Test Handoff System
```bash
# Run handoff performance tests
npm run test:handoffs

# Check handoff latency metrics
npm run test:performance -- --grep="handoff"
```

### 4.2 Memory System Issues

**Symptoms**:
- Context not persisting between sessions
- Episodic memory not functioning
- Vector search returning poor results

**Solutions**:

#### Solution A: Verify Memory Configuration
```yaml
memory:
  memoriEngine:
    enabled: true
    persistencePath: "~/.lapa/memori"
    
  episodic:
    enabled: true
    maxSessions: 100
    
  chroma:
    enabled: true
    collectionName: "lapa-context"
```

#### Solution B: Reset Memory Systems
```bash
# Clear and reset memory (use with caution)
npm run clean:memory

# Rebuild vector database
npm run build:vectors
```

## UI and Interface Issues

### 5.1 Dashboard Display Problems

**Symptoms**:
- Swarm Dashboard not loading
- UI components missing or broken
- Real-time updates not working

**Solutions**:

#### Solution A: Clear UI Cache
1. **Close Cursor**
2. **Delete UI cache files** (location varies by OS)
3. **Restart Cursor**

#### Solution B: Check WebView Compatibility
1. **Verify Cursor version** supports current WebView components
2. **Update Cursor** to latest version
3. **Check for extension conflicts** with other installed extensions

#### Solution C: Enable UI Debug Mode
```json
// In Cursor settings
"lapa.ui.debug": true,
"lapa.ui.logEvents": true
```

### 5.2 Command Palette Issues

**Symptoms**:
- LAPA commands not appearing
- Command execution failures
- Permission errors

**Solutions**:

#### Solution A: Refresh Command Registry
1. **Restart Cursor** to reload command registry
2. **Check extension activation** in Extensions view
3. **Verify command permissions** in extension manifest

#### Solution B: Manual Command Execution
Use direct command execution if palette fails:

```typescript
// In Cursor Developer Tools
await vscode.commands.executeCommand('lapa.startSwarm');
```

## Advanced Troubleshooting

### 6.1 Debug Mode Activation

Enable comprehensive debugging for detailed problem analysis:

#### Step 1: Configure Debug Settings
```json
// In Cursor settings.json
{
  "lapa.logLevel": "debug",
  "lapa.debugMode": true,
  "lapa.logEvents": true,
  "lapa.logHandoffs": true,
  "lapa.logMemory": true
}
```

#### Step 2: Monitor Developer Tools
1. **Open Developer Tools** (`Ctrl+Shift+I`)
2. **Check Console tab** for error messages
3. **Monitor Network tab** for API calls
4. **Review Storage** for configuration issues

#### Step 3: Generate Debug Report
```bash
# Generate comprehensive debug report
npm run generate:debug-report
```

### 6.2 Performance Profiling

Use built-in profiling tools to identify bottlenecks:

#### CPU Profiling
```bash
# Start CPU profiling
npm run profile:cpu

# Analyze profile results
node --prof-process isolate-0xnnnnnnnnnnnn-v8.log > profile.txt
```

#### Memory Profiling
```bash
# Generate memory snapshot
npm run profile:memory

# Analyze heap usage
node --heapsnapshot-signal=SIGUSR2
```

## Getting Additional Help

### Community Resources

- **[GitHub Issues](https://github.com/Menoxcide/Lapa/issues)** - Report bugs and request features
- **[GitHub Discussions](https://github.com/Menoxcide/Lapa/discussions)** - Community support and Q&A
- **[Documentation](README.md)** - Comprehensive guides and references

### Support Channels

- **Email**: lapa-ai@proton.me
- **Documentation**: Check [`docs/`](docs/) directory for specific guides
- **Community**: Join discussions for real-time help

### Providing Debug Information

When requesting help, include:

1. **Cursor version** and operating system
2. **LAPA version** (from extension details)
3. **Error messages** and stack traces
4. **Debug logs** from Developer Tools
5. **Configuration files** (redacted for security)

## Prevention and Best Practices

### Regular Maintenance

1. **Keep Cursor updated** to latest version
2. **Update LAPA extension** when new versions released
3. **Monitor system resources** during intensive operations
4. **Backup configuration files** before major changes

### Configuration Management

1. **Use version control** for custom configurations
2. **Test changes** in development environment first
3. **Document custom settings** for future reference
4. **Use environment variables** for sensitive information

---

**Last Updated**: November 2025 - LAPA v1.3.0-preview SwarmOS Edition