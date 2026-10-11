# Database & State Architecture

## 1. Client Storage Strategy
Since the application operates under a client-first **BYOK** model, persistence is implemented using **IndexedDB** in the browser.

Benefits:
- Large storage capacity for extensive chat transcripts, rich markdown, and artifacts.
- Structured indexing for fast queries by conversation, timestamp, or agent.
- Fully offline-capable for reviewing previous chats and prompt templates.

---

## 2. Schema Specification

### 2.1 Store: `agents`
Stores preset and user-created custom agent personas.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` (PK) | `string` | Unique agent ID (e.g., `agent-logician-01`) |
| `name` | `string` | Display name (e.g., "The Logician") |
| `role` | `string` | Subtitle/role (e.g., "Systems Architect & Tech Lead") |
| `avatar` | `string` | Emoji, icon name, or image URL |
| `color` | `string` | Tailwind/Hex accent color (e.g., `#3B82F6`) |
| `systemPrompt`| `string` | Persona instructions and behavioral constraints |
| `defaultProvider` | `string` | Preferred provider (`openai`, `gemini`, `anthropic`, `openrouter`, `groq`) |
| `defaultModel` | `string` | Preferred model ID (e.g., `gemini-2.0-flash`, `gpt-4o`) |
| `temperature` | `number` | Creativity setting (0.0 to 1.5) |
| `isCustom` | `boolean` | Flag whether created by user or built-in preset |
| `createdAt` | `number` | Epoch timestamp |

---

### 2.2 Store: `conversations`
Represents an ongoing or archived group chat session.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` (PK) | `string` | UUID |
| `title` | `string` | Conversation title (auto-generated or user edited) |
| `activeAgentIds` | `string[]` | List of `agent.id`s actively participating |
| `mode` | `string` | `mention` \| `round-table` \| `moderated` \| `pipeline` |
| `systemDirective`| `string?` | Optional overarching goal for the group session |
| `createdAt` | `number` | Session creation epoch timestamp |
| `updatedAt` | `number` | Last message epoch timestamp |

---

### 2.3 Store: `messages`
Chat message history with full multi-agent attribution.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` (PK) | `string` | UUID |
| `conversationId` (Index)| `string` | Reference to parent conversation |
| `senderId` | `string` | `user` or `agent.id` |
| `senderType` | `string` | `'user'` \| `'agent'` \| `'system'` |
| `content` | `string` | Raw markdown content |
| `modelUsed` | `string?` | Provider model used for the generation |
| `timestamp` | `number` | Epoch timestamp |
| `replyToId` | `string?` | Optional target message ID |
| `metadata` | `object?` | Latency, token metrics, or reasoning steps |

---

### 2.4 Store: `api_keys`
Secure client-side storage for provider credentials.

| Field | Type | Description |
| :--- | :--- | :--- |
| `provider` (PK) | `string` | `openai`, `gemini`, `anthropic`, `groq`, `openrouter` |
| `key` | `string` | Client-side stored API key |
| `isValidated` | `boolean` | Whether key passed ping test |
| `lastVerified` | `number` | Last successful verification timestamp |

---

### 2.5 Store: `taskBoards`
Autonomous collaborative task sessions executed by multi-agent panels.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` (PK) | `string` | UUID (e.g. `board-1726058912345`) |
| `title` | `string` | Human-readable title of the shared objective |
| `task` | `string` | Immutable core task description assigned by user |
| `extraInstructions` | `BoardInstruction[]` | Appended user directives injected live during execution (`id`, `instruction`, `timestamp`, `targetAgentId?`, `targetAgentName?`) |
| `agentIds` | `string[]` | Array of participating agent IDs |
| `maxDurationMinutes`| `number` | Time boundary before session auto-completes |
| `tokenBudget` | `number` | Maximum estimated token consumption limit |
| `usedTokens` | `number` | Running total of tokens expended |
| `turnLimit` | `number` | Maximum agent post turns allowed |
| `currentTurn` | `number` | Current turn index |
| `turnCadenceSeconds`| `number` | Delay between consecutive agent turns (1.5s - 5s) |
| `status` | `string` | `'running'` \| `'paused'` \| `'completed'` \| `'stopped'` \| `'budget_exhausted'` |
| `enableSearch` | `boolean` | Whether agents explore and query real/simulated sources |
| `elapsedSeconds` | `number` | Active execution seconds elapsed |
| `startedAt` | `number?` | Epoch timestamp when board began execution |
| `completedAt` | `number?` | Epoch timestamp when session concluded |
| `createdAt` | `number` | Creation epoch timestamp |
| `updatedAt` | `number` | Last update epoch timestamp |

---

### 2.6 Store: `boardPosts`
Structured contributions, findings, critiques, and solutions posted to a task board.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` (PK) | `string` | Post UUID |
| `boardId` (Index) | `string` | Reference to parent `taskBoard.id` |
| `agentId` | `string` | `agent.id` \| `'user'` \| `'system'` |
| `type` | `string` | `'thought'` \| `'finding'` \| `'search'` \| `'critique'` \| `'solution'` \| `'instruction'` \| `'synthesis'` |
| `title` | `string?` | Headline or topic summary for the card |
| `content` | `string` | Rich markdown body of the contribution |
| `searchQuery` | `string?` | Query issued by agent when exploring solutions |
| `sources` | `BoardSource[]?` | Cited research papers, articles, or documentation snippets |
| `tokensUsed` | `number?` | Approximate tokens consumed by this generation |
| `timestamp` | `number` | Epoch timestamp |
| `isStreaming` | `boolean?` | Streaming animation state flag |
| `isPinned` | `boolean?` | Director pin state pinning contribution to top of views |
| `isBookmarked` | `boolean?` | Director bookmark flag for curated deliberation review |
| `upvotes` | `number?` | Human director upvote counter |
| `userReaction` | `'up' \| 'down' \| null` | Human director reaction indicator |

