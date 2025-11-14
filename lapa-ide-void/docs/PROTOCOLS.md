# Void IDE Protocol Reference

## Overview
This document provides protocol specifications for Void IDE integration with LAPA Swarm extension, covering extension communication, IDE integration, and protocol compliance.

**Version**: v1.0.0  
**Last Updated**: November 2025  
**Status**: ✅ Phase 5 Complete

## Void IDE Extension Protocol

### Extension Integration
- **Extension Location**: `extensions/lapa-swarm/`
- **Activation**: On startup finished
- **Commands**: LAPA Swarm commands via Command Palette
- **UI Integration**: Activity bar icons, webview panels

### Command Protocol
Void IDE exposes LAPA commands through the Command Palette:

- `lapa.swarm.start` - Start LAPA Swarm session
- `lapa.swarm.stop` - Stop active session
- `lapa.mcp.tool` - Execute MCP tool
- `lapa.trace.view` - View Phoenix trace
- `lapa.collab.join` - Join collaborative session

### API Integration Points

#### Text Document Provider
- **Purpose**: RAG semantic search integration
- **Implementation**: `src/vs/workbench/contrib/void/browser/textDocumentProvider.ts`
- **Protocol**: VS Code Text Document Provider API

#### Status Bar Integration
- **Purpose**: Display thermal gauge and ROI metrics
- **Implementation**: `src/vs/workbench/contrib/void/browser/statusBar.ts`
- **Metrics**: Temperature, performance, ROI v1.0

#### Webview Integration
- **Purpose**: AG Swarm dashboard and UI
- **Implementation**: `src/vs/workbench/contrib/void/browser/webview.ts`
- **Features**: React Flow visualization, inline diffs

## LAPA Protocol Compliance

### MCP Integration
Void IDE supports MCP protocol through extension:
- **Registration**: Via Command Palette
- **Tool Execution**: `lapa.mcp.tool` command
- **Compliance**: W46 MCP compliance standards

### A2A Integration
Agent-to-Agent protocol supported via:
- **Inline Edits**: A2A handoff integration
- **Event Emission**: Event bus pub/sub
- **Compliance**: Phase 38 A2A connection

### AG-UI Integration
Agent-to-UI protocol via:
- **Webview Sidebar**: AG Swarm visualization
- **Preview HTML**: Dynamic component rendering
- **Compliance**: Phase 38 AGUI connection

## Build and Packaging Protocols

### Daily Compilation
- **Script**: `scripts/daily-compile.sh` / `daily-compile.ps1`
- **Workflow**: `.github/workflows/daily-compile.yml`
- **Requirements**: YarnComp8m, Lint0, Test100%

### Weekly Packaging
- **Script**: `scripts/pack-weekly.sh` / `pack-weekly.ps1`
- **Workflow**: `.github/workflows/weekly-package.yml`
- **Outputs**: VSIX <400MB, Electron builds, Docker images

### Release Management
- **Script**: `scripts/release-manager.sh`
- **Workflow**: `.github/workflows/release.yml`
- **Validation**: <400MB per artifact, <2min install time

## Configuration Protocol

### LAPA Configuration
- **Location**: `~/.lapa/config.json`
- **Integration**: `src/vs/workbench/contrib/void/common/lapaConfigService.ts`
- **Purpose**: Domain expertise and corporate knowledge (P29+W42 reference)

### Settings Integration
Void IDE settings integrate with LAPA:
- **Model Selection**: Local model preference (NIM/Ollama)
- **Privacy**: Zero-cloud mode for sensitive data
- **Inference**: Hybrid local/cloud configuration

## Protocol Compliance Matrix

| Protocol | Void IDE Integration | Status |
|----------|---------------------|--------|
| MCP | Command registration | ✅ |
| A2A | Inline edit integration | ✅ |
| AG-UI | Webview panels | ✅ |
| LPSP | Phase summary display | ✅ |
| Memory Unlock | Extension API | ✅ |
| Self-Improvement | Event integration | ✅ |

## Extension API Reference

### Text Document Provider
```typescript
// RAG semantic search
const provider = new LAPATextDocumentProvider();
const results = await provider.provideTextDocumentContent(uri, query);
```

### Status Bar
```typescript
// Thermal gauge and ROI
statusBar.setThermalGauge(temperature);
statusBar.setROI(roiValue);
```

### Command Execution
```typescript
// Execute LAPA command
await commands.executeCommand('lapa.swarm.start');
```

---

**Void IDE Protocol Reference - Phase 5 Complete**  
**Last Updated**: November 2025

