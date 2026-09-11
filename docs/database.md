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
