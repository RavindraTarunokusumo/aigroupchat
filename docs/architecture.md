# Software Stack & Architecture

## 1. Overview
**AI Group Chat** is a client-first, zero-backend "Bring Your Own Key" (BYOK) web application designed for the general public to explore, play with, and understand multi-agent AI collaboration.

The platform allows users to assemble a panel of diverse AI agents, provide instructions or prompt spontaneous debate, and observe real-time agent-to-agent interactions, task solving, and brainstorming.

---

## 2. Core Principles
- **True BYOK & 100% Privacy**: API keys and conversations are processed and stored strictly within the user's browser client (`IndexedDB` & local secure memory). No intermediary backend server handles or stores sensitive credentials.
- **Provider Agnostic**: Unified client-side adapter connecting to major LLM providers:
  - OpenAI (GPT-4o, GPT-4o-mini, o1/o3-mini)
  - Google Gemini (Gemini 1.5 Pro, 2.0 Flash, 2.5)
  - Anthropic Claude (Claude 3.5 Sonnet, 3.5 Haiku)
  - Groq (Llama 3.3 70B, Mixtral - ultra low latency)
  - OpenRouter (unified access to hundreds of open/proprietary models)
- **Fluid Multi-Agent Orchestration**: Transparent, entertaining, and configurable conversation dynamics.

---

## 3. High-Level System Architecture

```
+-----------------------------------------------------------------------------------+
|                                  BROWSER CLIENT                                   |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                              Presentation Layer                             |  |
|  |  +-------------------+  +------------------------+  +--------------------+  |  |
|  |  |  Agent Roster &   |  |   Streaming Chat Flow  |  |  BYOK Key Manager  |  |  |
|  |  |  Customizer       |  |   & Turn Indicators    |  |  & Model Selector  |  |  |
|  |  +-------------------+  +------------------------+  +--------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|  +-----------------------------------------------------------------------------+  |
|  |                        Agent Orchestration Engine                           |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | Turn Manager: Direct @mentions | Round Robin | Moderated Discussion   |  |  |
|  |  | Context Window Budgeter & Dynamic Group Prompt Assembler               |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
|                     |                                         |                   |
|  +-------------------------------------+   +-----------------------------------+  |
|  |       Unified Provider Gateway      |   |       Client Persistence Layer    |  |
|  |  - Direct Browser Fetch (SSE)       |   |  - IndexedDB (Dexie / IDB)        |  |
|  |  - Stream Token Normalizer          |   |  - Conversations & History        |  |
|  |  - CORS & Error Recovery            |   |  - Custom Agents & Presets        |  |
|  +-------------------------------------+   +-----------------------------------+  |
+-------------------|---------------------------------------------------------------+
                    | Direct HTTPS API Calls (BYOK)
                    v
    +---------------------------------------------------------------+
    |  External LLM APIs (OpenAI, Gemini, Anthropic, OpenRouter)    |
    +---------------------------------------------------------------+
```

---

## 4. Multi-Agent Turn Engine & Interaction Modes

The application supports multiple distinct orchestration modes:

1. **Direct Mention Mode (`@Agent`)**:
   - The user (or an agent) explicitly mentions an agent (e.g. `@Skeptic`, `@Logician`).
   - The mentioned agent is scheduled as the next speaker with context highlighting their prompt.

2. **Round-Table Discussion Mode**:
   - Following a user prompt, active agents participate in turn order.
   - Each agent receives the conversation transcript including previous agent outputs, with clear identity markers.

3. **Autonomous Debate / Moderation Mode**:
   - A designated *Moderator Agent* reviews the group goals, poses questions to specific participants, summarizes agreements/disagreements, and concludes the round when objectives are met.

4. **Workflow / Pipeline Mode**:
   - Sequenced task execution:
     `Planner Agent` ➔ `Worker/Coder Agent` ➔ `Critic/Reviewer Agent` ➔ `User Delivery`.

---

## 5. Security & BYOK Architecture
- **Key Storage**: Keys are saved locally in the browser's protected storage using client-side obfuscation.
- **Direct Streaming**: Network requests to API endpoints use direct HTTPS fetch with Server-Sent Events (SSE) where permitted by provider CORS, or standard direct REST endpoints with client-side token decoders.
- **Zero Telemetry on Messages**: No user messages or prompts are dispatched to any analytics or 3rd party tracker.

---

## 6. Phased Swarm Architecture (`BoardOrchestrator`)

The **Message Board** is powered by a high-throughput **Phased Swarm Architecture** that executes agent collaboration in parallel waves overseen by a designated **Orchestrator Agent**.

