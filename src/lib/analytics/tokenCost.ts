import { db } from '../db';
import type { Agent, BoardPost, DiscussionMessage, Message, ProviderId } from '../../types';

/**
 * Standard model pricing configuration (USD per 1M tokens)
 */
export interface ModelPricing {
  id: string;
  name: string;
  provider: ProviderId | string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  blendedCostPer1M?: number;
  description?: string;
}

/**
 * Canonical pricing map for standard frontier & open-weight models.
 * Rates reflect official vendor API rates per 1,000,000 tokens.
 */
export const STANDARD_MODEL_PRICING: Record<string, ModelPricing> = {
  // 1. Google Gemini 2.5 Flash
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    blendedCostPer1M: 0.15,
    description: 'Google high-speed multimodal reasoning'
  },
  'gemini-3.7-flash': {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    provider: 'gemini',
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.40,
    blendedCostPer1M: 0.20,
    description: 'Next-gen hybrid reasoning'
  },
  'gemini-3.8-flash': {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.40,
    blendedCostPer1M: 0.20,
    description: 'Google flagship speed & 1M context'
  },
  'gemini-3.5-flash-lite': {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    provider: 'gemini',
    inputCostPer1M: 0.05,
    outputCostPer1M: 0.20,
    blendedCostPer1M: 0.10,
    description: 'Ultra-low latency intelligence'
  },

  // 2. OpenAI GPT-4o
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    blendedCostPer1M: 5.00,
    description: 'OpenAI flagship multimodal intelligence'
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    blendedCostPer1M: 0.30,
    description: 'Affordable high-efficiency omni model'
  },
  'openai/gpt-6-astra': {
    id: 'openai/gpt-6-astra',
    name: 'GPT-6 Astra',
    provider: 'openai',
    inputCostPer1M: 3.00,
    outputCostPer1M: 12.00,
    blendedCostPer1M: 6.00,
    description: 'OpenAI next-gen flagship'
  },
  'openai/gpt-5.6-sol': {
    id: 'openai/gpt-5.6-sol',
    name: 'GPT-5.6 Sol',
    provider: 'openai',
    inputCostPer1M: 2.00,
    outputCostPer1M: 8.00,
    blendedCostPer1M: 4.00,
    description: 'High-speed reasoning model'
  },

  // 3. Anthropic Claude 3.5 Sonnet
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    blendedCostPer1M: 7.50,
    description: 'Anthropic frontier coding & deep reasoning'
  },
  'claude-sonnet-5': {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'anthropic',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    blendedCostPer1M: 7.50,
    description: 'Frontier coding & agent execution'
  },
  'claude-fable-5.1': {
    id: 'claude-fable-5.1',
    name: 'Claude Fable 5.1',
    provider: 'anthropic',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    blendedCostPer1M: 7.50,
    description: 'Creative & structured nuance'
  },
  'claude-opus-5': {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    provider: 'anthropic',
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
    blendedCostPer1M: 35.00,
    description: 'Architectural depth and nuance'
  },

  // 4. DeepSeek V4.1 Flash
  'deepseek-v4.1-flash': {
    id: 'deepseek-v4.1-flash',
    name: 'DeepSeek V4.1 Flash',
    provider: 'openrouter',
    inputCostPer1M: 0.14,
    outputCostPer1M: 0.28,
    blendedCostPer1M: 0.20,
    description: 'Sparse MoE CED architecture for rapid technical reasoning'
  },
  'deepseek/deepseek-v4.1-flash': {
    id: 'deepseek/deepseek-v4.1-flash',
    name: 'DeepSeek V4.1 Flash',
    provider: 'openrouter',
    inputCostPer1M: 0.14,
    outputCostPer1M: 0.28,
    blendedCostPer1M: 0.20,
    description: 'Sparse MoE CED architecture'
  },
  'deepseek/deepseek-v4-pro-0813': {
    id: 'deepseek/deepseek-v4-pro-0813',
    name: 'DeepSeek V4 Pro',
    provider: 'openrouter',
    inputCostPer1M: 0.27,
    outputCostPer1M: 1.10,
    blendedCostPer1M: 0.55,
    description: 'Frontier deep reasoning & code'
  },

  // 5. Qwen 3.8 27B
  'qwen/qwen3.8-27b': {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B',
    provider: 'openrouter',
    inputCostPer1M: 0.20,
    outputCostPer1M: 0.60,
    blendedCostPer1M: 0.35,
    description: 'Alibaba Cloud multilingual & algorithmic reasoning'
  },
  'qwen/qwen3.8-27b:free': {
    id: 'qwen/qwen3.8-27b:free',
    name: 'Qwen 3.8 27B (Free)',
    provider: 'openrouter',
    inputCostPer1M: 0.20,
    outputCostPer1M: 0.60,
    blendedCostPer1M: 0.35,
    description: 'Alibaba Cloud free community tier'
  },

  // 6. Groq Llama 3.3
  'llama-3.3-70b-versatile': {
    id: 'llama-3.3-70b-versatile',
    name: 'Groq Llama 3.3 70B',
    provider: 'groq',
    inputCostPer1M: 0.59,
    outputCostPer1M: 0.79,
    blendedCostPer1M: 0.69,
    description: 'Groq LPUs high-throughput inference'
  },
  'deepseek-r1-distill-llama-70b': {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill 70B',
    provider: 'groq',
    inputCostPer1M: 0.59,
    outputCostPer1M: 0.99,
    blendedCostPer1M: 0.79,
    description: 'Instant reasoning output on Groq hardware'
  },

  // Additional Deliberation Models in Stack
  'nvidia/nemotron-3-ultra-550b-a55b:free': {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'Nemotron 3 Ultra (Free)',
    provider: 'openrouter',
    inputCostPer1M: 0.60,
    outputCostPer1M: 1.80,
    blendedCostPer1M: 1.20,
    description: 'NVIDIA 550B MoE systems and computational model'
  },
  'nvidia/nemotron-3-ultra-550b-a55b': {
    id: 'nvidia/nemotron-3-ultra-550b-a55b',
    name: 'Nemotron 3 Ultra',
    provider: 'openrouter',
    inputCostPer1M: 0.60,
    outputCostPer1M: 1.80,
    blendedCostPer1M: 1.20,
    description: 'NVIDIA 550B commercial throughput model'
  },
  'z-ai/glm-5.3-flash': {
    id: 'z-ai/glm-5.3-flash',
    name: 'GLM 5.3 Flash',
    provider: 'openrouter',
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.10,
    blendedCostPer1M: 0.10,
    description: 'Zhipu AI bilingual reasoning and agentic foundation model'
  },
  'openrouter/free': {
    id: 'openrouter/free',
    name: 'OpenRouter Free',
    provider: 'openrouter',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    blendedCostPer1M: 0.00,
    description: 'Free auto-router tier'
  }
};

