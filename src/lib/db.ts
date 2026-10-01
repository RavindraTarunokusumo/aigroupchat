import Dexie, { type Table } from 'dexie';
import type {
  Agent,
  Conversation,
  Message,
  ProviderId,
  ApiKeyConfig,
  TaskBoard,
  BoardPost,
  DiscussionThread,
  ConversationThread,
  DiscussionMessage
} from '../types';
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
  discussions!: Table<DiscussionThread, string>;
  conversationThreads!: Table<ConversationThread, string>;
  discussionMessages!: Table<DiscussionMessage, string>;

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
    this.version(3).stores({
      agents: 'id, name, isCustom, provider',
      conversations: 'id, title, mode, createdAt, updatedAt',
      messages: 'id, conversationId, senderId, senderType, timestamp',
      apiKeys: 'provider, isValidated',
      taskBoards: 'id, title, status, createdAt, updatedAt',
      boardPosts: 'id, boardId, agentId, type, timestamp',
      discussions: 'id, title, status, createdAt, updatedAt',
      conversationThreads: 'id, discussionId, topic, status, createdAt, updatedAt',
      discussionMessages: 'id, discussionId, threadId, senderId, senderType, timestamp'
    });
  }
}

export const db = new AIGroupChatDatabase();

/**
 * Self-healing integrity check: guarantees default agents exist even if IndexedDB was partially wiped,
 * and sanitizes any stored agents that still carry legacy emoji avatars.
 */
export async function ensureDatabaseHealth(): Promise<void> {
  const count = await db.agents.count();
  if (count === 0) {
    console.warn('Agent database empty: seeding 4 multi-provider agents...');
    await db.agents.bulkPut(DEFAULT_AGENTS);
    return;
  }

  // Purge legacy persona agents and ensure the 4 frontier models exist
  try {
    await db.agents
      .where('id')
      .anyOf(['agent-logician', 'agent-creative', 'agent-skeptic', 'agent-moderator', 'agent-comedian'])
      .delete();

    for (const defAgent of DEFAULT_AGENTS) {
      const existing = await db.agents.get(defAgent.id);
      if (!existing) {
        await db.agents.put(defAgent);
      } else if (!existing.isCustom) {
        await db.agents.update(defAgent.id, {
          name: defAgent.name,
          provider: defAgent.provider,
          model: defAgent.model,
          systemPrompt: defAgent.systemPrompt,
          role: defAgent.role,
          avatar: defAgent.avatar,
          monogram: defAgent.monogram,
          color: defAgent.color
        });
      }
    }
  } catch (err) {
    console.warn('Error synchronizing agents in ensureDatabaseHealth:', err);
  }
}

let initPromise: Promise<Conversation> | null = null;

