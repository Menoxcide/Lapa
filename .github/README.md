# LAPA-VOID Repository Structure

## Overview

This repository contains the LAPA-VOID IDE, a fork of Void IDE enhanced with LAPA swarm capabilities.

## Repository Organization

### Free vs Pro Model

- **Main Branch (`main`)**: Contains all code (free + pro)
- **Free Tier**: All core functionality available without license
- **Pro Tier**: Premium features gated via license checks
- **License**: MIT (open source)

### Branch Strategy

- `main` - Primary development branch (all features, license-gated)
- `release/*` - Release branches for stable versions
- `develop` - Development branch for new features

### Code Organization

```
lapa-ide-void/
├── src/                    # Void IDE core (forked from voideditor/void)
├── extensions/
│   └── lapa-swarm/        # LAPA extension (free + pro features)
│       ├── src/
│       │   ├── premium/    # Premium features (license-gated)
│       │   └── ...        # Free features
├── docs/                   # Documentation
└── scripts/               # Build and release scripts
```

## Free Tier Features

All code is open source (MIT license). Free tier includes:
- Basic swarm (4 agents)
- Local inference
- Basic memory
- Core protocols (MCP, A2A, AG-UI)

## Pro Tier Features

Premium features are in the same codebase but require license activation:
- Full 16-agent Helix
- Cloud inference scaling
- Advanced memory (99.5% recall)
- E2B sandbox
- Team collaboration

## Contributing

We welcome contributions! See [CONTRIBUTING.md](../docs/CONTRIBUTING.md) for guidelines.

## License

- **Code**: MIT License (open source)
- **Premium Features**: Require license activation
- **Free Tier**: Fully functional without license

## Support

- **Issues**: GitHub Issues
- **Discord**: Community Discord server
- **Email**: support@lapa.ai

