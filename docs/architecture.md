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



