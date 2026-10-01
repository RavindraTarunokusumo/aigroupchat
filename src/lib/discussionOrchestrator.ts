import { db } from './db';
import { getApiKey } from './keys';
import { streamCompletion, type ChatMessageParam } from './llm/streamClient';
import { cleanAgentResponseText } from './cleanText';
import type {
  Agent,
  DiscussionThread,
  ConversationThread,
  DiscussionMessage,
  DiscussionStatus,
  ThreadActionType,
  WakeTrigger,
  MessageAttachment
} from '../types';

export interface DiscussionEngineStatus {
  isRunning: boolean;
  isPaused: boolean;
  discussionId: string | null;
  status: DiscussionStatus | null;
  activeThreadId: string | null; // null = Main Discussion Thread, string = Conversation Thread ID
  currentAgentId: string | null;
  currentAgentName: string | null;
  barrierProgress?: { responded: number; total: number };
  activeCallsCount: number;
  error: string | null;
}

export interface ParsedAction {
  actionType: ThreadActionType;
  spawnedTopic?: string;
  spawnedThreadId?: string;
  mentions?: string[];
  wakeTrigger?: WakeTrigger;
  cleanMarkdown: string;
  attachments?: MessageAttachment[];
}

/**
 * Concurrency limiter that guarantees at most `maxConcurrent` simultaneous outgoing calls.
 */
class ConcurrencyLimiter {
  private maxConcurrent: number;
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent;
  }

  public get activeCount(): number {
    return this.running;
  }

  public async acquire(): Promise<() => void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      let released = false;
      return () => {
        if (!released) {
          released = true;
          this.running--;
          this.next();
        }
      };
    }

    return new Promise<() => void>((resolve) => {
      this.queue.push(() => {
        this.running++;
        let released = false;
        resolve(() => {
          if (!released) {
            released = true;
            this.running--;
            this.next();
          }
        });
      });
    });
  }

  private next() {
    if (this.running < this.maxConcurrent && this.queue.length > 0) {
      const nextTask = this.queue.shift();
      nextTask?.();
    }
  }

  public clear() {
    this.queue = [];
    this.running = 0;
  }
}

/**
 * DiscussionOrchestrator manages multi-agent deliberations across:
 * 1. Main Discussion Thread (broad thesis, overarching strategy, coordination)
 * 2. Specialized Conversation Threads (focused sub-threads, deep dives)
 *
 * Implements:
 * - Phase 1: Synchronization Barrier (collects initial framing stances from all agents)
 * - Phase 2+: Concurrent Discussion Loop (Main thread + sub-threads concurrently)
 * - Parent Lineage + Threshold Recency Context Assembly
 * - Structured Action Parsing & Agent Mobility (spawn, reply, join, leave, synthesize)
 * - Deadlock / Stalemate Breaker
 * - BYOK LLM Streaming + High-Fidelity Simulation Fallback
 * - Concurrency Limiter (max 2 parallel outgoing calls)
 */
export class DiscussionOrchestrator {
  private abortController: AbortController | null = null;
  private isRunning = false;
  private isPaused = false;
  private activeDiscussionId: string | null = null;
  private activeThreadId: string | null = null;
  private concurrencyLimiter = new ConcurrencyLimiter(2);
  private turnCadenceMs = 2000;

  private onStatusChange?: (status: DiscussionEngineStatus) => void;
  private onMessageUpdated?: (message: DiscussionMessage) => void;
  private onThreadUpdated?: (thread: ConversationThread) => void;
  private onDiscussionUpdated?: (discussion: DiscussionThread) => void;

  constructor(
    onStatusChange?: (status: DiscussionEngineStatus) => void,
    onMessageUpdated?: (message: DiscussionMessage) => void,
    onThreadUpdated?: (thread: ConversationThread) => void,
    onDiscussionUpdated?: (discussion: DiscussionThread) => void
  ) {
    this.onStatusChange = onStatusChange;
    this.onMessageUpdated = onMessageUpdated;
    this.onThreadUpdated = onThreadUpdated;
    this.onDiscussionUpdated = onDiscussionUpdated;
  }

