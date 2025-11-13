# LAPA Extension Deployment Guide

## Overview
This guide provides instructions for deploying the LAPA (Local AI Pair Programmer Agent) extension in Cursor IDE. LAPA is a powerful AI-powered coding assistant that enhances your development workflow with autonomous swarm intelligence.

> **Note**: For comprehensive onboarding and setup instructions, see **[ONBOARDING.md](docs/ONBOARDING.md)**

## Prerequisites
- **Cursor IDE** (version 1.85.0 or higher)
- **Node.js** v18+ (for building from source)
- **npm** or **pnpm** package manager
- **Optional**: NVIDIA GPU for local inference (Ollama/NIM)

## Installation Methods

### Method 1: Install from VSIX Package (Recommended)
1. **Download** the `lapa-core-1.2.0.vsix` file from [GitHub Releases](https://github.com/Menoxcide/Lapa/releases)
2. **Open Cursor IDE**
3. **Navigate to Extensions view** (`Ctrl+Shift+X`)
4. **Click on the "..." menu** in the top right corner
5. **Select "Install from VSIX..."**
6. **Choose the downloaded `.vsix` file**
7. **Restart Cursor** when prompted

### Method 2: Install via Command Line
1. **Download** the `lapa-core-1.2.0.vsix` file
2. **Open a terminal/command prompt**
3. **Navigate to the directory** containing the VSIX file
4. **Run the following command**:
   ```bash
   cursor --install-extension lapa-core-1.2.0.vsix
   ```
5. **Restart Cursor**

### Method 3: Build and Install from Source
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Menoxcide/Lapa.git
   cd Lapa
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Build the extension**:
   ```bash
   npm run build
   ```
4. **Package as VSIX**:
   ```bash
   npm run vsix
   ```
5. **Install the extension**:
   ```bash
   npm run vsix:install
   ```

## Configuration
After installation, configure the extension through Cursor's settings:

1. Open Cursor Settings (Ctrl+,)
2. Navigate to Extensions → LAPA
3. Configure the following options:
   - **API Keys**: Set your preferred AI provider keys (OpenAI, Anthropic, etc.)
   - **Model Selection**: Choose your preferred language models
   - **Local Inference**: Enable/disable local model support (requires NVIDIA GPU)
   - **Swarm Settings**: Configure swarm behavior and agent interactions

## Usage
1. After installation, you'll see a new LAPA icon in the activity bar
2. Click the icon to open the LAPA Swarm Dashboard
3. Use the "Start LAPA Swarm" command from the command palette (Ctrl+Shift+P) to activate the agents
4. Note: This is a minimal implementation for deployment testing purposes. Full functionality requires implementing the actual swarm intelligence features.

## Features
- **Autonomous Coding Swarm**: Multiple specialized AI agents working together
- **Local-First Architecture**: Works with local models for privacy and performance
- **Multi-Modal Support**: Vision and voice agents for UI/code generation
- **Memory Systems**: Persistent context and episodic memory for better assistance
- **Security**: Built-in RBAC and hallucination detection
- **Observability**: Performance monitoring and benchmarking

## Troubleshooting
- **Extension not appearing**: Ensure Cursor is restarted after installation
- **Activation issues**: Check that all prerequisites are met
- **Performance problems**: Adjust model settings or disable local inference
- **API errors**: Verify API keys and network connectivity

## Updating
To update the extension:
1. Download the latest VSIX package
2. Follow the installation steps above
3. Restart Cursor

## Uninstallation
To uninstall the extension:
1. Open Cursor Extensions view
2. Find "LAPA - Local AI Pair Programmer Agent"
3. Click the gear icon and select "Uninstall"
4. Restart Cursor

## Support
For issues, feature requests, or questions:
- Visit the GitHub repository: https://github.com/Menoxcide/Lapa
- Check the documentation: [DOCUMENTATION.md](docs/DOCUMENTATION.md)
- Contact the team: lapa-ai@proton.me