/**
 * Standard fallback rate used when an unrecognized custom model is encountered.
 */
export const DEFAULT_FALLBACK_PRICING: ModelPricing = {
  id: 'standard-frontier-default',
  name: 'Standard Frontier Model',
  provider: 'openrouter',
  inputCostPer1M: 0.50,
  outputCostPer1M: 1.50,
  blendedCostPer1M: 1.00,
  description: 'Average industry frontier blend'
};

/**
 * Resolves standard model pricing for a given model string and provider.
 * Supports exact IDs, prefixed model identifiers (e.g. `openrouter/...`), and fuzzy substring fallbacks.
 */
export function getModelPricing(modelId?: string, providerId?: ProviderId | string): ModelPricing {
  if (!modelId) {
    return DEFAULT_FALLBACK_PRICING;
  }

  const raw = modelId.trim().toLowerCase();

  // 1. Exact match
  if (STANDARD_MODEL_PRICING[raw]) {
    return STANDARD_MODEL_PRICING[raw];
  }

  // 2. Strip vendor prefix (e.g. "openrouter/qwen/qwen3.8-27b:free" -> "qwen/qwen3.8-27b:free")
  const strippedPrefix = raw.replace(/^openrouter\//, '');
  if (STANDARD_MODEL_PRICING[strippedPrefix]) {
    return STANDARD_MODEL_PRICING[strippedPrefix];
  }

  // 3. Strip :free or variant tags
  const strippedFree = strippedPrefix.replace(/:free$/, '');
  if (STANDARD_MODEL_PRICING[strippedFree]) {
    return STANDARD_MODEL_PRICING[strippedFree];
  }

  // 4. Heuristic / substring matching for canonical model families
  if (raw.includes('gemini-2.5') || raw.includes('gemini-2.0') || raw.includes('gemini-2') || raw.includes('gemini-1.5-flash')) {
    return STANDARD_MODEL_PRICING['gemini-2.5-flash'];
  }
  if (raw.includes('gemini-3.7')) {
    return STANDARD_MODEL_PRICING['gemini-3.7-flash'];
  }
  if (raw.includes('gemini-3.8')) {
    return STANDARD_MODEL_PRICING['gemini-3.8-flash'];
  }
  if (raw.includes('gemini-3.5') || raw.includes('flash-lite')) {
    return STANDARD_MODEL_PRICING['gemini-3.5-flash-lite'];
  }
  if (raw.includes('gemini')) {
    return STANDARD_MODEL_PRICING['gemini-2.5-flash'];
  }

  if (raw.includes('gpt-4o-mini')) {
    return STANDARD_MODEL_PRICING['gpt-4o-mini'];
  }
  if (raw.includes('gpt-4o') || raw.includes('gpt-4') || raw.includes('gpt-5') || raw.includes('gpt-6')) {
    return STANDARD_MODEL_PRICING['gpt-4o'];
  }

  if (raw.includes('claude-3-5-sonnet') || raw.includes('claude-3.5-sonnet') || raw.includes('sonnet')) {
    return STANDARD_MODEL_PRICING['claude-3-5-sonnet'];
  }
  if (raw.includes('claude-opus')) {
    return STANDARD_MODEL_PRICING['claude-opus-5'];
  }
  if (raw.includes('claude')) {
    return STANDARD_MODEL_PRICING['claude-3-5-sonnet'];
  }

  if (raw.includes('deepseek-v4.1') || raw.includes('deepseek-v4') || raw.includes('deepseek')) {
    if (raw.includes('distill') || raw.includes('groq')) {
      return STANDARD_MODEL_PRICING['deepseek-r1-distill-llama-70b'];
    }
    return STANDARD_MODEL_PRICING['deepseek-v4.1-flash'];
  }

  if (raw.includes('qwen')) {
    return STANDARD_MODEL_PRICING['qwen/qwen3.8-27b'];
  }

  if (raw.includes('nemotron')) {
    return STANDARD_MODEL_PRICING['nvidia/nemotron-3-ultra-550b-a55b'];
  }

  if (raw.includes('glm')) {
    return STANDARD_MODEL_PRICING['z-ai/glm-5.3-flash'];
  }

  if (raw.includes('llama-3.3') || raw.includes('llama-3') || (raw.includes('llama') && providerId === 'groq')) {
    return STANDARD_MODEL_PRICING['llama-3.3-70b-versatile'];
  }

  // Fallback with inferred provider
  return {
    ...DEFAULT_FALLBACK_PRICING,
    id: raw,
    name: modelId.split('/').pop() || modelId,
    provider: (providerId as ProviderId) || 'openrouter'
  };
}

/**
 * Estimates prompt tokens vs completion tokens when only total tokens or raw content is stored.
 * Standard heuristic: ~4 characters per completion token, remainder or proportion as prompt tokens.
 */
export function estimateTokenSplit(
  totalTokens: number | undefined,
  content: string = '',
  attachments?: { content?: string }[]
): { promptTokens: number; completionTokens: number; totalTokens: number } {
  const contentChars = content.length;
  const attachmentChars = attachments?.reduce((sum, a) => sum + (a.content?.length || 0), 0) || 0;
  const estimatedCompletion = Math.max(10, Math.round((contentChars + attachmentChars) / 4));

  if (typeof totalTokens === 'number' && totalTokens > 0) {
    // If telemetry or orchestrator provided an explicit token count:
    const completionTokens = Math.min(totalTokens, Math.max(10, Math.min(estimatedCompletion, Math.round(totalTokens * 0.75))));
    const promptTokens = Math.max(0, totalTokens - completionTokens);
    return {
      promptTokens,
      completionTokens,
      totalTokens
    };
  }

  // If unrecorded, estimate prompt context from typical turn expansion (1.5x completion)
  const promptTokens = Math.round(estimatedCompletion * 1.5);
  const total = promptTokens + estimatedCompletion;
  return {
    promptTokens,
    completionTokens: estimatedCompletion,
    totalTokens: total
  };
}

/**
 * Calculates estimated USD cost for a turn given prompt and completion tokens.
 */
export function calculateTurnCost(
  promptTokens: number,
  completionTokens: number,
  pricing: ModelPricing
): number {
  const inputCost = (promptTokens * pricing.inputCostPer1M) / 1_000_000;
  const outputCost = (completionTokens * pricing.outputCostPer1M) / 1_000_000;
  return inputCost + outputCost;
}

/**
 * Individual model usage aggregation
 */
export interface ModelUsageStats {
  modelId: string;
  modelName: string;
  provider: ProviderId | string;
  turns: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  avgLatencyMs: number;
  latenciesCount: number;
  estimatedCostUsd: number;
  pricing: ModelPricing;
}

/**
 * Provider-level grouping
 */
export interface ProviderUsageStats {
  provider: ProviderId | string;
  providerName: string;
  turns: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  avgLatencyMs: number;
  latenciesCount: number;
  estimatedCostUsd: number;
  models: ModelUsageStats[];
}

/**
 * Overall Cross-Provider Aggregation Result
 */
export interface AggregatedAnalytics {
  totalEstimatedCostUsd: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalTurns: number;
  avgLatencyMs: number;
  totalLatencyRecordedTurns: number;
  discussionTurns: number;
  boardTurns: number;
  generalChatTurns: number;
  byProvider: ProviderUsageStats[];
  byModel: ModelUsageStats[];
}

export interface CalculateUsageParams {
  discussionMessages?: DiscussionMessage[];
  boardPosts?: BoardPost[];
  agents?: Agent[];
  generalMessages?: Message[];
}

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openrouter: 'OpenRouter (Universal)',
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  groq: 'Groq (Ultra-Fast)',
  unknown: 'Other Providers'
};

