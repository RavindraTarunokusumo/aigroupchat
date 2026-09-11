import Dexie, { type Table } from 'dexie';
import type { Agent, Conversation, Message, ProviderId, ApiKeyConfig } from '../types';
import { DEFAULT_AGENTS } from './constants';
import { cleanAgentResponseText } from './cleanText';

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
  // 1. Seed or sync default agents
  const count = await db.agents.count();
  if (count === 0) {
    await db.agents.bulkAdd(DEFAULT_AGENTS);
  } else {
    // Sync default (non-custom) agents to updated defaults
    for (const defAgent of DEFAULT_AGENTS) {
      const existing = await db.agents.get(defAgent.id);
      if (existing && !existing.isCustom) {
        await db.agents.update(defAgent.id, {
          provider: defAgent.provider,
          model: defAgent.model,
          systemPrompt: defAgent.systemPrompt,
          role: defAgent.role,
          avatar: defAgent.avatar,
          color: defAgent.color
        });
      }
    }
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

  // 3. Clean up legacy speaker tags from stored agent messages
  try {
    const agentMessages = await db.messages.where('senderType').equals('agent').toArray();
    for (const msg of agentMessages) {
      const cleaned = cleanAgentResponseText(msg.content);
      if (cleaned !== msg.content) {
        await db.messages.update(msg.id, { content: cleaned });
      }
    }
  } catch (e) {
    console.warn('Failed to sanitize legacy agent messages:', e);
  }

  const latest = await db.conversations.orderBy('updatedAt').reverse().first();
  return latest!;
}