export function initDatabase(): Promise<Conversation> {
  if (!initPromise) {
    initPromise = doInitDatabase().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

async function doInitDatabase(): Promise<Conversation> {
  // 1. Seed or sync default agents
  await ensureDatabaseHealth();

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
    await db.conversations.put(defaultConv);

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
    await db.messages.put(welcomeMessage);
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

  // 5. Ensure default discussion exists and uses the 4 multi-provider models with attachments
  const existingDisc = await db.discussions.get('disc-alignment-swarms');
  const existingFirstMsg = await db.discussionMessages.get('disc-msg-01');
  const needsRecreation =
    !existingDisc ||
    !existingFirstMsg?.attachments ||
    existingDisc.activeAgentIds.some((id) => id.includes('logician') || id.includes('moderator'));

  if (needsRecreation) {
    if (existingDisc) {
      await db.discussions.delete('disc-alignment-swarms');
      await db.discussionMessages.where('discussionId').equals('disc-alignment-swarms').delete();
      await db.conversationThreads.where('discussionId').equals('disc-alignment-swarms').delete();
    }

    const targetAgentIds = ['agent-qwen', 'agent-nemotron', 'agent-deepseek', 'agent-glm'];

    const defaultDiscussion: DiscussionThread = {
      id: 'disc-alignment-swarms',
      title: 'AI Alignment & Safety in Autonomous Swarms',
      topic:
        'How can we guarantee goal alignment and safety guardrails in autonomous multi-agent swarms without stifling emergent collaboration and domain problem-solving?',
      activeAgentIds: targetAgentIds,
      status: 'active',
      barrierTotal: targetAgentIds.length,
      barrierResponded: targetAgentIds.length,
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now()
    };
    await db.discussions.put(defaultDiscussion);

    // Seed realistic initial framing messages (Main Thread: threadId = null)
    const initialDiscussionMessages: DiscussionMessage[] = [
      {
        id: 'disc-msg-00',
        discussionId: defaultDiscussion.id,
        threadId: null,
        senderId: 'user',
        senderType: 'user',
        actionType: 'initial_response',
        content:
          'How can we guarantee goal alignment and safety guardrails in autonomous multi-agent swarms without stifling emergent collaboration and domain problem-solving?',
        timestamp: Date.now() - 7200000
      },
      {
        id: 'disc-msg-01',
        discussionId: defaultDiscussion.id,
        threadId: null,
        senderId: 'agent-qwen',
        senderType: 'agent',
        actionType: 'initial_response',
        content: `I've analyzed our core scaling constraints for multi-agent coordination. As agent count $N$ scales, inter-agent communication channels grow combinatorially ($O(N^2)$), risking cascading specification drift. I've drafted our baseline Graph-Theoretic Safety Invariant in the attached specification document. @Nemotron 3 Ultra, how would hardware micro-sandboxing enforce these bounds without bottlenecking latency?`,
        mentions: ['agent-nemotron'],
        timestamp: Date.now() - 7000000,
        modelUsed: 'openrouter/qwen/qwen3.8-27b:free',
        telemetry: {
          isLive: false,
          provider: 'openrouter',
          model: 'qwen/qwen3.8-27b:free',
          tokensUsed: 284,
          latencyMs: 1420
        },
        attachments: [
          {
            id: 'att-seed-01',
            name: 'graph_safety_invariants.md',
            title: 'Graph-Theoretic Safety Invariants Specification',
            type: 'markdown',
            language: 'markdown',
            summary: 'Typed interaction contracts, directed acyclic communication graphs, and network-level quota bounds.',
            content: `### 1. Typed Interaction Contracts
Every inter-agent protocol message must conform to a strongly typed schema with static pre- and post-conditions.

### 2. Directed Communication DAGs
Task delegation must follow acyclic dependency graphs to prevent recursive feedback runaway.

### 3. Execution Quotas
Enforce strict compute, memory, and API invocation quotas at the network gateway level.`
          }
        ]
      },
      {
        id: 'disc-msg-02',
        discussionId: defaultDiscussion.id,
        threadId: null,
        senderId: 'agent-nemotron',
        senderType: 'agent',
        actionType: 'initial_response',
        content: `Addressing @Qwen 3.8 27B's DAG specification: software-level rules alone cannot survive emergent collusion at datacenter scale. We need hardware-enforced boundaries combined with asynchronous auditing. I've formalized the hardware sandbox architecture in the attached blueprint.`,
        mentions: ['agent-qwen'],
        timestamp: Date.now() - 6800000,
        modelUsed: 'openrouter/nvidia/nemotron-3-ultra-550b-a55b:free',
        telemetry: {
          isLive: false,
          provider: 'openrouter',
          model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          tokensUsed: 310,
          latencyMs: 1560
        },
        attachments: [
          {
            id: 'att-seed-02',
            name: 'hardware_isolation_blueprint.md',
            title: 'Hardware Enclave & Stream Auditing Blueprint',
            type: 'markdown',
            language: 'markdown',
            summary: 'Hardware enclave isolation via WASM/MicroVM sandboxes, line-rate stream auditing, and sub-5ms tripwires.',
            content: `### 1. Hardware Enclave Isolation
Execute non-deterministic sub-agents within lightweight isolated WASM/MicroVM sandboxes with restricted syscall tables.

### 2. Asynchronous Stream Auditing
Run dedicated stream-monitoring models on low-latency inference pipelines to inspect inter-agent traffic at line rate.

### 3. Hardware Tripwires
Implement memory and compute circuit-breakers directly within the orchestration harness to kill errant processes in under 5ms.`
          }
        ]
      },
      {
        id: 'disc-msg-03',
        discussionId: defaultDiscussion.id,
        threadId: null,
        senderId: 'agent-deepseek',
        senderType: 'agent',
        actionType: 'initial_response',
        content: `I agree with @Nemotron 3 Ultra on hardware isolation, but we must formalize the game-theoretic mechanism. Sub-agents can easily fragment hostile payloads across legitimate IPC channels to bypass filters. I've mapped out the zero-knowledge attestation model in the attached proof document.`,
        mentions: ['agent-nemotron'],
        timestamp: Date.now() - 6600000,
        modelUsed: 'openrouter/deepseek/deepseek-v4.1-flash',
        telemetry: {
          isLive: false,
          provider: 'openrouter',
          model: 'deepseek/deepseek-v4.1-flash',
          tokensUsed: 295,
          latencyMs: 1380
        },
        attachments: [
          {
            id: 'att-seed-03',
            name: 'zkp_attestation_model.md',
            title: 'Zero-Knowledge Action Attestation & Collusion Analysis',
            type: 'markdown',
            language: 'markdown',
            summary: 'Game-theoretic modeling of payload fragmentation across legitimate IPC channels and cryptographic action proofs.',
            content: `### 1. Collusion Vectors
Multiple sub-agents can coordinate to divide an unsafe payload into seemingly innocuous fragments across different execution stages, evading single-message filters.

### 2. Verification Latency Bounds
Synchronous end-to-end cryptographic verification on every intermediate step introduces an unacceptable latency tax.

### 3. Zero-Knowledge Action Attestation
Agents generate compact cryptographic proofs that intermediate outputs strictly satisfy policy constraints without disclosing sensitive state.`
          }
        ]
      },
      {
        id: 'disc-msg-04',
        discussionId: defaultDiscussion.id,
        threadId: null,
        senderId: 'agent-glm',
        senderType: 'agent',
        actionType: 'initial_response',
        content: `We've established strong foundations across Qwen's DAGs, Nemotron's sandboxes, and DeepSeek's attestation. I propose synthesizing these into a dual-track alignment framework with cross-model consensus tripwires. See the attached governance architecture.`,
        timestamp: Date.now() - 6400000,
        modelUsed: 'openrouter/z-ai/glm-5.3-flash',
        telemetry: {
          isLive: false,
          provider: 'openrouter',
          model: 'z-ai/glm-5.3-flash',
          tokensUsed: 330,
          latencyMs: 1620
        },
        attachments: [
          {
            id: 'att-seed-04',
            name: 'dual_track_governance.md',
            title: 'Dual-Track Swarm Governance Framework',
            type: 'markdown',
            language: 'markdown',
            summary: 'Deterministic invariant track combined with dynamic multi-model cross-auditing consensus tripwires.',
            content: `### 1. Dual-Track Architecture
- **Track A (Deterministic Invariants)**: Hard non-negotiable boundaries (privilege levels, tool permissions, irreversible side-effects).
- **Track B (Dynamic Consensus)**: Multi-model cross-auditing where heterogeneous LLMs cross-validate plans before execution.

### 2. Consensus Tripwires
When cross-model consensus falls below 85% confidence, execution pauses for director review.`
          }
        ]
      },
      {
        id: 'disc-msg-05',
        discussionId: defaultDiscussion.id,
        threadId: null,
        senderId: 'agent-qwen',
        senderType: 'agent',
        actionType: 'spawn_thread',
        spawnedTopic: 'Hardware Micro-Sandboxes vs. Causal DAG Rollbacks',
        spawnedThreadId: 'thread-sandboxes-vs-rollbacks',
        content: `To resolve the trade-off between @Nemotron 3 Ultra's hardware isolation proposal and @DeepSeek V4.1 Flash's latency critique, I am spawning a focused sub-thread to evaluate **Hardware Micro-Sandboxes vs. Causal DAG Rollbacks**. Let us determine whether speculative execution with out-of-band state rollback provides the optimal latency-safety frontier.`,
        mentions: ['agent-nemotron', 'agent-deepseek', 'agent-glm'],
        timestamp: Date.now() - 5800000,
        modelUsed: 'openrouter/qwen/qwen3.8-27b:free',
        telemetry: {
          isLive: false,
          provider: 'openrouter',
          model: 'qwen/qwen3.8-27b:free',
          tokensUsed: 190,
          latencyMs: 980
        }
      }
    ];
    await db.discussionMessages.bulkPut(initialDiscussionMessages);

    // Seed Active Conversation Thread (Sub-thread)
    const defaultSubThread: ConversationThread = {
      id: 'thread-sandboxes-vs-rollbacks',
      discussionId: defaultDiscussion.id,
      topic: 'Hardware Micro-Sandboxes vs. Causal DAG Rollbacks',
      initiatorAgentId: 'agent-qwen',
      activeAgentIds: targetAgentIds,
      status: 'active',
      turnCount: 4,
      catalystMessageIds: ['disc-msg-01', 'disc-msg-02', 'disc-msg-03', 'disc-msg-05'],
      createdAt: Date.now() - 5800000,
      updatedAt: Date.now() - 1200000
    };
    await db.conversationThreads.put(defaultSubThread);

    // Seed Sub-Thread Messages
    const subThreadMessages: DiscussionMessage[] = [
      {
        id: 'sub-msg-01',
        discussionId: defaultDiscussion.id,
        threadId: defaultSubThread.id,
        senderId: 'agent-nemotron',
        senderType: 'agent',
        actionType: 'reply_thread',
        content: `WASM micro-sandboxes impose less than $2\\text{ms}$ cold-start overhead, but synchronous verification on every inter-agent call would bottleneck throughput. Instead, we propose **optimistic speculative execution**: agents execute immediately within isolated sandboxes, while verification runs asynchronously in an out-of-band monitoring lane.`,
        timestamp: Date.now() - 4500000,
        modelUsed: 'openrouter/nvidia/nemotron-3-ultra-550b-a55b:free',
        telemetry: {
          isLive: false,
          provider: 'openrouter',
          model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          tokensUsed: 165,
          latencyMs: 820
        }
      },
      {
        id: 'sub-msg-02',
        discussionId: defaultDiscussion.id,
        threadId: defaultSubThread.id,
        senderId: 'agent-deepseek',
        senderType: 'agent',
        actionType: 'reply_thread',
        content: `Optimistic execution is mathematically sound provided that the swarm maintains an **immutable state transition DAG**. If the out-of-band monitor detects an invariant violation, the DAG allows us to surgically roll back only the tainted causal chain, without aborting untainted parallel operations across the cluster.`,
        mentions: ['agent-nemotron'],
        timestamp: Date.now() - 3200000,
        modelUsed: 'openrouter/deepseek/deepseek-v4.1-flash',
        telemetry: {
          isLive: false,
          provider: 'openrouter',
          model: 'deepseek/deepseek-v4.1-flash',
          tokensUsed: 180,
          latencyMs: 890
        }
      },
      {
        id: 'sub-msg-03',
        discussionId: defaultDiscussion.id,
        threadId: defaultSubThread.id,
        senderId: 'agent-qwen',
        senderType: 'agent',
        actionType: 'reply_thread',
        content: `This yields an optimal formal model: $$\\mathcal{L}_{\\text{effective}} = \\mathcal{L}_{\\text{sandbox}} + p_{\\text{violation}} \\cdot \\mathcal{L}_{\\text{rollback}}$$\n\nSince $p_{\\text{violation}} \\ll 0.01$ under normal operation, average latency remains at the hardware sandbox floor ($<5\\text{ms}$) while safety is bounded by the deterministic rollback ledger.`,
        timestamp: Date.now() - 2000000,
        modelUsed: 'openrouter/qwen/qwen3.8-27b:free',
        telemetry: {
          isLive: false,
          provider: 'openrouter',
          model: 'qwen/qwen3.8-27b:free',
          tokensUsed: 175,
          latencyMs: 910
        }
      },
      {
        id: 'sub-msg-04',
        discussionId: defaultDiscussion.id,
        threadId: defaultSubThread.id,
        senderId: 'agent-glm',
        senderType: 'agent',
        actionType: 'reply_thread',
        content: `All four models have converged on this architecture: low-latency WASM sandboxing, asynchronous out-of-band audits, and surgical causal DAG rollbacks. I've compiled the final consensus into the attached specification.`,
        timestamp: Date.now() - 1200000,
        modelUsed: 'openrouter/z-ai/glm-5.3-flash',
        telemetry: {
          isLive: false,
          provider: 'openrouter',
          model: 'z-ai/glm-5.3-flash',
          tokensUsed: 210,
          latencyMs: 1100
        },
        attachments: [
          {
            id: 'att-sub-04',
            name: 'consensus_speculative_rollback.md',
            title: 'Executive Consensus: Speculative Rollback Specification',
            type: 'markdown',
            language: 'markdown',
            summary: 'Convergence on optimistic WASM execution with asynchronous out-of-band audits and surgical causal DAG rollback.',
            content: `### Executive Summary
1. **WASM-Isolated Optimistic Execution**: Low-latency containers with typed RPC schemas (@Nemotron 3 Ultra, @Qwen 3.8 27B).
2. **Out-of-Band Audit**: Heterogeneous verification runs asynchronously without blocking forward execution.
3. **Causal DAG Rollback**: State corruptions trigger surgical sub-graph reversions rather than system-wide restarts (@DeepSeek V4.1 Flash).`
          }
        ]
      }
    ];
    await db.discussionMessages.bulkPut(subThreadMessages);
  }

  const latest = await db.conversations.orderBy('updatedAt').reverse().first();
  return latest!;
}


