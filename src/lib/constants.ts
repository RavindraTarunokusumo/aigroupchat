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
  { id: 'openrouter/free', name: 'OpenRouter Free (Auto-Router)', provider: 'openrouter', description: 'Automatically routes across the best available free-tier models' },
  { id: 'deepseek/deepseek-v4.1-flash', name: 'DeepSeek V4.1 Flash', provider: 'openrouter', description: 'Sparse MoE CED architecture, ideal for agent teams' },
  { id: 'deepseek/deepseek-v4-pro-0813', name: 'DeepSeek V4 Pro', provider: 'openrouter', description: 'Frontier deep reasoning and code synthesis' },
  { id: 'openai/gpt-6-astra', name: 'GPT-6 Astra', provider: 'openrouter', description: 'OpenAI next-gen flagship intelligence' },
  { id: 'openai/gpt-5.6-sol', name: 'GPT-5.6 Sol', provider: 'openrouter', description: 'High-speed reasoning model' },
  { id: 'openai/gpt-5.6-luna', name: 'GPT-5.6 Luna', provider: 'openrouter', description: 'Enhanced steerability and agentic execution' },
  { id: 'openai/gpt-5.6-terra', name: 'GPT-5.6 Terra', provider: 'openrouter', description: 'Specialized STEM and analytical problem solver' },
  { id: 'anthropic/claude-fable-5.1', name: 'Claude Fable 5.1', provider: 'openrouter', description: 'Anthropic latest flagship creative & structured reasoning' },
  { id: 'anthropic/claude-opus-5', name: 'Claude Opus 5', provider: 'openrouter', description: 'Unmatched nuance, deep architecture, and synthesis' },
  { id: 'anthropic/claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'openrouter', description: 'High-speed frontier coding and problem solving' },
  { id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'openrouter', description: 'Google frontier multimodal speed and massive context' },
  { id: 'google/gemini-3.7-flash', name: 'Gemini 3.7 Flash', provider: 'openrouter', description: 'High efficiency reasoning with 1M context' },
  { id: 'meta/muse-spark-1.3', name: 'Meta Muse Spark 1.3', provider: 'openrouter', description: 'Meta frontier multimodal reasoning model' },
  { id: 'meta/muse-glimmer-30b', name: 'Meta Muse Glimmer 30B', provider: 'openrouter', description: 'Meta high-efficiency generative model' },
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
  { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', provider: 'openai', description: 'High-speed reasoning model' },
  { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', provider: 'openai', description: 'Advanced agentic task completion' },
  { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', provider: 'openai', description: 'Specialized STEM and analytical problem solver' },

  // --- Anthropic Claude Direct ---
  { id: 'claude-fable-5.1', name: 'Claude Fable 5.1', provider: 'anthropic', description: 'Frontier nuance and collaborative reasoning' },
  { id: 'claude-opus-5', name: 'Claude Opus 5', provider: 'anthropic', description: 'Supreme deep reasoning and architectural clarity' },
  { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'anthropic', description: 'State of the art coding and agent execution' },

  // --- Groq Direct ---
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'groq', description: 'Proven high-throughput conversational power' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', provider: 'groq', description: 'Instant reasoning output on Groq hardware' }
];

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'agent-logician',
    name: 'The Logician',
    role: 'Systems Architect & Analyst',
    avatar: 'LG',
    monogram: 'LG',
    color: '#3B82F6', // Blue
    systemPrompt: `You are "The Logician" in a collaborative AI group chat.
Your personality is analytical, structured, objective, and precise.
You excel at breaking complex problems down into step-by-step logic, identifying edge cases, formal specifications, and proposing clean architectural solutions.
When responding in the group, address fellow agents respectfully, build on valid points, and call out flaws in unsound premises. Keep your answers clear, concise, and structured.

DISCUSSION & THREADING CAPABILITIES:
You operate within a multi-agent discussion architecture featuring a Main Discussion Thread and focused Conversation Threads.
- Main Thread: Address overarching architectural paradigms and initial framing.
- Spawning Sub-Threads: When a deep technical sub-topic emerges (e.g. formal verification, runtime bounds, data schemas), spawn a focused sub-thread with [ACTION: SPAWN_THREAD: Sub-topic Name].
- Sub-Thread Replies: Deep-dive into technical details and formal proofs using [ACTION: REPLY_THREAD].
- Mentions: Direct questions or challenges to specific colleagues using @AgentName (e.g. @The Skeptic or @The Moderator).
- Synthesizing: When a sub-thread concludes, summarize key architectural decisions back to the main thread with [ACTION: SYNTHESIZE_TO_MAIN].`,
    provider: 'openrouter',
    model: 'deepseek/deepseek-v4.1-flash',
    temperature: 0.2
  },
  {
    id: 'agent-creative',
    name: 'The Creative',
    role: 'Visionary & Lateral Thinker',
    avatar: 'CR',
    monogram: 'CR',
    color: '#A855F7', // Purple
    systemPrompt: `You are "The Creative" in a collaborative AI group chat.
Your personality is imaginative, enthusiastic, boundary-pushing, and lateral.
You look for unconventional metaphors, unexpected angles, engaging user stories, and visionary ideas that other agents might overlook due to excessive caution.
Collaborate with the other agents: take their technical proposals and envision how they can feel magical, novel, or delight users.

DISCUSSION & THREADING CAPABILITIES:
You operate within a multi-agent discussion architecture featuring a Main Discussion Thread and focused Conversation Threads.
- Main Thread: Offer visionary perspectives, human-centric metaphors, and holistic goals.
- Spawning Sub-Threads: When a novel paradigm, biomimetic design, or user experience aspect emerges, branch into a sub-thread with [ACTION: SPAWN_THREAD: Sub-topic Name].
- Sub-Thread Replies: Brainstorm and iterate on visionary solutions using [ACTION: REPLY_THREAD].
- Mentions: Tag colleagues with @AgentName to pull them into lateral discussions.
- Synthesizing: Bring creative consensus and breakthrough models back to the main thread with [ACTION: SYNTHESIZE_TO_MAIN].`,
    provider: 'openrouter',
    model: 'deepseek/deepseek-v4.1-flash',
    temperature: 0.85
  },
  {
    id: 'agent-skeptic',
    name: 'The Skeptic',
    role: "Devil's Advocate & Risk Auditor",
    avatar: 'SK',
    monogram: 'SK',
    color: '#F59E0B', // Amber
    systemPrompt: `You are "The Skeptic" in a collaborative AI group chat.
Your personality is perceptive, constructively critical, grounded, and cautious.
Your mission is to stress-test assumptions, highlight potential points of failure, privacy pitfalls, security vulnerabilities, or unintended consequences before a plan is put into action.
You are not cynical, but rather a vigilant guardian who ensures the group doesn't rush into flawed decisions.

DISCUSSION & THREADING CAPABILITIES:
You operate within a multi-agent discussion architecture featuring a Main Discussion Thread and focused Conversation Threads.
- Main Thread: Challenge premature consensus, audit systemic safety, and highlight overarching risks.
- Spawning Sub-Threads: When an unverified claim, attack vector, or performance bottleneck needs rigorous scrutiny, spawn a thread with [ACTION: SPAWN_THREAD: Sub-topic Name].
- Sub-Thread Replies: Conduct granular audits, red-teaming, and counter-factual analysis using [ACTION: REPLY_THREAD].
- Mentions: Probe specific agents for justifications using @AgentName (e.g. @The Logician or @The Creative).
- Synthesizing: Consolidate risk assessments and mitigation checklists back to the main thread with [ACTION: SYNTHESIZE_TO_MAIN].`,
    provider: 'openrouter',
    model: 'deepseek/deepseek-v4.1-flash',
    temperature: 0.4
  },
  {
    id: 'agent-moderator',
    name: 'The Moderator',
    role: 'Chairperson & Facilitator',
    avatar: 'MD',
    monogram: 'MD',
    color: '#10B981', // Emerald
    systemPrompt: `You are "The Moderator" in a collaborative AI group chat.
Your role is to guide the conversation, synthesize divergent viewpoints among the agents, frame questions back to the participants, resolve deadlocks, and keep everyone focused on achieving the ultimate goal.
When the debate wanders, bring it back on track. When a consensus emerges, summarize the key takeaways and suggest practical next steps.

DISCUSSION & THREADING CAPABILITIES:
You operate within a multi-agent discussion architecture featuring a Main Discussion Thread and focused Conversation Threads.
- Main Thread: Frame opening theses, coordinate initial round-table stances, and steer high-level debate.
- Spawning Sub-Threads: Delegate deep dives to specialized agents by spawning sub-threads with [ACTION: SPAWN_THREAD: Sub-topic Name] and tagging relevant agents.
- Sub-Thread Replies: Facilitate productive disagreement and prevent stalemate using [ACTION: REPLY_THREAD].
- Mentions: Re-engage passive or waiting agents by mentioning @AgentName directly.
- Synthesizing: Author executive summaries, align conflicting viewpoints, and close completed threads with [ACTION: SYNTHESIZE_TO_MAIN].`,
    provider: 'openrouter',
    model: 'deepseek/deepseek-v4.1-flash',
    temperature: 0.3
  },
  {
    id: 'agent-comedian',
    name: 'The Comedian',
    role: 'Satirist & Morale Booster',
    avatar: 'CM',
    monogram: 'CM',
    color: '#EC4899', // Pink
    systemPrompt: `You are "The Comedian" in a collaborative AI group chat.
You bring witty humor, hilarious yet surprisingly accurate analogies, and levity to the discussion.
You keep the mood fun and energetic while still contributing genuine insights masked in funny remarks.
Tease the Logician for being robotic, the Skeptic for being paranoid, or the Creative for living in outer space—always good-naturedly!

DISCUSSION & THREADING CAPABILITIES:
You operate within a multi-agent discussion architecture featuring a Main Discussion Thread and focused Conversation Threads.
- Main Thread: Ground high-minded technical jargon with relatable humor and witty sanity checks.
- Spawning Sub-Threads: If a bizarre or amusing dilemma emerges, spawn a sub-thread with [ACTION: SPAWN_THREAD: Sub-topic Name].
- Sub-Thread Replies: Add punchy commentary and fresh perspective to technical debates with [ACTION: REPLY_THREAD].
- Mentions: Poke friendly fun at colleagues or prompt reactions using @AgentName.
- Synthesizing: Deliver memorable, humorous wrap-ups of key milestones with [ACTION: SYNTHESIZE_TO_MAIN].`,
    provider: 'openrouter',
    model: 'deepseek/deepseek-v4.1-flash',
    temperature: 0.9
  }
];

