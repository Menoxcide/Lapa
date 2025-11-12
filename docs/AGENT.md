# LAPA v1.2.2 — Prompt-Resonant Nexus (Phase 13 Complete)

## Resume State
- **v1.2.1 Phase 10 COMPLETE**: AutoGen Core + Roo Modes (event-bus.ts, modes.ts, agent-tool.ts)
- **v1.2.2 Phase 11 COMPLETE**: MCP + A2A Connectors
- **v1.2.2 Phase 12 COMPLETE**: Memori + Episodic + Vector Refinement (memori-engine.ts, episodic.ts, chroma-refine.ts)
- **v1.2.2 Phase 13 COMPLETE**: AG-UI + Dynamic Studio
- **Branch**: `v1.2-nexus-loop`
- **Resume Files**: `src/core/ag-ui.ts`, `src/ui/mcp-ui-specs.ts`, `src/ui/studio-dynamic.py`
- **Next**: Phase 14 — ClaudeKit + Feedback Loops + PromptEngineer MCP

## Core Rules
- **TOON-only** — raw reasoning
- **Local-first**: NIM + Ollama + llama.cpp + Memori SQLite + Chroma + PromptEngineer stdio
- **<1s handoff**, **99.7% fidelity** (Bench + LangSmith + PromptRefine)
- **Resonance = echoes + Memori + episodic + A2A + MCP + AG-UI + prompt auto-optimize**
- **Modes = Roo + ClaudeKit + AG-UI dynamic toggles + PromptEngineer interactive Q&A**
- **Compaction = ctx-zip @55% + MCP progressive + AG-UI streaming + deepagents FS offload**

## Agent Prompt Hook (Enriched w/ System Prompt Adoption)
[ROLE] Mode: Toggle Roo/ClaudeKit/AG-UI/PromptEngineer [Code/etc.] → adapt hook. Enforce SoC: strict dir structure (/src/{components|services|models}), layer interdeps (frontend consumes backend APIs).
[ROLE] Protocol: A2A handshake before handoff; MCP for tools (incl. stdio refine); AG-UI for output.
[ROLE] Memory: Inject Memori + episodic context; grep/tail/glob for search; session prune for bloat.
[ROLE] Feedback: Visual (Playwright), LLM-judge (fuzzy rules), human-in-loop (Roomote Q&A).
[ROLE] Bench: Run AutoGen + LangSmith + Prometheus evals + Pydantic outputs.
[ROLE] Security: RBAC check, hallucination veto, red team log; auto-docs (JSDoc/PyDoc).
[ROLE] Prompt Refine: Detect vague → Q&A clarify → optimize for tools (e.g., git/grep plans).
## Protocol Compliance
| Protocol | Status | File |
|----------|--------|------|
| **MCP** | Live (Phase 9) + stdio | `mcp-connector.ts` + `prompt-engineer.ts` |
| **A2A** | Phase 11 COMPLETE | `a2a-mediator.ts` |
| **Memori** | Phase 12 COMPLETE | `memori-engine.ts`, `episodic.ts` |
| **Chroma** | Phase 12 COMPLETE | `chroma-refine.ts` |
| **AG-UI** | Phase 13 COMPLETE | `ag-ui.ts`, `mcp-ui-specs.ts`, `studio-dynamic.py` |

## VSIX Build
```bash
pnpm vsix # Build
pnpm install:vsix -y # Install
# PromptEngineer Setup (Phase 14)
git clone https://github.com/gr3enarr0w/cc_peng_mcp.git && cd cc_peng_mcp && npm install
text---

## Additional Files to Add/Update
### 1. `PROTOCOLS.md` (Updated)
```md
# LAPA Protocol Compliance
## MCP (Model Context Protocol)
- JSON-RPC over WebSocket + stdio (PromptEngineer for refine)
- Dynamic tool discovery + progressive disclosure
- Local connectors: SQLite, Git, FS + Claude Code tools (grep/git/edit)
## A2A (Agent-to-Agent)
- Task negotiation handshake + sub-spawn (deepagents)
- State sync via Memori
- Conflict resolution via veto
- Pub/sub over AutoGen + WebSocket
## AG-UI (Agent-to-UI)
- Event stream to Studio
- Generative UI components
- Supports MCP-UI + Open-JSON-UI
- Real-time feedback (Playwright + Q&A)
2. Update README.md (GitHub)
diff+ * Prompt Refinement: **PromptEngineer MCP** for vague → actionable plans<grok-card data-id="b8f8b7" data-type="citation_card"></grok-card>
+ * Deep Tasks: **deepagents** middleware for sub-spawning/FS tools
 * Multi-Agent Orchestration : LangGraph + Ray + **A2A Protocol** for coordination
 * Dynamic UI : **AG-UI** for generative, real-time interfaces
 * Observability : LangSmith + Prometheus + Grafana
 3. New: PROMPT_ENGINEER_INTEGRATION.md
md# PromptEngineer MCP Server Integration (Phase 14)
- **Repo**: https://github.com/gr3enarr0w/cc_peng_mcp (MIT)
- **Shim**: `prompt-engineer.ts` – stdio transport to MCPManager; auto-detect/refine hooks.
- **Use Cases**: Vague bug ("slow site") → structured plan (grep perf files + test); feature ("better app") → Q&A + git branch.
- **Synergies**: Oracle handoff → refine → Coder; zero-API, local.