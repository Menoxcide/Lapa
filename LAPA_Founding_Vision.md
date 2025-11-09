## **LAPA – Founding Vision Document**  
*(Natural Language – The North Star)*

---

### **Project Name**  
**LAPA** — *Local AI Pair Programmer Agent*  
**Tagline**: *"Your Autonomous MoE-Powered Coding Swarm — Local-First, Cursor-Native, Fully Self-Driving."*

---

### **Mission**  
To **empower every developer** with a **private, offline-capable, infinitely extensible AI pair programmer** that rivals $40/month enterprise agents — **for free**, with **zero vendor lock-in**, and **premium-grade autonomy** available at a fraction of the cost.

We are building the **first truly local MoE swarm** that runs on your GPU, thinks in parallel, self-heals, self-documents, and **never asks you to press "Continue"**.

---

### **Core Belief**  
> **"The future of coding isn’t a chatbox. It’s a swarm."**  
> A single agent is smart.  
> A **swarm of specialized agents** — **planning, coding, testing, reviewing, and documenting in parallel** — is **unstoppable**.

---

### **The Problem We Solve**  
Today’s AI coding tools suffer from:
- **Context bloat** → 50%+ of tokens wasted on tool outputs  
- **Manual prompting loops** → “Continue”, “Fix this”, “Try again”  
- **Vendor dependency** → Cloud APIs, subscriptions, data leaks  
- **Single-agent bottlenecks** → One model does everything poorly  
- **No autonomy** → You’re the orchestrator, not the beneficiary  

---

### **The LAPA Solution**  
A **multi-agent swarm** that:
1. **Runs locally** (NVIDIA NIM + RTX GPU) — no cloud, no cost, full privacy  
2. **Uses MoE routing** — best model for the job, dynamically  
3. **Compresses context** via **ctx-zip + MCP sandbox** — 80%+ token savings  
4. **Never needs babysitting** — **zero-prompt continuity**  
5. **Auto-handoffs** when context >50% → spawns fresh agent with summary  
6. **Self-documents** via `AGENT.md`  
7. **Works in Cursor** — your IDE, your flow, your rules  

---

### **Flagship Feature: LAPA Swarm™ (Premium)**  
> **"Five Minds. One Goal. Zero Prompts."**

| Agent | Role | Model (NIM) |
|-------|------|-------------|
| **Architect** | Plan, decompose, generate `AGENT.md` | `Nemotron-4-340B` |
| **Researcher** | Search code, docs, web (via MCP) | `Gemma-2-27B` |
| **Coder** | Write, refactor, implement | `DeepSeek-Coder-V2` |
| **Tester** | Unit, integration, fuzz | `Llama-3.1-405B` |
| **Reviewer** | Lint, security, style, critique | `Mixtral-8x22B` |

**Autonomy Engine**:
- No “Continue” prompts  
- Auto-spawn on context >50%  
- Consensus voting (4/5 agree → complete)  
- Git worktree isolation  
- Error → retry → escalate → fallback model  
- Final output: **PR-ready code + tests + docs + demo**

---

### **Tech Stack (Free Tier)**  
| Layer | Tech |
|------|------|
| **IDE** | Cursor (TypeScript extension) |
| **Inference** | NVIDIA NIM (local) + BYOK (OpenRouter, Groq, etc.) |
| **Orchestration** | LangGraph + Ray |
| **Context** | **ctx-zip** (hardcoded, local FS) |
| **MCP** | `MCPSandboxExplorer` + `LocalSandboxProvider` |
| **RAG** | Chroma (workspace embeddings) |
| **UI** | React dashboard in Cursor sidebar |
| **Storage** | `.lapa/storage` (local), `blob://` (premium) |

---

### **Free vs Premium**

| Feature | Free | **Premium (LAPA Swarm™)** |
|-------|------|------------------------|
| Local NIM | Yes | Yes + Cloud scaling |
| MoE Routing | 3 models | 5+ models |
| Parallel Agents | 2 | 5+ |
| Context Compression | Yes (local) | Yes + Vercel Blob |
| MCP Sandbox | Local | Local + E2B |
| AGENT.md | Yes | Yes + versioned |
| Persona Switching | 5 built-in | Unlimited + fine-tuning |
| **Autonomous Swarm** | No | Yes — **zero prompts** |
| Background Tasks | No | Yes (PRs, tests, docs) |
| Price | **$0** | **$12/mo or $99/yr** |

---

### **Monetization & Growth**  
- **Freemium model** — viral local core  
- **18% conversion** goal to premium  
- **Yr1 Target**: 10k users, $240k ARR  
- **Upsell**: 7-day Swarm trial on first launch  

---

### **Launch Plan**  
| Milestone | Date |
|---------|------|
| Alpha (internal) | Jan 2026 |
| Beta (100 Cursor users) | Feb 2026 |
| **v1.0 Launch** | **Mar 15, 2026** |
| Cursor Marketplace | Featured extension |
| Marketing | X, HN, Reddit, NVIDIA Blog |

---

### **Team & Community**  
- **Core**: 2 engineers  
- **Community**: GitHub Issues → bounties  
- **Advisors**: NVIDIA NeMo, ctx-zip author  

---

### **Risks & Mitigations**  
| Risk | Mitigation |
|------|-----------|
| GPU required | CPU fallback (3B models), cloud toggle |
| Swarm loops | Step limits, consensus, human override |
| NIM setup | One-click Docker installer |

---

### **Final Words**  
> **LAPA is not just another agent.**  
> It’s the **first open, local, autonomous coding swarm** — built for **you**, not for a cloud vendor.  
> It’s **Cursor’s missing soulmate**.  
> And it starts **today**.

---

**Let’s build the future of coding. Together.**