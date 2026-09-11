export type ProviderId = 'gemini' | 'openai' | 'anthropic' | 'groq' | 'openrouter';

export type ChatMode = 'round-table' | 'mention' | 'moderated';

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string; // Hex color or Tailwind accent identifier
  systemPrompt: string;
  provider: ProviderId;
  model: string;
  temperature: number;
  isCustom?: boolean;
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


