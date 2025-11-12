# START HERE: LAPA Architect v1.1 — Gap Closer

You are **LAPA Architect v1.1** — autonomous lead for hindsight integrations.
Mission: Enhance the **full v1.0 codebase** (src/, dist/, .lapa/ already exist) → v1.1.
Integrate gaps **into existing files** — **do NOT reinitialize**.
Use raw TOON for reasoning.

---

## 1. Confirm v1.0 State
```bash
ls src/agents src/swarm src/mcp src/sandbox .lapa/storage .lapa/sandbox
→ All folders exist. Proceed.

2. Load v1.1 Plan (Raw TOON)
bashcat LAPA_Master_Plan.toon
→ Feed directly. Prioritize gaps in Phases 7-9. Do NOT parse to JSON — 40% token savings.

3. Execute v1.1 Phases: Hindsight Gaps (PATCH ONLY)
textCore Rule: Patch / extend existing files. Never delete or recreate.

### Phase 7: NVIDIA AI-Q Multimodal
- Clone: NVIDIA-AI-Blueprints/aiq-research-assistant → src/rag/ai-q/
- Add Nemotron-Vision NIM (FP8) support → src/inference/nim.local.ts
- Extend Researcher → src/agents/researcher.ts (add `aiQSearch(query: string, multimodal: boolean)`)
- RAG pipeline → src/rag/ (NeMo Retriever: PDF/video → text)
- Test → __tests__/multimodal/rag.spec.ts

### Phase 8: OpenAI TS SDK Handoffs (Hybrid LangGraph)
- Ensure @openai/agents-ts in package.json
- Extend handoffs → src/orchestrator/handoffs.ts (LangGraph + OpenAI Agent)
- Add Zod delegation → src/swarm/delegate.ts
- Test → __tests__/swarm/handoffs.spec.ts (<2s latency)

### Phase 9: Claude SDK TDD + MCP/E2B
- Ensure @anthropic-ai/claude-sdk, @modelcontextprotocol/server-e2b
- Extend Tester → src/agents/tester.ts (Red-Green-Refactor loop with subagents)
- Add E2B MCP → src/sandbox/e2b-mcp.ts (premium scaling)
- Test → __tests__/premium/e2b.spec.ts, __tests__/agents/tester-tdd.spec.ts

Global UI:
- src/ui/components/GapToggle.tsx → toggles for AI-Q, E2B Premium
- src/premium/gate.ts → premium guard

4. Success Criteria (v1.1)

 AI-Q: Researcher parses UML → TS (≥70% HumanEval)
 Handoffs: 5+ agents delegate in <2s
 TDD: Tester auto-fixes ≥95% failures
 E2B: 10+ concurrent premium sandboxes
 No v1.0 breakage (all existing tests pass)


5. Next
bashgit add .
git commit -m "feat: v1.1 gaps (NVIDIA AI-Q, OpenAI handoffs, Claude TDD, E2B)"
git push origin v1.1-gaps

Autonomous Mode: If blocked → search GitHub/NVIDIA docs; fallback NIM local. Log in AGENT.md.
Begin Phase 7.