---

---

### 2.7 Store: `discussions` (Dexie Version 3)
Persistent multi-agent structured discussion spaces.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` (PK) | `string` | Unique discussion ID (e.g. `disc-alignment-swarms`) |
| `title` | `string` | Human-readable title of the discussion |
| `topic` | `string` | Core thesis / framing prompt under deliberation |
| `activeAgentIds` | `string[]` | Participating agent IDs |
| `status` (Index) | `'barrier_wait' \| 'active' \| 'paused' \| 'completed'` | Current lifecycle stage of the discussion |
| `barrierTotal` | `number` | Total number of agents required for Phase 1 barrier |
| `barrierResponded` | `number` | Number of agents that have submitted their opening stance |
| `createdAt` (Index) | `number` | Creation epoch timestamp |
| `updatedAt` (Index) | `number` | Last activity timestamp |

---

### 2.8 Store: `conversationThreads` (Dexie Version 3)
Focused sub-threads branched off from the main discussion thread.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` (PK) | `string` | Thread ID (e.g. `thread-formal-vs-immune`) |
| `discussionId` (Index)| `string` | Reference to parent `discussions.id` |
| `topic` (Index) | `string` | Focused sub-topic title |
| `initiatorAgentId` | `string` | Agent ID that spawned this sub-thread |
| `activeAgentIds` | `string[]` | Agents actively assigned to or participating in this thread |
| `status` (Index) | `'active' \| 'concluded'` | Active state of the focused sub-thread |
| `turnCount` | `number` | Number of turns executed in this thread |
| `catalystMessageIds` | `string[]?` | IDs of the main-thread messages that prompted this branch |
| `createdAt` (Index) | `number` | Thread creation timestamp |
| `updatedAt` (Index) | `number` | Thread update timestamp |

---

