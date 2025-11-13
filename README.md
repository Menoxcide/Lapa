# LAPA Core - Local AI Pair Programmer Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.2.2-blue.svg)](https://github.com/Menoxcide/Lapa/releases)
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

## 📋 Requirements

- **Node.js** v18+ with npm/pnpm
- **Cursor IDE** for extension development
- **Optional**: NVIDIA GPU for local inference (Ollama/NIM)
- **Optional**: Cloud AI providers (OpenAI, Anthropic) for enhanced capabilities

## 🛠 Installation

### Method 1: Development Mode

```bash
# Clone the repository
git clone https://github.com/Menoxcide/Lapa.git
cd Lapa

# Install dependencies
npm install

# Build the extension
npm run build

# Run tests to verify installation
npm test

# Open in Cursor for extension development
cursor --extensionDevelopmentPath=.
```

### Method 2: Production Installation (Coming Soon)

> **Note**: VSIX packaging is implemented but official releases are pending. Check [Releases](https://github.com/Menoxcide/Lapa/releases) for updates.

1. Download the `.vsix` extension file from [Releases](https://github.com/Menoxcide/Lapa/releases)
2. In Cursor: `View → Command Palette → Extensions: Install from VSIX`
3. Select the downloaded `.vsix` file

## ▶️ Getting Started

After installation:

1. **Start Development Server**: Run `npm run dev` to start the development build
2. **Open in Cursor**: Use `cursor --extensionDevelopmentPath=.` to load the extension
3. **Start LAPA Swarm**: Click the LAPA icon in the activity bar and select "Start LAPA Swarm"
4. **Monitor Dashboard**: Watch real-time agent activities in the swarm dashboard

## 📖 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- **[START_HERE.md](docs/START_HERE.md)** - Current implementation status and quick start guide
- **[AGENT.md](docs/AGENT.md)** - Detailed agent architecture and protocols
- **[PROTOCOLS.md](docs/PROTOCOLS.md)** - Protocol specifications and compliance details
- **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Contribution guidelines and development workflow

### Key Implementation Highlights

- **✅ Phase 10-18 Completed**: A2A handshakes, MCP integration, memory systems, UI framework, observability
- **✅ Production Ready**: VSIX packaging with benchmark suite and comprehensive testing
- **✅ 99.5% Fidelity Target**: Achieved across handoff latency, memory efficiency, and task completion

For detailed API references and advanced usage, explore the source code in [`src/`](src/) directory.

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](docs/CONTRIBUTING.md) and [Code of Conduct](docs/CODE_OF_CONDUCT.md) before getting started.

### Development Workflow

1. **Fork the repository** and create a feature branch
2. **Set up development environment** using the instructions above
3. **Make your changes** following the project architecture
4. **Add comprehensive tests** for new functionality
5. **Run the test suite** to ensure everything works: `npm test`
6. **Submit a pull request** with detailed description of changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- **Documentation**: Explore [`docs/`](docs/) directory for comprehensive guides
- **Community**: [GitHub Discussions](https://github.com/Menoxcide/Lapa/discussions)
- **Issues**: [GitHub Issues](https://github.com/Menoxcide/Lapa/issues)
- **Repository**: [LAPA GitHub](https://github.com/Menoxcide/Lapa)

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape LAPA Core
- Built with [ctx-zip](https://github.com/lapa-ai/ctx-zip) for context compression
- Powered by hybrid inference (Ollama, NVIDIA NIM, OpenAI, Anthropic)
- Integrated with MCP (Model Context Protocol) for extensibility

---

**LAPA Core v1.2.2** - Protocol-Resonant Nexus - November 2025