# LAPA-VOID: Swarm-Powered IDE

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Menoxcide/Lapa/releases)

## Overview

**LAPA-VOID** is a fork of [Void IDE](https://github.com/voideditor/void) enhanced with **LAPA Swarm** capabilities. It combines Void's excellent AI-powered IDE features with LAPA's autonomous multi-agent swarm system.

This repository contains:
- **LAPA-VOID IDE**: Complete IDE with LAPA swarm integration (`lapa-ide-void/`)
- **LAPA Core**: Standalone LAPA extension (original project in `src/`)

## Quick Links

- **[LAPA-VOID README](lapa-ide-void/README.md)** - Main IDE documentation
- **[PREMIUM_FEATURES.md](PREMIUM_FEATURES.md)** - Free vs Pro comparison
- **[Documentation](docs/)** - Complete documentation index
- **[DIRECTIONS.md](src/DIRECTIONS.md)** - Development roadmap

## What is LAPA-VOID?

LAPA-VOID is the **next frontier agent/IDE**:
- ✅ **100% Void IDE compatibility** - All core features preserved
- ✅ **16-Agent Helix Swarm** - Autonomous multi-agent coding system
- ✅ **Local-First** - Runs entirely on your machine (free tier)
- ✅ **Premium Features** - Cloud scaling, advanced memory, team collaboration (Pro)

## Free vs Pro

| Feature | Free | Pro ($12/mo) |
|---------|------|--------------|
| Agents | 4 max | 16 (Full Helix) |
| Inference | Local only | Local + Cloud |
| Memory | 85% recall | 99.5% recall |
| Collaboration | Single user | Multi-user |

See [PREMIUM_FEATURES.md](PREMIUM_FEATURES.md) for complete breakdown.

## Installation

### For End Users

1. Download `lapa-swarm-*.vsix` from [Releases](https://github.com/Menoxcide/Lapa/releases)
2. Install in Void IDE (or VS Code) via Extensions → Install from VSIX
3. Restart IDE

### For Developers

```bash
git clone --recursive https://github.com/Menoxcide/Lapa.git
cd Lapa/lapa-ide-void
yarn install
yarn compile
```

See [lapa-ide-void/README.md](lapa-ide-void/README.md) for detailed instructions.

## Documentation

- **[START_HERE.md](docs/START_HERE.md)** - Getting started guide
- **[FEATURE_OVERVIEW.md](docs/FEATURE_OVERVIEW.md)** - Complete feature list
- **[PROTOCOLS.md](docs/PROTOCOLS.md)** - Protocol specifications
- **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Contribution guidelines

## License

LAPA-VOID is distributed under multiple open source licenses:

- **LAPA Code**: MIT License - See [LICENSE](LICENSE)
- **Void IDE Additions**: Apache 2.0 License - See [lapa-ide-void/LICENSE.txt](lapa-ide-void/LICENSE.txt)
- **VS Code Base**: MIT License - See [lapa-ide-void/LICENSE-VS-Code.txt](lapa-ide-void/LICENSE-VS-Code.txt)
- **Third Party Notices**: See [lapa-ide-void/ThirdPartyNotices.txt](lapa-ide-void/ThirdPartyNotices.txt)

### Attribution

LAPA-VOID is built on:
- **[Void IDE](https://github.com/voideditor/void)** - Copyright 2025 Glass Devtools, Inc. (Apache 2.0)
- **[VS Code](https://github.com/microsoft/vscode)** - Copyright (c) 2015 - present Microsoft Corporation (MIT)
- **[LAPA Swarm](https://github.com/Menoxcide/Lapa)** - Copyright (c) 2025 LAPA Team (MIT)

All licenses permit commercial use. See [docs/SUBMODULE_FIX_AND_LICENSING.md](docs/SUBMODULE_FIX_AND_LICENSING.md) for details.

### Premium Features

- **Premium Features**: Require license activation ($12/mo or $99/yr)
- **Free Tier**: Fully functional without license

## Support

- **Issues**: [GitHub Issues](https://github.com/Menoxcide/Lapa/issues)
- **Email**: support@lapa.ai

---

**LAPA-VOID v1.0.0** - November 2025
