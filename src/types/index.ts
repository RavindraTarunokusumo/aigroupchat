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