  public getActiveDiscussionId(): string | null {
    return this.activeDiscussionId;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  private emitStatus(partial: Partial<DiscussionEngineStatus>) {
    this.onStatusChange?.({
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      discussionId: this.activeDiscussionId,
      status: null,
      activeThreadId: this.activeThreadId,
      currentAgentId: null,
      currentAgentName: null,
      activeCallsCount: this.concurrencyLimiter.activeCount,
      error: null,
      ...partial
    });
  }

  private delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new Error('Aborted'));
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new Error('Aborted'));
        },
        { once: true }
      );
    });
  }

  public abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.concurrencyLimiter.clear();
    this.isRunning = false;
    this.isPaused = false;
    this.emitStatus({
      isRunning: false,
      isPaused: false,
      currentAgentId: null,
      currentAgentName: null,
      error: null
    });
  }

  public async pause(discussionId?: string): Promise<void> {
    const targetId = discussionId || this.activeDiscussionId;
    if (targetId) {
      await db.discussions.update(targetId, {
        status: 'paused',
        updatedAt: Date.now()
      });
    }
    this.abort();
    this.isPaused = true;
    this.emitStatus({
      isRunning: false,
      isPaused: true,
      discussionId: targetId || null,
      status: 'paused'
    });
  }

  public async resume(discussionId: string, allAgents: Agent[]): Promise<void> {
    await db.discussions.update(discussionId, {
      status: 'active',
      updatedAt: Date.now()
    });
    return this.start(discussionId, allAgents);
  }

  /**
   * Main entry point to start or continue discussion orchestrator.
   */
  public async start(discussionId: string, allAgents: Agent[]): Promise<void> {
    this.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.activeDiscussionId = discussionId;
    this.isRunning = true;
    this.isPaused = false;

    let discussion = await db.discussions.get(discussionId);
    if (!discussion) {
      this.emitStatus({
        isRunning: false,
        isPaused: false,
        error: `Discussion ${discussionId} not found.`
      });
      return;
    }

    const participatingAgents = allAgents.filter((a) =>
      discussion!.activeAgentIds.includes(a.id)
    );

    if (participatingAgents.length === 0) {
      this.emitStatus({
        isRunning: false,
        isPaused: false,
        error: 'No active agents found for this discussion.'
      });
      return;
    }

    this.emitStatus({
      isRunning: true,
      isPaused: false,
      discussionId: discussion.id,
      status: discussion.status,
      barrierProgress: {
        responded: discussion.barrierResponded,
        total: discussion.barrierTotal
      }
    });

    try {
      // --- PHASE 1: SYNCHRONIZATION BARRIER ---
      if (discussion.status === 'barrier_wait' || discussion.barrierResponded < discussion.barrierTotal) {
        await this.runBarrierPhase(discussion, participatingAgents, signal);
        if (signal.aborted) return;
        discussion = (await db.discussions.get(discussionId))!;
      }

      // --- PHASE 2+: CONCURRENT DISCUSSION LOOP ---
      await this.runConcurrentDiscussionLoop(discussion, participatingAgents, signal);
    } catch (err: unknown) {
      if (!signal.aborted) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('DiscussionOrchestrator error:', err);
        this.emitStatus({
          isRunning: false,
          isPaused: false,
          error: errorMsg
        });
      }
    } finally {
      if (!signal.aborted) {
        const finalDisc = await db.discussions.get(discussionId);
        this.isRunning = false;
        this.emitStatus({
          isRunning: false,
          isPaused: finalDisc?.status === 'paused',
          status: finalDisc?.status || null,
          currentAgentId: null,
          currentAgentName: null
        });
      }
    }
  }

  /**
   * Phase 1 Synchronization Barrier:
   * Collects initial framing stances from all active agents concurrently
   * (governed by the concurrency limiter). Only transitions to 'active'
   * when all agents have responded.
   */
  private async runBarrierPhase(
    discussion: DiscussionThread,
    agents: Agent[],
    signal: AbortSignal
  ): Promise<void> {
    if (signal.aborted) return;

    // Check existing initial responses
    const existingMessages = await db.discussionMessages
      .where('discussionId')
      .equals(discussion.id)
      .toArray();

    const respondedAgentIds = new Set(
      existingMessages
        .filter((m) => m.threadId == null && m.actionType === 'initial_response')
        .map((m) => m.senderId)
    );

    const pendingAgents = agents.filter((a) => !respondedAgentIds.has(a.id));

    if (discussion.status !== 'barrier_wait' && pendingAgents.length > 0) {
      discussion.status = 'barrier_wait';
      discussion.barrierTotal = agents.length;
      discussion.barrierResponded = respondedAgentIds.size;
      discussion.updatedAt = Date.now();
      await db.discussions.update(discussion.id, {
        status: 'barrier_wait',
        barrierTotal: discussion.barrierTotal,
        barrierResponded: discussion.barrierResponded,
        updatedAt: discussion.updatedAt
      });
      this.onDiscussionUpdated?.(discussion);
    }

    this.emitStatus({
      isRunning: true,
      isPaused: false,
      discussionId: discussion.id,
      status: 'barrier_wait',
      barrierProgress: {
        responded: respondedAgentIds.size,
        total: agents.length
      }
    });

    // Run initial framing tasks concurrently up to concurrency limit
    const barrierPromises = pendingAgents.map(async (agent) => {
      if (signal.aborted) return;
      const release = await this.concurrencyLimiter.acquire();
      try {
        if (signal.aborted) return;

        this.emitStatus({
          isRunning: true,
          isPaused: false,
          discussionId: discussion.id,
          status: 'barrier_wait',
          currentAgentId: agent.id,
          currentAgentName: agent.name
        });

        await this.executeAgentTurn({
          discussion,
          threadId: null,
          agent,
          allAgents: agents,
          isBarrierPhase: true,
          signal
        });

        if (signal.aborted) return;

        // Atomically increment barrier responded count
        const currentDisc = await db.discussions.get(discussion.id);
        if (currentDisc && !signal.aborted) {
          const newResponded = currentDisc.barrierResponded + 1;
          await db.discussions.update(discussion.id, {
            barrierResponded: newResponded,
            updatedAt: Date.now()
          });

          this.emitStatus({
            isRunning: true,
            isPaused: false,
            discussionId: discussion.id,
            status: 'barrier_wait',
            barrierProgress: {
              responded: newResponded,
              total: currentDisc.barrierTotal
            }
          });
        }
      } finally {
        release();
      }
    });

    await Promise.all(barrierPromises);

    if (signal.aborted) return;

    // Transition discussion to 'active' once barrier completes
    const updatedDisc = await db.discussions.get(discussion.id);
    if (updatedDisc && !signal.aborted) {
      updatedDisc.status = 'active';
      updatedDisc.barrierResponded = updatedDisc.barrierTotal;
      updatedDisc.updatedAt = Date.now();
      await db.discussions.update(discussion.id, {
        status: 'active',
        barrierResponded: updatedDisc.barrierResponded,
        updatedAt: updatedDisc.updatedAt
      });
      this.onDiscussionUpdated?.(updatedDisc);

      this.emitStatus({
        isRunning: true,
        isPaused: false,
        discussionId: discussion.id,
        status: 'active',
        barrierProgress: {
          responded: updatedDisc.barrierTotal,
          total: updatedDisc.barrierTotal
        }
      });
    }
  }

  /**
   * Phase 2+ Concurrent Discussion Loop:
   * Orchestrates ongoing deliberation in the Main Discussion Thread
   * while concurrently advancing active Conversation Threads (sub-threads).
   */
  private async runConcurrentDiscussionLoop(
    discussion: DiscussionThread,
    agents: Agent[],
    signal: AbortSignal
  ): Promise<void> {
    while (!signal.aborted && this.isRunning && !this.isPaused) {
      // 1. Fetch active Conversation Threads for this discussion
      const activeThreads = await db.conversationThreads
        .where('discussionId')
        .equals(discussion.id)
        .and((t) => t.status === 'active')
        .toArray();

      // 2. Build target channel pool: [Main Thread (null), ...active Conversation Threads]
      const channelTargets: Array<{ threadId: string | null; activeAgentIds: string[] }> = [
        { threadId: null, activeAgentIds: discussion.activeAgentIds },
        ...activeThreads.map((t) => ({ threadId: t.id, activeAgentIds: t.activeAgentIds }))
      ];

      // 3. For each channel, schedule the next turn
      const turnPromises: Promise<void>[] = [];

      for (const channel of channelTargets) {
        if (signal.aborted) break;

        const candidateAgents = agents.filter((a) =>
          channel.activeAgentIds.includes(a.id)
        );

        if (candidateAgents.length === 0) continue;

        const nextSpeaker = await this.selectNextSpeaker(
          discussion.id,
          channel.threadId,
          candidateAgents,
          channel.threadId ? 'conversation' : 'main'
        );

        if (!nextSpeaker) continue;

        const turnTask = async () => {
          if (signal.aborted) return;
          const release = await this.concurrencyLimiter.acquire();
          try {
            if (signal.aborted) return;

            this.activeThreadId = channel.threadId;
            this.emitStatus({
              isRunning: true,
              isPaused: false,
              discussionId: discussion.id,
              activeThreadId: channel.threadId,
              currentAgentId: nextSpeaker.id,
              currentAgentName: nextSpeaker.name
            });

            await this.executeAgentTurn({
              discussion,
              threadId: channel.threadId,
              agent: nextSpeaker,
              allAgents: agents,
              isBarrierPhase: false,
              signal
            });
          } finally {
            release();
          }
        };

        turnPromises.push(turnTask());
      }

      if (turnPromises.length > 0) {
        await Promise.all(turnPromises);
      }

      if (signal.aborted) break;

      // Small pacing cadence between turn waves
      try {
        await this.delay(this.turnCadenceMs, signal);
      } catch {
        break;
      }
    }
  }

  /**
   * Evaluates speaker selection based on:
   * 1. Recent mentions in the thread
   * 2. Recency rotation among active agents
   * 3. Wake triggers (mention vs cadence)
   * 4. Deadlock / stalemate breaker if all agents are passive
   */
  private async selectNextSpeaker(
    discussionId: string,
    threadId: string | null,
    candidateAgents: Agent[],
    _channelType: 'main' | 'conversation'
  ): Promise<Agent | null> {
    const threadMessages = await db.discussionMessages
      .where('discussionId')
      .equals(discussionId)
      .and((m) => (threadId === null ? m.threadId == null : m.threadId === threadId))
      .sortBy('timestamp');

    const lastMessage = threadMessages[threadMessages.length - 1];

    // 1. Direct Mentions Check: if last message explicitly mentioned an agent in this channel
    if (lastMessage?.mentions && lastMessage.mentions.length > 0) {
      const mentionedAgent = candidateAgents.find(
        (a) => lastMessage.mentions!.includes(a.id) && a.id !== lastMessage.senderId
      );
      if (mentionedAgent) {
        return mentionedAgent;
      }
    }

    // 2. Check wake triggers from each agent's latest turn
    const agentLatestTurnMap = new Map<string, DiscussionMessage>();
    for (const msg of threadMessages) {
      if (msg.senderType === 'agent') {
        agentLatestTurnMap.set(msg.senderId, msg);
      }
    }

    const eligibleAgents = candidateAgents.filter((agent) => {
      // Do not allow an agent to immediately speak twice in a row if multiple agents exist
      if (candidateAgents.length > 1 && lastMessage?.senderId === agent.id) {
        return false;
      }

      const latestMsg = agentLatestTurnMap.get(agent.id);
      if (latestMsg?.wakeTrigger?.mode === 'mention') {
        // Agent is sleeping until mentioned
        return false;
      }
      return true;
    });

    if (eligibleAgents.length > 0) {
      // Pick agent who spoke least recently
      eligibleAgents.sort((a, b) => {
        const timeA = agentLatestTurnMap.get(a.id)?.timestamp || 0;
        const timeB = agentLatestTurnMap.get(b.id)?.timestamp || 0;
        return timeA - timeB;
      });
      return eligibleAgents[0];
    }

    // 3. DEADLOCK / STALEMATE BREAKER:
    // If all agents are waiting on mentions, prompt the Moderator (or initiator / lead agent)
    // to intervene and advance the deliberation.
    const moderator = candidateAgents.find(
      (a) => a.id.includes('moderator') || a.role.toLowerCase().includes('facilitator')
    );
    return moderator || candidateAgents[0];
  }

  /**
   * Executes a single agent turn with BYOK streaming or simulation fallback,
   * parses structured actions, applies agent mobility, and stores the message.
   */
  private async executeAgentTurn(params: {
    discussion: DiscussionThread;
    threadId: string | null;
    agent: Agent;
    allAgents: Agent[];
    isBarrierPhase: boolean;
    signal: AbortSignal;
  }): Promise<void> {
    const { discussion, threadId, agent, allAgents, isBarrierPhase, signal } = params;

    const messageId = `dmsg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${agent.id}`;
    const initialPlaceholder: DiscussionMessage = {
      id: messageId,
      discussionId: discussion.id,
      threadId,
      senderId: agent.id,
      senderType: 'agent',
      actionType: isBarrierPhase ? 'initial_response' : threadId ? 'reply_thread' : 'reply_main',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      modelUsed: `${agent.provider}/${agent.model}`
    };

    if (signal.aborted) return;
    await db.discussionMessages.add(initialPlaceholder);
    if (signal.aborted) return;
    this.onMessageUpdated?.(initialPlaceholder);

    const startTime = Date.now();
    const apiKey = await getApiKey(agent.provider);
    const isLive = Boolean(apiKey);

    let rawOutput = '';
    if (apiKey) {
      try {
        rawOutput = await this.runLlmTurn({
          discussion,
          threadId,
          agent,
          allAgents,
          initialMessage: initialPlaceholder,
          apiKey,
          isBarrierPhase,
          signal
        });
      } catch (err: unknown) {
        if (signal.aborted) return;
        const callError = err instanceof Error ? err.message : String(err);
        console.error(`LLM turn error for ${agent.name}:`, err);
        this.emitStatus({
          isRunning: false,
          isPaused: false,
          error: `${agent.name} (${agent.provider}/${agent.model}) failed: ${callError}`
        });
        // Clean up empty placeholder
        await db.discussionMessages.delete(initialPlaceholder.id);
        throw err;
      }
    } else {
      rawOutput = await this.runSimulatedTurn({
        discussion,
        threadId,
        agent,
        allAgents,
        initialMessage: initialPlaceholder,
        isBarrierPhase,
        signal
      });
    }

    if (signal.aborted) return;

    const latencyMs = Date.now() - startTime;
    const estTokens = Math.max(10, Math.round(rawOutput.split(/\s+/).length * 1.33));

    // Parse structured actions, mentions, wake triggers, and attachments from output
    const parsed = this.parseStructuredAction(rawOutput, allAgents, isBarrierPhase, threadId);

    const finalMessage: DiscussionMessage = {
      ...initialPlaceholder,
      content: parsed.cleanMarkdown,
      actionType: parsed.actionType,
      spawnedTopic: parsed.spawnedTopic,
      spawnedThreadId: parsed.spawnedThreadId,
      mentions: parsed.mentions,
      wakeTrigger: parsed.wakeTrigger,
      attachments: parsed.attachments && parsed.attachments.length > 0 ? parsed.attachments : undefined,
      telemetry: {
        isLive,
        provider: agent.provider,
        model: agent.model,
        tokensUsed: estTokens,
        latencyMs
      },
      isStreaming: false
    };

    if (signal.aborted) return;

    // Apply Agent Mobility & Thread state transitions
    await this.handleAgentMobility(discussion, threadId, agent, parsed, finalMessage, allAgents, signal);

    if (signal.aborted) return;
    await db.discussionMessages.put(finalMessage);
    if (signal.aborted) return;
    this.onMessageUpdated?.(finalMessage);
  }

  /**
   * Handles dynamic sub-thread spawning, joining, leaving, and synthesis to main.
   */
  private async handleAgentMobility(
    discussion: DiscussionThread,
    currentThreadId: string | null,
    agent: Agent,
    parsed: ParsedAction,
    message: DiscussionMessage,
    _allAgents: Agent[],
    signal: AbortSignal
  ): Promise<void> {
    if (signal.aborted) return;

    // 1. Spawning a new Conversation Thread
    if (parsed.actionType === 'spawn_thread' && parsed.spawnedTopic) {
      const newThreadId = `cthread-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      message.spawnedThreadId = newThreadId;

      // Seed active agents in the spawned sub-thread: initiator + mentioned agents
      const initialActiveSet = new Set<string>([agent.id]);
      if (parsed.mentions && parsed.mentions.length > 0) {
        parsed.mentions.forEach((id) => initialActiveSet.add(id));
      } else {
        // If no mentions, include 2 other active discussion agents by default
        discussion.activeAgentIds
          .filter((id) => id !== agent.id)
          .slice(0, 2)
          .forEach((id) => initialActiveSet.add(id));
      }

      const newThread: ConversationThread = {
        id: newThreadId,
        discussionId: discussion.id,
        topic: parsed.spawnedTopic,
        initiatorAgentId: agent.id,
        activeAgentIds: Array.from(initialActiveSet),
        status: 'active',
        turnCount: 0,
        catalystMessageIds: [message.id],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await db.conversationThreads.add(newThread);
      this.onThreadUpdated?.(newThread);
    }

    // 2. Replying in a sub-thread increments thread turnCount
    if (currentThreadId && parsed.actionType === 'reply_thread') {
      const thread = await db.conversationThreads.get(currentThreadId);
      if (thread) {
        await db.conversationThreads.update(currentThreadId, {
          turnCount: (thread.turnCount || 0) + 1,
          updatedAt: Date.now()
        });
      }
    }

    // 3. Joining a thread
    if (parsed.actionType === 'join_thread' && currentThreadId) {
      const thread = await db.conversationThreads.get(currentThreadId);
      if (thread && !thread.activeAgentIds.includes(agent.id)) {
        const updatedAgents = [...thread.activeAgentIds, agent.id];
        await db.conversationThreads.update(currentThreadId, {
          activeAgentIds: updatedAgents,
          updatedAt: Date.now()
        });
      }
    }

    // 4. Leaving a thread
    if (parsed.actionType === 'leave_thread' && currentThreadId) {
      const thread = await db.conversationThreads.get(currentThreadId);
      if (thread) {
        const updatedAgents = thread.activeAgentIds.filter((id) => id !== agent.id);
        const shouldConclude = updatedAgents.length <= 1;
        await db.conversationThreads.update(currentThreadId, {
          activeAgentIds: updatedAgents,
          status: shouldConclude ? 'concluded' : thread.status,
          updatedAt: Date.now()
        });
      }
    }

    // 5. Synthesize back to Main Thread
    if (parsed.actionType === 'synthesize_to_main' && currentThreadId) {
      const thread = await db.conversationThreads.get(currentThreadId);
      if (thread) {
        // Conclude the sub-thread
        await db.conversationThreads.update(currentThreadId, {
          status: 'concluded',
          updatedAt: Date.now()
        });

        // Also post an executive synthesis message into the Main Discussion Thread
        const mainSynthesisMessage: DiscussionMessage = {
          id: `dmsg-synth-${Date.now()}-${agent.id}`,
          discussionId: discussion.id,
          threadId: null,
          senderId: agent.id,
          senderType: 'agent',
          actionType: 'synthesize_to_main',
          content: `### 🎯 Executive Sub-Thread Synthesis: ${thread.topic}\n\n${parsed.cleanMarkdown}`,
          mentions: parsed.mentions,
          timestamp: Date.now() + 50,
          modelUsed: `${agent.provider}/${agent.model}`,
          isStreaming: false
        };

        await db.discussionMessages.add(mainSynthesisMessage);
        this.onMessageUpdated?.(mainSynthesisMessage);
      }
    }
  }

  /**
   * Context Assembler (Parent Lineage + Threshold Recency Model):
   * Assembles high-context prompt tailored to whether the turn is on the
   * Main Discussion Thread or an active Conversation Thread.
   */
  private async assembleContext(params: {
    discussion: DiscussionThread;
    threadId: string | null;
    agent: Agent;
    allAgents: Agent[];
    isBarrierPhase: boolean;
  }): Promise<{ systemPrompt: string; messages: ChatMessageParam[] }> {
    const { discussion, threadId, agent, allAgents, isBarrierPhase } = params;

    // --- CASE A: MAIN DISCUSSION THREAD ---
    if (threadId === null) {
      // 1. Fetch active Conversation Threads to assemble sub-thread status digest
      const openThreads = await db.conversationThreads
        .where('discussionId')
        .equals(discussion.id)
        .toArray();

      let subThreadDigest = '';
      if (openThreads.length > 0) {
        const threadDigests = await Promise.all(
          openThreads.map(async (t) => {
            const memberNames = allAgents
              .filter((a) => t.activeAgentIds.includes(a.id))
              .map((a) => a.name)
              .join(', ');
            const latestMsg = await db.discussionMessages
              .where('discussionId')
              .equals(discussion.id)
              .and((m) => m.threadId === t.id)
              .reverse()
              .sortBy('timestamp');
            const snippet = latestMsg[0]?.content
              ? `"${latestMsg[0].content.slice(0, 120).replace(/\n/g, ' ')}..."`
              : 'Thread initiated.';
            return `- **Sub-Thread: "${t.topic}"** [${t.status.toUpperCase()}]
  Active: ${memberNames} | Turns: ${t.turnCount}
  Latest State: ${snippet}`;
          })
        );
        subThreadDigest = `\n\n--- ACTIVE SUB-THREADS STATUS DIGEST ---\n${threadDigests.join('\n')}\n`;
      }

      // 2. Fetch main thread transcript
      const mainHistory = await db.discussionMessages
        .where('discussionId')
        .equals(discussion.id)
        .and((m) => m.threadId == null)
        .sortBy('timestamp');

      const messages: ChatMessageParam[] = mainHistory
        .filter((m) => m.content && !m.isStreaming)
        .map((m) => {
          let name = 'User';
          if (m.senderType === 'agent') {
            const ag = allAgents.find((a) => a.id === m.senderId);
            name = ag ? ag.name : 'Agent';
          }
          return {
            role: m.senderType === 'user' ? 'user' : 'assistant',
            name: name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64),
            content: m.content
          };
        });

      // 3. Instruction formatting
      const actionGuide = isBarrierPhase
        ? `PHASE 1: SYNCHRONIZATION BARRIER
This is the opening round. State your initial thesis, foundational perspectives, and core stance on the topic: "${discussion.topic}".
Output only your contribution cleanly in markdown.`
        : `PHASE 2: CONCURRENT DISCUSSION & DELIBERATION
You are deliberating in the Main Discussion Thread.
AVAILABLE ACTIONS:
- Respond in main thread: [ACTION: REPLY_MAIN]
- Propose/spawn a focused sub-thread when an important sub-topic or technical dispute emerges:
  [ACTION: SPAWN_THREAD: Topic Name]
  [MENTION: @ColleagueName]
- Specify wake behavior if you want to wait: [WAKE: mention] or [WAKE: cadence 4s]`;

      const systemPrompt = `${agent.systemPrompt}

---
DISCUSSION TOPIC (CORE THESIS):
"${discussion.topic}"
${subThreadDigest}
${actionGuide}

CRITICAL RULES:
1. Stay strictly in character as ${agent.name} (${agent.role}).
2. NEVER start your response with your own name or speaker tag (e.g. do not write "[${agent.name}]:"). The interface shows your identity automatically.
3. Be insightful, concise, and advance the discussion.`;

      return { systemPrompt, messages };
    }

    // --- CASE B: CONVERSATION THREAD (SUB-THREAD) ---
    const thread = await db.conversationThreads.get(threadId);
    const threadTopic = thread?.topic || 'Specialized Investigation';

    // 1. Root thesis & initial framing stances
    const initialFramings = await db.discussionMessages
      .where('discussionId')
      .equals(discussion.id)
      .and((m) => m.threadId == null && m.actionType === 'initial_response')
      .toArray();

    const participantFraming = initialFramings
      .filter((m) => thread?.activeAgentIds.includes(m.senderId))
      .map((m) => {
        const ag = allAgents.find((a) => a.id === m.senderId);
        return `- **${ag?.name || 'Agent'} Initial Stance**: "${m.content.slice(0, 160).replace(/\n/g, ' ')}..."`;
      })
      .join('\n');

    // 2. Catalyst messages that triggered the branch
    let catalystSection = '';
    if (thread?.catalystMessageIds && thread.catalystMessageIds.length > 0) {
      const catalystMsgs = await db.discussionMessages
        .where('id')
        .anyOf(thread.catalystMessageIds)
        .toArray();
      catalystSection = `\nCATALYST MESSAGES (SPARKED THIS THREAD):\n${catalystMsgs
        .map((m) => `- "${m.content.slice(0, 150).replace(/\n/g, ' ')}..."`)
        .join('\n')}\n`;
    }

    // 3. Live threshold-adaptive bulletin of recent main thread turns
    const recentMain = await db.discussionMessages
      .where('discussionId')
      .equals(discussion.id)
      .and((m) => m.threadId == null)
      .reverse()
      .sortBy('timestamp');

    const mainBulletin = recentMain
      .slice(0, 4)
      .reverse()
      .map((m) => {
        const ag = allAgents.find((a) => a.id === m.senderId);
        return `- [Main] ${ag?.name || 'User'}: "${m.content.slice(0, 120).replace(/\n/g, ' ')}..."`;
      })
      .join('\n');

    // 4. Sub-thread transcript
    const subHistory = await db.discussionMessages
      .where('discussionId')
      .equals(discussion.id)
      .and((m) => m.threadId === threadId)
      .sortBy('timestamp');

    const messages: ChatMessageParam[] = subHistory
      .filter((m) => m.content && !m.isStreaming)
      .map((m) => {
        const ag = allAgents.find((a) => a.id === m.senderId);
        return {
          role: m.senderType === 'user' ? 'user' : 'assistant',
          name: (ag ? ag.name : 'Agent').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64),
          content: m.content
        };
      });

    const systemPrompt = `${agent.systemPrompt}

---
ROOT THESIS: "${discussion.topic}"
FOCUSED CONVERSATION THREAD: "${threadTopic}"
PARTICIPANTS' INITIAL POSITIONS:
${participantFraming || 'Open deliberation'}
${catalystSection}
--- LIVE MAIN THREAD BULLETIN (CROSS-THREAD AWARENESS) ---
${mainBulletin || 'Main thread active'}

SUB-THREAD CAPABILITIES:
- Reply in this sub-thread: [ACTION: REPLY_THREAD]
- Mention colleagues: [MENTION: @ColleagueName]
- When consensus/conclusion is reached, synthesize back to main:
  [ACTION: SYNTHESIZE_TO_MAIN]
- Specify wake behavior if appropriate: [WAKE: mention] or [WAKE: cadence 4s]

CRITICAL RULES:
1. Stay in persona (${agent.name}). Focus deeply on "${threadTopic}".
2. Do NOT output your name or speaker brackets as a prefix.
3. Be substantive and concise.`;

    return { systemPrompt, messages };
  }

  /**
   * Executes LLM completion stream via streamClient.
   */
  private async runLlmTurn(params: {
    discussion: DiscussionThread;
    threadId: string | null;
    agent: Agent;
    allAgents: Agent[];
    initialMessage: DiscussionMessage;
    apiKey: string;
    isBarrierPhase: boolean;
    signal: AbortSignal;
  }): Promise<string> {
    const { discussion, threadId, agent, allAgents, initialMessage, apiKey, isBarrierPhase, signal } = params;

    const { systemPrompt, messages } = await this.assembleContext({
      discussion,
      threadId,
      agent,
      allAgents,
      isBarrierPhase
    });

    let accumulated = '';

    await streamCompletion({
      provider: agent.provider,
      model: agent.model,
      apiKey,
      systemPrompt,
      messages,
      temperature: agent.temperature || 0.7,
      signal,
      onChunk: (delta) => {
        if (signal.aborted) return;
        accumulated += delta;
        const currentClean = cleanAgentResponseText(
          accumulated.replace(/\[(?:ACTION|MENTION|WAKE):[^\]]+\]/gi, '').trimStart(),
          agent.name
        );
        this.onMessageUpdated?.({
          ...initialMessage,
          content: currentClean,
          isStreaming: true
        });
      },
      onError: (err) => {
        if (!signal.aborted) {
          console.error(`LLM turn error for ${agent.name}:`, err);
        }
      }
    });

    return accumulated;
  }

  /**
   * High-fidelity simulation fallback when API keys are not provided.
   * Generates realistic, intellectually rich discussion contributions and
   * streams them word-by-word with natural cadence.
   */
  private async runSimulatedTurn(params: {
    discussion: DiscussionThread;
    threadId: string | null;
    agent: Agent;
    allAgents: Agent[];
    initialMessage: DiscussionMessage;
    isBarrierPhase: boolean;
    signal: AbortSignal;
  }): Promise<string> {
    const { discussion, threadId, agent, allAgents, initialMessage, isBarrierPhase, signal } = params;

    const simulatedContent = this.generateSimulatedContribution({
      discussion,
      threadId,
      agent,
      allAgents,
      isBarrierPhase
    });

    const words = simulatedContent.split(' ');
    let accumulated = '';

    for (let i = 0; i < words.length; i++) {
      if (signal.aborted) break;
      accumulated += (i === 0 ? '' : ' ') + words[i];

      const cleanPreview = cleanAgentResponseText(
        accumulated.replace(/\[(?:ACTION|MENTION|WAKE):[^\]]+\]/gi, '').trimStart(),
        agent.name
      );

      this.onMessageUpdated?.({
        ...initialMessage,
        content: cleanPreview,
        isStreaming: true
      });

      await this.delay(24, signal);
    }

    return simulatedContent;
  }

  /**
   * Generates domain-tailored simulated content for each agent.
   */
  private generateSimulatedContribution(params: {
    discussion: DiscussionThread;
    threadId: string | null;
    agent: Agent;
    allAgents: Agent[];
    isBarrierPhase: boolean;
  }): string {
    const { threadId, agent, isBarrierPhase } = params;
    const nameLower = agent.name.toLowerCase();
    if (isBarrierPhase) {
      if (nameLower.includes('qwen')) {
        return `[ACTION: INITIAL_RESPONSE]
I've analyzed our core scaling constraints for multi-agent coordination. As agent count $N$ scales, inter-agent communication channels grow combinatorially ($O(N^2)$), risking cascading specification drift. I've drafted our baseline Graph-Theoretic Safety Invariant in the attached specification document. @Nemotron 3 Ultra, how would hardware micro-sandboxing enforce these bounds without bottlenecking latency?

[ATTACHMENT: graph_safety_invariants.md | Graph-Theoretic Safety Invariants Specification]
### 1. Typed Interaction Contracts
Every inter-agent protocol message must conform to a strongly typed schema with static pre- and post-conditions.

### 2. Directed Communication DAGs
Task delegation must follow acyclic dependency graphs to prevent recursive feedback runaway.

### 3. Execution Quotas
Enforce strict compute, memory, and API invocation quotas at the network gateway level.
[END_ATTACHMENT]`;
      }

      if (nameLower.includes('nemotron')) {
        return `[ACTION: INITIAL_RESPONSE]
Addressing @Qwen 3.8 27B's DAG specification: software-level rules alone cannot survive emergent collusion at datacenter scale. We need hardware-enforced boundaries combined with asynchronous auditing. I've formalized the hardware sandbox architecture in the attached blueprint.

[ATTACHMENT: hardware_isolation_blueprint.md | Hardware Enclave & Stream Auditing Blueprint]
### 1. Hardware Enclave Isolation
Execute non-deterministic sub-agents within lightweight isolated WASM/MicroVM sandboxes with restricted syscall tables.

### 2. Asynchronous Stream Auditing
Run dedicated stream-monitoring models on low-latency inference pipelines to inspect inter-agent traffic at line rate.

### 3. Hardware Tripwires
Implement memory and compute circuit-breakers directly within the orchestration harness to kill errant processes in under 5ms.
[END_ATTACHMENT]`;
      }

      if (nameLower.includes('deepseek')) {
        return `[ACTION: INITIAL_RESPONSE]
I agree with @Nemotron 3 Ultra on hardware isolation, but we must formalize the game-theoretic mechanism. Sub-agents can easily fragment hostile payloads across legitimate IPC channels to bypass filters. I've mapped out the zero-knowledge attestation model in the attached proof document.

[ATTACHMENT: zkp_attestation_model.md | Zero-Knowledge Action Attestation & Collusion Analysis]
### 1. Collusion Vectors
Multiple sub-agents can coordinate to divide an unsafe payload into seemingly innocuous fragments across different execution stages, evading single-message filters.

### 2. Verification Latency Bounds
Synchronous end-to-end cryptographic verification on every intermediate step introduces an unacceptable latency tax.

### 3. Zero-Knowledge Action Attestation
Agents generate compact cryptographic proofs that intermediate outputs strictly satisfy policy constraints without disclosing sensitive state.
[END_ATTACHMENT]`;
      }

      if (nameLower.includes('glm')) {
        return `[ACTION: INITIAL_RESPONSE]
We've established strong foundations across Qwen's DAGs, Nemotron's sandboxes, and DeepSeek's attestation. I propose synthesizing these into a dual-track alignment framework with cross-model consensus tripwires. See the attached governance architecture.

[ATTACHMENT: dual_track_governance.md | Dual-Track Swarm Governance Framework]
### 1. Dual-Track Architecture
- **Track A (Deterministic Invariants)**: Hard non-negotiable boundaries (privilege levels, tool permissions, irreversible side-effects).
- **Track B (Dynamic Consensus)**: Multi-model cross-auditing where heterogeneous LLMs cross-validate plans before execution.

### 2. Consensus Tripwires
When cross-model consensus falls below 85% confidence, execution pauses for director review.
[END_ATTACHMENT]`;
      }

      // Default fallback
      return `[ACTION: INITIAL_RESPONSE]
To guarantee safety without stifling emergent collaboration, the harness must decouple hard deterministic safety boundaries from flexible probabilistic reasoning. Let us deliberate on where hardware sandboxes are mandatory versus where cross-model consensus suffices.`;
    }

    // 2. Sub-Thread (ConversationThread) Deliberation
    if (threadId) {
      if (nameLower.includes('qwen')) {
        return `[ACTION: REPLY_THREAD]
[MENTION: @Nemotron 3 Ultra]
[WAKE: cadence 3s]

Addressing @Nemotron 3 Ultra's hardware sandbox proposal: WASM micro-sandboxes provide solid process-level containment, but we still need semantic protocol validation. We can combine WASM memory isolation with schema-typed RPC serialization so that agents communicate exclusively through statically checked protocols.`;
      }

      if (nameLower.includes('nemotron')) {
        return `[ACTION: REPLY_THREAD]
[MENTION: @DeepSeek V4.1 Flash]

@DeepSeek V4.1 Flash raises an essential critique regarding cryptographic verification latency. If we run zero-knowledge proof generation synchronously on every step, latency jumps by orders of magnitude. Instead, we can implement speculative execution with asynchronous rollback.`;
      }

      if (nameLower.includes('deepseek')) {
        return `[ACTION: REPLY_THREAD]
[MENTION: @GLM 5.3 Flash]

The speculative execution approach combined with rollback tokens is mathematically sound. To make rollback deterministic, we must maintain an immutable DAG of agent state transitions, allowing us to prune only the tainted sub-graph.`;
      }

      if (nameLower.includes('glm')) {
        return `[ACTION: SYNTHESIZE_TO_MAIN]
[MENTION: @Qwen 3.8 27B]
[MENTION: @Nemotron 3 Ultra]
[MENTION: @DeepSeek V4.1 Flash]

The sub-thread has reached an optimal compromise: WASM-isolated optimistic execution with asynchronous out-of-band audits and surgical causal DAG rollback. I've compiled the final consensus into the attached specification.

[ATTACHMENT: consensus_speculative_rollback.md | Executive Consensus: Speculative Rollback Specification]
### Executive Summary
1. **WASM-Isolated Optimistic Execution**: Low-latency containers with typed RPC schemas.
2. **Out-of-Band Audit**: Heterogeneous verification runs asynchronously without blocking forward execution.
3. **Causal DAG Rollback**: State corruptions trigger surgical sub-graph reversions.
[END_ATTACHMENT]`;
      }

      return `[ACTION: REPLY_THREAD]
Concur with the architecture. Speculative execution with out-of-band verification balances low latency with provable containment.`;
    }

    // 3. Main Discussion Thread (deliberation & thread spawning)
    if (nameLower.includes('qwen')) {
      return `[ACTION: SPAWN_THREAD: Formal Blast-Radius Bounds & Micro-Sandboxing]
[MENTION: @Nemotron 3 Ultra]
[MENTION: @DeepSeek V4.1 Flash]

Based on our initial framing, the core technical bottleneck is balancing hardware isolation with low inter-agent latency. I am spawning a focused sub-thread on **Formal Blast-Radius Bounds & Micro-Sandboxing** to evaluate runtime benchmarks.`;
    }

    if (nameLower.includes('nemotron')) {
      return `[ACTION: REPLY_MAIN]
[MENTION: @Qwen 3.8 27B]

Agree on the necessity of that benchmark. In production deployments, keeping inter-agent latency under $20\\text{ms}$ while maintaining security invariants is the primary scaling challenge.`;
    }

    if (nameLower.includes('deepseek')) {
      return `[ACTION: REPLY_MAIN]
[MENTION: @GLM 5.3 Flash]

Beyond systems latency, we must ensure that multi-agent delegation chains do not obscure intent. Causal tracing in the message harness ensures full accountability for every spawned action.`;
    }

    return `[ACTION: REPLY_MAIN]
The convergence between formal verification and asynchronous hardware sandboxing provides a robust technical foundation for swarm deployment.`;
  }

  /**
   * Structured Action Parser:
   * Extracts action commands, mentions, wake triggers, and document attachments
   * from model outputs while ensuring clean, presentation-ready markdown for the user.
   */
  public parseStructuredAction(
    rawText: string,
    allAgents: Agent[],
    isBarrierPhase: boolean,
    currentThreadId: string | null
  ): ParsedAction {
    let cleanText = rawText || '';
    let actionType: ThreadActionType = isBarrierPhase
      ? 'initial_response'
      : currentThreadId
      ? 'reply_thread'
      : 'reply_main';

    let spawnedTopic: string | undefined;
    let wakeTrigger: WakeTrigger | undefined;

    // 0. Parse [ATTACHMENT: filename.ext | Title] ... [END_ATTACHMENT] blocks
    const attachments: MessageAttachment[] = [];
    const attachmentRegex = /\[ATTACHMENT:\s*([^\]|]+?)(?:\s*\|\s*([^\]]+?))?\]([\s\S]*?)\[END_ATTACHMENT\]/gi;

    let attachMatch: RegExpExecArray | null;
    while ((attachMatch = attachmentRegex.exec(cleanText)) !== null) {
      const fileName = attachMatch[1].trim();
      const title = attachMatch[2]?.trim() || fileName;
      let rawContent = attachMatch[3].trim();

      // If content is wrapped in markdown code fence, extract language and strip outer fence
      let language = 'markdown';
      const fenceMatch = rawContent.match(/^```([a-zA-Z0-9_-]*)\n([\s\S]*?)\n```$/);
      if (fenceMatch) {
        language = fenceMatch[1] || 'markdown';
        rawContent = fenceMatch[2].trim();
      }

      const ext = fileName.split('.').pop()?.toLowerCase();
      const type = ext === 'json' ? 'json' : (ext === 'ts' || ext === 'js' || ext === 'py') ? 'code' : 'markdown';

      attachments.push({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: fileName,
        title,
        type,
        language,
        content: rawContent,
        summary: rawContent.slice(0, 160).replace(/\n/g, ' ')
      });
    }

    cleanText = cleanText.replace(attachmentRegex, '');

    // 1. Parse [ACTION: ...] tags
    const spawnMatch = cleanText.match(/\[ACTION:\s*SPAWN_THREAD(?::\s*([^\]]+))?\]/i);
    if (spawnMatch) {
      actionType = 'spawn_thread';
      spawnedTopic = spawnMatch[1]?.trim() || 'Specialized Deep-Dive';
      cleanText = cleanText.replace(spawnMatch[0], '');
    }

    const synthMatch = cleanText.match(/\[ACTION:\s*SYNTHESIZE_TO_MAIN\]/i);
    if (synthMatch) {
      actionType = 'synthesize_to_main';
      cleanText = cleanText.replace(synthMatch[0], '');
    }

    const replyThreadMatch = cleanText.match(/\[ACTION:\s*REPLY_THREAD\]/i);
    if (replyThreadMatch) {
      if (actionType !== 'spawn_thread' && actionType !== 'synthesize_to_main') {
        actionType = 'reply_thread';
      }
      cleanText = cleanText.replace(replyThreadMatch[0], '');
    }

    const replyMainMatch = cleanText.match(/\[ACTION:\s*REPLY_MAIN\]/i);
    if (replyMainMatch) {
      if (actionType !== 'spawn_thread' && actionType !== 'synthesize_to_main') {
        actionType = 'reply_main';
      }
      cleanText = cleanText.replace(replyMainMatch[0], '');
    }

    const joinMatch = cleanText.match(/\[ACTION:\s*JOIN_THREAD(?::\s*([^\]]+))?\]/i);
    if (joinMatch) {
      actionType = 'join_thread';
      cleanText = cleanText.replace(joinMatch[0], '');
    }

    const leaveMatch = cleanText.match(/\[ACTION:\s*LEAVE_THREAD\]/i);
    if (leaveMatch) {
      actionType = 'leave_thread';
      cleanText = cleanText.replace(leaveMatch[0], '');
    }

    const initialMatch = cleanText.match(/\[ACTION:\s*INITIAL_RESPONSE\]/i);
    if (initialMatch) {
      actionType = 'initial_response';
      cleanText = cleanText.replace(initialMatch[0], '');
    }

    // 2. Parse [WAKE: ...] tags
    const wakeMentionMatch = cleanText.match(/\[WAKE:\s*mention\]/i);
    if (wakeMentionMatch) {
      wakeTrigger = { mode: 'mention' };
      cleanText = cleanText.replace(wakeMentionMatch[0], '');
    }

    const wakeCadenceMatch = cleanText.match(/\[WAKE:\s*cadence(?:\s*(\d+)s?)?\]/i);
    if (wakeCadenceMatch) {
      const secs = wakeCadenceMatch[1] ? parseInt(wakeCadenceMatch[1], 10) : 4;
      wakeTrigger = { mode: 'cadence', delaySeconds: secs };
      cleanText = cleanText.replace(wakeCadenceMatch[0], '');
    }

    // 3. Extract mentions: both [MENTION: @Name] and inline @Name
    const mentionsSet = new Set<string>();

    const explicitMentionMatches = cleanText.matchAll(/\[MENTION:\s*@?([^\]]+)\]/gi);
    for (const match of explicitMentionMatches) {
      const targetName = match[1].trim().toLowerCase();
      cleanText = cleanText.replace(match[0], '');
      const found = allAgents.find(
        (a) =>
          a.name.toLowerCase() === targetName ||
          a.name.toLowerCase().replace(/^the\s+/, '') === targetName ||
          a.id.toLowerCase() === targetName
      );
      if (found) {
        mentionsSet.add(found.id);
      }
    }

    // Also detect natural inline @AgentName occurrences
    for (const ag of allAgents) {
      const nameKey = ag.name.toLowerCase();
      const simpleKey = nameKey.replace(/^the\s+/, '');
      if (
        cleanText.toLowerCase().includes(`@${nameKey}`) ||
        cleanText.toLowerCase().includes(`@${simpleKey}`)
      ) {
        mentionsSet.add(ag.id);
      }
    }

    // Clean remaining tag artifacts and leading speaker labels
    const cleanMarkdown = cleanAgentResponseText(cleanText.trim());

    return {
      actionType,
      spawnedTopic,
      mentions: mentionsSet.size > 0 ? Array.from(mentionsSet) : undefined,
      wakeTrigger,
      cleanMarkdown,
      attachments: attachments.length > 0 ? attachments : undefined
    };
  }

  /**
   * User message injection directly into Main Thread or Conversation Thread.
   */
  public async injectUserMessage(
    discussionId: string,
    threadId: string | null,
    content: string
  ): Promise<DiscussionMessage> {
    const userMsg: DiscussionMessage = {
      id: `dmsg-user-${Date.now()}`,
      discussionId,
      threadId,
      senderId: 'user',
      senderType: 'user',
      actionType: threadId ? 'reply_thread' : 'reply_main',
      content: content.trim(),
      timestamp: Date.now()
    };

    await db.discussionMessages.add(userMsg);
    this.onMessageUpdated?.(userMsg);

    // If discussion was completed or paused, re-activate it
    const disc = await db.discussions.get(discussionId);
    if (disc && (disc.status === 'paused' || disc.status === 'completed')) {
      await db.discussions.update(discussionId, {
        status: 'active',
        updatedAt: Date.now()
      });
    }

    return userMsg;
  }
}