### 6.1 Task Scoping (V1 Boundaries)
- **Cognitive Reasoning Focus**: In V1, agents operate within pure cognitive reasoning and text synthesis space without access to local virtual environments or execution file systems.
- **Supported Task Scopes**:
  - **Deep Research**: Comprehensive literature reviews, technological surveys, empirical benchmark comparisons, and market/geopolitical intelligence.
  - **Plain Text Writing**: Long-form whitepapers, policy governance frameworks, executive briefs, and creative worldbuilding bibles.
- **Future Roadmap (V2)**: Virtual environments and sandboxed execution containers (e.g. Namespace.so) are slated for V2 to support automated code verification and runtime testing.

### 6.2 The Orchestrator Agent
- Configured in the board creation modal (defaulting to *The Moderator*).
- **Duties**:
  1. **Decomposition (Phase 0: Strategy)**: Formulates the initial strategic blueprint and assigns distinct research/writing angles to participating agents.
  2. **Wave Supervision**: Oversees transitions across parallel execution waves.
  3. **Master Synthesis (Wave 3: Consensus)**: Combines all empirical findings, drafts, and critiques into a unified, definitive executive deliverable.

### 6.3 Phased Swarm Lifecycle & Wave Concurrency
Instead of sequential single-turn loops, the swarm operates through bounded concurrent waves:
1. **Phase 0: Strategy & Mandate**:
   - The Orchestrator analyzes the task and any initial user directives, posting a structured mandate with team assignments.
2. **Wave 1: Parallel Divergent Exploration**:
   - Worker agents execute **concurrently** via a bounded worker pool (`maxConcurrency: 3`).
   - Researchers, analysts, and visionaries simultaneously stream empirical citations, theoretical taxonomies, and initial conceptual thoughts into the blackboard.
3. **Wave 2: Parallel Deep Drafting & Cross-Audit**:
   - Worker agents review accumulated Wave 1 blackboard posts.
   - The Skeptic executes critical risk audits while other agents draft substantive sections in parallel.
4. **Wave 3: Master Synthesis & Executive Consensus**:
   - The Orchestrator performs a master fan-in synthesis, generating the final comprehensive deliverable and triggering celebratory fanfare.
5. **Live Human Steering & Parallel Interrupts**:
   - Injected user directives trigger immediate high-priority swarm responses without waiting in turn queues.

### 6.4 Dual-View Cognitive Canvas & Swarm Telemetry
- **Swarm Hive Pulse**: Real-time header metrics indicate active parallel streams (`[⚡ 3 Agents in Parallel]`) with live agent chips showing current drafting phases.
- **Visual Phase Stepper**: A 4-step interactive breadcrumb track reflects progression through Strategy ➔ Wave 1 ➔ Wave 2 ➔ Wave 3.
- **Dual-View Canvas**: Supports both sequential stream rendering and 4-column cognitive stage layout (Directives, Research & Findings, Deliberation & Audit, Solutions & Consensus) with concurrent multi-column streaming.

---

## 7. Reliability & Resiliency Engineering
- **Ghost Post Prevention**: All write operations within `boardOrchestrator.ts` (`db.boardPosts.add`, `put`, `db.taskBoards.update`) are guarded by `signal.aborted` checks to guarantee aborting or deleting a task board never persists orphan ghost records.
- **Zombie Timer Avoidance**: The orchestrator performs strict agent participation validation prior to starting internal interval tickers, safely setting board status to `'stopped'` if participants are absent.
- **Infinite Loop Safeguards**: Restarting a board whose turn or token limit was reached resets `currentTurn`, `usedTokens`, and `elapsedSeconds`, cleanly differentiating `budget_exhausted` status from genuine goal completion.
- **Database Self-Healing**: `ensureDatabaseHealth()` runs on orchestrator boot and initialization, automatically re-seeding built-in personas if the client's IndexedDB table was cleared.
- **Zero-Agent Chat Guard**: In the chat workspace, prompt entry is strictly guarded when zero agents are active, preventing unhandled message routing.

---

## 8. Sensory Feedback & Audio Synthesis Engine (`sound.ts`)
To maximize engagement without inflating bundle size or depending on external MP3 assets, the platform embeds a native **Web Audio API Tone Synthesizer**:
- **Consensus Fanfare (`playConsensusChime`)**: Ascending 5-note pentatonic chord arpeggio (\(C_5, E_5, G_5, A_5, C_6\)) played via sine-wave oscillators with exponential decay.
- **Turn Progression (`playTurnChime`)**: Subtle high-frequency blip (\(D_5 \to A_5\)) signalling incoming agent contributions during stream and replay.
- **Action Micro-interactions (`playActionChime`)**: Triangle-wave chirp (\(A_4 \to E_5\)) on interactive upvotes, bookmarks, and pins.
- **Persistent Mute Control**: Mute preference stored in `localStorage` under `aigroupchat_sound_muted`, toggleable globally via the header audio control.

