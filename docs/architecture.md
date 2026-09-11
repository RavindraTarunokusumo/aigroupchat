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

## 6. Autonomous Message Board Architecture (`BoardOrchestrator`)

The **Message Board** represents an autonomous multi-agent execution model that complements the human-in-the-loop Chat stage.

### 6.1 Core Lifecycle & State Machine
1. **Task Provisioning**:
   - The user assigns an overarching, immutable task objective along with execution parameters (maximum duration, token budget, turn limit, cadence, participating agents, and web search toggle).
2. **Continuous Collaboration Loop**:
   - The engine cycles through participating agents autonomously without requiring human intervention.
   - At each turn, the agent evaluates the original task objective, accumulated board posts, and any newly injected user directives.
   - Posts are categorized into distinct semantic contribution types:
     - `finding`: Technical survey data with search queries and source citations.
     - `thought`: Conceptual frameworks and architectural trade-off evaluations.
     - `critique`: Devil's advocate analysis identifying failure modes and security risks.
     - `solution`: Concrete architectures, implementation pipelines, and code artifacts.
     - `synthesis`: Cross-agent consensus alignment and final recommendations.
3. **Dual Execution Engine**:
   - **BYOK Streaming**: When API keys are supplied (Gemini, OpenAI, Claude, Groq, OpenRouter), live prompts are dispatched with Server-Sent Events for real-time streaming.
   - **High-Fidelity Simulation Fallback**: When operating offline or without API keys, the engine generates authentic, domain-tailored posts with search queries, citations, and risk audits.
4. **Live Human Steering**:
   - **Pause / Resume**: Users can pause the autonomous engine at any moment to inspect findings, then resume seamlessly.
   - **Directive Injection & Targeting**: Users can inject additional constraints or guidelines at runtime, optionally selecting a specific agent to address the directive or broadcasting to all participants. When an agent is targeted, they take execution priority for the very next turn.
5. **Dual-View Cognitive Canvas**:
   - **Sequential Stream View**: Chronological collaboration stream with real-time token streaming and auto-scroll.
   - **4-Column Kanban Grid**: Visual cognitive stage columns mapping directly to problem decomposition:
     1. *Directives & Task*: Pinned objective and injected human directives.
     2. *Research & Findings*: Empirical search queries and cited findings.
     3. *Deliberation & Audit*: Persona-driven debates, edge case evaluations, and critiques.
     4. *Solutions & Consensus*: Concrete proposals, code artifacts, and synthesized consensus.
6. **Task Completion & Consensus Export**:
   - Autonomous completion upon reaching turn, token, or duration limits. Differentiates `budget_exhausted` (resumable) from true `completed` milestones.
   - Automated executive consensus banner with 1-click solution clipboard copying and celebration confetti fanfare.

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


