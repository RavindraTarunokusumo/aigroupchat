import Dexie, { type Table } from 'dexie';
import type { Agent, Conversation, Message, ProviderId, ApiKeyConfig } from '../types';
import { DEFAULT_AGENTS } from './constants';

export interface StoredApiKey extends ApiKeyConfig {
  provider: ProviderId;
}

export class AIGroupChatDatabase extends Dexie {
  agents!: Table<Agent, string>;
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  apiKeys!: Table<StoredApiKey, ProviderId>;

  constructor() {
    super('AIGroupChatDB');
    this.version(1).stores({
      agents: 'id, name, isCustom, provider',
      conversations: 'id, title, mode, createdAt, updatedAt',
      messages: 'id, conversationId, senderId, senderType, timestamp',
      apiKeys: 'provider, isValidated'
    });
  }
}

export const db = new AIGroupChatDatabase();

export async function initDatabase(): Promise<Conversation> {
  // 1. Seed default agents if empty
  const count = await db.agents.count();
  if (count === 0) {
    await db.agents.bulkAdd(DEFAULT_AGENTS);
  }

  // 2. Ensure at least one active conversation exists
  const convCount = await db.conversations.count();
  if (convCount === 0) {
    const defaultConv: Conversation = {
      id: 'conv-default',
      title: 'Welcome to AI Group Chat!',
      activeAgentIds: DEFAULT_AGENTS.map((a) => a.id),
      mode: 'round-table',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.conversations.add(defaultConv);

    // Add welcome greeting
    const welcomeMessage: Message = {
      id: 'msg-welcome-01',
      conversationId: defaultConv.id,
      senderId: 'system',
      senderType: 'system',
      content: `### 👋 Welcome to the **AI Group Chat** BYOK Playground!
Here you can prompt a panel of diverse AI agents to collaborate, solve problems, or debate in real-time.

**How to get started:**
1. Click **API Keys** in the header to enter your API key (e.g. Google Gemini, OpenAI, Groq, or OpenRouter).
2. Choose a chat mode (e.g. **Round-Table**, **Direct Mention**, or **Moderated**).
3. Type a message below or mention specific agents like \`@The Logician\` or \`@The Creative\`!`,
      timestamp: Date.now()
    };
    await db.messages.add(welcomeMessage);

    return defaultConv;
  }

  const latest = await db.conversations.orderBy('updatedAt').reverse().first();
  return latest!;
}