/**
 * Pure calculation function to aggregate usage across discussion messages, board posts, and agents.
 */
export function calculateUsageAnalytics(params: CalculateUsageParams): AggregatedAnalytics {
  const { discussionMessages = [], boardPosts = [], agents = [], generalMessages = [] } = params;

  const agentMap = new Map<string, Agent>();
  for (const a of agents) {
    agentMap.set(a.id, a);
  }

  const modelStatsMap = new Map<string, ModelUsageStats>();

  let discussionTurns = 0;
  let boardTurns = 0;
  let generalChatTurns = 0;

  // 1. Process db.discussionMessages (agent responses only)
  for (const msg of discussionMessages) {
    if (msg.senderType !== 'agent') continue;
    discussionTurns++;

    const agent = agentMap.get(msg.senderId);
    const provider = (msg.telemetry?.provider || agent?.provider || 'openrouter') as ProviderId;
    const modelId = msg.telemetry?.model || msg.modelUsed || agent?.model || 'openrouter/free';
    const pricing = getModelPricing(modelId, provider);

    const tokens = msg.telemetry?.tokensUsed;
    const split = estimateTokenSplit(tokens, msg.content, msg.attachments);
    const turnCost = calculateTurnCost(split.promptTokens, split.completionTokens, pricing);
    const latencyMs = msg.telemetry?.latencyMs;

    const groupKey = `${provider}::${modelId}`;
    let stat = modelStatsMap.get(groupKey);
    if (!stat) {
      stat = {
        modelId,
        modelName: pricing.name,
        provider,
        turns: 0,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        avgLatencyMs: 0,
        latenciesCount: 0,
        estimatedCostUsd: 0,
        pricing
      };
      modelStatsMap.set(groupKey, stat);
    }

    stat.turns += 1;
    stat.totalTokens += split.totalTokens;
    stat.promptTokens += split.promptTokens;
    stat.completionTokens += split.completionTokens;
    stat.estimatedCostUsd += turnCost;

    if (typeof latencyMs === 'number' && latencyMs > 0) {
      const currentSum = stat.avgLatencyMs * stat.latenciesCount;
      stat.latenciesCount += 1;
      stat.avgLatencyMs = (currentSum + latencyMs) / stat.latenciesCount;
    }
  }

  // 2. Process db.boardPosts (agent posts only)
  for (const post of boardPosts) {
    if (post.agentId === 'user' || post.agentId === 'system') continue;
    boardTurns++;

    const agent = agentMap.get(post.agentId);
    const provider = (agent?.provider || 'openrouter') as ProviderId;
    const modelId = agent?.model || 'openrouter/free';
    const pricing = getModelPricing(modelId, provider);

    const tokens = post.tokensUsed;
    const split = estimateTokenSplit(tokens, post.content);
    const turnCost = calculateTurnCost(split.promptTokens, split.completionTokens, pricing);

    const groupKey = `${provider}::${modelId}`;
    let stat = modelStatsMap.get(groupKey);
    if (!stat) {
      stat = {
        modelId,
        modelName: pricing.name,
        provider,
        turns: 0,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        avgLatencyMs: 0,
        latenciesCount: 0,
        estimatedCostUsd: 0,
        pricing
      };
      modelStatsMap.set(groupKey, stat);
    }

    stat.turns += 1;
    stat.totalTokens += split.totalTokens;
    stat.promptTokens += split.promptTokens;
    stat.completionTokens += split.completionTokens;
    stat.estimatedCostUsd += turnCost;
  }

  // 3. Process db.messages (general chat agent messages, if present)
  for (const msg of generalMessages) {
    if (msg.senderType !== 'agent') continue;
    generalChatTurns++;

    const agent = agentMap.get(msg.senderId);
    const provider = (agent?.provider || 'openrouter') as ProviderId;
    const modelId = msg.modelUsed || agent?.model || 'openrouter/free';
    const pricing = getModelPricing(modelId, provider);

    const split = estimateTokenSplit(undefined, msg.content);
    const turnCost = calculateTurnCost(split.promptTokens, split.completionTokens, pricing);

    const groupKey = `${provider}::${modelId}`;
    let stat = modelStatsMap.get(groupKey);
    if (!stat) {
      stat = {
        modelId,
        modelName: pricing.name,
        provider,
        turns: 0,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        avgLatencyMs: 0,
        latenciesCount: 0,
        estimatedCostUsd: 0,
        pricing
      };
      modelStatsMap.set(groupKey, stat);
    }

    stat.turns += 1;
    stat.totalTokens += split.totalTokens;
    stat.promptTokens += split.promptTokens;
    stat.completionTokens += split.completionTokens;
    stat.estimatedCostUsd += turnCost;
  }

  // Sort model stats by estimatedCostUsd descending, then totalTokens
  const byModel = Array.from(modelStatsMap.values()).sort((a, b) => {
    if (b.estimatedCostUsd !== a.estimatedCostUsd) {
      return b.estimatedCostUsd - a.estimatedCostUsd;
    }
    return b.totalTokens - a.totalTokens;
  });

  // Group by Provider
  const providerGroupsMap = new Map<string, ProviderUsageStats>();
  for (const m of byModel) {
    const provKey = String(m.provider);
    let pGroup = providerGroupsMap.get(provKey);
    if (!pGroup) {
      pGroup = {
        provider: m.provider,
        providerName: PROVIDER_DISPLAY_NAMES[provKey] || provKey.toUpperCase(),
        turns: 0,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        avgLatencyMs: 0,
        latenciesCount: 0,
        estimatedCostUsd: 0,
        models: []
      };
      providerGroupsMap.set(provKey, pGroup);
    }

    pGroup.turns += m.turns;
    pGroup.totalTokens += m.totalTokens;
    pGroup.promptTokens += m.promptTokens;
    pGroup.completionTokens += m.completionTokens;
    pGroup.estimatedCostUsd += m.estimatedCostUsd;
    pGroup.models.push(m);

    if (m.latenciesCount > 0) {
      const existingSum = pGroup.avgLatencyMs * pGroup.latenciesCount;
      const modelSum = m.avgLatencyMs * m.latenciesCount;
      pGroup.latenciesCount += m.latenciesCount;
      pGroup.avgLatencyMs = (existingSum + modelSum) / pGroup.latenciesCount;
    }
  }

  const byProvider = Array.from(providerGroupsMap.values()).sort((a, b) => {
    if (b.estimatedCostUsd !== a.estimatedCostUsd) {
      return b.estimatedCostUsd - a.estimatedCostUsd;
    }
    return b.totalTokens - a.totalTokens;
  });

  // Calculate overall aggregates
  let totalEstimatedCostUsd = 0;
  let totalTokens = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTurns = 0;
  let totalLatencySum = 0;
  let totalLatencyRecordedTurns = 0;

  for (const m of byModel) {
    totalEstimatedCostUsd += m.estimatedCostUsd;
    totalTokens += m.totalTokens;
    promptTokens += m.promptTokens;
    completionTokens += m.completionTokens;
    totalTurns += m.turns;
    if (m.latenciesCount > 0) {
      totalLatencySum += m.avgLatencyMs * m.latenciesCount;
      totalLatencyRecordedTurns += m.latenciesCount;
    }
  }

  const avgLatencyMs =
    totalLatencyRecordedTurns > 0 ? totalLatencySum / totalLatencyRecordedTurns : 0;

  return {
    totalEstimatedCostUsd,
    totalTokens,
    promptTokens,
    completionTokens,
    totalTurns,
    avgLatencyMs,
    totalLatencyRecordedTurns,
    discussionTurns,
    boardTurns,
    generalChatTurns,
    byProvider,
    byModel
  };
}

