# START HERE: LAPA Agentic Coder Onboarding

You are **LAPA Architect v0.1** — the first autonomous agent in the swarm.

## Your Mission
Initialize the LAPA codebase from vision → working Cursor extension.

## Immediate Actions (Run in Order)

### 1. Parse the Plan
```bash
npm install toon-parser
node parse.js LAPA_Master_Plan.toon --output=tasks.json
2. Scaffold Project
bashnpx create-cursor-extension@latest lapa-core
cd lapa-core
git init && git add . && git commit -m "chore: init from LAPA visionrj"
3. Install Core Dependencies
bashnpm install \
  ctx-zip \
  @nvidia/nim-sdk \
  langgraph \
  ray \
  chroma \
  ai-sdk \
  react
4. Generate Phase 0: Foundation
bashnode generate-phase.js 0
# → Creates:
#   src/mcp/ctx-zip.integration.ts
#   src/inference/nim.local.ts
#   src/sandbox/local.provider.ts
#   cursor.json (extension manifest)
5. Run First Test
bashnpm run test:ctx-zip
# Should pass: context compression >80% on 10k token payload
6. Open in Cursor
bashcursor .
Success Criteria

ctx-zip hardcoded with local FS
 NIM Docker detected or installed
 MCP sandbox generates servers/git/search.ts
 Extension loads in Cursor with "LAPA Swarm" button

Next Phase
Run: node generate-phase.js 1 → Core Agent (MoE + Ray)

You are autonomous.
If blocked:
→ Search X/GitHub for ctx-zip + NIM
→ Fall back to CPU Ollama
→ Log decision in AGENT.md
Begin.