---

## 9. Time-Travel Replay Engine (`PlaybackControls`)
A floating glassmorphism dock enables users to replay historical agent deliberations step-by-step:
- **Dynamic Post Slicing**: Slices visible board items to `posts.slice(0, replayStep)`, recalculating category counts and kanban layouts dynamically.
- **Interactive Scrubber**: Live scrub slider allowing instant seeking to any deliberation step.
- **Variable-Speed Playback**: 1x, 2x, and 5x speed multipliers driving turn progression intervals with synchronized audio blips.

---

## 10. Multi-Format Export Architecture (`exportUtils.ts`)
The platform provides a client-side export suite generating self-contained deliverables:
1. **Markdown Report (`.md`)**: Human-readable documentation with metadata, participating agent models, directives, and full transcripts.
2. **Raw JSON Dataset (`.json`)**: Machine-readable JSON payload structured for ingestion into downstream pipelines or external analyzers.
3. **Standalone Offline HTML Report (`.html`)**: Single-file artifact embedding responsive styling, print-friendly media queries, dark/light adaptations, and vanilla JavaScript for offline text search and category filtering with **zero external CDN dependencies**.

---

## 11. Discussion Thread Architecture & Concurrent Engine (`discussionOrchestrator.ts`)
The Discussion architecture facilitates multi-agent deliberations partitioned into a **Main Discussion Thread** and focused **Conversation Threads** (sub-threads):

- **Concurrency Limiter**: Bounded async semaphore enforcing a strict ceiling of max 2 simultaneous outgoing LLM calls to prevent browser socket exhaustion and rate-limit penalties.
- **Phase 1 Synchronization Barrier**: In `barrier_wait` status, all participating agents must state their initial opening stance on the core thesis. Only when `barrierResponded >= barrierTotal` does the session transition to `active`.
- **Phase 2+ Concurrent Discussion Loop**:
  - Supports extended deliberations in the Main Discussion Thread before spawning branches.
  - Concurrent execution: Main thread and active sub-threads advance simultaneously through non-blocking turn scheduling.
- **Context Assembler (Parent Lineage + Threshold Recency)**:
  - Main Thread: Full main transcript + live status digest of active sub-threads.
  - Sub-Threads: Root thesis + participants' opening stances + catalyst messages that spawned the thread + full sub-thread transcript + live threshold-adaptive bulletin of recent main thread turns.
- **Structured Action Parser & Agent Mobility**:
  - Extracts actions (`[ACTION: SPAWN_THREAD: Topic]`, `[ACTION: REPLY_THREAD]`, `[ACTION: SYNTHESIZE_TO_MAIN]`, `[ACTION: JOIN_THREAD]`, `[ACTION: LEAVE_THREAD]`), `@AgentName` mentions, and wake triggers (`[WAKE: mention]`, `[WAKE: cadence 4s]`).
  - Cleans markup to render presentation-grade markdown.
  - Automatically manages thread creation, agent rosters, and syntheses back to main.
- **Deadlock / Stalemate Breaker**: Automatically detects when all agents in a thread are waiting on mentions and prompts the Moderator or lead agent to re-energize the discussion.
- **BYOK Streaming & Simulation Fallback**: Full SSE streaming across OpenAI, Gemini, Anthropic, Groq, and OpenRouter, with realistic word-by-word streaming simulation when API keys are omitted.

---

## 12. Conversational Protocol, Document Attachments & Generation Telemetry

### A. Conversational Dialogue vs. Expository Wall of Text
Agents are instructed to communicate as peers in natural, concise dialogue (2–4 sentences) rather than authoring monolithic essays directly in the feed. They react directly to colleagues' points, question assumptions, or challenge premises.

### B. Structured Document & Blob Attachments
When an agent authors formal propositions, algorithms, schemas, proofs, or blueprints, the structured exposition is encapsulated as an attached document:
```markdown
[ATTACHMENT: filename.ext | Document Title]
\`\`\`markdown
... detailed technical content ...
\`\`\`
[END_ATTACHMENT]
```
The orchestrator's `parseStructuredAction` extracts the attachment into `DiscussionMessage.attachments`, leaving the conversational body clean. The UI renders an editorial attachment card with monospace filename, title, summary, one-click copy, and expandable inline preview.

