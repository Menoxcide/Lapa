# LAPA-VOID Premium Features

## Overview

LAPA-VOID offers a **free tier** with core functionality and a **premium tier** (LAPA Swarm Pro) with advanced features for power users and teams.

## Free Tier

The free tier includes all core LAPA swarm functionality:

### Core Features (Free)
- ✅ **Basic Swarm** - Up to 4 agents working in parallel
- ✅ **Local Inference** - Full support for Ollama and NVIDIA NIM (local models)
- ✅ **Basic Memory** - SQLite-based memory engine with basic recall
- ✅ **MCP Integration** - Model Context Protocol support
- ✅ **A2A Handoffs** - Agent-to-agent communication
- ✅ **AG-UI Dashboard** - Basic swarm visualization
- ✅ **Observability** - Basic metrics and logging
- ✅ **Skills System** - Access to core skills (ClaudeKit, Visual Feedback, LLM Judge)
- ✅ **RAG** - Basic RAG with Chroma vector store
- ✅ **Protocols** - MCP, A2A, AG-UI, LPSP support
- ✅ **WebRTC Sessions** - Basic collaborative sessions (single user)

### Limitations (Free)
- Maximum 4 agents per swarm
- Local inference only (no cloud scaling)
- Basic memory recall (no advanced episodic/vector refinement)
- No E2B sandbox access
- No team collaboration features
- No cloud NIM integration
- Limited observability (basic metrics only)

## Premium Tier (LAPA Swarm Pro)

**Pricing**: $12/month or $99/year

### Advanced Features (Pro)
- ✅ **Full 16-Agent Helix** - Complete 16-agent swarm system
- ✅ **Cloud Inference Scaling** - Hybrid local/cloud inference with automatic scaling
- ✅ **Advanced Memory** - 99.5% recall with episodic memory and vector refinement
- ✅ **E2B Sandbox** - Secure cloud sandbox for code execution
- ✅ **Team Collaboration** - Multi-user WebRTC sessions with cross-user veto
- ✅ **Cloud NIM Integration** - NVIDIA NIM cloud inference
- ✅ **Advanced Observability** - Full LangSmith tracing, Prometheus metrics, ROI dashboard
- ✅ **Premium Skills** - Access to all premium skills (Webapp Testing, MCP Server Gen, Artifacts Builder, etc.)
- ✅ **Blob Storage** - Vercel Blob storage for assets
- ✅ **Team State Sync** - Synchronized team state management
- ✅ **Audit Logging** - Comprehensive audit logs
- ✅ **Priority Support** - Priority customer support

### Premium Capabilities
- **Unlimited Agents**: Full 16-agent Helix system
- **Cloud Scaling**: Automatic cloud inference when local resources are limited
- **Advanced Memory**: 99.5% recall with hybrid RAG (SQL + Episodic + Vector)
- **Enterprise Features**: Team collaboration, audit logs, priority support

## Feature Comparison Matrix

| Feature | Free | Pro |
|---------|------|-----|
| **Agents** | 4 max | 16 (Full Helix) |
| **Inference** | Local only (Ollama/NIM) | Local + Cloud scaling |
| **Memory Recall** | Basic (~85%) | Advanced (99.5%) |
| **E2B Sandbox** | ❌ | ✅ |
| **Team Collaboration** | Single user | Multi-user |
| **Cloud NIM** | ❌ | ✅ |
| **Observability** | Basic metrics | Full suite (LangSmith, Prometheus, ROI) |
| **Premium Skills** | ❌ | ✅ |
| **Blob Storage** | ❌ | ✅ |
| **Audit Logging** | ❌ | ✅ |
| **Support** | Community | Priority |

## Upgrade Path

### How to Upgrade
1. Open LAPA-VOID Settings
2. Navigate to "LAPA Swarm" → "Premium"
3. Click "Upgrade to Pro"
4. Complete payment via Stripe
5. License automatically activated

### License Management
- Licenses stored in `~/.lapa/licenses/` (gitignored)
- Automatic validation on startup
- Graceful degradation if license expires
- Offline validation support

## Free Tier Philosophy

We believe in **open source first**. The free tier provides:
- Full local-first experience
- Complete privacy (no cloud required)
- All core swarm functionality
- Community-driven development

Premium features are **additive**, not restrictive. Free tier users get a complete, functional IDE with powerful swarm capabilities.

## Enterprise Options

For teams and enterprises:
- **Team Licenses**: Volume discounts available
- **On-Premise Deployment**: Self-hosted premium features
- **Custom Integrations**: Tailored integrations for your stack
- **Dedicated Support**: Enterprise support SLA

Contact: enterprise@lapa.ai

## License Activation

### Free Tier
- No license required
- Automatic activation on first use
- Full functionality immediately available

### Pro Tier
- License key provided after payment
- Automatic activation via Stripe webhook
- Manual activation available if needed
- License stored securely in `~/.lapa/licenses/`

## Feature Gating

Premium features are gated via:
- License validation on feature access
- Graceful degradation (features disabled, not errors)
- Clear upgrade prompts when premium features accessed
- No data loss when switching tiers

## Refund Policy

- 30-day money-back guarantee
- Pro-rated refunds for annual subscriptions
- No questions asked

## Support

- **Free Tier**: GitHub Issues, Community Discord
- **Pro Tier**: Priority support via email, dedicated Discord channel

---

**Last Updated**: November 2025  
**Version**: 1.0

