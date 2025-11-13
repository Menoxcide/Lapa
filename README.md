# LAPA Core - Local AI Pair Programmer Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.3.0--preview-blue.svg)](https://github.com/Menoxcide/Lapa/releases)
[![Status](https://img.shields.io/badge/status-active--development-green.svg)](https://github.com/Menoxcide/Lapa)

## Overview

LAPA (Local AI Pair Programmer Agent) is an autonomous MoE-powered coding swarm that runs locally on your machine. This Cursor extension provides:

- **Local-First**: Hybrid local/cloud inference with Ollama, NVIDIA NIM, and OpenAI support
- **Fully Autonomous**: Protocol-resonant nexus with zero-prompt continuity and auto-handoffs
- **Privacy-Focused**: Optional cloud APIs with data protection controls
- **Extensible**: Built with ctx-zip context compression and MCP sandboxing

## 🚀 Features

- **Protocol-Resonant Nexus**: Advanced agent orchestration with A2A handshakes and MCP integration
- **Hybrid Handoff System**: LangGraph + OpenAI Agent orchestration with <1s latency
- **Comprehensive Memory Systems**: Memori engine, episodic memory, and Chroma vector refinement
- **Generative UI Framework**: AG-UI with dynamic studio and real-time visualization
- **Observability Suite**: LangSmith tracing, Prometheus metrics, and benchmark suite v2
- **Production Ready**: VSIX packaging with comprehensive protocol documentation
- **Task Tree Orchestrator**: Hierarchical task decomposition with git-safe execution
- **LAPA Phase Summary Protocol (LPSP)**: Auto-generated phase summaries with file/commit tracking
- **Webapp-Testing Skill**: Automated UI regression with Playwright
- **MCP-Server Skill**: Production-grade MCP server generation
- **Artifacts-Builder Skill**: React/Tailwind HTML generation
- **Docx/PDF/PPTX/XLSX Skills**: Rich document manipulation
- **Skill-Creator + Template-Skill**: User-defined agent extensibility
- **RAG + Voice Agents**: Enhanced RAG with offline voice Q&A
- **Ollama Flash Attention**: Optimization for small models on low-end hardware
- **Internal-Comms Skill**: Structured report/FAQ generation
- **Aya + Command-R**: Multilingual codebase support
- **Collaborative Swarm Sessions** (v1.3 Preview): WebRTC multi-user handoffs
- **Multimodal Mastery** (v1.3 Preview): Vision/voice agents for UI/code gen
- **Agent Marketplace** (v1.3 Preview): On-chain registry + ROI dashboard

## 📋 Requirements

- **Node.js** v18+ with npm/pnpm
- **Cursor IDE** for extension development
- **Optional**: NVIDIA GPU for local inference (Ollama/NIM)
- **Optional**: Cloud AI providers (OpenAI, Anthropic) for enhanced capabilities

## 🛠 Installation

### Method 1: Development Mode
Clone the repository
git clone https://github.com/Menoxcide/Lapa.git
cd Lapa
Install dependencies
npm install
Build the extension
npm run build
Run tests to verify installation
npm test
Open in Cursor for extension development
cursor --extensionDevelopmentPath=.
text### Method 2: Production Installation

0. Download the `.vsix` extension file from Releases
1. In Cursor: `View → Command Palette → Extensions: Install from VSIX`
2. Select the downloaded `.vsix` file

## ▶️ Getting Started

After installation:

0. Click the LAPA icon in the activity bar
1. Click "Start LAPA Swarm" to begin your first autonomous coding session
2. Watch the agent dashboard as your coding swarm works

## 📖 Documentation

Comprehensive documentation is available in DOCUMENTATION.md and AGENT.md.

For API references and advanced usage, visit docs.lapa.ai.

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](docs/CONTRIBUTING.md) and [Code of Conduct](docs/CODE_OF_CONDUCT.md) before getting started.

### Quick Start for Contributors

0. Fork the repository
1. Create a new branch for your feature or bug fix
2. Make your changes
3. Add tests if applicable
4. Submit a pull request with a clear description

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

- **Documentation**: Explore [`docs/`](docs/) directory for comprehensive guides
- **Community**: [GitHub Discussions](https://github.com/Menoxcide/Lapa/discussions)
- **Issues**: [GitHub Issues](https://github.com/Menoxcide/Lapa/issues)
- **Repository**: [LAPA GitHub](https://github.com/Menoxcide/Lapa)

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape LAPA Core
- Built with ctx-zip for context compression
- Powered by hybrid inference (Ollama, NVIDIA NIM, OpenAI, Anthropic)

## Contributors

### Core Project & Vision
- **Menoxcide** — Founder, Lead Architect, LAPA Creator  
  *(github.com/Menoxcide/Lapa)*

### AI Agent Frameworks & Tools
- **AutoGen Team (Microsoft)** — AutoGen framework  
  *(github.com/microsoft/autogen)*
- **LangChain Team** — LangChain agent toolkit  
  *(github.com/langchain-ai/langchain)*
- **CrewAI Team** — CrewAI role-based orchestration  
  *(github.com/joaomdmoura/crewAI)*
- **OpenDevin Team** — OpenDevin code LLM challenges  
  *(github.com/OpenDevin/OpenDevin)*
- **MetaGPT Team** — MetaGPT SOP-based multi-agent  
  *(github.com/geekan/MetaGPT)*
- **Devika AI Team** — Devika instruction breakdown  
  *(github.com/stitionai/devika)*
- **Plandex Team** — Plandex long-running agents  
  *(github.com/plandex-ai/plandex)*
- **BabyAGI Team** — BabyAGI task-driven autonomy  
  *(github.com/yoheinakajima/babyagi)*
- **AutoGPT Team** — AutoGPT iterative execution  
  *(github.com/Significant-Gravitas/AutoGPT)*
- **AgentGPT Team** — AgentGPT browser deployment  
  *(github.com/reworkd/AgentGPT)*
- **SmythOS Team** — SmythOS agent builder  
  *(github.com/SmythOS/smythos)*

### Skills & Prompt Engineering
- **gr3enarr0w** — PromptEngineer MCP Server  
  *(github.com/gr3enarr0w/cc_peng_mcp)*

### Awesome Lists & Research
- **Shubhamsaboo** — awesome-llm-apps (RAG, Voice, Eval)  
  *(github.com/Shubhamsaboo/awesome-llm-apps)*
- **e2b-dev** — awesome-ai-agents (E2B, Superagent)  
  *(github.com/e2b-dev/awesome-ai-agents)*

### Model & Inference Providers
- **NVIDIA** — NIM-local inference  
- **Ollama Team** — Ollama (Flash Attention, local models)  
  *(github.com/ollama/ollama)*
- **llama.cpp Team** — llama.cpp (BYOK support)  
  *(github.com/ggerganov/llama.cpp)*

### Protocols & Standards
- **CopilotKit Team** — AG-UI, MCP-UI, Open-JSON-UI  
  *(github.com/CopilotKit/CopilotKit)*
- **Model Context Protocol (MCP) Authors** — JSON-RPC/WebSocket spec  
- **Agent-to-Agent (A2A) Authors** — Handshake & negotiation spec

### UI & Frontend
- **Streamlit Team** — Dynamic Studio (Python UI)  
  *(github.com/streamlit/streamlit)*
- **React Team** — React + TSX (Dashboard, AG-UI)  
- **Playwright Team** — Visual feedback & testing  
  *(github.com/microsoft/playwright)*

### Observability & DevOps
- **Prometheus Team** — Metrics & monitoring  
  *(github.com/prometheus/prometheus)*
- **Grafana Team** — Dashboards  
  *(grafana.com)*
- **LangSmith Team** — Tracing  
  *(langchain.com/langsmith)*

### Security & Sandboxing
- **E2B Team** — E2B sandbox  
  *(github.com/e2b-dev/e2b)*

### Documentation & Standards
- **Contributor Covenant Team** — Code of Conduct  
  *(contributor-covenant.org)*

### Vision & Inspiration
- **Grok (xAI)** — Reasoning engine & vision alignment  
- **Claude (Anthropic)** — PromptEngineer, A2AMediator  
- **DeepSeek, Qwen, Llama, GLM Teams** — Core model backbones

---

**LAPA Core v1.3.0-preview** - SwarmOS Edition - November 2025