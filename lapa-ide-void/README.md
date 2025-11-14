# LAPA-VOID: Swarm-Powered IDE

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Menoxcide/Lapa/releases)
[![Status](https://img.shields.io/badge/status-release--ready-green.svg)](https://github.com/Menoxcide/Lapa)

<div align="center">
	<img
		src="./void_icons/slice_of_void.png"
	 	alt="LAPA-VOID Logo"
		width="300"
	 	height="300"
	/>
</div>

## Overview

**LAPA-VOID** is a fork of [Void IDE](https://github.com/voideditor/void) enhanced with **LAPA Swarm** capabilities. It combines Void's excellent AI-powered IDE features with LAPA's autonomous multi-agent swarm system.

### What is LAPA-VOID?

LAPA-VOID is the **next frontier agent/IDE** - a complete development environment that:
- ✅ Preserves **100% of Void IDE's core functionality** (inline edits, agent modes, local models)
- ✅ Adds **LAPA Swarm** - a 16-agent Helix system for autonomous coding
- ✅ Runs **locally-first** with optional cloud scaling
- ✅ Provides **free tier** with core features + **premium tier** for power users

## 🚀 Key Features

### Void IDE Core (Inherited)
- **Inline Edits**: Fast Apply (Search/Replace) and Slow Apply (whole file rewrite)
- **Agent Modes**: Multiple coding behavior modes
- **Local Models**: Full support for Ollama and NVIDIA NIM
- **Model Selection**: Flexible provider/model configuration
- **Text Document Provider**: RAG semantic search integration
- **Status Bar**: Metrics and thermal gauge
- **Webview Integration**: Custom UI panels

### LAPA Swarm (Enhanced)
- **16-Agent Helix**: Specialized agents working in parallel (Architect, Coder, Tester, Reviewer, etc.)
- **Protocol Integration**: MCP, A2A, AG-UI, LPSP support
- **Advanced Memory**: 99.5% recall with episodic memory and vector refinement (Pro)
- **Observability**: LangSmith tracing, Prometheus metrics, ROI dashboard
- **WebRTC Collaboration**: Multi-user swarm sessions (Pro)
- **Multimodal**: Vision and voice agents (Pro)

## 📊 Free vs Pro Comparison

| Feature | Free | **Pro ($12/mo or $99/yr)** |
|---------|------|------------------------|
| **Agents** | 4 max | 16 (Full Helix) |
| **Inference** | Local only (Ollama/NIM) | Local + Cloud scaling |
| **Memory Recall** | 85% | 99.5% |
| **E2B Sandbox** | ❌ | ✅ |
| **Team Collaboration** | Single user | Multi-user WebRTC |
| **Cloud NIM** | ❌ | ✅ |
| **Advanced Observability** | Basic metrics | Full suite (LangSmith, Prometheus, ROI) |
| **Premium Skills** | ❌ | ✅ |
| **Blob Storage** | ❌ | ✅ |
| **Audit Logging** | ❌ | ✅ |
| **Support** | Community | Priority |

See [PREMIUM_FEATURES.md](../PREMIUM_FEATURES.md) for complete feature breakdown.

## 📋 Requirements

- **Node.js** v20+ (for building)
- **Yarn** package manager
- **Git** with submodule support
- **Optional**: NVIDIA GPU for local inference (Ollama/NIM)
- **Optional**: Cloud AI providers for premium features

## 🚀 Quick Start

### Installation

#### Option 1: Build from Source (Recommended for Development)

```bash
# Clone repository with submodules
git clone --recursive https://github.com/Menoxcide/Lapa.git
cd Lapa/lapa-ide-void

# Install dependencies
yarn install

# Compile
yarn compile

# Run in development mode
yarn watch
```

#### Option 2: Install Extension (For End Users)

1. Download `lapa-swarm-*.vsix` from [Releases](https://github.com/Menoxcide/Lapa/releases)
2. Open Void IDE (or VS Code)
3. Go to Extensions view (`Ctrl+Shift+X`)
4. Click "..." menu → "Install from VSIX"
5. Select the downloaded VSIX file
6. Restart IDE when prompted

### First Use

1. **Start LAPA Swarm**: Press `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac) or use Command Palette → "LAPA: Start Swarm"
2. **Configure**: Open Settings → Extensions → LAPA Swarm
3. **Upgrade** (optional): Use "LAPA: Upgrade to Pro" command for premium features

## 📖 Documentation

### Getting Started
- **[START_HERE.md](../docs/START_HERE.md)** - Project overview and current status
- **[ONBOARDING.md](../docs/ONBOARDING.md)** - Complete installation and setup guide
- **[PREMIUM_FEATURES.md](../PREMIUM_FEATURES.md)** - Free vs Pro feature comparison

### Technical Documentation
- **[VOID_CODEBASE_GUIDE.md](./VOID_CODEBASE_GUIDE.md)** - Void IDE codebase structure
- **[PROTOCOLS.md](./docs/PROTOCOLS.md)** - Protocol specifications (MCP, A2A, AG-UI, LPSP)
- **[FEATURE_OVERVIEW.md](../docs/FEATURE_OVERVIEW.md)** - Complete feature capabilities
- **[DIRECTIONS.md](../src/DIRECTIONS.md)** - Development roadmap and architecture

### Advanced
- **[CONTEXT_ENGINEERING.md](../docs/CONTEXT_ENGINEERING.md)** - Context engineering guide
- **[TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[CONTRIBUTING.md](../docs/CONTRIBUTING.md)** - Contribution guidelines

## 🛠 Development

### Building

```bash
# Daily compilation
yarn compile

# Watch mode (development)
yarn watch

# Package extension
cd extensions/lapa-swarm
npm run build
npm run package
```

### Testing

```bash
# Run tests
yarn test

# Extension tests
cd extensions/lapa-swarm
npm test
```

### Project Structure

```
lapa-ide-void/
├── src/                    # Void IDE core (forked from voideditor/void)
│   └── vs/workbench/contrib/void/  # Void integration points
├── extensions/
│   └── lapa-swarm/        # LAPA extension
│       ├── src/
│       │   ├── agents/    # 16-agent Helix system
│       │   ├── swarm/     # Swarm orchestration
│       │   ├── premium/   # Premium features (license-gated)
│       │   └── ...
│       └── package.json
├── docs/                   # Documentation
└── scripts/               # Build and release scripts
```

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](../docs/CONTRIBUTING.md) and [Code of Conduct](../docs/CODE_OF_CONDUCT.md) before getting started.

### Quick Start for Contributors

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes
4. Add tests if applicable
5. Submit a pull request with a clear description

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

- **Code**: MIT License (open source)
- **Premium Features**: Require license activation (see [PREMIUM_FEATURES.md](../PREMIUM_FEATURES.md))
- **Free Tier**: Fully functional without license

## 💬 Support

- **Documentation**: Explore [`docs/`](../docs/) directory for comprehensive guides
- **Issues**: [GitHub Issues](https://github.com/Menoxcide/Lapa/issues)
- **Community**: [GitHub Discussions](https://github.com/Menoxcide/Lapa/discussions)
- **Email**: support@lapa.ai

## 🙏 Acknowledgments

### Void IDE
- **Void Team** - Original Void IDE fork of VS Code
  - [voideditor/void](https://github.com/voideditor/void)

### LAPA Core
- **Menoxcide** — Founder, Lead Architect, LAPA Creator
- **AutoGen Team (Microsoft)** — AutoGen framework
- **LangChain Team** — LangChain agent toolkit
- **CrewAI Team** — CrewAI role-based orchestration
- And many more (see [README.md](../README.md) for full list)

## 🎯 Roadmap

- **v1.0** (Current): Initial release with core swarm functionality
- **v1.1**: Enhanced collaboration features
- **v1.2**: Marketplace and skill ecosystem
- **v1.3**: Advanced multimodal capabilities

## 📈 Status

**Current Version**: v1.0.0  
**Status**: Release Ready  
**Free Tier**: Fully functional  
**Pro Tier**: Available via license activation

---

**LAPA-VOID v1.0.0** - Swarm-Powered IDE - November 2025

**Built with ❤️ by the LAPA team**
