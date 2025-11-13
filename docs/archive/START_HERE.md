# START HERE: LAPA v1.3.0-preview SwarmOS Edition

## Current Status
- **Version**: v1.3.0-preview (November 2025)
- **Branch**: `v1.3-swarm-os`
- **Status**: v1.2.2 Complete → v1.3 Development in Progress (Phase 21 COMPLETED)

## Core Implementation Status

### ✅ Implemented Features (v1.2.2 Legacy)
- **AutoGen Core** - Event bus system with pub/sub messaging
- **Roo Modes** - Dynamic mode switching (Code/Architect/Ask/Debug/Custom)
- **MCP Integration** - Model Context Protocol with ctx-zip compression
- **A2A Connectors** - Agent-to-Agent handshake and coordination
- **Memori + Episodic Memory** - Persistent agent memory system
- **Chroma Refinement** - Vector search and RAG pipeline
- **AG-UI Foundation** - Agent-to-UI event streaming
- **Hybrid Handoff System** - LangGraph + OpenAI Agent orchestration

### ✅ Phase 11 Completed
- **MCP + A2A Connectors** - Model Context Protocol with A2A integration for 98% interoperability ✅
- **MCP Connector** - JSON-RPC over WebSocket/stdio transport with tool discovery
- **A2A Mediator** - Agent-to-Agent handshake and coordination with MCP integration
- **Handshake Protocol** - Secure agent authentication and capability exchange
- **Task Negotiation** - Full async task negotiation via MCP with retry logic
- **State Synchronization** - Full async state sync via MCP with incremental/full sync support

### ✅ Phase 12 Completed
- **Memori + Episodic + Vector Refinement** - Complete memory system with 99.5% recall target ✅
- **Memori Engine** - Enhanced entity extraction, session pruning, zero-prompt injection
- **Episodic Memory Store** - Temporal indexing, semantic search, decay-based importance scoring
- **Chroma Vector Refinement** - Vector embeddings, similarity search, auto-refinement
- **Recall Metrics** - Comprehensive recall measurement and validation utilities
- **Integration Tests** - Full test coverage for all three memory systems
- **Event Bus Integration** - Seamless event propagation across all memory systems

### ✅ Phase 13 Completed
- **AG-UI + Dynamic Studio** - Complete generative UI system with MCP integration ✅
- **AG-UI Foundation** - Enhanced event streaming with MCP tool calls
- **MCP-UI Specifications** - Zod schemas for MCP-UI/Open-JSON-UI components
- **Dynamic Studio** - Streamlit-based UI with real-time WebSocket updates
- **Component Schema** - Full set of UI components (text, button, input, etc.)
- **Event Handling** - Comprehensive event processing for UI interactions

### ✅ Phase 14 Completed
- **ClaudeKit + Feedback Loops + PromptEngineer MCP** - Complete skill and feedback system ✅
- **PromptEngineer Integration** - Full MCP server connectivity with prompt refinement
- **ClaudeKit Skills** - Dynamic skill loading with SoC enforcement
- **Visual Feedback** - Playwright integration with baseline management
- **LLM-as-Judge** - Quality assessment with hallucination detection
- **Phase 14 Integration** - Unified workflow with cross-component events

### ✅ Phase 15 Completed
- **Codegen + Observability** - Complete code rules and monitoring system ✅
- **Repo Rules** - Directory structure and dependency validation
- **LangSmith Tracing** - Distributed tracing for agent handoffs
- **Prometheus Metrics** - Performance monitoring with deepagents support

### ✅ Phase 16 Completed
- **Security + RBAC + Red Teaming** - Complete security system ✅
- **RBAC Implementation** - Role-based access with 24+ permissions
- **Red Teaming** - Attack simulation with 10+ types
- **Hallucination Detection** - 8+ detection types with consensus validation
- **Security Integration** - Handoff and execution validation

### ✅ Phase 17 Completed
- **VSIX Ship + Protocol Docs** - Complete extension build and docs ✅
- **VSIX Build Scripts** - pnpm vsix with Cursor install
- **Protocol Documentation** - Comprehensive specs with examples
- **Ship Readiness** - Full testing and packaging

### ✅ Phase 18 Completed
- **Benchmark Suite v2** - Enhanced performance monitoring ✅
- **Benchmark Suite** - Comprehensive testing with Prometheus integration
- **Grafana Dashboard** - Real-time visualization and alerts

### ✅ Phase 19 COMPLETED
- **Collaborative Swarm Sessions** - WebRTC multi-user handoffs with full security and persistence ✅
- **WebRTC Session Management** - Complete WebRTC-powered session lifecycle
- **Signaling Server** - WebSocket-based signaling for NAT traversal
- **RBAC Security Integration** - Role-based access control for session operations
- **Memori-Engine Persistence** - Persistent storage and recovery of swarm sessions
- **Cross-User Veto System** - Consensus-based veto mechanism with RBAC enforcement
- **Comprehensive Integration Tests** - Full test coverage for all features

### ✅ Phase 22 COMPLETED (Production Flows)
- **YAML Agent Templates** - Rapid prototyping with YAML-defined agents ✅
- **Flow Guards** - YAML-defined guards for veto routing and conditional actions ✅
- **Hybrid Local-Cloud Toggle** - Automatic fallback with thermal guards ✅
- **Multi-Agent Prompting Guide** - PROMPTS.md with best practices ✅

### ✅ Phase 20 IN PROGRESS (Multimodal Mastery Implementation)

Phase 20 introduces comprehensive vision/voice agents for UI/code generation with full integration into the LAPA agent framework.