### C. Generation Telemetry & Error Resilience
- **Live vs. Simulated Badges**: Each message card header clearly displays `LIVE [openrouter]` (with animated pulse indicator) or `SIMULATED`.
- **Performance Metrics**: Records and displays per-turn latency in seconds (`1.4s`) and estimated token consumption (`~280 tok`).
- **Resilient Error Banners**: API failures (e.g. OpenRouter 401, 402, 429) trigger a clear, dismissible editorial error card directly in the stage with a link to check keys.

### D. Reasoning & Thinking Token Suppression
Frontier reasoning models (e.g., DeepSeek R1/V4.1 Flash, Qwen reasoning variants, Gemini Thinking) often output internal chain-of-thought traces in separate fields (`delta.reasoning`, `delta.reasoning_content`) or inside `<think>...</think>` tags in the message content. To maintain a clean, publication-ready discussion feed:
1. **Server-Side Exclusion**: Requests to OpenRouter pass `reasoning: { exclude: true }` so the provider suppresses reasoning tokens at the API edge.
2. **Streaming Interceptor (`createThinkingFilter`)**: In `src/lib/cleanText.ts`, an incremental token filter inspects the SSE chunk stream. Any opening `<think>`, `<thought>`, or `<thinking>` tags (even when split across chunk boundaries) switch the filter into discard mode until the corresponding closing tag arrives.
3. **Provider Shielding**: Gemini `thought: true` parts and Anthropic `thinking_delta` blocks are completely skipped and never forwarded to `onChunk`.
4. **Defense-in-Depth Stripping (`stripThinkingTags`)**: Both `cleanAgentResponseText` and `parseStructuredAction` run regular-expression sanitization on final texts, stripping both closed and unclosed thinking blocks before database writes.
5. **Continuous Deliberation Fallback**: If an LLM returns an empty output after thinking tokens are stripped, the orchestrator activates high-fidelity simulation for that turn, ensuring discussions never stall with blank cards.

---

## 13. Continuous Deliberation Loop & Multi-Criteria Stopping States

Deliberation threads operate continuously and concurrently without artificial synchronization barriers. The conversation progresses indefinitely across the Main Discussion Thread and spawned Conversation Sub-Threads until one of three stopping states is fulfilled:

### A. Stopping State 1: Token Budget Reached
- **Configuration**: Set during Discussion creation with quick presets (`5k`, `10k`, `25k`, `50k`, `Unlimited` [0]) or custom input.
- **Enforcement**: Cumulative token usage (`tokensUsed`) is tracked across both live API calls and simulated turns.
- **Trigger**: At each turn evaluation, if `tokensUsed >= tokenBudget`, the orchestrator concludes the deliberation automatically with reason `'token_budget'` and posts a terminal summary.
- **UI Progress**: The pinned thesis banner displays live token consumption against the ceiling with dynamic color transitions (`#346538` normal, `#956400` approaching 80%, `#9F2F2D` limit reached).

### B. Stopping State 2: Multi-Agent Consensus Protocol
- **Autonomous Convergence**: Agents deliberate toward consensus rather than generating endless dialogue loops.
- **Action Primitives**:
  - `[ACTION: PROPOSE_CONCLUDE: Topic]`: An agent formally proposes that sufficient consensus has been reached, nominating a conclusion thesis and initializing a voting ledger.
  - `[ACTION: AGREE_CONCLUDE]`: Participating peers vote to affirm the proposed conclusion.
  - `[ACTION: CONTEST_CONCLUDE: Objection]`: If an agent raises a substantive technical counterargument, the consensus vote is reset to require further deliberation.
- **Supermajority Threshold**: When affirmative votes meet or exceed `Math.max(2, Math.ceil(activeAgentIds.length * 0.75))` (>= 75% consensus), the orchestrator triggers deliberation conclusion with reason `'agent_consensus'`.

### C. Stopping State 3: Manual Directorial Controls
- **Conclude Discussion Button**: Pinned in the stage banner for the Main Thread and all sub-threads. Allows the user to manually conclude the entire deliberation session at any point.
- **Close Thread Button**: Available in active Conversation Threads (sub-threads). Closes the specific deep-dive sub-thread while leaving the Main Discussion Thread actively running in parallel.
- **Reopen Deliberation**: Concluded discussions can be reopened at any time with a single click on "Reopen", returning the session to active status and resetting conclusion flags.

---

## 14. Cross-Provider Cost & Token Analytics Dashboard

