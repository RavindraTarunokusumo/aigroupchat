import Dexie, { type Table } from 'dexie';
import type { Agent, Conversation, Message, ProviderId, ApiKeyConfig, TaskBoard, BoardPost } from '../types';
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
  taskBoards!: Table<TaskBoard, string>;
  boardPosts!: Table<BoardPost, string>;

  constructor() {
    super('AIGroupChatDB');
    this.version(1).stores({
      agents: 'id, name, isCustom, provider',
      conversations: 'id, title, mode, createdAt, updatedAt',
      messages: 'id, conversationId, senderId, senderType, timestamp',
      apiKeys: 'provider, isValidated'
    });
    this.version(2).stores({
      agents: 'id, name, isCustom, provider',
      conversations: 'id, title, mode, createdAt, updatedAt',
      messages: 'id, conversationId, senderId, senderType, timestamp',
      apiKeys: 'provider, isValidated',
      taskBoards: 'id, title, status, createdAt, updatedAt',
      boardPosts: 'id, boardId, agentId, type, timestamp'
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

  // 4. Ensure at least one default task board exists
  const boardCount = await db.taskBoards.count();
  if (boardCount === 0) {
    const defaultBoard: TaskBoard = {
      id: 'board-default-01',
      title: 'Zero-Downtime Multi-Region Database Migration',
      task: 'Design a resilient zero-downtime database migration architecture from single-node PostgreSQL to a globally distributed multi-region setup with sub-100ms read replicas, continuous bi-directional sync, automated conflict resolution, and immediate rollback procedures.',
      extraInstructions: [
        {
          id: 'inst-01',
          instruction: 'Ensure all solutions prioritize zero data loss (RPO=0) and support Kubernetes deployment.',
          timestamp: Date.now() - 60000
        }
      ],
      agentIds: DEFAULT_AGENTS.map((a) => a.id),
      maxDurationMinutes: 15,
      tokenBudget: 20000,
      usedTokens: 1420,
      turnLimit: 20,
      currentTurn: 3,
      turnCadenceSeconds: 3,
      status: 'paused',
      enableSearch: true,
      elapsedSeconds: 45,
      createdAt: Date.now() - 360000,
      updatedAt: Date.now()
    };
    await db.taskBoards.add(defaultBoard);

    // Seed realistic collaboration posts
    const initialPosts: BoardPost[] = [
      {
        id: 'post-seed-01',
        boardId: defaultBoard.id,
        agentId: 'agent-logician-01',
        type: 'thought',
        title: 'Initial Architectural Topology Assessment',
        content: `To achieve **zero-downtime** with sub-100ms cross-region reads and RPO=0, standard asynchronous replication is insufficient due to potential replication lag during failovers.
We need to evaluate a dual-write pipeline using Change Data Capture (CDC) via Debezium or pglogical alongside write-ahead log (WAL) streaming.`,
        timestamp: Date.now() - 180000,
        tokensUsed: 420
      },
      {
        id: 'post-seed-02',
        boardId: defaultBoard.id,
        agentId: 'agent-skeptic-01',
        type: 'critique',
        title: 'Network Partition & Conflict Resolution Hazards',
        content: `Caution: Bi-directional replication across multiple regions introduces the PACELC dilemma. In the event of cross-Atlantic or trans-Pacific network degradation:
1. Multi-master setups will generate concurrent primary key collisions unless UUIDv7 or composite shard keys are strictly enforced.
2. Latency spikes on two-phase commit (2PC) will degrade p99 write latency beyond acceptable SLOs.
We must designate a deterministic single-leader region for write transactions or use CRDTs for conflicting entity states.`,
        timestamp: Date.now() - 120000,
        tokensUsed: 480
      },
      {
        id: 'post-seed-03',
        boardId: defaultBoard.id,
        agentId: 'agent-creative-01',
        type: 'finding',
        title: 'Shadow Traffic & Progressive Cutover Strategy',
        content: `Found a high-leverage pattern from Netflix and Figma migration playbooks:
- **Phase 1 (Shadow Mirroring)**: Use a lightweight proxy (e.g., Envoy or PgBouncer plugin) to duplicate 10% -> 50% -> 100% of read/write traffic to the new multi-region target without returning target responses to users.
- **Phase 2 (Drift Detection)**: Run an automated checksum comparator checking replicated row hashes in near real-time.
- **Phase 3 (DNS Canary Flip)**: Instant zero-downtime cutover via weighted Route53 / Cloudflare DNS records with 5s TTL.`,
        searchQuery: 'zero downtime postgresql migration shadow traffic canary cutover',
        sources: [
          { title: 'Figma PostgreSQL Migration at Scale', snippet: 'How Figma partitioned and migrated petabyte databases with zero downtime using shadow traffic.' },
          { title: 'PostgreSQL Logical Replication & Conflict Avoidance', snippet: 'Avoiding split-brain scenarios in distributed postgres configurations.' }
        ],
        timestamp: Date.now() - 60000,
        tokensUsed: 520
      }
    ];
    await db.boardPosts.bulkAdd(initialPosts);
  }

  const latest = await db.conversations.orderBy('updatedAt').reverse().first();
  return latest!;
}

