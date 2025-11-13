# LAPA Onboarding Guide

## Overview

Welcome to LAPA (Local AI Pair Programmer Agent)! This comprehensive onboarding guide will help you install, configure, and start using LAPA as a Cursor extension. LAPA is an autonomous MoE-powered coding swarm that runs locally on your machine with optional cloud integration.

## Quick Start Options

Choose your installation method:

- **Quick Install**: Install the pre-built VSIX extension (recommended for new users)
- **Developer Setup**: Build from source for development and customization
- **Production Configuration**: Advanced setup for enterprise or team usage

## Prerequisites

Before installing LAPA, ensure you have:

- **Cursor IDE** (version 1.85.0 or higher)
- **Node.js** v18+ (for building from source)
- **npm** or **pnpm** package manager
- **Optional**: NVIDIA GPU for local inference (Ollama/NIM)

## Installation Methods

### Method 1: VSIX Extension Installation (Recommended)

#### Step 1: Download the VSIX File

Download the latest `lapa-core-1.2.0.vsix` file from:
- [GitHub Releases](https://github.com/Menoxcide/Lapa/releases)
- Or use the file included in this repository

#### Step 2: Install in Cursor

**Option A: GUI Installation**
1. Open Cursor IDE
2. Press `Ctrl+Shift+X` to open the Extensions view
3. Click the "..." menu (top right corner)
4. Select "Install from VSIX..."
5. Choose the downloaded `.vsix` file
6. Restart Cursor when prompted

**Option B: Command Line Installation**
```bash
cursor --install-extension lapa-core-1.2.0.vsix
```

#### Step 3: Verify Installation

1. After restarting Cursor, look for the LAPA icon in the activity bar
2. Click the icon to open the Swarm Dashboard
3. If the icon isn't visible, check that the extension is enabled in Extensions view

### Method 2: Build from Source

#### Step 1: Clone the Repository

```bash
git clone https://github.com/Menoxcide/Lapa.git
cd Lapa
```

#### Step 2: Install Dependencies

```bash
# Using npm
npm install

# Or using pnpm (preferred)
pnpm install
```

#### Step 3: Build the Extension

```bash
npm run build
```

#### Step 4: Package as VSIX

```bash
npm run vsix
```

#### Step 5: Install Locally

```bash
npm run vsix:install
```

## Getting Started Tutorial

### Step 1: Initial Setup

After installation, configure LAPA for your environment:

1. **Open Cursor Settings** (`Ctrl+,`)
2. **Navigate to Extensions → LAPA**
3. **Configure Basic Settings**:
   - **Default Model**: Choose your preferred AI provider (Ollama, OpenRouter, etc.)
   - **Local Inference**: Enable if you have local models installed
   - **API Keys**: Set API keys for cloud providers if needed

### Step 2: Start Your First Swarm Session

1. **Open Command Palette** (`Ctrl+Shift+P`)
2. **Search for "Start LAPA Swarm"** and execute the command
3. **Monitor the Swarm Dashboard** as agents initialize

### Step 3: Basic Usage Examples

#### Example 1: Code Generation

1. Open a file in your project
2. Use the LAPA command palette options:
   - "LAPA: Generate Component" - Create React components
   - "LAPA: Refactor Code" - Optimize existing code
   - "LAPA: Add Tests" - Generate test coverage

#### Example 2: Multi-Agent Task

1. Open the Swarm Dashboard
2. Create a new task: "Implement user authentication system"
3. Watch as specialized agents collaborate:
   - **Architect** designs the system
   - **Coder** implements the code
   - **Reviewer** ensures quality
   - **Tester** validates functionality

### Step 4: Advanced Features

#### YAML Configuration (Phase 22)

Create `~/.lapa/agents.yaml` for custom agent configurations:

```yaml
version: "1.0"

agents:
  architect:
    role: "System Architect"
    goal: "Design scalable architectures"
    model: "DeepSeek-R1-671B"
    capabilities: ["planning", "architecture"]
    tools: ["diagram-generator"]

  coder:
    role: "Software Engineer"
    goal: "Write clean, maintainable code"
    model: "Qwen3-Coder-480B-A35B-Instruct"
    capabilities: ["code-generation"]
    tools: ["code-generator", "code-formatter"]

globalSettings:
  enableAutoRefine: true
  defaultModel: "ollama"
  vetoThreshold: 0.833
```

#### Flow Guards (Phase 22)

Configure automatic routing with `~/.lapa/flow-guards.yaml`:

```yaml
version: "1.0"

guards:
  - name: "thermal-guard"
    condition: "system.temperature > 78"
    action:
      type: "route"
      targetAgent: "optimizer"
    priority: "high"
    blocking: false

  - name: "quality-gate"
    condition: "task.confidence < 0.8"
    action:
      type: "require-veto"
      requiredAgents: ["reviewer", "tester"]
    priority: "critical"
    blocking: true
```

## Configuration Guide

### Production Settings

For optimal performance in production environments:

#### Inference Configuration

Create `~/.lapa/inference.yaml`:

```yaml
enabled: true
fallbackToCloud: true
sensitiveTasksLocalOnly: true

# API Keys (use environment variables)
openrouterApiKey: "${OPENROUTER_API_KEY}"

thermalThresholds:
  vram: 85
  ram: 85
  cpu: 90
  temperature: 78

preferredProviders:
  - "ollama"
  - "nim" 
  - "openrouter"
```

#### Memory Configuration

LAPA includes comprehensive memory systems:
- **Memori Engine**: Persistent agent memory
- **Episodic Memory**: Session-based context storage
- **Chroma Refinement**: Vector search and RAG pipeline

### Performance Optimization

#### Local Inference Setup

**Ollama Installation**:
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull deepseek-coder
ollama pull llama3.1
```

**NVIDIA NIM Setup**:
```bash
# Install NIM (requires NVIDIA GPU)
npm run setup:nim
```

#### Benchmarking

Run performance tests:
```bash
# Comprehensive benchmark suite
npm run test:performance

# Handoff performance testing
npm run test:handoffs
```

## Feature Overview

### Core Capabilities

- **Autonomous Swarm Intelligence**: Multiple specialized agents working collaboratively
- **Hybrid Inference**: Seamless switching between local and cloud AI providers
- **Protocol-Resonant Nexus**: Advanced agent orchestration with A2A handshakes
- **Comprehensive Memory**: Persistent context with episodic and vector memory
- **Generative UI**: Dynamic interface with real-time agent feedback

### Advanced Features (v1.3 Preview)

- **Multimodal Mastery**: Vision and voice agents for UI/code generation
- **Collaborative Swarm Sessions**: WebRTC multi-user handoffs
- **Agent Marketplace**: On-chain registry with ROI dashboard
- **Export Replay**: GIF + JSON session sharing

### Security Features

- **RBAC Implementation**: Role-based access control
- **Hallucination Detection**: Advanced output validation
- **Red Teaming**: Comprehensive security testing
- **Audit Logging**: Detailed security event tracking

## Troubleshooting

### Common Issues

#### Extension Not Appearing
- **Solution**: Restart Cursor completely
- **Check**: Verify extension is enabled in Extensions view
- **Verify**: Check Cursor version compatibility (requires 1.85.0+)

#### Activation Errors
- **Solution**: Ensure Node.js v18+ is installed
- **Check**: Verify all prerequisites are met
- **Debug**: Check Cursor developer console for errors

#### Performance Issues
- **Solution**: Adjust inference settings in configuration
- **Optimize**: Enable local inference for better performance
- **Monitor**: Use the benchmark suite to identify bottlenecks

#### API Connection Problems
- **Solution**: Verify API keys and network connectivity
- **Fallback**: Configure hybrid inference with local fallback
- **Test**: Use the test suite to validate connections

### Debug Mode

Enable detailed logging for troubleshooting:

1. **Open Cursor Settings**
2. **Set LAPA log level to "debug"**
3. **Check console output in Developer Tools** (`Ctrl+Shift+I`)

### Getting Help

- **Troubleshooting**: Comprehensive guide in [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Documentation**: Complete guides in [`docs/`](docs/)
- **Community**: [GitHub Discussions](https://github.com/Menoxcide/Lapa/discussions)
- **Issues**: [GitHub Issues](https://github.com/Menoxcide/Lapa/issues)
- **Support**: lapa-ai@proton.me

## Next Steps

### Learning Resources

- **[START_HERE.md](START_HERE.md)**: Comprehensive project overview
- **[FEATURE_OVERVIEW.md](FEATURE_OVERVIEW.md)**: Complete feature capabilities and architecture
- **[AGENT.md](AGENT.md)**: Detailed agent architecture and protocols
- **[PROMPTS.md](PROMPTS.md)**: Multi-agent prompting guide with YAML examples
- **[PROTOCOLS.md](PROTOCOLS.md)**: Protocol specifications and compliance
- **[MULTIMODAL_USAGE_EXAMPLES.md](MULTIMODAL_USAGE_EXAMPLES.md)**: Vision and voice agent examples

### Advanced Tutorials

- **YAML Agent Templates**: Rapid prototyping with configuration files
- **Flow Guards**: Advanced routing and conditional actions
- **Multimodal Integration**: Combining vision and voice capabilities
- **Swarm Session Management**: Collaborative multi-user workflows

### Contributing

Interested in contributing? Check out:
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: Contribution guidelines
- **Code of Conduct**: Community standards
- **Development Setup**: Building and testing the extension

## Conclusion

You're now ready to experience autonomous coding with LAPA! The extension provides powerful AI-assisted development capabilities while maintaining privacy and control through local-first architecture.

For the latest updates and community support, join our [GitHub Discussions](https://github.com/Menoxcide/Lapa/discussions) and stay tuned for new features in the v1.3 SwarmOS edition.

---

**Last Updated**: November 2025 - LAPA v1.3.0-preview SwarmOS Edition