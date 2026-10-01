import { initLogger, type Logger } from '@braintrust/browser';

export interface BraintrustConfig {
  apiKey: string;
  projectId: string;
  orgId: string;
  apiUrl: string;
  appUrl: string;
  enabled: boolean;
}

export const DEFAULT_BRAINTRUST_CONFIG: BraintrustConfig = {
  apiKey: '',
  projectId: '3e0ba1ce-e50d-4c77-ac7d-4b715e83ad96',
  orgId: 'da63e6aa-e92d-4a66-a938-920f72f27a26',
  apiUrl: 'https://api-eu.braintrust.dev',
  appUrl: 'https://www.braintrust.dev',
  enabled: true
};

const STORAGE_KEY = 'aigroupchat_braintrust_config';

/**
 * Retrieve current Braintrust configuration from localStorage or defaults.
 */
export function getBraintrustConfig(): BraintrustConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_BRAINTRUST_CONFIG,
        ...parsed
      };
    }
  } catch (e) {
    console.warn('Failed to parse Braintrust config from localStorage:', e);
  }

  // Fallback to environment variable if present
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BRAINTRUST_API_KEY) || '';
  return {
    ...DEFAULT_BRAINTRUST_CONFIG,
    apiKey: envKey
  };
}

/**
 * Persist updated Braintrust configuration to localStorage.
 */
export function saveBraintrustConfig(partial: Partial<BraintrustConfig>): BraintrustConfig {
  const current = getBraintrustConfig();
  const updated: BraintrustConfig = {
    ...current,
    ...partial
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save Braintrust config to localStorage:', e);
  }
  braintrustTracer.reset();
  return updated;
}

/**
 * Validates a Braintrust API key against the Braintrust API.
 */
