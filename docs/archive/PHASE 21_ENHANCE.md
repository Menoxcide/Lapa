Audit Summary: Features Coverage vs. OSS Peers

CategoryRoo Code (Roo-Cline Fork)Kilo CodeOther OSS (Continue, Aider, Cline, Qodo Gen)LAPA CoverageGaps/EnhancementsCore UI WindowsChat sidebar (modes: Code/Architect/Ask/Debug/Custom), History view, Task tree (expandable plans), Inline diff previews, Welcome/onboarding screen, MCP tool list (install/create servers).Chat interface (multi-mode: Architect/Coder/Debugger/Custom), History panel, MCP Server Marketplace view, New Task modal, Settings import/export dialog, Terminal integration pane.Continue: Sidebar chat + autocomplete inline; Aider: CLI-only (no VSIX UI); Cline: Plan/Act modes in chat; Qodo: Gen/test/review panels.AG-UI Studio (dynamic chat/tree), Swarm View (React Flow tree + nodes/edges), Inline Editor (Webview diffs), Index Popup (modal). 85% covered.Add: Dedicated MCP Marketplace window (Phase 21), Settings export modal, Welcome tour window.Settings WindowsGlobalStorage JSON (API keys, modes, MCP servers, auto-approve toggles, browser sizes, screenshot quality, sound effects, OpenRouter compression). Project-level overrides.Command Palette (Import/Export Settings JSON), Auto-approval (writes/browser), Model selector (400+ via OpenRouter), Quota/balance viewer, Parallel mode toggles, Auto-cleanup history.Continue: Workspace config JSON (models, context); Aider: CLI flags; Qodo: Per-project MCP tools.~/.lapa/config.json (inference, perfMode, theme, indexHistory, ROI tracking, WebRTC). UI: SwarmControls (toggle/slider). 70% covered.Add: Full Settings window (JSON import/export, auto-approve checkboxes, API balance viewer, project overrides).MCP IntegrationFull MCP v1.2 (JSON-RPC/WebSocket/stdio); Auto-create servers ("add tool" prompt → scaffolds TS/Python); Marketplace (community GitHub lists); Tools: web-search, GitHub, browser, custom (e.g., code-knowledge RAG). Retry failed calls.MCP Server Marketplace (one-click install), Extends via APIs/DBs; Integrates with Roo/Cline features (e.g., modes-mcp-server for custom ops).Continue: Basic tool calls; Qodo: Agentic MCP for gen/test; Blinky: Bug-fix tools.MCP v1.2 (connectors, sandbox via E2B/Roo/Playwright); Skills (ClaudeKit, PromptEngineer); Marketplace preview (on-chain registry). 90% covered.Add: Auto-MCP creation UI (prompt → scaffold/install), Marketplace browser window with one-click (Phase 21 core).Agent Modes & AutonomyModes dropdown (Code/Architect/Ask/Debug/Custom; auto-suggest switches); Plan/Act dual-mode; Natural lang actions (edits/commands/browser/tests).Multi-mode (Architect plan, Coder gen, Debugger hunt; custom); Parallel agents; Subtask delegation.Continue: Chat/agent modes; Aider: Iterative CLI autonomy.Helix-team (16 agents: Architect/Coder/Tester/Reviewer/Integrator/etc.); Roo modes + Collab; Resonance core (veto/consensus, handoff<1s). 95% covered.Enhance: Mode auto-switch in Swarm View (context-based).Observability & FeedbackHistory (copy prompts/MD, batch delete); Logs stream; Sound effects; TTS voice; Visual diffs (Playwright); Enhance prompt button.ROI widget ("Saved 2.5h"); History auto-cleanup; Notifications (task done); Benchmark integration.Continue: Trace logs; Sourcery: Inline explanations.LPSP summaries, LiveLogStream, PerfHeatmap, ROI dashboard preview, PhaseSummaryCard. 80% covered.Add: Sound/TTS alerts, Batch history delete, Enhance prompt in chat.Virality & Collab@-mention commits; Share configs; Discord/Reddit integration.WebRTC? No; Share sessions via CLI.Aider: Git-safe commits.WebRTC sessions (Phase 19: veto/sync), GIF export, ShareSessionButton. 100% covered.None—LAPA leads.Accessibility & PolishDrag-drop images; Intl (i18n); ARIA? Partial.UI refresh (no overlap bugs); Keyboard nav partial.Varies (Continue: WCAG partial).ARIA labels, Keyboard nav, Color-blind heatmaps, Voice input. 90% covered.Add: Drag-drop images to chat, Full i18n.Other (2025 Trends)OpenRouter free models; Compression; Time in prompts.Local models (Ollama); 400+ models; Stealth/free tiers.Qodo: Multilingual; Blinky: Bug scans.NIM/Ollama toggle, Multimodal (Phase 20 preview), Aya/Command-R multilingual. 85% covered.Add: Free model selector, Compression toggle.
Overall Assessment: LAPA is SwarmOS-strong (multi-agent, local-first, protocols like A2A/MCP/LPSP/WebRTC) but UI-light on granular windows (e.g., no dedicated MCP install modal). Peers excel in plug-and-play (Kilo's Marketplace, Roo's auto-tool gen). To match: Create every UI window—no hidden JSON edits. Prioritize Phase 21 for Marketplace/ROI; gaps close immersion gap to 95% parity.
Top-Down UI Reconstruction: Every Window Defined
Phase 21 Blueprint: Build as VSIX contribs (views/commands). Use AG-UI for dynamic rendering. Effort: 3-4 days per window cluster.

