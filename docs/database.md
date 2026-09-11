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
| `status` | `string` | `'running'` \| `'paused'` \| `'completed'` \| `'stopped'` |
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

