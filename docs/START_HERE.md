# START HERE: LAPA v1.2 Protocol-Resonant Nexus — Phase 11 In Progress

## Resume State
- **v1.1 Phase 9 COMPLETE**: Claude TDD loop, E2B MCP sandbox, OpenAI handoffs
- **v1.2 Phase 10 COMPLETE**: AutoGen Core + Roo Modes (event-bus.ts, modes.ts, agent-tool.ts)
- **v1.2 Phase 11 IN PROGRESS**: MCP + A2A Connectors
- **Branch**: `v1.2-nexus-loop`
- **Resume Files**: `src/orchestrator/a2a-mediator.ts`, `src/swarm/a2a-mediator.ts`
- **Next**: Phase 11 — MCP + A2A Connectors (mcp-connector.ts, handshake.ts)

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
text## Protocol Compliance
| Protocol | Status | File |
|--------|--------|------|
| **MCP** | Live (Phase 9) | `mcp-connector.ts` |
| **A2A** | Phase 11 | `a2a-mediator.ts` |
| **AG-UI** | Phase 13 | `ag-ui.ts` |