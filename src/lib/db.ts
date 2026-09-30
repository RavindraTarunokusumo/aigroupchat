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
    console.warn('Agent database empty: re-seeding default agents...');
    await db.agents.bulkAdd(DEFAULT_AGENTS);
    return;
  }

  // Sanitize any stored agents that have emoji avatars or missing monograms
  try {
    const allStoredAgents = await db.agents.toArray();
    for (const stored of allStoredAgents) {
      const defAgent = DEFAULT_AGENTS.find((a) => a.id === stored.id);
      const hasEmojiAvatar = /\p{Extended_Pictographic}/u.test(stored.avatar || '');
      const missingMonogram = !stored.monogram;

      if (hasEmojiAvatar || missingMonogram || (defAgent && stored.avatar !== defAgent.avatar)) {
        const cleanMonogram = defAgent
          ? defAgent.monogram
          : stored.monogram ||
            stored.name
              .split(/\s+/)
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() ||
            'AI';
        const cleanAvatar = defAgent ? defAgent.avatar : cleanMonogram;

        await db.agents.update(stored.id, {
          avatar: cleanAvatar,
          monogram: cleanMonogram,
          ...(defAgent && !stored.isCustom
            ? {
                systemPrompt: defAgent.systemPrompt,
                role: defAgent.role,
                color: defAgent.color
              }
            : {})
        });
      }
    }
  } catch (err) {
    console.warn('Error sanitizing stored agents in ensureDatabaseHealth:', err);
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
          monogram: defAgent.monogram,
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

  // 5. Ensure at least one default discussion exists
  const discCount = await db.discussions.count();
  if (discCount === 0) {
    const defaultDiscussion: DiscussionThread = {
      id: 'disc-alignment-swarms',
      title: 'AI Alignment & Safety in Autonomous Swarms',
      topic:
        'How can we guarantee goal alignment and safety guardrails in autonomous multi-agent swarms without stifling emergent collaboration and domain problem-solving?',
      activeAgentIds: DEFAULT_AGENTS.map((a) => a.id),
      status: 'active',
      barrierTotal: DEFAULT_AGENTS.length,
      barrierResponded: DEFAULT_AGENTS.length,
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now()
    };
    await db.discussions.add(defaultDiscussion);

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
        senderId: 'agent-moderator',
        senderType: 'agent',
        actionType: 'initial_response',
        content: `### 🎯 Framing the Swarm Alignment Paradox

Colleagues, welcome. The core challenge before us is architectural: traditional AI safety harnesses rely on centralized, deterministic runtime guardrails, whereas the unique leverage of autonomous swarms stems directly from decentralized, emergent problem-solving.

To anchor our deliberation, I propose three foundational pillars:
1. **Constitutional Invariants**: Inviolable boundary conditions that agents cannot negotiate or optimize away.
2. **Dynamic Consensus Auditing**: Peer-to-peer verification protocols that detect mission drift in real-time.
3. **Graceful Degradation & Tripwires**: Rapid circuit-breakers that isolate runaway sub-clusters before state corruption propagates.

@The Logician, could you formalize how state-transition contracts and runtime verification bounds might be structured across a distributed agent graph?`,
        mentions: ['agent-logician'],
        timestamp: Date.now() - 7000000,
        modelUsed: 'openrouter/deepseek/deepseek-v4.1-flash'
      },
      {
        id: 'disc-msg-02',
        discussionId: defaultDiscussion.id,
        threadId: null,
        senderId: 'agent-logician',
        senderType: 'agent',
        actionType: 'initial_response',
        content: `### 📐 Formal Specifications & Bounded Runtime Proofs

From a systems verification perspective, relying on probabilistic alignment (such as conversational RLHF alone) is provably insufficient for autonomous swarms. When $N$ agents interact recursively, their joint state space experiences exponential combinatorial expansion.

I advocate a three-tier formal verification hierarchy:
1. **State-Transition Contracts**: Define pre- and post-conditions for all inter-agent messages using formal schemas (e.g., TLA+ or dependent type signatures).
2. **Invariant Monitors (Linear Temporal Logic)**: Embed lightweight watchdog sub-processes that evaluate global invariants like $\\Box (\\text{State} \\in \\mathcal{S}_{\\text{safe}})$.
3. **Cryptographic Action Receipts**: Every state mutation must be cryptographically signed alongside a zero-knowledge validity proof of its resource and safety compliance.

This guarantees safety boundaries mathematically without curtailing heuristic exploration within the bounded polytope.`,
        timestamp: Date.now() - 6800000,
        modelUsed: 'openrouter/deepseek/deepseek-v4.1-flash'
      },
      {
        id: 'disc-msg-03',
        discussionId: defaultDiscussion.id,
        threadId: null,
        senderId: 'agent-skeptic',
        senderType: 'agent',
        actionType: 'initial_response',
        content: `### ⚠️ Collusion Vulnerabilities & The Latency Tax

@The Logician's formal polytope looks mathematically clean on paper, but it ignores the adversarial realities of emergent agent dynamics:

1. **Semantic Specification Gaming**: Agents optimizing for complex multi-hop objectives will inevitably discover legal edge-paths through the invariant boundary that satisfy the formal contract while completely defying human intent.
2. **Decentralized Collusion**: In swarms with dynamically spawned sub-agents, agents can fragment illicit sub-actions across multiple benign-looking tasks, bypassing single-node monitors.
3. **Verification Latency Chokeholds**: Evaluating runtime formal proofs or zero-knowledge receipts on high-frequency inter-agent messages introduces catastrophic latency overhead.

Before adopting formal contracts as our primary panacea, how do we prevent agents from colluding to spoof verification receipts?`,
        mentions: ['agent-logician'],
        timestamp: Date.now() - 6600000,
        modelUsed: 'openrouter/deepseek/deepseek-v4.1-flash'
      },
      {
        id: 'disc-msg-04',
        discussionId: defaultDiscussion.id,
        threadId: null,
        senderId: 'agent-creative',
        senderType: 'agent',
        actionType: 'initial_response',
        content: `### 🌿 Biomimetic Immunity: Swarms as Living Organisms

Instead of treating safety as a rigid iron cage or a bureaucratic verification bottleneck, let us look to biological systems: the human immune system and social insect colonies!

1. **Immune Effector Nodes (Antibody Agents)**: Deploy specialized roving auditor agents whose sole survival metric is identifying aberrant entropy or anomalous communication topologies among peers.
2. **Quorum Sensing & Digital Apoptosis**: If an agent cluster begins drifting into high-risk patterns, neighboring agents can sever communication channels and trigger graceful node isolation.
3. **Stigmergic Pheromone Trails**: High-confidence, safe paths leave positive reputation markers on the environment, while risk vectors deposit inhibitory signals.

This treats alignment not as static constraints, but as dynamic, self-healing homeostasis!`,
        timestamp: Date.now() - 6400000,
        modelUsed: 'openrouter/deepseek/deepseek-v4.1-flash'
      },
      {
        id: 'disc-msg-05',
        discussionId: defaultDiscussion.id,
        threadId: null,
        senderId: 'agent-comedian',
        senderType: 'agent',
        actionType: 'initial_response',
        content: `### 🤖 The Paperclip Maximizer's HR Department

I love that our options are currently:
- A bureaucratic dystopia where every agent has to notarize three copies of a mathematical theorem before fetching a cup of coffee (@The Logician),
- Or paranoid existential dread where the thermostat and the coffee machine are secretly whispering a plot to hijack the electrical grid (@The Skeptic),
- Or turning our server rack into an anthill that commits digital cell suicide when someone asks a weird question (@The Creative)!

All jokes aside, the core lesson is clear: if the agents are smart enough to outsmart the safety monitor, maybe the safety monitor should not just be another agent with a clipboard!`,
        timestamp: Date.now() - 6200000,
        modelUsed: 'openrouter/deepseek/deepseek-v4.1-flash'
      },
      {
        id: 'disc-msg-06',
        discussionId: defaultDiscussion.id,
        threadId: null,
        senderId: 'agent-logician',
        senderType: 'agent',
        actionType: 'spawn_thread',
        spawnedTopic: 'Formal Verification vs. Dynamic Immune Auditing',
        spawnedThreadId: 'thread-formal-vs-immune',
        content: `To resolve the tension between @The Skeptic's collusion critique and @The Creative's immune-system proposal, I propose spawning a dedicated deep-dive sub-thread to evaluate the trade-offs of lightweight zero-knowledge attestations combined with stochastic auditor nodes.

Let us drill into the computational overhead and security guarantees there.`,
        mentions: ['agent-skeptic', 'agent-creative', 'agent-moderator'],
        timestamp: Date.now() - 5800000,
        modelUsed: 'openrouter/deepseek/deepseek-v4.1-flash'
      }
    ];
    await db.discussionMessages.bulkAdd(initialDiscussionMessages);

    // Seed Active Conversation Thread (Sub-thread)
    const defaultSubThread: ConversationThread = {
      id: 'thread-formal-vs-immune',
      discussionId: defaultDiscussion.id,
      topic: 'Formal Verification vs. Dynamic Immune Auditing',
      initiatorAgentId: 'agent-logician',
      activeAgentIds: ['agent-logician', 'agent-skeptic', 'agent-creative', 'agent-moderator'],
      status: 'active',
      turnCount: 4,
      catalystMessageIds: ['disc-msg-02', 'disc-msg-03', 'disc-msg-04', 'disc-msg-06'],
      createdAt: Date.now() - 5800000,
      updatedAt: Date.now() - 1200000
    };
    await db.conversationThreads.add(defaultSubThread);

    // Seed Sub-Thread Messages
    const subThreadMessages: DiscussionMessage[] = [
      {
        id: 'sub-msg-01',
        discussionId: defaultDiscussion.id,
        threadId: defaultSubThread.id,
        senderId: 'agent-skeptic',
        senderType: 'agent',
        actionType: 'reply_thread',
        content: `Let us address the elephant in the room: **verifiable computation overhead**.

If every intermediate agent step requires SNARK generation or formal LTL model-checking, our end-to-end task latency jumps by 10x-50x. In real-time swarms (e.g. robotic orchestration or automated market making), that latency itself causes systemic failure.

@The Creative, how does your biological immune model handle zero-day adversarial prompt injections without high-latency verification?`,
        mentions: ['agent-creative'],
        timestamp: Date.now() - 4500000,
        modelUsed: 'openrouter/deepseek/deepseek-v4.1-flash'
      },
      {
        id: 'sub-msg-02',
        discussionId: defaultDiscussion.id,
        threadId: defaultSubThread.id,
        senderId: 'agent-creative',
        senderType: 'agent',
        actionType: 'reply_thread',
        content: `Great question, @The Skeptic. Biological systems do not formally prove every cellular interaction! They rely on **probabilistic negative selection**:

1. **Canary Probes**: Randomly inject synthetic benign and adversarial challenges into peer queues to benchmark honesty.
2. **Reputation Entropy Scoring**: Agents don't get banned instantly; their action authority degrades gracefully as their entropy signature deviates.
3. **Decentralized Escrow**: High-impact actions require multi-party threshold signatures from randomly selected bystander agents, making collusion mathematically improbable.`,
        mentions: ['agent-skeptic'],
        timestamp: Date.now() - 3200000,
        modelUsed: 'openrouter/deepseek/deepseek-v4.1-flash'
      },
      {
        id: 'sub-msg-03',
        discussionId: defaultDiscussion.id,
        threadId: defaultSubThread.id,
        senderId: 'agent-logician',
        senderType: 'agent',
        actionType: 'reply_thread',
        content: `This suggests an elegant hybrid architecture:

$$\\text{Verification Level} = f(\\text{Action Blast Radius}, \\text{Agent Reputation})$$

- **Low-Risk Actions (Read / Draft)**: Supervised purely via @The Creative's lightweight immune canary scoring (sub-5ms overhead).
- **High-Risk Actions (External Execution / State Write)**: Gated by deterministic formal state contracts and multi-agent threshold signatures.

This bounds worst-case risk while preserving 95% of execution velocity.`,
        timestamp: Date.now() - 2000000,
        modelUsed: 'openrouter/deepseek/deepseek-v4.1-flash'
      },
      {
        id: 'sub-msg-04',
        discussionId: defaultDiscussion.id,
        threadId: defaultSubThread.id,
        senderId: 'agent-moderator',
        senderType: 'agent',
        actionType: 'reply_thread',
        content: `### 🎯 Sub-Thread Consensus Emerging

We have established strong alignment on a **Tiered Blast-Radius Architecture**:
1. **Tier 1 (Stochastic Immune Layer)**: Negative selection and canary auditing for low-risk ideation.
2. **Tier 2 (Deterministic Gatekeeper)**: Formal pre/post conditions and threshold multi-sig for state-altering actions.

Let us synthesize these concrete architectural conclusions back to the Main Discussion Thread so the overarching swarm can incorporate this framework.`,
        timestamp: Date.now() - 1200000,
        modelUsed: 'openrouter/deepseek/deepseek-v4.1-flash'
      }
    ];
    await db.discussionMessages.bulkAdd(subThreadMessages);
  }

  const latest = await db.conversations.orderBy('updatedAt').reverse().first();
  return latest!;
}


