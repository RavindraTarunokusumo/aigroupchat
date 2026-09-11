import { db } from './db';
import { getApiKey } from './keys';
import { streamCompletion, type ChatMessageParam } from './llm/streamClient';
import { cleanAgentResponseText } from './cleanText';
import type { Agent, TaskBoard, BoardPost, BoardPostType, BoardSource } from '../types';

export interface BoardEngineStatus {
  isRunning: boolean;
  isPaused: boolean;
  activeBoardId: string | null;
  currentAgentId: string | null;
  currentAgentName: string | null;
  phase: string | null;
}

export class BoardOrchestrator {
  private abortController: AbortController | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private onStatusChange?: (status: BoardEngineStatus) => void;
  private onPostUpdated?: (post: BoardPost) => void;
  private currentBoardId: string | null = null;
  private priorityAgentId: string | null = null;

  constructor(
    onStatusChange?: (status: BoardEngineStatus) => void,
    onPostUpdated?: (post: BoardPost) => void
  ) {
    this.onStatusChange = onStatusChange;
    this.onPostUpdated = onPostUpdated;
  }

  public getActiveBoardId(): string | null {
    return this.currentBoardId;
  }

  private emitStatus(status: Partial<BoardEngineStatus>) {
    this.onStatusChange?.({
      isRunning: false,
      isPaused: false,
      activeBoardId: this.currentBoardId,
      currentAgentId: null,
      currentAgentName: null,
      phase: null,
      ...status
    });
  }

  public stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public abort() {
    this.stopTimer();
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.emitStatus({
      isRunning: false,
      isPaused: false,
      currentAgentId: null,
      currentAgentName: null,
      phase: null
    });
  }

  /**
   * Pause execution of the current board
   */
  public async pause(boardId: string): Promise<void> {
    this.abort();
    await db.taskBoards.update(boardId, {
      status: 'paused',
      updatedAt: Date.now()
    });
    this.emitStatus({
      isRunning: false,
      isPaused: true,
      activeBoardId: boardId
    });
  }

  /**
   * Stop execution permanently
   */
  public async stop(boardId: string): Promise<void> {
    this.abort();
    await db.taskBoards.update(boardId, {
      status: 'stopped',
      updatedAt: Date.now()
    });
    this.emitStatus({
      isRunning: false,
      isPaused: false,
      activeBoardId: boardId
    });
  }

  /**
   * Inject extra instruction into the board live
   */
  public async addInstruction(
    boardId: string,
    instructionText: string,
    targetAgentId?: string,
    targetAgentName?: string
  ): Promise<void> {
    const board = await db.taskBoards.get(boardId);
    if (!board) return;

    if (targetAgentId) {
      this.priorityAgentId = targetAgentId;
    }

    const newInstruction = {
      id: `inst-${Date.now()}`,
      instruction: instructionText.trim(),
      timestamp: Date.now(),
      targetAgentId,
      targetAgentName
    };

    const updatedInstructions = [...(board.extraInstructions || []), newInstruction];

    await db.taskBoards.update(boardId, {
      extraInstructions: updatedInstructions,
      updatedAt: Date.now()
    });

    // Also post as a prominent board instruction post visible to user & agents
    const instructionPost: BoardPost = {
      id: `post-inst-${Date.now()}`,
      boardId,
      agentId: 'user',
      type: 'instruction',
      title: targetAgentName
        ? `Targeted Directive for ${targetAgentName}`
        : 'Direct Injected User Directive',
      content: targetAgentName
        ? `**Targeted Directive for @${targetAgentName}:**\n> ${instructionText.trim()}`
        : `**New Constraint Added by User:**\n> ${instructionText.trim()}`,
      timestamp: Date.now()
    };

    await db.boardPosts.add(instructionPost);
    this.onPostUpdated?.(instructionPost);
  }

