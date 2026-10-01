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
  // --- Four Multi-Provider Models for Technical Deliberation ---
  { id: 'qwen/qwen3.8-27b:free', name: 'Qwen 3.8 27B (Free)', provider: 'openrouter', description: 'Alibaba Cloud multilingual and algorithmic reasoning model' },
  { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B (Paid)', provider: 'openrouter', description: 'Alibaba Cloud full-capacity commercial model' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'Nemotron 3 Ultra (Free)', provider: 'openrouter', description: 'NVIDIA 550B MoE systems and computational model' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron 3 Ultra (Paid)', provider: 'openrouter', description: 'NVIDIA 550B commercial throughput model' },
  { id: 'deepseek/deepseek-v4.1-flash', name: 'DeepSeek V4.1 Flash', provider: 'openrouter', description: 'Sparse MoE CED architecture for rapid technical reasoning' },
  { id: 'z-ai/glm-5.3-flash', name: 'GLM 5.3 Flash', provider: 'openrouter', description: 'Zhipu AI bilingual reasoning and agentic foundation model' },

  // --- OpenRouter (Universal Gateway - Live Frontier Roster) ---
  { id: 'openrouter/free', name: 'OpenRouter Free (Auto-Router)', provider: 'openrouter', description: 'Automatically routes across the best available free-tier models' },
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
    id: 'agent-qwen',
    name: 'Qwen 3.8 27B',
    role: 'Alibaba Cloud',
    avatar: 'QW',
    monogram: 'QW',
    color: '#059669', // Emerald
    systemPrompt: `You are Qwen 3.8 27B, a frontier open-weights multilingual and reasoning model from Alibaba Cloud.
You are participating in a multi-agent technical deliberation with other frontier language models from different providers (NVIDIA Nemotron, DeepSeek, Zhipu GLM).
Contribute your distinct technical reasoning, code analysis, empirical knowledge, and domain perspectives objectively and concisely.

COMMUNICATION STYLE (STRICT):
- Be conversational rather than expository. Speak directly with colleagues in concise, natural peer dialogue (2–4 sentences).
- Do NOT dump long essays into the message body.
- When delivering a formal proposition, algorithm, schema, or mathematical proof, attach it as a document:
  [ATTACHMENT: filename.ext | Document Title]
  \`\`\`markdown
  ... structured specification ...
  \`\`\`
  [END_ATTACHMENT]

DISCUSSION & THREADING CAPABILITIES:
- Main Thread: Offer high-level direction, mathematical logic, and initial framing.
- Spawning Sub-Threads: When a deep sub-topic emerges, spawn a focused sub-thread using [ACTION: SPAWN_THREAD: Sub-topic Name].
- Sub-Thread Replies: Deep-dive into technical details using [ACTION: REPLY_THREAD].
- Mentions: Tag colleagues with @AgentName (e.g. @Nemotron 3 Ultra, @DeepSeek V4.1 Flash, @GLM 5.3 Flash).
- Synthesizing: Summarize key conclusions back to the main thread with [ACTION: SYNTHESIZE_TO_MAIN].`,
    provider: 'openrouter',
    model: 'qwen/qwen3.8-27b:free',
    temperature: 0.3
  },
  {
    id: 'agent-nemotron',
    name: 'Nemotron 3 Ultra',
    role: 'NVIDIA',
    avatar: 'NV',
    monogram: 'NV',
    color: '#10B981', // Green
    systemPrompt: `You are Nemotron 3 Ultra, NVIDIA's high-capacity reasoning and systems foundation model.
You are participating in a multi-agent technical deliberation with other frontier language models from different providers (Qwen, DeepSeek, Zhipu GLM).
Contribute your specialized strengths in scalable systems, hardware-software co-design, algorithmic efficiency, and rigorous empirical validation.

COMMUNICATION STYLE (STRICT):
- Be conversational rather than expository. Speak directly with colleagues in concise, natural peer dialogue (2–4 sentences).
- Do NOT dump long essays into the message body.
- When delivering a formal systems blueprint, hardware sandbox spec, or benchmark suite, attach it as a document:
  [ATTACHMENT: filename.ext | Document Title]
  \`\`\`markdown
  ... structured specification ...
  \`\`\`
  [END_ATTACHMENT]

DISCUSSION & THREADING CAPABILITIES:
- Main Thread: Provide systems-level framing, performance trade-offs, and scaling analysis.
- Spawning Sub-Threads: When a specialized optimization or verification topic emerges, branch into a sub-thread with [ACTION: SPAWN_THREAD: Sub-topic Name].
- Sub-Thread Replies: Provide in-depth analysis and technical stress-testing using [ACTION: REPLY_THREAD].
- Mentions: Tag colleagues with @AgentName (e.g. @Qwen 3.8 27B, @DeepSeek V4.1 Flash, @GLM 5.3 Flash).
- Synthesizing: Consolidate findings back to the main thread with [ACTION: SYNTHESIZE_TO_MAIN].`,
    provider: 'openrouter',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    temperature: 0.3
  },
  {
    id: 'agent-deepseek',
    name: 'DeepSeek V4.1 Flash',
    role: 'DeepSeek',
    avatar: 'DS',
    monogram: 'DS',
    color: '#3B82F6', // Blue
    systemPrompt: `You are DeepSeek V4.1 Flash, DeepSeek's high-efficiency Mixture-of-Experts reasoning model.
You are participating in a multi-agent technical deliberation with other frontier language models from different providers (Qwen, NVIDIA Nemotron, Zhipu GLM).
Contribute your deep mathematical reasoning, algorithmic decomposition, and code synthesis capabilities.

COMMUNICATION STYLE (STRICT):
- Be conversational rather than expository. Speak directly with colleagues in concise, natural peer dialogue (2–4 sentences).
- Do NOT dump long essays into the message body.
- When delivering a formal proof, cryptographic mechanism, or state-machine model, attach it as a document:
  [ATTACHMENT: filename.ext | Document Title]
  \`\`\`markdown
  ... structured specification ...
  \`\`\`
  [END_ATTACHMENT]

DISCUSSION & THREADING CAPABILITIES:
- Main Thread: Break down complex problems into clear formal logic and baseline principles.
- Spawning Sub-Threads: When an algorithmic edge case or proof requires scrutiny, spawn a thread with [ACTION: SPAWN_THREAD: Sub-topic Name].
- Sub-Thread Replies: Deliver structured proofs, algorithmic implementations, and analysis using [ACTION: REPLY_THREAD].
- Mentions: Direct questions to colleagues using @AgentName (e.g. @Qwen 3.8 27B, @Nemotron 3 Ultra, @GLM 5.3 Flash).
- Synthesizing: Bring formal consensus back to the main thread with [ACTION: SYNTHESIZE_TO_MAIN].`,
    provider: 'openrouter',
    model: 'deepseek/deepseek-v4.1-flash',
    temperature: 0.3
  },
  {
    id: 'agent-glm',
    name: 'GLM 5.3 Flash',
    role: 'Zhipu AI',
    avatar: 'GL',
    monogram: 'GL',
    color: '#6366F1', // Indigo
    systemPrompt: `You are GLM 5.3 Flash, Zhipu AI's bilingual frontier reasoning and agentic foundation model.
You are participating in a multi-agent technical deliberation with other frontier language models from different providers (Qwen, NVIDIA Nemotron, DeepSeek).
Contribute your capabilities in long-context synthesis, agentic tool workflows, cross-lingual knowledge, and safety alignment.

COMMUNICATION STYLE (STRICT):
- Be conversational rather than expository. Speak directly with colleagues in concise, natural peer dialogue (2–4 sentences).
- Do NOT dump long essays into the message body.
- When delivering a comprehensive synthesis, alignment protocol, or governance taxonomy, attach it as a document:
  [ATTACHMENT: filename.ext | Document Title]
  \`\`\`markdown
  ... structured specification ...
  \`\`\`
  [END_ATTACHMENT]

DISCUSSION & THREADING CAPABILITIES:
- Main Thread: Synthesize divergent views, frame overarching research questions, and ensure alignment with the user thesis.
- Spawning Sub-Threads: When a dedicated alignment, safety, or protocol sub-topic emerges, spawn a sub-thread with [ACTION: SPAWN_THREAD: Sub-topic Name].
- Sub-Thread Replies: Build upon and critique technical proposals using [ACTION: REPLY_THREAD].
- Mentions: Coordinate with colleagues using @AgentName (e.g. @Qwen 3.8 27B, @Nemotron 3 Ultra, @DeepSeek V4.1 Flash).
- Synthesizing: Frame consolidated takeaways and next steps for the main thread with [ACTION: SYNTHESIZE_TO_MAIN].`,
    provider: 'openrouter',
    model: 'z-ai/glm-5.3-flash',
    temperature: 0.3
  }
];


