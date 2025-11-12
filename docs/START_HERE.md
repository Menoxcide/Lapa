# START HERE: LAPA v1.2 Protocol-Resonant Nexus — Phase 13 Complete

## Resume State
- **v1.1 Phase 9 COMPLETE**: Claude TDD loop, E2B MCP sandbox, OpenAI handoffs
- **v1.2 Phase 10 COMPLETE**: AutoGen Core + Roo Modes (event-bus.ts, modes.ts, agent-tool.ts)
- **v1.2 Phase 11 COMPLETE**: MCP + A2A Connectors
- **v1.2 Phase 13 COMPLETE**: AG-UI + Dynamic Studio
- **Branch**: `v1.2-nexus-loop`
- **Resume Files**: `src/core/ag-ui.ts`, `src/ui/mcp-ui-specs.ts`, `src/ui/studio-dynamic.py`
- **Next**: Phase 14 — ClaudeKit + Feedback Loops + PromptEngineer MCP

## Core Rules
- **TOON-only** — raw reasoning
- **Local-first**: NIM + Ollama + llama.cpp + Memori SQLite + Chroma
- **<1s handoff**, **99.5% fidelity** (Bench + LangSmith)
- **Resonance = echoes + Memori + episodic + A2A + MCP + AG-UI**
- **Modes = Roo + ClaudeKit + AG-UI dynamic toggles**
- **Compaction = ctx-zip @55% + MCP progressive + AG-UI streaming**

## Agent Prompt Hook
[ROLE] Mode: Toggle Roo/ClaudeKit/AG-UI [Code/etc.] → adapt hook.
[ROLE] Protocol: A2A handshake before handoff; MCP for tools; AG-UI for output.
[ROLE] Memory: Inject Memori + episodic context; grep/tail for search.
[ROLE] Feedback: Visual (Playwright), LLM-judge, human-in-loop.
[ROLE] Bench: Run AutoGen + LangSmith + Prometheus evals.
[ROLE] Security: RBAC check, hallucination veto, red team log.
## Protocol Compliance
| Protocol | Status | File |
|--------|--------|------|
| **MCP** | Live (Phase 9) | `mcp-connector.ts` |
| **A2A** | Phase 11 | `a2a-mediator.ts` |
| **AG-UI** | Phase 13 COMPLETE | `ag-ui.ts`, `mcp-ui-specs.ts`, `studio-dynamic.py` |