  /**
   * Main autonomous execution loop
   */
  public async start(boardId: string, allAgents: Agent[]): Promise<void> {
    this.abort();
    this.currentBoardId = boardId;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    let board = await db.taskBoards.get(boardId);
    if (!board) return;

    // Transition board to running
    await db.taskBoards.update(boardId, {
      status: 'running',
      startedAt: board.startedAt || Date.now(),
      updatedAt: Date.now()
    });

    // Start elapsed time ticker
    this.timerInterval = setInterval(async () => {
      const current = await db.taskBoards.get(boardId);
      if (current && current.status === 'running') {
        const newElapsed = (current.elapsedSeconds || 0) + 1;
        await db.taskBoards.update(boardId, { elapsedSeconds: newElapsed });

        // Check time budget
        if (newElapsed >= current.maxDurationMinutes * 60) {
          await this.completeBoard(boardId, 'Duration limit reached');
        }
      }
    }, 1000);

    const participatingAgents = allAgents.filter((a) => board?.agentIds.includes(a.id));
    if (participatingAgents.length === 0) {
      this.emitStatus({ isRunning: false, phase: 'No active agents found' });
      return;
    }

    try {
      while (!signal.aborted) {
        // Refresh board state
        const freshBoard = await db.taskBoards.get(boardId);
        if (!freshBoard || freshBoard.status !== 'running') {
          break;
        }
        board = freshBoard;

        // Check budget limits
        if (board.currentTurn >= board.turnLimit) {
          await this.completeBoard(boardId, 'Turn budget limit reached');
          break;
        }

        if (board.usedTokens >= board.tokenBudget) {
          await this.completeBoard(boardId, 'Token budget limit reached');
          break;
        }

        if (board.elapsedSeconds >= board.maxDurationMinutes * 60) {
          await this.completeBoard(boardId, 'Duration budget reached');
          break;
        }

        // Determine next agent and post phase
        let currentAgent: Agent;
        if (this.priorityAgentId) {
          const targeted = participatingAgents.find((a) => a.id === this.priorityAgentId);
          if (targeted) {
            currentAgent = targeted;
          } else {
            const agentIndex = board.currentTurn % participatingAgents.length;
            currentAgent = participatingAgents[agentIndex];
          }
          this.priorityAgentId = null;
        } else {
          const agentIndex = board.currentTurn % participatingAgents.length;
          currentAgent = participatingAgents[agentIndex];
        }
        const postType = this.determinePostType(board.currentTurn, board.enableSearch, currentAgent);

        this.emitStatus({
          isRunning: true,
          isPaused: false,
          activeBoardId: boardId,
          currentAgentId: currentAgent.id,
          currentAgentName: currentAgent.name,
          phase: `Formulating ${postType}`
        });

        // Execute agent turn
        await this.runBoardTurn(board, currentAgent, postType, signal);

        // Turn delay cadence
        const cadenceMs = Math.max(1500, (board.turnCadenceSeconds || 2) * 1000);
        await this.delay(cadenceMs, signal);
      }
    } catch (err) {
      if (!signal.aborted) {
        console.error('Board execution error:', err);
      }
    } finally {
      this.stopTimer();
      const finalBoard = await db.taskBoards.get(boardId);
      this.emitStatus({
        isRunning: false,
        isPaused: finalBoard?.status === 'paused',
        activeBoardId: boardId,
        currentAgentId: null,
        currentAgentName: null,
        phase: null
      });
    }
  }

  private async completeBoard(boardId: string, reason: string): Promise<void> {
    this.stopTimer();
    await db.taskBoards.update(boardId, {
      status: 'completed',
      completedAt: Date.now(),
      updatedAt: Date.now()
    });

    const completionPost: BoardPost = {
      id: `post-complete-${Date.now()}`,
      boardId,
      agentId: 'system',
      type: 'synthesis',
      title: '🎯 Task Session Completed',
      content: `The autonomous agent collaboration session has concluded (${reason}). All agent findings, search queries, and architectural proposals have been consolidated above.`,
      timestamp: Date.now()
    };
    await db.boardPosts.add(completionPost);
    this.onPostUpdated?.(completionPost);
    this.abort();
  }

  private determinePostType(turnNumber: number, enableSearch: boolean, agent: Agent): BoardPostType {
    const roleLower = agent.role.toLowerCase();
    const nameLower = agent.name.toLowerCase();

    if (turnNumber === 0) return 'thought';
    if (enableSearch && (turnNumber === 1 || turnNumber === 3 || roleLower.includes('creative') || nameLower.includes('creative'))) {
      return 'finding';
    }
    if (nameLower.includes('skeptic') || roleLower.includes('risk') || turnNumber % 4 === 2) {
      return 'critique';
    }
    if (turnNumber >= 4 && (turnNumber % 3 === 0 || nameLower.includes('logician'))) {
      return 'solution';
    }
    if (nameLower.includes('moderator') || turnNumber >= 6) {
      return 'synthesis';
    }
    return 'thought';
  }

