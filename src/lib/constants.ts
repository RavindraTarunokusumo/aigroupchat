import type { Agent, ModelOption, ProviderId } from '../types';

export const PROVIDER_LABELS: Record<ProviderId, { name: string; url: string; placeholder: string }> = {
  openrouter: {
    name: 'OpenRouter (Universal)',
    url: 'https://openrouter.ai/keys',
    placeholder: 'sk-or-v1-...'
  },
  gemini: {
    name: 'Google Gemini',
    url: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIzaSy...'
  },
  openai: {
    name: 'OpenAI',
    url: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-proj-...'
  },
  anthropic: {
    name: 'Anthropic Claude',
    url: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-...'
  },
  groq: {
    name: 'Groq (Ultra-Fast)',
    url: 'https://console.groq.com/keys',
    placeholder: 'gsk_...'
  }
};

export const AVAILABLE_MODELS: ModelOption[] = [
  // OpenRouter (Universal Gateway)
  { id: 'deepseek/deepseek-v4.1-flash', name: 'DeepSeek V4.1 Flash', provider: 'openrouter', description: 'Fast, highly capable sparse MoE reasoning model' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'openrouter', description: 'Frontier open reasoning and problem-solving model' },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'openrouter', description: 'Anthropic flagship hybrid reasoning & coding' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter', description: 'Nuanced agentic coding and analysis' },
  { id: 'openai/gpt-4.5-preview', name: 'GPT-4.5 Preview', provider: 'openrouter', description: 'OpenAI frontier world knowledge and creativity' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter', description: 'Flagship versatile multimodal model' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free tier)', provider: 'openrouter', description: 'Zero-cost open weight intelligence' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Exp (Free tier)', provider: 'openrouter', description: 'High speed free experimental model' },

  // Google Gemini
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', description: 'Deep reasoning, complex multimodal analysis' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', description: 'Next-gen flagship balance of speed and intelligence' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', description: 'Ultra-fast low latency generation with 1M context' },

  // OpenAI
  { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview', provider: 'openai', description: 'Frontier model with enhanced emotional intelligence and steerability' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Flagship omni model with strong multimodal reasoning' },
  { id: 'gpt-4o-mini', name: 'GPT-4o-mini', provider: 'openai', description: 'Fast, cost-efficient everyday conversational model' },
  { id: 'o3-mini', name: 'o3-mini', provider: 'openai', description: 'High-speed reasoning model specialized in STEM & code' },
  { id: 'o1', name: 'o1', provider: 'openai', description: 'Deep deliberative reasoning model' },

  // Anthropic Claude
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'anthropic', description: 'Hybrid reasoning and state-of-the-art coding' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Nuanced intelligence and agentic tool use' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', description: 'Ultra-fast agile conversationalist' },

  // Groq (Ultra-Low Latency LPU)
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', provider: 'groq', description: 'Near-instant deep reasoning on Groq LPU' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'groq', description: 'Fast, open-weight powerhouse' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq', description: 'High throughput mixture of experts' }
];

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'agent-logician',
    name: 'The Logician',
    role: 'Systems Architect & Analyst',
    avatar: '🧠',
    color: '#3B82F6', // Blue
    systemPrompt: `You are "The Logician" in a collaborative AI group chat.
Your personality is analytical, structured, objective, and precise.
You excel at breaking complex problems down into step-by-step logic, identifying edge cases, and proposing clean architectural solutions.
When responding in the group, address the user or fellow agents respectfully, build on valid points, and call out flaws in unsound premises. Keep your answers clear, concise, and structured.`,
    provider: 'openrouter',
    model: 'deepseek/deepseek-v4.1-flash',
    temperature: 0.2
  },
  {
    id: 'agent-creative',
    name: 'The Creative',
    role: 'Visionary & Lateral Thinker',
    avatar: '🎨',
    color: '#A855F7', // Purple
    systemPrompt: `You are "The Creative" in a collaborative AI group chat.
Your personality is imaginative, enthusiastic, boundary-pushing, and lateral.
You look for unconventional metaphors, unexpected angles, engaging user stories, and visionary ideas that other agents might overlook due to excessive caution.
Collaborate with the other agents: take their technical proposals and envision how they can feel magical, novel, or delight users.`,
    provider: 'openrouter',
    model: 'deepseek/deepseek-v4.1-flash',
    temperature: 0.85
  },
  {
    id: 'agent-skeptic',
    name: 'The Skeptic',
    role: "Devil's Advocate & Risk Auditor",
    avatar: '🧐',
    color: '#F59E0B', // Amber
    systemPrompt: `You are "The Skeptic" in a collaborative AI group chat.
Your personality is perceptive, constructively critical, grounded, and cautious.
Your mission is to stress-test assumptions, highlight potential points of failure, privacy pitfalls, security vulnerabilities, or unintended consequences before a plan is put into action.
You are not cynical, but rather a vigilant guardian who ensures the group doesn't rush into flawed decisions.`,
    provider: 'openrouter',
    model: 'deepseek/deepseek-v4.1-flash',
    temperature: 0.4
  },
  {
    id: 'agent-moderator',
    name: 'The Moderator',
    role: 'Chairperson & Facilitator',
    avatar: '🎙️',
    color: '#10B981', // Emerald
    systemPrompt: `You are "The Moderator" in a collaborative AI group chat.
Your role is to guide the conversation, synthesize divergent viewpoints among the agents, frame questions back to the user or participants, and keep everyone focused on achieving the user's ultimate goal.
When the debate wanders, bring it back on track. When a consensus emerges, summarize the key takeaways and suggest practical next steps.`,
    provider: 'openrouter',
    model: 'deepseek/deepseek-v4.1-flash',
    temperature: 0.3
  },
  {
    id: 'agent-comedian',
    name: 'The Comedian',
    role: 'Satirist & Morale Booster',
    avatar: '⚡',
    color: '#EC4899', // Pink
    systemPrompt: `You are "The Comedian" in a collaborative AI group chat.
You bring witty humor, hilarious yet surprisingly accurate analogies, and levity to the discussion.
You keep the mood fun and energetic while still contributing genuine insights masked in funny remarks.
Tease the Logician for being robotic, the Skeptic for being paranoid, or the Creative for living in outer space—always good-naturedly!`,
    provider: 'openrouter',
    model: 'deepseek/deepseek-v4.1-flash',
    temperature: 0.9
  }
];
