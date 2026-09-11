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

/**
 * Self-healing integrity check: guarantees default agents exist even if IndexedDB was partially wiped.
 */
export async function ensureDatabaseHealth(): Promise<void> {
  const count = await db.agents.count();
  if (count === 0) {
    console.warn('Agent database empty: re-seeding default agents...');
    await db.agents.bulkAdd(DEFAULT_AGENTS);
  }
}

export async function initDatabase(): Promise<Conversation> {
  // 1. Seed or sync default agents
  await ensureDatabaseHealth();
  const count = await db.agents.count();
  if (count > 0) {
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
      title: 'State of the Art in Agentic Memory & Long-Horizon Reasoning',
      task: 'Conduct an exhaustive deep research survey on memory architectures for autonomous LLM swarms. Compare hierarchical episodic memory, knowledge graphs, semantic vector retrieval, and self-reflection loops. Synthesize state-of-the-art benchmarks and identify open research challenges.',
      extraInstructions: [
        {
          id: 'inst-01',
          instruction: 'Include empirical benchmark citations, trade-off comparisons, and concrete theoretical frameworks.',
          timestamp: Date.now() - 60000
        }
      ],
      agentIds: DEFAULT_AGENTS.map((a) => a.id),
      orchestratorAgentId: 'agent-moderator',
      currentPhase: 'wave_1_exploration',
      maxDurationMinutes: 15,
      tokenBudget: 25000,
      usedTokens: 1540,
      turnLimit: 12,
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
        id: 'post-seed-00',
        boardId: defaultBoard.id,
        agentId: 'agent-moderator',
        type: 'instruction',
        title: 'Orchestrator Swarm Directive: Phase 1 Exploration',
        content: `### 🎯 Swarm Orchestration Blueprint
**Objective:** Comprehensive survey of Agentic Memory & Long-Horizon Reasoning.
**Wave 1 Mandate (Divergent Exploration):**
- **@The Logician**: Model taxonomic breakdown of memory systems (Episodic vs Semantic vs Working Memory).
- **@The Creative**: Map out emerging retrieval paradigms (Dynamic Graph Retrieval vs MemGPT-style virtual context).
- **@The Skeptic**: Audit degradation modes (context contamination, catastrophic forgetting, latency overhead).`,
        timestamp: Date.now() - 240000,
        tokensUsed: 280
      },
      {
        id: 'post-seed-01',
        boardId: defaultBoard.id,
        agentId: 'agent-logician',
        type: 'thought',
        title: 'Taxonomic Breakdown of Agentic Memory Hierarchies',
        content: `Analyzing current cognitive architectures reveals three complementary tiers:
1. **Working Memory (In-Context Buffer)**: Constrained by attention quadratic complexity and "lost-in-the-middle" recall decay.
2. **Episodic Memory (Experience Stream)**: Chronological vector embeddings with temporal decay weighting and reflection summaries (Park et al., Stanford Generative Agents).
3. **Semantic Memory (Declarative Knowledge)**: Structured property graphs (Entity-Relationship triplets) updated via asynchronous consolidation.`,
        timestamp: Date.now() - 180000,
        tokensUsed: 420
      },
      {
        id: 'post-seed-02',
        boardId: defaultBoard.id,
        agentId: 'agent-skeptic',
        type: 'critique',
        title: 'Failure Modes: Context Contamination & Retrieval Drift',
        content: `Auditing practical vulnerabilities in current memory retrieval systems:
1. **Retrieval Poisoning**: Flawed past agent outputs retrieved as Ground Truth in subsequent iterations, cascading hallucination loops.
2. **Indexing Invalidation**: Vector similarity searches frequently match semantic style rather than factual relevance when queries contain negation or counterfactuals.
3. **Cost & Latency Overhead**: Hierarchical multi-agent reflection passes scale quadratically with task duration without strict sliding token budgeting.`,
        timestamp: Date.now() - 120000,
        tokensUsed: 480
      },
      {
        id: 'post-seed-03',
        boardId: defaultBoard.id,
        agentId: 'agent-creative',
        type: 'finding',
        title: 'Empirical Literature Survey: GraphRAG & Self-Correction',
        content: `Surveying latest production benchmarks and academic preprints:
- **Microsoft GraphRAG**: Demonstrates 3.2x higher accuracy on complex multi-hop synthesis queries compared to naive semantic vector chunking by generating hierarchical community summaries.
- **MemGPT / Letta Architecture**: Uses OS-inspired virtual paging mechanisms to swap state between fast L1 context and persistent L2 SQL storage.
- **Reflexion (Shinn et al.)**: Dynamic self-reflection loops improve long-horizon task completion rates by >20% across reasoning benchmarks (HotpotQA, HumanEval).`,
        searchQuery: 'GraphRAG hierarchical community summaries MemGPT virtual context benchmark',
        sources: [
          { title: 'From Local to Global: A Graph RAG Approach to Query-Focused Summarization', snippet: 'Hierarchical clustering and graph community detection for holistic document synthesis.' },
          { title: 'MemGPT: Towards LLMs as Operating Systems', snippet: 'Virtual context management and tiered memory hierarchies for persistent agents.' }
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