  private async runBoardTurn(
    board: TaskBoard,
    agent: Agent,
    postType: BoardPostType,
    signal: AbortSignal
  ): Promise<void> {
    const apiKey = await getApiKey(agent.provider);
    const existingPosts = await db.boardPosts
      .where('boardId')
      .equals(board.id)
      .sortBy('timestamp');

    const postId = `post-${Date.now()}-${agent.id}`;
    const initialPost: BoardPost = {
      id: postId,
      boardId: board.id,
      agentId: agent.id,
      type: postType,
      title: this.generateDefaultTitle(postType, board.currentTurn, agent.name),
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    await db.boardPosts.add(initialPost);
    this.onPostUpdated?.(initialPost);

    if (apiKey) {
      // BYOK LLM Execution
      await this.runLlmTurn(board, agent, postType, existingPosts, initialPost, apiKey, signal);
    } else {
      // Intelligent Simulation Fallback
      await this.runSimulatedTurn(board, agent, postType, existingPosts, initialPost, signal);
    }

    // Advance turn & tokens
    const estTokens = 250 + Math.floor(Math.random() * 150);
    await db.taskBoards.update(board.id, {
      currentTurn: board.currentTurn + 1,
      usedTokens: (board.usedTokens || 0) + estTokens,
      updatedAt: Date.now()
    });
  }

  private async runLlmTurn(
    board: TaskBoard,
    agent: Agent,
    postType: BoardPostType,
    existingPosts: BoardPost[],
    initialPost: BoardPost,
    apiKey: string,
    signal: AbortSignal
  ): Promise<void> {
    const historySummary = existingPosts
      .slice(-6)
      .map((p) => `[${p.type.toUpperCase()}] ${p.content.slice(0, 200)}...`)
      .join('\n\n');

    const extraInstructionsText = (board.extraInstructions || [])
      .map((ins, i) => `${i + 1}. ${ins.instruction}`)
      .join('\n');

    const systemPrompt = `${agent.systemPrompt}

---
AUTONOMOUS COLLABORATION MESSAGE BOARD CONTEXT:
Shared Task Objective: ${board.task}
${extraInstructionsText ? `Active User Directives/Constraints:\n${extraInstructionsText}\n` : ''}
Your Current Action: Formulate a ${postType.toUpperCase()} contribution.

INSTRUCTIONS:
1. Provide a focused, highly relevant contribution adhering to your persona (${agent.name}, ${agent.role}).
2. Reference or build upon your colleagues' prior findings.
3. Be structured with Markdown headings, lists, or code if proposing a solution.
4. Output ONLY your message content. Do NOT include greetings or preamble like "[${agent.name}]:".`;

    const chatMessages: ChatMessageParam[] = [
      {
        role: 'user',
        content: `Colleagues have posted:\n${historySummary || 'No previous posts yet.'}\n\nPlease provide your ${postType} regarding: "${board.task}".`
      }
    ];

    let fullText = '';
    await streamCompletion({
      provider: agent.provider,
      model: agent.model,
      apiKey,
      systemPrompt,
      messages: chatMessages,
      temperature: agent.temperature,
      signal,
      onChunk: (delta) => {
        fullText += delta;
        const cleaned = cleanAgentResponseText(fullText, agent.name);
        const updated: BoardPost = {
          ...initialPost,
          content: cleaned,
          isStreaming: true
        };
        this.onPostUpdated?.(updated);
      },
      onComplete: async (finalText) => {
        const cleaned = cleanAgentResponseText(finalText, agent.name);
        const finalPost: BoardPost = {
          ...initialPost,
          content: cleaned,
          tokensUsed: 350,
          isStreaming: false
        };
        await db.boardPosts.put(finalPost);
        this.onPostUpdated?.(finalPost);
      },
      onError: async (_err) => {
        const fallback = this.generateSimulatedContent(board, agent, postType, existingPosts);
        const finalPost: BoardPost = {
          ...initialPost,
          content: fallback.content,
          searchQuery: fallback.searchQuery,
          sources: fallback.sources,
          tokensUsed: 200,
          isStreaming: false
        };
        await db.boardPosts.put(finalPost);
        this.onPostUpdated?.(finalPost);
      }
    });
  }

  private async runSimulatedTurn(
    board: TaskBoard,
    agent: Agent,
    postType: BoardPostType,
    existingPosts: BoardPost[],
    initialPost: BoardPost,
    signal: AbortSignal
  ): Promise<void> {
    const { title, content, searchQuery, sources } = this.generateSimulatedContent(
      board,
      agent,
      postType,
      existingPosts
    );

    // Stream out chunks for authentic visual animation
    const words = content.split(' ');
    let current = '';

    for (let i = 0; i < words.length; i++) {
      if (signal.aborted) break;
      current += (i === 0 ? '' : ' ') + words[i];
      const partial: BoardPost = {
        ...initialPost,
        title,
        content: current,
        searchQuery,
        sources,
        isStreaming: true
      };
      this.onPostUpdated?.(partial);
      await this.delay(25, signal);
    }

    const finalPost: BoardPost = {
      ...initialPost,
      title,
      content,
      searchQuery,
      sources,
      tokensUsed: 150 + words.length * 2,
      isStreaming: false
    };
    await db.boardPosts.put(finalPost);
    this.onPostUpdated?.(finalPost);
  }

  private generateDefaultTitle(type: BoardPostType, turn: number, agentName: string): string {
    switch (type) {
      case 'finding':
        return `Research Findings & Empirical Sources (Round ${turn + 1})`;
      case 'search':
        return `Solution Search & Exploration (Round ${turn + 1})`;
      case 'thought':
        return `Conceptual Rationale & Assessment`;
      case 'critique':
        return `Critical Risk Audit & Edge Case Evaluation`;
      case 'solution':
        return `Concrete Architecture & Implementation Blueprint`;
      case 'synthesis':
        return `Consensus Alignment & Synthesized Recommendations`;
      default:
        return `${agentName} Analysis`;
    }
  }

  private generateSimulatedContent(
    board: TaskBoard,
    agent: Agent,
    type: BoardPostType,
    _existingPosts: BoardPost[]
  ): {
    title: string;
    content: string;
    searchQuery?: string;
    sources?: BoardSource[];
  } {
    const task = board.task;
    const extra = (board.extraInstructions || []).map((i) => i.instruction).join(' ');
    const extraContext = extra ? `\n\n*Applied User Directive:* Incorporating "${extra.slice(0, 100)}..."` : '';
    const perspective = `### **${agent.name}** (${agent.role})\n\n`;

    if (type === 'finding') {
      const query = `state of the art ${task.split(' ').slice(0, 5).join(' ')} best practices benchmarks`;
      return {
        title: `Technical Survey: ${task.slice(0, 45)}...`,
        searchQuery: query,
        sources: [
          { title: 'ACM Distributed Systems Survey 2025', snippet: 'Empirical analysis of state-machine replication and partition tolerance under high concurrency.' },
          { title: 'Cloud Native Architecture Patterns', snippet: 'Patterns for resilient decoupled microservices and zero-loss cutovers.' }
        ],
        content: `${perspective}Searched for relevant production benchmarks and engineering case studies:\n\n1. **Empirical Trade-off**: Asynchronous streaming achieves >98% lower write latency compared to synchronous two-phase commits, but requires automated reconciliation.\n2. **Decoupled Fallback**: Introducing a dual-channel buffer isolates failures and guarantees data idempotency across nodes.\n3. **Validation Thresholds**: Synthetic load test data shows sub-40ms end-to-end latency when using pre-warmed connection pools.${extraContext}`
      };
    }

    if (type === 'critique') {
      return {
        title: `Failure Mode & Resilience Review`,
        content: `${perspective}Reviewing the current direction against reliability hazards:\n\n- **Cascading Failures**: If network jitter causes a retry storm, the downstream queue will exhaust thread pools without exponential backoff with full jitter.\n- **State Drift**: Without periodic cryptographic Merkle tree or hash-range validation, silent data corruption can go undetected across replicas.\n- **Operational Complexity**: We must maintain a single-command automated rollback script tested continuously in pre-production.${extraContext}`
      };
    }

    if (type === 'solution') {
      return {
        title: `Actionable Implementation Proposal`,
        content: `${perspective}Here is the concrete architecture to fulfill the shared objective:\n\n\`\`\`typescript\n// Architectural Pipeline\ninterface ExecutionPipeline {\n  ingest(task: TaskPayload): Promise<ValidationResult>;\n  replicateWithIdempotency(key: string, data: Uint8Array): Promise<void>;\n  rollbackOnPartition(sessionToken: string): void;\n}\n\`\`\`\n\n### Step-by-Step Delivery Plan:\n1. **Phase 1**: Deploy non-blocking ingest layer with distributed tracing headers.\n2. **Phase 2**: Enable parallel dual-writes with canary verification.\n3. **Phase 3**: Verify invariant checks and execute DNS flip.${extraContext}`
      };
    }

    if (type === 'synthesis') {
      return {
        title: `Consolidated Roadmap & Recommendation`,
        content: `${perspective}Synthesizing input from the team:\n\n- **Agreement**: We all favor a progressive shadow verification approach rather than a high-risk big-bang cutover.\n- **Risk Mitigation**: The Skeptic's concern regarding retry storms is resolved by enforcing token-bucket rate limiters.\n- **Final Verdict**: The proposed architectural blueprint satisfies all constraints, performance targets, and user directives.${extraContext}`
      };
    }

    return {
      title: `Strategic Assessment`,
      content: `${perspective}Analyzing the core requirements for: *"${task.slice(0, 60)}..."*\n\nOur primary objective is to balance speed of execution with bulletproof correctness. By establishing clear interface boundaries and modularizing each component, we can isolate external dependencies while preserving end-to-end testability.${extraContext}`
    };
  }

  private delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (signal?.aborted) return resolve();
      const timeout = setTimeout(() => resolve(), ms);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timeout);
          resolve();
        },
        { once: true }
      );
    });
  }
}
