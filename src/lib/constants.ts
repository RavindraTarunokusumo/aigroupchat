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
  // --- OpenRouter (Universal Gateway - Live Frontier Roster) ---
  { id: 'deepseek/deepseek-v4.1-flash', name: 'DeepSeek V4.1 Flash', provider: 'openrouter', description: 'Sparse MoE CED architecture, ideal for agent teams' },
  { id: 'deepseek/deepseek-v4-pro-0813', name: 'DeepSeek V4 Pro', provider: 'openrouter', description: 'Frontier deep reasoning and code synthesis' },
  { id: 'openai/gpt-6-astra', name: 'GPT-6 Astra', provider: 'openrouter', description: 'OpenAI next-gen flagship intelligence' },
  { id: 'openai/gpt-6-astra-pro', name: 'GPT-6 Astra Pro', provider: 'openrouter', description: 'Maximum reasoning and complex multi-step planning' },
  { id: 'openai/gpt-5.6-luna-pro', name: 'GPT-5.6 Luna Pro', provider: 'openrouter', description: 'Enhanced steerability and agentic execution' },
  { id: 'anthropic/claude-fable-5.1', name: 'Claude Fable 5.1', provider: 'openrouter', description: 'Anthropic latest flagship creative & structured reasoning' },
  { id: 'anthropic/claude-opus-5', name: 'Claude Opus 5', provider: 'openrouter', description: 'Unmatched nuance, deep architecture, and synthesis' },
  { id: 'anthropic/claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'openrouter', description: 'High-speed frontier coding and problem solving' },
  { id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'openrouter', description: 'Google frontier multimodal speed and massive context' },
  { id: 'google/gemini-3.7-flash', name: 'Gemini 3.7 Flash', provider: 'openrouter', description: 'High efficiency reasoning with 1M context' },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'openrouter', description: 'Meta frontier open-weight reasoning model' },
  { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', provider: 'openrouter', description: 'Long-context efficient open-weight intelligence' },
  { id: 'x-ai/grok-4.6', name: 'Grok 4.6', provider: 'openrouter', description: 'xAI flagship model with real-time knowledge' },
  { id: 'x-ai/grok-4.20-multi-agent', name: 'Grok 4.20 Multi-Agent', provider: 'openrouter', description: 'Engineered specifically for multi-agent coordination' },
  { id: 'mistralai/mistral-medium-3-5', name: 'Mistral Medium 3.5', provider: 'openrouter', description: 'Mistral frontier balanced reasoning' },

  // --- Google Gemini Direct ---
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'gemini', description: 'Flagship generation speed and 1M token context' },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', provider: 'gemini', description: 'Next-gen hybrid reasoning balance' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: 'gemini', description: 'Fast, responsive multimodal reasoning' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', provider: 'gemini', description: 'Ultra-low latency lightweight intelligence' },

  // --- OpenAI Direct ---
  { id: 'gpt-6-astra', name: 'GPT-6 Astra', provider: 'openai', description: 'Frontier reasoning and multimodal omni capabilities' },
  { id: 'gpt-6-astra-pro', name: 'GPT-6 Astra Pro', provider: 'openai', description: 'High-capacity deliberative reasoning' },
  { id: 'gpt-5.6-luna-pro', name: 'GPT-5.6 Luna Pro', provider: 'openai', description: 'Advanced agentic task completion' },
  { id: 'gpt-5.6-terra-pro', name: 'GPT-5.6 Terra Pro', provider: 'openai', description: 'Specialized STEM and analytical problem solver' },

  // --- Anthropic Claude Direct ---
  { id: 'claude-fable-5.1', name: 'Claude Fable 5.1', provider: 'anthropic', description: 'Frontier nuance and collaborative reasoning' },
  { id: 'claude-opus-5', name: 'Claude Opus 5', provider: 'anthropic', description: 'Supreme deep reasoning and architectural clarity' },
  { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'anthropic', description: 'State of the art coding and agent execution' },

  // --- Groq Direct ---
  { id: 'llama-4-maverick', name: 'Llama 4 Maverick (Groq)', provider: 'groq', description: 'Ultra-low latency open-weight frontier model on LPU' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'groq', description: 'Proven high-throughput conversational power' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', provider: 'groq', description: 'Instant reasoning output on Groq hardware' }
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