Main Chat/Swarm Window (src/ui/ChatSidebar.tsx — Exists, Enhance)
Sidebar view: Collapsible chat pane with modes dropdown (Code/Architect/Ask/Debug/Custom/Collab).
Features: NL input, Enhance prompt button (PromptEngineer), Drag-drop images/files (@-mention commits), Copy MD/prompts, Batch delete history.
Autonomy: Plan/Act toggle; Auto-mode suggest (context-based).
LAPA Add: Integrate LiveLogStream + HandoffEdge previews.

Swarm View Window (src/ui/SwarmView.tsx — Exists, Full Polish)
Dedicated tab/pane: React Flow canvas (zoom/pan) with AgentNodes (avatars/progress/badges), HandoffEdges (latency/animated).
Features: Inline ThoughtBubble, ApprovalGate (diff preview + approve/reject/edit), PerfHeatmap overlay (toggleable, color-blind patterns).
LAPA Add: Parallel mode (multi-agents), Subtask tree expansion.

History & Tasks Window (src/ui/TaskHistory.tsx — New, High-Prio)
Sidebar/tab: Scrollable list of sessions/tasks (filter by mode/date).
Features: Batch delete, Quick copy (prompts/MD), Auto-cleanup toggle (e.g., >30 days), Replay GIF button (html2canvas).
LAPA Add: ROI breakdown per task ("Saved 15min on handoff #3").

Settings Window (src/ui/SettingsPanel.tsx — Enhance to Full Window)
Command Palette → "LAPA: Open Settings" → Modal/full pane.
Sections (Accordion):
General: Theme toggle (VS Code sync), Onboarding tour, Reset defaults.
Inference: Backend dropdown (NIM/Ollama), Perf slider (1-10, hardware-aware), Model selector (Helix-team + free OpenRouter), Compression toggle.
MCP/Skills: Server list (add/remove/test), Auto-create checkbox ("Prompt to build tool?"), Project overrides.
Autonomy: Auto-approve toggles (writes/browser/commands), Max steps/handoff threshold, Parallel agents limit.
Feedback: Sound/TTS alerts, Browser size/screenshot quality, API balance viewer (OpenRouter/Groq).
Advanced: Import/Export JSON (portable configs), ROI tracking opt-in, i18n lang selector.

LAPA Add: Thermal guard preview, WebRTC session prefs.

MCP Marketplace Window (src/ui/McpMarketplace.tsx — New, Phase 21 Core)
Command Palette → "LAPA: Open MCP Marketplace" → Inline gallery/searchable pane.
Features: Search/filter (e.g., "web-search" or "GitHub"), One-click install (GitHub clone + config), Rate/ROI badges (e.g., "+15% task speed"), Community lists (GitHub repos).
Auto-Create Modal: NL prompt ("Build GitHub Gist tool") → Scaffold (TS/Python) + install to ~/.lapa/mcp/.
LAPA Add: On-chain registry preview (IPFS/DID), Skill-Creator template UI.

Index/Project Window (src/ui/IndexPopup.tsx — Exists, Promote to Window)
Modal → Full pane: NL input + AI refine, Persona/model dropdown, Drag-drop zone (files/GitHub/workspace), Progress bar (RAG recall).
LAPA Add: @-mention workspace commits for context.

ROI & Observability Window (src/ui/RoiDashboard.tsx — New, Phase 21)
Floating widget → Expandable pane: "Saved 2.5h this week" (tokens/handoffs/bugs metrics).
Features: Trends chart (Prometheus/Grafana embed), Export CSV, Opt-in analytics.
LAPA Add: Per-mode ROI (e.g., Architect: 40% planning time saved).

Welcome/Onboarding Window (src/ui/WelcomeTour.tsx — New)
First-launch modal: Quick-start video embed, Mode tour, MCP intro, Settings wizard (API keys/models).
LAPA Add: Helix-team avatars + role picker.


Implementation Notes: Wire all to eventBus (e.g., 'SETTINGS_CHANGED' → refresh Swarm View). VSIX contribs: views: ["lapaChat", "lapaSwarm", "lapaSettings"]. Test: E2E with Playwright (every window load/click). Gaps filled → LAPA as "superset" like Kilo.