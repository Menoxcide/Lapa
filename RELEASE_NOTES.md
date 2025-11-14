# LAPA-VOID v1.0.0 Release Notes

**Release Date**: November 2025  
**Status**: Release Ready  
**License**: MIT (Free tier) + Premium (License required)

## Installation

1. Download `lapa-swarm-1.0.0.vsix` from [Releases](https://github.com/Menoxcide/Lapa/releases)
2. Open Void IDE (or VS Code)
3. Go to Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X` on Mac)
4. Click "..." menu → "Install from VSIX"
5. Select the downloaded VSIX file
6. Restart IDE when prompted

## What's New

### Initial Release
This is the first release of **LAPA-VOID IDE**, combining Void IDE's excellent AI-powered features with LAPA's autonomous multi-agent swarm system.

### Core Features (Free Tier)

✅ **Basic Swarm** - Up to 4 agents working in parallel  
✅ **Local Inference** - Full support for Ollama and NVIDIA NIM (local models)  
✅ **Basic Memory** - SQLite-based memory engine with 85% recall  
✅ **MCP Integration** - Model Context Protocol support  
✅ **A2A Handoffs** - Agent-to-agent communication  
✅ **AG-UI Dashboard** - Basic swarm visualization  
✅ **Observability** - Basic metrics and logging  
✅ **Skills System** - Access to core skills  
✅ **RAG** - Basic RAG with Chroma vector store  
✅ **Protocols** - MCP, A2A, AG-UI, LPSP support  
✅ **WebRTC Sessions** - Basic collaborative sessions (single user)

### Premium Features (Pro - $12/month or $99/year)

✅ **Full 16-Agent Helix** - Complete 16-agent swarm system  
✅ **Cloud Inference Scaling** - Hybrid local/cloud inference with automatic scaling  
✅ **Advanced Memory** - 99.5% recall with episodic memory and vector refinement  
✅ **E2B Sandbox** - Secure cloud sandbox for code execution  
✅ **Team Collaboration** - Multi-user WebRTC sessions with cross-user veto  
✅ **Cloud NIM Integration** - NVIDIA NIM cloud inference  
✅ **Advanced Observability** - Full LangSmith tracing, Prometheus metrics, ROI dashboard  
✅ **Premium Skills** - Access to all premium skills  
✅ **Blob Storage** - Vercel Blob storage for assets  
✅ **Team State Sync** - Synchronized team state management  
✅ **Audit Logging** - Comprehensive audit logs  
✅ **Priority Support** - Priority customer support

## Free vs Pro Comparison

| Feature | Free | Pro |
|---------|------|-----|
| **Agents** | 4 max | 16 (Full Helix) |
| **Inference** | Local only | Local + Cloud |
| **Memory Recall** | 85% | 99.5% |
| **E2B Sandbox** | ❌ | ✅ |
| **Team Collaboration** | Single user | Multi-user |
| **Cloud NIM** | ❌ | ✅ |
| **Advanced Observability** | Basic | Full suite |
| **Premium Skills** | ❌ | ✅ |
| **Support** | Community | Priority |

See [PREMIUM_FEATURES.md](PREMIUM_FEATURES.md) for complete feature breakdown.

## Upgrading to Pro

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run "LAPA: Upgrade to Pro"
3. Complete payment via Stripe checkout
4. Activate license using "LAPA: Activate License" command

Or visit: https://lapa.ai/upgrade

## Changes

### Core Integration
- ✅ Full integration of LAPA Swarm with Void IDE
- ✅ All Void IDE core features preserved (inline edits, agent modes, local models)
- ✅ Extension architecture following Void patterns

### Feature Gating
- ✅ License management system implemented
- ✅ Free tier fully functional without license
- ✅ Premium features gated via license checks
- ✅ Graceful degradation when premium features accessed without license

### Payment Integration
- ✅ Stripe payment integration
- ✅ License activation flow
- ✅ Upgrade dialog UI

### Build & Release
- ✅ One-click release script (bash and PowerShell)
- ✅ GitHub Actions workflows (daily compile, weekly package, release)
- ✅ VSIX packaging (<400MB)
- ✅ Comprehensive documentation

## Known Issues

- None at this time

## Breaking Changes

None - This is the initial release.

## Migration Guide

N/A - This is the initial release.

## Support

- **Issues**: [GitHub Issues](https://github.com/Menoxcide/Lapa/issues)
- **Email**: support@lapa.ai
- **Documentation**: [docs/](docs/) directory

## Acknowledgments

- **Void Team** - Original Void IDE (forked from voideditor/void)
- **LAPA Team** - LAPA Swarm system
- **Community** - All contributors and testers

---

**LAPA-VOID v1.0.0** - Swarm-Powered IDE  
**November 2025**