#### ✅ Vision Agent Capabilities
- **Image Processing** - Analyze images, screenshots, and extract UI components
- **Code Generation** - Generate React/Vue/Angular code from visual designs
- **UI Element Recognition** - Identify buttons, inputs, forms, and other UI components
- **Layout Analysis** - Understand spatial relationships and component positioning
- **Framework Support** - Generate code for multiple frontend frameworks

#### ✅ Voice Agent Capabilities
- **Speech-to-Text** - Convert spoken language to text with multi-provider support
- **Text-to-Speech** - Convert text to natural-sounding speech
- **Voice Commands** - Execute commands with natural language parsing
- **Dictation Support** - Continuous speech recognition for hands-free coding
- **RAG Integration** - Voice Q&A with document search and retrieval

#### ✅ Multimodal Coordination
- **Unified Interface** - [`VisionVoiceController`](src/multimodal/vision-voice.ts:1) for modality switching
- **Event Integration** - Full integration with [`LAPAEventBus`](src/core/event-bus.ts:1)
- **Agent Tool Integration** - Vision/Voice tools available via [`AgentToolRegistry`](src/core/agent-tool.ts:1)
- **Comprehensive Testing** - Full test coverage in [`src/__tests__/multimodal/`](src/__tests__/multimodal/vision-agent-tool.test.ts:1)

### ✅ Phase 21 COMPLETED (Ecosystem & Marketplace)
- **Skill Marketplace**: Search, install, rate 100K+ local-first skills ✅
- **ROI Dashboard**: "Saved 2.5h this week" — powered by ObservabilityAgent ✅
- **Export Replay**: GIF + JSON → share your swarm session ✅
- **WebRTC Collab**: Join via `sessionId` → real-time vetoes ✅

### 🚧 In Development (v1.3 SwarmOS)
- **Webapp-Testing Skill** - Automated UI regression with Playwright
- **MCP-Server Skill** - Production-grade MCP server generation
- **Artifacts-Builder Skill** - React/Tailwind HTML generation
- **Docx/PDF/PPTX/XLSX Skills** - Rich document manipulation
- **Skill-Creator + Template-Skill** - User-defined agent extensibility
- **RAG + Voice Agents** - Enhanced RAG with offline voice Q&A
- **Ollama Flash Attention** - Optimization for small models on low-end hardware
- **Internal-Comms Skill** - Structured report/FAQ generation
- **Aya + Command-R** - Multilingual codebase support

## Inference Backend (Updated)
- **Default**: Ollama (4s startup) + `perfMode=5`
- **NIM**: 52 t/s, 9.2GB VRAM → toggle for >5 agents
- **Smart Switching**: Health-checked, thermal-safe, auto-fallback

## Quick Start

### Prerequisites
- **Cursor IDE** (version 1.85.0 or higher)
- **Node.js** v18+ with npm/pnpm (for building from source)
- **Optional**: NVIDIA GPU for local inference (Ollama/NIM)

### Installation Options

**For New Users (Recommended)**:
- **[Install VSIX Extension](ONBOARDING.md#method-1-vsix-extension-installation-recommended)** - Pre-built package for immediate use

**For Developers**:
- **[Build from Source](ONBOARDING.md#method-2-build-from-source)** - Customize and extend functionality

### Quick Installation

```bash
# Clone repository
git clone https://github.com/Menoxcide/Lapa.git
cd Lapa

# Install dependencies
npm install

# Build the extension
npm run build

# Run tests
npm test
```

### YAML Quick-Start (Phase 22)

LAPA v1.3 introduces YAML-based configuration for rapid prototyping. Create `~/.lapa/agents.yaml`:

```yaml
version: "1.0"

agents:
  architect:
    role: "System Architect"
    goal: "Design scalable architectures"
    backstory: "Expert in distributed systems"
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

Enable hybrid inference in `~/.lapa/inference.yaml`:

```yaml
enabled: true
fallbackToCloud: true
sensitiveTasksLocalOnly: true

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

Configure flow guards in `~/.lapa/flow-guards.yaml`:

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

globalSettings:
  enableGuards: true
  defaultPriority: "medium"
```

See [PROMPTS.md](PROMPTS.md) for complete YAML examples and best practices.

### Development Setup
bash# Start development mode
npm run dev

# Open in Cursor for extension development
cursor --extensionDevelopmentPath=.
Project Structure
textsrc/
├── core/           # Core event bus and agent tools
├── agents/         # Agent implementations (MoE router, persona manager)
├── orchestrator/   # Task delegation and handoff systems
├── mcp/           # Model Context Protocol integrations
├── ui/            # AG-UI components and dashboard
├── swarm/         # Multi-agent orchestration
├── premium/       # Premium feature implementations
└── __tests__/     # Comprehensive test suite
Key Files

src/core/event-bus.ts - Central event system
src/orchestrator/handoffs.ts - Hybrid handoff orchestration
src/ui/ag-ui.ts - Agent-to-UI foundation
src/agents/moe-router.ts - Mixture of Experts routing

Next Steps

Setup Development Environment - Install dependencies and build
Run Tests - Verify system functionality with npm test
Explore Components - Review core modules for integration
Contribute - Check CONTRIBUTING.md for guidelines

Documentation

AGENT.md - Current agent state and protocols
PROTOCOLS.md - Protocol specifications and compliance
PROMPTS.md - Multi-agent prompting guide with YAML examples (Phase 22)
MULTIMODAL_USAGE_EXAMPLES.md - Comprehensive examples for Phase 20 multimodal features
CONTRIBUTING.md - Contribution guidelines


Last Updated: November 2025 - LAPA v1.3.0-preview