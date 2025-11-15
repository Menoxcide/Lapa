# Persona & Workflow Integration - LAPA-VOID IDE

## Overview

This document describes the integration of agent personas and workflow (smart agent chaining) systems into the LAPA-VOID IDE extension.

## ✅ Completed Integration

### 1. Filesystem Persona Loader
- **Location**: `src/agents/filesystem-persona-loader.ts`
- **Functionality**: 
  - Loads all personas from `docs/personas/*.md` files
  - Parses markdown persona documents
  - Integrates with runtime PersonaManager
  - Supports VS Code workspace context
- **Auto-loads on extension activation**

### 2. Persona Management Commands
- **`lapa.personas.list`** - List all loaded personas
- **`lapa.personas.reload`** - Reload personas from filesystem
- Accessible via Command Palette: "LAPA: List Personas" / "LAPA: Reload Personas"

### 3. Workflow Generation System
- **Location**: `src/orchestrator/workflow-generator.ts`
- **Functionality**:
  - Auto-generates optimal multi-agent workflows
  - Pattern matching (feature-implementation, bug-fixing, refactoring, documentation)
  - Task decomposition and agent sequence generation
  - Confidence scoring and reasoning

### 4. Workflow Command
- **`lapa.workflow.generate`** - Generate workflow from task description
- Accessible via Command Palette: "LAPA: Generate Workflow"
- Shows workflow details and allows execution

### 5. Extension Integration
- Personas auto-load on extension activation
- All personas from `docs/personas/` are available
- Workflow system integrated with swarm manager
- Commands registered in `package.json`

## 📋 Available Personas

All personas from `docs/personas/` are automatically loaded:

### Core Helix Team (12 Agents)
1. ARCHITECT
2. CODER
3. REVIEWER
4. TEST
5. DEBUGGER
6. OPTIMIZER
7. PLANNER
8. VALIDATOR
9. INTEGRATOR
10. DEPLOYER
11. DOCUMENTATION_SPECIALIST
12. RESEARCH_WIZARD

### Specialized Agents
13. MCP
14. FEATURE
15. FILESYSTEM_EXPERT
16. GITHUB_OPERATIONS
17. WEB_RESEARCH_HYBRID

### Master Orchestrator
18. NEURAFORGE

## 🔄 Workflow Patterns

The system recognizes and generates workflows for:

1. **Feature Implementation** - PLANNER → CODER → TEST → REVIEWER
2. **Bug Fixing** - DEBUGGER → CODER → TEST → REVIEWER
3. **Refactoring** - ARCHITECT → CODER → TEST → REVIEWER → OPTIMIZER
4. **Documentation** - DOCUMENTATION → REVIEWER (parallel)

## 🚀 Usage

### Loading Personas
Personas are automatically loaded on extension activation. To reload:
```
Command Palette → "LAPA: Reload Personas"
```

### Listing Personas
```
Command Palette → "LAPA: List Personas"
```
Shows all loaded personas with metadata. Click to open persona file.

### Generating Workflows
```
Command Palette → "LAPA: Generate Workflow"
```
Enter task description (e.g., "Implement user authentication feature")
- System generates optimal agent sequence
- Shows confidence score and reasoning
- Option to execute workflow or view details

## 🔧 Technical Details

### Persona Loading Flow
1. Extension activates → `initializePersonas()`
2. `FilesystemPersonaLoader` scans `docs/personas/` directory
3. Parses each `*_PERSONA.md` file
4. Extracts persona metadata and content
5. Creates/updates Persona objects in PersonaManager
6. Logs loaded count

### Workflow Generation Flow
1. User provides task description
2. `WorkflowGenerator` analyzes task
3. Decomposes into subtasks
4. Matches to workflow patterns
5. Generates agent sequence
6. Calculates confidence and reasoning
7. Returns GeneratedWorkflow

### Integration Points
- **PersonaManager**: Runtime persona storage
- **SwarmManager**: Workflow execution
- **Extension Activation**: Auto-initialization
- **Command Registration**: VS Code command palette

## 📝 Files Modified/Created

### Created
- `lapa-ide-void/extensions/lapa-swarm/src/agents/filesystem-persona-loader.ts`
- `lapa-ide-void/extensions/lapa-swarm/src/orchestrator/workflow-generator.ts`

### Modified
- `lapa-ide-void/extensions/lapa-swarm/src/extension.ts` - Added persona initialization and commands
- `lapa-ide-void/extensions/lapa-swarm/package.json` - Added command definitions

## 🎯 Next Steps (Optional)

1. **UI Components** - Add persona selection and workflow visualization to LAPASwarmViewPane
2. **Workflow Execution** - Enhanced integration with swarm manager for workflow execution
3. **Persona Editor** - In-IDE persona editing capabilities
4. **Workflow History** - Track and replay historical workflows

## ✅ Status

**COMPLETE** - Personas and workflows are fully integrated into LAPA-VOID IDE!

All personas from the backend filesystem are accessible, and the workflow system enables smart agent chaining for complex tasks.

