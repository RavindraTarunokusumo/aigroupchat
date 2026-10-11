export type ProviderId = 'gemini' | 'openai' | 'anthropic' | 'groq' | 'openrouter';

export type ChatMode = 'round-table' | 'mention' | 'moderated';

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  monogram: string;
  color: string; // Hex color or Tailwind accent identifier
  systemPrompt: string;
  provider: ProviderId;
  model: string;
  temperature: number;
  isCustom?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string; // 'user' or agent.id
  senderType: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  activeAgentIds: string[];
  mode: ChatMode;
  systemDirective?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ApiKeyConfig {
  key: string;
  isValidated: boolean;
  lastVerified?: number;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: ProviderId;
  description: string;
}

export type BoardStatus = 'idle' | 'running' | 'paused' | 'completed' | 'stopped' | 'budget_exhausted';

export type BoardPostType =
  | 'thought'
  | 'finding'
  | 'search'
  | 'critique'
  | 'solution'
  | 'instruction'
  | 'synthesis';

export interface BoardSource {
  title: string;
  url?: string;
  snippet?: string;
}

export interface BoardInstruction {
  id: string;
  instruction: string;
  timestamp: number;
  targetAgentId?: string;
  targetAgentName?: string;
}

export type SwarmPhase =
  | 'strategy'
  | 'wave_1_exploration'
  | 'wave_2_deep_dive'
  | 'wave_3_synthesis'
  | 'completed';

export interface TaskBoard {
  id: string;
  title: string;
  task: string; // Original immutable shared task
  extraInstructions: BoardInstruction[]; // Dynamically appended instructions from user
  agentIds: string[];
  orchestratorAgentId?: string; // Designated overseer agent for strategy, delegation, and final synthesis
  currentPhase?: SwarmPhase;
  maxDurationMinutes: number;
  tokenBudget: number;
  usedTokens: number;
  turnLimit: number;
  currentTurn: number;
  turnCadenceSeconds: number;
  status: BoardStatus;
  enableSearch: boolean;
  startedAt?: number;
  completedAt?: number;
  elapsedSeconds: number;
  createdAt: number;
  updatedAt: number;
}

export interface BoardPost {
  id: string;
  boardId: string;
  agentId: string; // agent.id or 'user' or 'system'
  type: BoardPostType;
  title?: string;
  content: string;
  searchQuery?: string;
  sources?: BoardSource[];
  tokensUsed?: number;
  timestamp: number;
  isStreaming?: boolean;
  isPinned?: boolean;
  isBookmarked?: boolean;
  upvotes?: number;
  userReaction?: 'up' | 'down' | null;
}

// --- Discussion & Conversation Thread Types ---

export type DiscussionStatus = 'active' | 'paused' | 'completed' | 'barrier_wait';

export interface DiscussionThread {
  id: string;
  title: string;
  topic: string; // the core thesis / prompt
  activeAgentIds: string[];
  status: DiscussionStatus;
  tokenBudget?: number; // ceiling in tokens (0 or undefined = unlimited)
  tokensUsed?: number; // cumulative tokens consumed across all messages
  concludedReason?: 'token_budget' | 'agent_consensus' | 'user_manual';
  concludeVotes?: string[]; // agent IDs who voted/agreed to conclude
  barrierTotal?: number;
  barrierResponded?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ConversationThread {
  id: string;
  discussionId: string;
  topic: string; // sub-topic name, e.g. "Value Alignment & RLHF"
  initiatorAgentId: string;
  activeAgentIds: string[];
  status: 'active' | 'concluded';
  turnCount: number;
  catalystMessageIds?: string[]; // ids of the main-thread messages that prompted this sub-thread
  createdAt: number;
  updatedAt: number;
}

export type ThreadActionType =
  | 'initial_response'
  | 'reply_main'
  | 'reply_thread'
  | 'spawn_thread'
  | 'join_thread'
  | 'leave_thread'
  | 'synthesize_to_main'
  | 'propose_conclude'
  | 'agree_conclude'
  | 'contest_conclude'
  | 'concluded';

export interface WakeTrigger {
  mode: 'mention' | 'cadence';
  delaySeconds?: number;
}

export interface MessageAttachment {
  id: string;
  name: string; // e.g. "interaction_contracts_spec.md"
  title?: string; // e.g. "Formal Invariant Specification"
  type: 'markdown' | 'code' | 'json' | 'text';
  language?: string;
  content: string; // Structured exposition / proposition
  summary?: string;
}

export interface GenerationTelemetry {
  isLive: boolean;
  provider: ProviderId;
  model: string;
  tokensUsed?: number;
  latencyMs?: number;
}

export interface DiscussionMessage {
  id: string;
  discussionId: string;
  threadId?: string | null; // null = Main Discussion Thread, string = Conversation Thread ID
  senderId: string; // 'user' or agent.id or 'system'
  senderType: 'user' | 'agent' | 'system';
  actionType: ThreadActionType;
  content: string;
  spawnedTopic?: string;
  spawnedThreadId?: string;
  mentions?: string[];
  replyToMessageIds?: string[];
  wakeTrigger?: WakeTrigger;
  timestamp: number;
  isStreaming?: boolean;
  modelUsed?: string;
  attachments?: MessageAttachment[];
  telemetry?: GenerationTelemetry;
}


