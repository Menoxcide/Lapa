# LAPA Core - Local AI Pair Programmer Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/lapa-ai/lapa-core?style=social)](https://github.com/lapa-ai/lapa-core/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/lapa-ai/lapa-core?style=social)](https://github.com/lapa-ai/lapa-core/network/members)

## Overview

LAPA (Local AI Pair Programmer Agent) is your autonomous MoE-powered coding swarm that runs locally on your machine. This Cursor extension provides:

- **Local-First**: Runs entirely on your GPU with NVIDIA NIM
- **Fully Autonomous**: Zero-prompt continuity with auto-handoffs
- **Privacy-Focused**: No cloud APIs, no data leaks
- **Extensible**: Built with ctx-zip context compression and MCP sandboxing

## 🚀 Features

- **LAPA Swarm™**: Five specialized agents working in parallel
- **Context Compression**: 80%+ token savings with ctx-zip
- **Multi-Agent Orchestration**: LangGraph + Ray for parallel execution
- **Self-Documentation**: Auto-generates AGENT.md files
- **Developer Dashboard**: Real-time visualization of agent activities

## 📋 Requirements

- NVIDIA RTX GPU (3060 or better recommended)
- Docker Desktop
- Cursor IDE

## 🛠 Installation

### Method 1: Development Mode

```bash
# Clone the repository
git clone https://github.com/lapa-ai/lapa-core.git
cd lapa-core

# Install dependencies
npm install

# Install NVIDIA NIM Docker container
npm run setup:nim

# Open in Cursor for extension development
cursor --extensionDevelopmentPath=.
```

### Method 2: Production Installation

1. Download the `.vsix` extension file from [Releases](https://github.com/lapa-ai/lapa-core/releases)
2. In Cursor: `View → Command Palette → Extensions: Install from VSIX`
3. Select the downloaded `.vsix` file

## ▶️ Getting Started

After installation:

1. Click the LAPA icon in the activity bar
2. Click "Start LAPA Swarm" to begin your first autonomous coding session
3. Watch the agent dashboard as your coding swarm works

## 📖 Documentation

Comprehensive documentation is available in [DOCUMENTATION.md](DOCUMENTATION.md) and [AGENT.md](AGENT.md).

For API references and advanced usage, visit [docs.lapa.ai](https://docs.lapa.ai).

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before getting started.

### Quick Start for Contributors

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- **Documentation**: [docs.lapa.ai](https://docs.lapa.ai)
- **Community**: [GitHub Discussions](https://github.com/lapa-ai/lapa-core/discussions)
- **Support**: [support@lapa.ai](mailto:support@lapa.ai)

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape LAPA Core
- Built with [ctx-zip](https://github.com/lapa-ai/ctx-zip) for context compression
- Powered by NVIDIA NIM for local AI inference