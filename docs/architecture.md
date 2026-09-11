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