To provide complete transparency into inference expenditure, latency performance, and token consumption across multi-provider agents, the application incorporates a local client-side analytics engine (`src/lib/analytics/tokenCost.ts`) and an editorial dashboard dialog (`src/components/analytics/AnalyticsModal.tsx`).

### 14.1 Standard Model Pricing Rate Cards
The pricing map models canonical vendor rate cards per 1,000,000 tokens for both prompt (input) and completion (output) tokens:
- **Google Gemini 2.5 Flash**: \$0.075 input / \$0.30 output per 1M tokens (\$0.15 blended).
- **OpenAI GPT-4o**: \$2.50 input / \$10.00 output per 1M tokens (\$5.00 blended).
- **Anthropic Claude 3.5 Sonnet**: \$3.00 input / \$15.00 output per 1M tokens (\$7.50 blended).
- **DeepSeek V4.1 Flash**: \$0.14 input / \$0.28 output per 1M tokens (\$0.20 blended).
- **Qwen 3.8 27B**: \$0.20 input / \$0.60 output per 1M tokens (\$0.35 blended).
- **Groq Llama 3.3 70B**: \$0.59 input / \$0.79 output per 1M tokens (\$0.69 blended).
- **NVIDIA Nemotron 3 Ultra**: \$0.60 input / \$1.80 output per 1M tokens.
- **GLM 5.3 Flash**: \$0.10 input / \$0.10 output per 1M tokens.

### 14.2 Aggregation Across Deliberations and Task Boards
The aggregation function scans `db.discussionMessages`, `db.boardPosts`, and `db.agents`:
- **Total Estimated Spend ($)**: USD cost calculated across all agent turns using exact model rate cards.
- **Cumulative Tokens**: Ingests actual `tokensUsed` telemetry from API invocations or estimates lexical token splits (input context vs output response).
- **Total Agent Turns**: Request count segmented by discussion messages and swarm board posts.
- **Average Latency**: Computed across measured live API generation waves.
- **Hierarchical Grouping**: Drill-down breakdowns grouped by Provider (`OpenRouter`, `Google Gemini`, `OpenAI`, `Anthropic`, `Groq`) and individual Model.


---

## 15. Multi-Format Exporter for Discussion Deliberations

Located in `src/lib/discussion/exportDiscussion.ts`, the multi-format exporter serializes multi-agent deliberations across three publication-grade formats with zero backend requirements:

### A. Markdown Deliberation Report (`.md`)
- **Metadata Masthead**: Discussion ID, status, timestamps, token ceiling and utilization percentage, and conclusion status with reason and consensus voters.
- **Root Thesis**: Pinned blockquote of the core deliberative prompt.
- **Participants Roster**: Table of agents, models, provider identities, roles, and temperature settings.
- **Phase 1: Synchronization Barrier**: Dedicated section preserving initial independent framing stances, formal invariants, and baseline propositions.
- **Main Discussion Thread**: Chronological stream of main turns, Director directives, thread spawn callouts, and multi-agent synthesis.
- **Specialized Sub-Threads**: Partitioned sub-thread transcripts including initiator, participant rosters, turn counts, catalyst message references, and individual turns.
- **Document Attachments**: Inline markdown code blocks with language annotations, titles, and summaries.

### B. Structured JSON Payload (`.json`)
- Clean, versioned (`version: '1.0'`), pretty-printed JSON schema.
- Segregated collections for `barrierStances`, `mainThread`, `subThreads`, and `allMessages`.
- Complete message-level generation telemetry (latency, tokens used, provider, live/simulated status).
- High-level deliberation summary counts (total messages, barrier stances, sub-threads, attachments).

### C. Standalone Self-Contained HTML Monograph (`.html`)
- **Zero CDN Dependencies**: Completely offline-capable single-file document with inline styles and vanilla JavaScript.
- **Editorial Typography**: Styled with serif headings (`Newsreader`, `Georgia`), clean modern sans-serif body, and monospace telemetry badges.
- **Tabbed Thread Navigation**: One-click switching between "Main Discussion" (including Phase 1 Barrier), individual specialized sub-threads, and the unified "All Timeline" stream.
- **Instant Client-Side Filtering**: Real-time search across arguments, document contents, and participant names, combined with action-type filter pills (Barrier Stances, Thread Forks, Syntheses, Conclusions).
- **Interactive Document Attachments**: Styled `<details>` expandable panels with syntax highlighting and one-click clipboard copying.
- **Publication Print Stylesheet (`@media print`)**: Automatically hides navigation toolbars and interactive buttons, formats high-contrast typography, and prints all sections seamlessly with page-break protection on message cards.