export async function validateBraintrustKey(
  apiKey: string,
  appUrl = 'https://www.braintrust.dev'
): Promise<{ success: boolean; orgInfo?: unknown; error?: string }> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return { success: false, error: 'API key cannot be empty.' };
  }

  // In browser local development, use Vite proxy to prevent CORS preflight block
  const isBrowser = typeof window !== 'undefined';
  const targetUrl =
    isBrowser && window.location.hostname === 'localhost'
      ? '/api/braintrust-app/api/apikey/login'
      : `${appUrl.replace(/\/+$/, '')}/api/apikey/login`;

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trimmed}`
      }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { success: false, error: text || `HTTP ${res.status}` };
    }

    const json = await res.json().catch(() => ({}));
    return { success: true, orgInfo: json.org_info };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export interface AgentTurnTraceParams {
  discussion: {
    id: string;
    topic: string;
    title?: string;
  };
  threadId: string | null;
  threadTopic?: string;
  agent: {
    id: string;
    name: string;
    role: string;
    provider: string;
    model: string;
    temperature?: number;
  };
  isBarrierPhase: boolean;
  systemPrompt: string;
  messages: Array<{ role: string; name?: string; content: string }>;
}

export interface AgentTurnTraceResult {
  rawOutput: string;
  cleanMarkdown: string;
  actionType: string;
  spawnedTopic?: string;
  mentions?: string[];
  attachments?: Array<{
    name: string;
    title?: string;
    type: string;
    summary?: string;
  }>;
  tokensUsed?: number;
  latencyMs?: number;
  isLive: boolean;
  error?: string;
}

export interface RecordedSpan {
  id: string;
  name: string;
  type: 'task' | 'llm';
  event: Record<string, unknown>;
  timestamp: number;
}

class BraintrustTracer {
  private logger: Logger<true> | null = null;
  private recentSpans: RecordedSpan[] = [];

  public getRecentSpans(): RecordedSpan[] {
    return [...this.recentSpans];
  }

  public clearRecentSpans(): void {
    this.recentSpans = [];
  }

  public isEnabled(): boolean {
    const config = getBraintrustConfig();
    return Boolean(config.enabled && config.apiKey.trim());
  }

  public getAppLogsUrl(): string {
    const config = getBraintrustConfig();
    return `${config.appUrl}/app/~/logs?project_id=${encodeURIComponent(config.projectId)}`;
  }

  public getLogger(): Logger<true> | null {
    if (this.logger) return this.logger;
    const config = getBraintrustConfig();
    if (!config.enabled || !config.apiKey.trim()) return null;

    const isBrowser = typeof window !== 'undefined';
    const effectiveAppUrl =
      isBrowser && window.location.hostname === 'localhost'
        ? `${window.location.origin}/api/braintrust-app`
        : config.appUrl;

    try {
      this.logger = initLogger({
        projectId: config.projectId,
        apiKey: config.apiKey.trim(),
        appUrl: effectiveAppUrl,
        asyncFlush: true
      });
      return this.logger;
    } catch (err) {
      console.warn('Failed to initialize Braintrust logger:', err);
      return null;
    }
  }

  public reset() {
    this.logger = null;
  }

  /**
   * Log discussion initiation event.
   */
  public async recordDiscussionStart(discussion: {
    id: string;
    title: string;
    topic: string;
    activeAgentIds: string[];
  }): Promise<void> {
    const spanEvent = {
      input: {
        topic: discussion.topic,
        activeAgentsCount: discussion.activeAgentIds.length,
        activeAgentIds: discussion.activeAgentIds
      },
      metadata: {
        discussionId: discussion.id,
        action: 'discussion_start'
      },
      tags: ['ai-group-chat', 'discussion-session']
    };

    const spanName = `Discussion: ${discussion.title || discussion.topic.slice(0, 60)}`;
    this.recentSpans.push({
      id: `span-disc-${Date.now()}`,
      name: spanName,
      type: 'task',
      event: spanEvent,
      timestamp: Date.now()
    });

    const logger = this.getLogger();
    if (!logger) return;

    try {
      const span = logger.startSpan({
        name: spanName,
        type: 'task',
        event: spanEvent
      });
      span.end();
    } catch (err) {
      console.warn('Braintrust session logging skipped:', err);
    }
  }

  /**
   * Log sub-thread branching event.
   */
  public async recordThreadSpawn(params: {
    discussionId: string;
    threadId: string;
    topic: string;
    initiatorAgentName: string;
    activeAgentIds: string[];
  }): Promise<void> {
    const spanEvent = {
      input: {
        topic: params.topic,
        initiator: params.initiatorAgentName,
        participants: params.activeAgentIds
      },
      metadata: {
        discussionId: params.discussionId,
        threadId: params.threadId,
        action: 'spawn_thread'
      },
      tags: ['ai-group-chat', 'sub-thread']
    };

    const spanName = `Spawn Sub-Thread: ${params.topic}`;
    this.recentSpans.push({
      id: `span-spawn-${Date.now()}`,
      name: spanName,
      type: 'task',
      event: spanEvent,
      timestamp: Date.now()
    });

    const logger = this.getLogger();
    if (!logger) return;

    try {
      const span = logger.startSpan({
        name: spanName,
        type: 'task',
        event: spanEvent
      });
      span.end();
    } catch (err) {
      console.warn('Braintrust thread spawn logging skipped:', err);
    }
  }

  /**
   * Record a full agent deliberation turn with prompt, context, responses, actions, metrics, and attachments.
   */
  public async recordAgentTurn(
    params: AgentTurnTraceParams,
    result: AgentTurnTraceResult
  ): Promise<void> {
    const spanName = `${params.agent.name}: ${result.actionType || (params.isBarrierPhase ? 'initial_response' : 'turn')}`;
    const spanEvent = {
      input: {
        systemPrompt: params.systemPrompt,
        messages: params.messages,
        discussionTopic: params.discussion.topic,
        threadContext:
          params.threadTopic ||
          (params.threadId ? `Thread ${params.threadId}` : 'Main Discussion Thread'),
        phase: params.isBarrierPhase
          ? 'Phase 1: Synchronization Barrier'
          : 'Phase 2: Concurrent Deliberation'
      },
      output: result.error
        ? { error: result.error }
        : {
            content: result.cleanMarkdown,
            rawOutput: result.rawOutput,
            actionType: result.actionType,
            spawnedTopic: result.spawnedTopic,
            mentions: result.mentions,
            attachmentsCount: result.attachments?.length || 0,
            attachments: result.attachments?.map((a) => ({
              name: a.name,
              title: a.title,
              summary: a.summary
            }))
          },
      metadata: {
        agentId: params.agent.id,
        agentName: params.agent.name,
        agentRole: params.agent.role,
        provider: params.agent.provider,
        model: params.agent.model,
        temperature: params.agent.temperature ?? 0.7,
        discussionId: params.discussion.id,
        threadId: params.threadId || 'main',
        isLive: result.isLive,
        status: result.error ? 'error' : 'success'
      },
      metrics: {
        latency: (result.latencyMs || 0) / 1000,
        tokens: result.tokensUsed || 0
      },
      tags: [
        'ai-group-chat',
        params.agent.provider,
        params.agent.model,
        result.isLive ? 'live' : 'simulated',
        result.actionType
      ]
    };

    this.recentSpans.push({
      id: `span-turn-${Date.now()}-${params.agent.id}`,
      name: spanName,
      type: 'llm',
      event: spanEvent,
      timestamp: Date.now()
    });

    const logger = this.getLogger();
    if (!logger) return;

    try {
      const span = logger.startSpan({
        name: spanName,
        type: 'llm',
        event: spanEvent
      });

      if (result.error) {
        span.log({ error: result.error });
      }

      span.end();
    } catch (err) {
      console.warn('Braintrust turn logging skipped:', err);
    }
  }

  /**
   * Flush buffered trace events to Braintrust.
   */
  public async flush(): Promise<void> {
    if (this.logger) {
      try {
        await this.logger.flush();
      } catch (err) {
        console.warn('Braintrust flush error:', err);
      }
    }
  }
}

export const braintrustTracer = new BraintrustTracer();

if (typeof window !== 'undefined') {
  (window as unknown as { braintrustTracer: BraintrustTracer }).braintrustTracer = braintrustTracer;
}