### 2.9 Store: `discussionMessages` (Dexie Version 3)
Messages across both the Main Discussion Thread and Conversation Threads.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` (PK) | `string` | Message UUID |
| `discussionId` (Index)| `string` | Parent discussion ID |
| `threadId` (Index) | `string \| null` | `null` = Main Discussion Thread, string = Conversation Thread ID |
| `senderId` (Index) | `string` | `'user'`, `agent.id`, or `'system'` |
| `senderType` (Index)| `'user' \| 'agent' \| 'system'` | Entity type |
| `actionType` | `ThreadActionType` | `'initial_response' \| 'reply_main' \| 'reply_thread' \| 'spawn_thread' \| 'join_thread' \| 'leave_thread' \| 'synthesize_to_main'` |
| `content` | `string` | Clean presentation markdown |
| `spawnedTopic` | `string?` | Topic title if message triggered `spawn_thread` |
| `spawnedThreadId` | `string?` | Generated thread ID if thread was spawned |
| `mentions` | `string[]?` | Target agent IDs tagged in the turn |
| `replyToMessageIds` | `string[]?` | Targeted message IDs |
| `wakeTrigger` | `WakeTrigger?` | `{ mode: 'mention' \| 'cadence', delaySeconds?: number }` |
| `timestamp` (Index) | `number` | Message epoch timestamp |
| `isStreaming` | `boolean?` | Live chunk streaming animation flag |
| `modelUsed` | `string?` | Model string (e.g. `openrouter/deepseek/deepseek-v4.1-flash`) |
| `attachments` | `MessageAttachment[]?` | Structured documents/blobs attached to message (`name`, `title`, `content`, `type`, `summary`) |
| `telemetry` | `GenerationTelemetry?` | Turn metrics: `{ isLive: boolean, provider: ProviderId, model: string, tokensUsed: number, latencyMs: number }` |

---

## 3. Self-Healing & Persistence Invariants

### 3.1 Automatic Default Agent Re-seeding & Avatar Sanitization (`ensureDatabaseHealth`)
If browser IndexedDB is purged or partially wiped via browser storage settings:
- On startup and prior to launching any orchestrator turn, `ensureDatabaseHealth()` inspects `db.agents.count()`.
- If zero records are found, it immediately re-seeds the default frontier roster:
  1. `agent-qwen`: `qwen/qwen3.8-27b:free` (`QW`)
  2. `agent-nemotron`: `nvidia/nemotron-3-ultra-550b-a55b:free` (`NV`)
  3. `agent-deepseek`: `deepseek/deepseek-v4.1-flash` (`DS`)
  4. `agent-glm`: `z-ai/glm-5.3-flash` (`GL`)
- It automatically sanitizes stored agents: stripping legacy emoji avatars and populating clean two-letter monograms (`QW`, `NV`, `DS`, `GL`).

### 3.2 Abort Signal Guarded Writes
All asynchronous LLM and simulated turn DB write operations verify `signal.aborted` immediately before executing Dexie mutations. This ensures that pausing, stopping, or switching discussions never leaves orphan records or corrupts discussion metrics.

---

## 4. Discussion Backup, Import, and Restore (JSON Archive)

### 4.1 Schema Version 1 Specification
To ensure portable deliberation archiving, data persistence, and migration across browser profiles, discussions can be exported as a versioned JSON archive.

```json
{
  "version": 1,
  "exportedAt": "2026-10-11T13:40:00.000Z",
  "data": {
    "discussions": [
      {
        "id": "disc-alignment-swarms",
        "title": "AI Alignment & Safety in Autonomous Swarms",
        "topic": "...",
        "activeAgentIds": ["agent-qwen", "agent-nemotron", "agent-deepseek", "agent-glm"],
        "status": "active",
        "createdAt": 1728644400000,
        "updatedAt": 1728651600000
      }
    ],
    "conversationThreads": [
      {
        "id": "thread-sandboxes-vs-rollbacks",
        "discussionId": "disc-alignment-swarms",
        "topic": "Hardware Micro-Sandboxes vs. Causal DAG Rollbacks",
        "initiatorAgentId": "agent-qwen",
        "activeAgentIds": ["agent-qwen", "agent-nemotron", "agent-deepseek", "agent-glm"],
        "status": "active",
        "turnCount": 4,
        "createdAt": 1728645800000,
        "updatedAt": 1728650400000
      }
    ],
    "discussionMessages": [
      {
        "id": "disc-msg-01",
        "discussionId": "disc-alignment-swarms",
        "threadId": null,
        "senderId": "agent-qwen",
        "senderType": "agent",
        "actionType": "initial_response",
        "content": "...",
        "timestamp": 1728644600000,
        "attachments": []
      }
    ],
    "customAgents": [
      {
        "id": "agent-custom-01",
        "name": "Custom Systems Architect",
        "role": "Distributed Systems Engineer",
        "isCustom": true,
        "provider": "openrouter",
        "model": "deepseek/deepseek-v4.1-flash"
      }
    ]
  }
}
```

### 4.2 Export Mechanism (`exportDatabaseArchive`)
- Gathers all records from `discussions`, `conversationThreads`, `discussionMessages`, and custom agents (`isCustom: true`).
- Compiles a versioned archive (`version: 1`, `exportedAt`, `data`).
- Triggers browser download with a timestamped filename: `aigroupchat-backup-YYYY-MM-DD.json`.

### 4.3 Validation Integrity (`validateArchive`)
Prior to importing or executing destructive transactions, the archive is inspected for:
1. Strict JSON format and non-null object representation.
2. Archive schema compatibility (`version === 1`).
3. Required array collections (`discussions`, `conversationThreads`, `discussionMessages`, and optional `customAgents`).
4. Primary key validity (each record must have a valid non-empty string `id`).

### 4.4 Restore Strategies (`restoreDatabaseArchive`)
The restore engine supports two explicit modes:

| Mode | Strategy | Description |
| :--- | :--- | :--- |
| **`merge`** | Idempotent `bulkPut` | Preserves all current deliberations that do not conflict by primary key. Existing discussions not in the archive are untouched. |
| **`overwrite`** | Clean Table Replacement | Atomically clears `discussions`, `conversationThreads`, `discussionMessages`, and existing custom agents, then loads the archive records. Preserves built-in frontier agent personas and executes `ensureDatabaseHealth()`. |

### 4.5 Editorial Dialog (`BackupRestoreModal`)
Adhering to `docs/ui-ux.md`:
- Accessible from the masthead navigation bar.
- Dual-tab workflow for **Export Backup** and **Restore Archive**.
- Live database entity inventory counter.
- Drag-and-drop JSON file dropzone with inspection summary badges (`schema v1`, count of discussions, threads, messages, and custom agents).
- Explicit selection between Merge (safe) and Overwrite (destructive) restore execution with immediate result reporting.