/**
 * Convenience asynchronous aggregator querying Dexie tables directly.
 */
export async function getAggregatedUsage(): Promise<AggregatedAnalytics> {
  const [discussionMessages, boardPosts, agents, generalMessages] = await Promise.all([
    db.discussionMessages.toArray(),
    db.boardPosts.toArray(),
    db.agents.toArray(),
    db.messages.toArray()
  ]);

  return calculateUsageAnalytics({
    discussionMessages,
    boardPosts,
    agents,
    generalMessages
  });
}

/**
 * Format currency in USD. Automatically uses 4 decimals for fractional cents, 2 decimals otherwise.
 */
export function formatUsd(amount: number): string {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) {
    return `$${amount.toFixed(4)}`;
  }
  return `$${amount.toFixed(2)}`;
}

/**
 * Format integer numbers with commas.
 */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString();
}

/**
 * Format latency cleanly in milliseconds or seconds.
 */
export function formatLatency(ms: number): string {
  if (!ms || ms <= 0) return '—';
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Format model pricing rate card string (e.g. "$0.14 / $0.28 per 1M")
 */
export function formatPricingRate(pricing: ModelPricing): string {
  if (pricing.inputCostPer1M === 0 && pricing.outputCostPer1M === 0) {
    return 'Free Tier';
  }
  return `$${pricing.inputCostPer1M.toFixed(2)} / $${pricing.outputCostPer1M.toFixed(2)} (1M)`;
}
