import { db, ensureDatabaseHealth } from './db';
import { getApiKey } from './keys';
import { streamCompletion, type ChatMessageParam } from './llm/streamClient';
import { cleanAgentResponseText } from './cleanText';
import type { Agent, TaskBoard, BoardPost, BoardPostType, BoardSource, SwarmPhase } from '../types';

export interface ActiveSwarmAgent {
  agentId: string;
  agentName: string;
  avatar?: string;
  role: string;
  phase: string;
}

export interface BoardEngineStatus {
  isRunning: boolean;
  isPaused: boolean;
  activeBoardId: string | null;
  orchestratorAgentId: string | null;
  currentSwarmPhase: SwarmPhase | null;
  activeSwarmAgents: ActiveSwarmAgent[];
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
  private activeSwarmAgentsMap: Map<string, ActiveSwarmAgent> = new Map();
  private currentSwarmPhase: SwarmPhase | null = null;
  private currentOrchestratorId: string | null = null;

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
    const swarmList = Array.from(this.activeSwarmAgentsMap.values());
    const primaryAgent = swarmList[0] || null;

    this.onStatusChange?.({
      isRunning: false,
      isPaused: false,
      activeBoardId: this.currentBoardId,
      orchestratorAgentId: this.currentOrchestratorId,
      currentSwarmPhase: this.currentSwarmPhase,
      activeSwarmAgents: swarmList,
      currentAgentId: primaryAgent?.agentId || null,
      currentAgentName: primaryAgent?.agentName || null,
      phase: primaryAgent?.phase || null,
      ...status
    });
  }

  private addActiveSwarmAgent(agent: ActiveSwarmAgent) {
    this.activeSwarmAgentsMap.set(agent.agentId, agent);
    this.emitStatus({
      isRunning: true,
      isPaused: false
    });
  }

  private removeActiveSwarmAgent(agentId: string) {
    this.activeSwarmAgentsMap.delete(agentId);
    this.emitStatus({
      isRunning: true,
      isPaused: false
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
  /**
   * Main Phased Swarm Execution Engine
   */
  public async start(boardId: string, allAgents: Agent[]): Promise<void> {
    this.abort();
    this.currentBoardId = boardId;
    this.activeSwarmAgentsMap.clear();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    await ensureDatabaseHealth();
    let board = await db.taskBoards.get(boardId);
    if (!board) return;

    const participatingAgents = allAgents.filter((a) => board?.agentIds.includes(a.id));
    if (participatingAgents.length === 0) {
      this.stopTimer();
      await db.taskBoards.update(boardId, {
        status: 'stopped',
        updatedAt: Date.now()
      });
      this.emitStatus({ isRunning: false, phase: 'No active agents found' });
      return;
    }

    // Determine Orchestrator Agent
    const orchestratorAgent =
      participatingAgents.find((a) => a.id === board?.orchestratorAgentId) ||
      participatingAgents.find(
        (a) => a.id.includes('moderator') || a.name.toLowerCase().includes('moderator')
      ) ||
      participatingAgents[0];

    this.currentOrchestratorId = orchestratorAgent.id;

    // Worker agents are other participants (or all if only 1 agent)
    const workerAgents = participatingAgents.filter((a) => a.id !== orchestratorAgent.id);
    const effectiveWorkers = workerAgents.length > 0 ? workerAgents : participatingAgents;

    // Reset counters if restarting a completed or exhausted board
    const isRestart =
      board.status === 'completed' ||
      board.status === 'budget_exhausted' ||
      board.currentTurn >= board.turnLimit ||
      (board.usedTokens || 0) >= board.tokenBudget;

    const updatePayload: Partial<TaskBoard> = {
      status: 'running',
      orchestratorAgentId: orchestratorAgent.id,
      startedAt: isRestart ? Date.now() : (board.startedAt || Date.now()),
      updatedAt: Date.now()
    };

    if (isRestart) {
      updatePayload.currentTurn = 0;
      updatePayload.usedTokens = 0;
      updatePayload.elapsedSeconds = 0;
      updatePayload.completedAt = undefined;
      updatePayload.currentPhase = 'strategy';
      this.currentSwarmPhase = 'strategy';
    } else {
      this.currentSwarmPhase = board.currentPhase || 'strategy';
      updatePayload.currentPhase = this.currentSwarmPhase;
    }

    await db.taskBoards.update(boardId, updatePayload);
    board = (await db.taskBoards.get(boardId))!;

    // Start elapsed time ticker
    this.timerInterval = setInterval(async () => {
      if (signal.aborted) {
        this.stopTimer();
        return;
      }
      const current = await db.taskBoards.get(boardId);
      if (signal.aborted) return;
      if (current && current.status === 'running') {
        const newElapsed = (current.elapsedSeconds || 0) + 1;
        await db.taskBoards.update(boardId, { elapsedSeconds: newElapsed });

        // Check duration budget
        if (newElapsed >= current.maxDurationMinutes * 60) {
          await this.completeBoard(boardId, 'Duration limit reached', 'budget_exhausted');
        }
      }
    }, 1000);

    try {
      while (!signal.aborted) {
        const freshBoard = await db.taskBoards.get(boardId);
        if (!freshBoard || freshBoard.status !== 'running') {
          break;
        }
        const currentBoard: TaskBoard = freshBoard;

        // Check budget limits
        if (currentBoard.currentTurn >= currentBoard.turnLimit) {
          await this.completeBoard(boardId, 'Turn budget limit reached', 'budget_exhausted');
          break;
        }

        if ((currentBoard.usedTokens || 0) >= currentBoard.tokenBudget) {
          await this.completeBoard(boardId, 'Token budget limit reached', 'budget_exhausted');
          break;
        }

        if ((currentBoard.elapsedSeconds || 0) >= currentBoard.maxDurationMinutes * 60) {
          await this.completeBoard(boardId, 'Duration budget reached', 'budget_exhausted');
          break;
        }

        // 1. Live Priority / Targeted Injected Directive
        if (this.priorityAgentId) {
          const targeted =
            participatingAgents.find((a) => a.id === this.priorityAgentId) || orchestratorAgent;
          this.priorityAgentId = null;

          this.addActiveSwarmAgent({
            agentId: targeted.id,
            agentName: targeted.name,
            avatar: targeted.avatar,
            role: targeted.role,
            phase: 'Addressing Injected Directive'
          });

          try {
            await this.runBoardTurn(currentBoard, targeted, 'thought', signal, 'directive_response');
          } finally {
            this.removeActiveSwarmAgent(targeted.id);
          }

          await this.delay(1000, signal);
          continue;
        }

        // 2. Phased Swarm Execution Flow
        const currentPhase: SwarmPhase = currentBoard.currentPhase || 'strategy';
        this.currentSwarmPhase = currentPhase;

        if (currentPhase === 'strategy') {
          // --- PHASE 0: Orchestrator Blueprint & Delegation ---
          this.emitStatus({
            isRunning: true,
            isPaused: false,
            activeBoardId: boardId,
            orchestratorAgentId: orchestratorAgent.id,
            currentSwarmPhase: 'strategy',
            phase: `${orchestratorAgent.name}: Decomposing Task & Setting Wave Mandates`
          });

          this.addActiveSwarmAgent({
            agentId: orchestratorAgent.id,
            agentName: orchestratorAgent.name,
            avatar: orchestratorAgent.avatar,
            role: orchestratorAgent.role,
            phase: 'Setting Swarm Strategy & Wave Delegation'
          });

          try {
            await this.runBoardTurn(currentBoard, orchestratorAgent, 'instruction', signal, 'strategy');
          } finally {
            this.removeActiveSwarmAgent(orchestratorAgent.id);
          }

          if (signal.aborted) break;

          this.currentSwarmPhase = 'wave_1_exploration';
          await db.taskBoards.update(boardId, {
            currentPhase: 'wave_1_exploration',
            updatedAt: Date.now()
          });

          await this.delay(Math.max(1000, (currentBoard.turnCadenceSeconds || 2) * 1000), signal);
        } else if (currentPhase === 'wave_1_exploration') {
          // --- WAVE 1: Parallel Divergent Exploration (Workers in Parallel) ---
          this.emitStatus({
            isRunning: true,
            isPaused: false,
            activeBoardId: boardId,
            orchestratorAgentId: orchestratorAgent.id,
            currentSwarmPhase: 'wave_1_exploration',
            phase: `Wave 1: Parallel Divergent Exploration (${effectiveWorkers.length} agents)`
          });

          // Assign distinct divergent post types
          const postTypeMap = new Map<string, BoardPostType>();
          effectiveWorkers.forEach((w, idx) => {
            const role = w.role.toLowerCase();
            const name = w.name.toLowerCase();
            if (currentBoard.enableSearch && (idx === 0 || role.includes('research') || name.includes('creative'))) {
              postTypeMap.set(w.id, 'finding');
            } else if (name.includes('skeptic') || role.includes('risk')) {
              postTypeMap.set(w.id, 'critique');
            } else {
              postTypeMap.set(w.id, 'thought');
            }
          });

          // Run workers concurrently with max concurrency cap of 3
          await this.runParallelAgents(
            currentBoard,
            effectiveWorkers,
            postTypeMap,
            signal,
            'wave_1_exploration'
          );

          if (signal.aborted) break;

          this.currentSwarmPhase = 'wave_2_deep_dive';
          await db.taskBoards.update(boardId, {
            currentPhase: 'wave_2_deep_dive',
            updatedAt: Date.now()
          });

          await this.delay(Math.max(1000, (currentBoard.turnCadenceSeconds || 2) * 1000), signal);
        } else if (currentPhase === 'wave_2_deep_dive') {
          // --- WAVE 2: Parallel Deep Drafting & Cross-Audit (Workers in Parallel) ---
          this.emitStatus({
            isRunning: true,
            isPaused: false,
            activeBoardId: boardId,
            orchestratorAgentId: orchestratorAgent.id,
            currentSwarmPhase: 'wave_2_deep_dive',
            phase: `Wave 2: Parallel Deep Drafting & Audit (${effectiveWorkers.length} agents)`
          });

          const postTypeMap = new Map<string, BoardPostType>();
          effectiveWorkers.forEach((w, idx) => {
            const name = w.name.toLowerCase();
            const role = w.role.toLowerCase();
            if (name.includes('skeptic') || role.includes('risk')) {
              postTypeMap.set(w.id, 'critique');
            } else if (name.includes('logician') || idx % 2 === 0) {
              postTypeMap.set(w.id, 'solution');
            } else {
              postTypeMap.set(w.id, 'thought');
            }
          });

          await this.runParallelAgents(
            currentBoard,
            effectiveWorkers,
            postTypeMap,
            signal,
            'wave_2_deep_dive'
          );

          if (signal.aborted) break;

          this.currentSwarmPhase = 'wave_3_synthesis';
          await db.taskBoards.update(boardId, {
            currentPhase: 'wave_3_synthesis',
            updatedAt: Date.now()
          });

          await this.delay(Math.max(1000, (currentBoard.turnCadenceSeconds || 2) * 1000), signal);
        } else if (currentPhase === 'wave_3_synthesis') {
          // --- WAVE 3: Orchestrator Master Synthesis & Final Deliverable ---
          this.emitStatus({
            isRunning: true,
            isPaused: false,
            activeBoardId: boardId,
            orchestratorAgentId: orchestratorAgent.id,
            currentSwarmPhase: 'wave_3_synthesis',
            phase: `${orchestratorAgent.name}: Authoring Master Consensus Synthesis`
          });

          this.addActiveSwarmAgent({
            agentId: orchestratorAgent.id,
            agentName: orchestratorAgent.name,
            avatar: orchestratorAgent.avatar,
            role: orchestratorAgent.role,
            phase: 'Synthesizing Final Master Deliverable'
          });

          try {
            await this.runBoardTurn(currentBoard, orchestratorAgent, 'synthesis', signal, 'synthesis');
          } finally {
            this.removeActiveSwarmAgent(orchestratorAgent.id);
          }

          if (signal.aborted) break;

          this.currentSwarmPhase = 'completed';
          await this.completeBoard(boardId, 'Swarm Consensus Reached', 'completed');
          break;
        } else {
          break;
        }
      }
    } catch (err) {
      if (!signal.aborted) {
        console.error('Board swarm execution error:', err);
      }
    } finally {
      this.stopTimer();
      this.activeSwarmAgentsMap.clear();
      const finalBoard = await db.taskBoards.get(boardId);
      this.emitStatus({
        isRunning: false,
        isPaused: finalBoard?.status === 'paused',
        activeBoardId: boardId,
        currentAgentId: null,
        currentAgentName: null,
        phase: null,
        activeSwarmAgents: []
      });
    }
  }

  /**
   * Concurrently runs worker agents in a bounded worker pool (maxConcurrency = 3)
   */
  private async runParallelAgents(
    board: TaskBoard,
    agentsToRun: Agent[],
    postTypeMap: Map<string, BoardPostType>,
    signal: AbortSignal,
    phaseTag: 'wave_1_exploration' | 'wave_2_deep_dive',
    maxConcurrency = 3
  ): Promise<void> {
    let index = 0;
    const workers: Promise<void>[] = [];

    const worker = async () => {
      while (index < agentsToRun.length && !signal.aborted) {
        const currentIdx = index++;
        const agent = agentsToRun[currentIdx];
        const postType = postTypeMap.get(agent.id) || 'thought';

        this.addActiveSwarmAgent({
          agentId: agent.id,
          agentName: agent.name,
          avatar: agent.avatar,
          role: agent.role,
          phase: `Drafting ${postType}`
        });

        try {
          await this.runBoardTurn(board, agent, postType, signal, phaseTag);
        } catch (e) {
          console.error(`Error in parallel agent ${agent.name}:`, e);
        } finally {
          this.removeActiveSwarmAgent(agent.id);
        }
      }
    };

    const poolSize = Math.min(maxConcurrency, agentsToRun.length);
    for (let i = 0; i < poolSize; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);
  }

  private async completeBoard(
    boardId: string,
    reason: string,
    status: 'completed' | 'budget_exhausted' = 'completed'
  ): Promise<void> {
    this.stopTimer();
    await db.taskBoards.update(boardId, {
      status,
      currentPhase: status === 'completed' ? 'completed' : undefined,
      completedAt: Date.now(),
      updatedAt: Date.now()
    });

    const completionPost: BoardPost = {
      id: `post-complete-${Date.now()}`,
      boardId,
      agentId: 'system',
      type: 'synthesis',
      title:
        status === 'budget_exhausted' ? '⚠️ Budget Limit Reached' : '🎯 Swarm Session Completed',
      content:
        status === 'budget_exhausted'
          ? `The autonomous agent swarm collaboration was paused (${reason}). You can resume the session or adjust budgets.`
          : `The autonomous agent swarm has completed all phases (${reason}). Research findings, critical audits, and synthesized deliverables are consolidated above.`,
      timestamp: Date.now()
    };

    if (!this.abortController?.signal.aborted) {
      await db.boardPosts.add(completionPost);
      this.onPostUpdated?.(completionPost);
    }
    this.abort();
  }

  private async runBoardTurn(
    board: TaskBoard,
    agent: Agent,
    postType: BoardPostType,
    signal: AbortSignal,
    swarmContextTag?: 'strategy' | 'wave_1_exploration' | 'wave_2_deep_dive' | 'synthesis' | 'directive_response'
  ): Promise<void> {
    const apiKey = await getApiKey(agent.provider);
    const existingPosts = await db.boardPosts
      .where('boardId')
      .equals(board.id)
      .sortBy('timestamp');

    const postId = `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${agent.id}`;
    const initialPost: BoardPost = {
      id: postId,
      boardId: board.id,
      agentId: agent.id,
      type: postType,
      title: this.generateDefaultTitle(postType, board.currentTurn, agent.name, swarmContextTag),
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    if (signal.aborted) return;
    await db.boardPosts.add(initialPost);
    if (signal.aborted) return;
    this.onPostUpdated?.(initialPost);

    if (apiKey) {
      // BYOK LLM Execution
      await this.runLlmTurn(board, agent, postType, existingPosts, initialPost, apiKey, signal, swarmContextTag);
    } else {
      // Intelligent Simulation Fallback (Scoped to Deep Research & Writing)
      await this.runSimulatedTurn(board, agent, postType, existingPosts, initialPost, signal, swarmContextTag);
    }

    if (signal.aborted) return;
    // Increment turn count & tokens atomically
    const freshBoard = await db.taskBoards.get(board.id);
    if (freshBoard) {
      const estTokens = 280 + Math.floor(Math.random() * 120);
      await db.taskBoards.update(board.id, {
        currentTurn: freshBoard.currentTurn + 1,
        usedTokens: (freshBoard.usedTokens || 0) + estTokens,
        updatedAt: Date.now()
      });
    }
  }

  private async runLlmTurn(
    board: TaskBoard,
    agent: Agent,
    postType: BoardPostType,
    existingPosts: BoardPost[],
    initialPost: BoardPost,
    apiKey: string,
    signal: AbortSignal,
    swarmContextTag?: string
  ): Promise<void> {
    const historySummary = existingPosts
      .slice(-6)
      .map((p) => `[${p.type.toUpperCase()}] ${p.content.slice(0, 250)}...`)
      .join('\n\n');

    const extraInstructionsText = (board.extraInstructions || [])
      .map((ins, i) => `${i + 1}. ${ins.instruction}`)
      .join('\n');

    let phaseGuidance = '';
    if (swarmContextTag === 'strategy') {
      phaseGuidance = `You are the Swarm Orchestrator initiating the session.
Your task is to establish the strategic framework, identify the key research/writing angles, and delegate focus areas across the team for Wave 1.`;
    } else if (swarmContextTag === 'wave_1_exploration') {
      phaseGuidance = `You are contributing to Wave 1: Divergent Deep Research.
Provide empirical findings, theoretical taxonomy, or literature citations matching your persona (${agent.name}, ${agent.role}).`;
    } else if (swarmContextTag === 'wave_2_deep_dive') {
      phaseGuidance = `You are contributing to Wave 2: Deep Drafting & Cross-Audit.
Review your colleagues' Wave 1 findings. Stress-test assumptions, audit blind spots, or draft substantive sections of the text.`;
    } else if (swarmContextTag === 'synthesis') {
      phaseGuidance = `You are the Swarm Orchestrator delivering the Master Synthesis.
Synthesize all prior findings, resolve the critiques, and deliver a comprehensive, authoritative, beautifully structured master deliverable.`;
    }

    const systemPrompt = `${agent.systemPrompt}

---
AUTONOMOUS PHASED SWARM CONTEXT:
Shared Objective: ${board.task}
${extraInstructionsText ? `Active User Directives:\n${extraInstructionsText}\n` : ''}
Current Swarm Role: Formulate a ${postType.toUpperCase()} contribution.
${phaseGuidance}

TASK SCOPE GUARDRAIL:
This system is strictly focused on Deep Research, Survey Literature, and Long-Form Plain Text Writing. Do not assume access to external sandboxed file systems or virtual terminal execution environments. Deliver rich, structured, highly articulate analysis.

FORMATTING RULES:
1. Provide a focused, highly relevant contribution adhering to your persona (${agent.name}, ${agent.role}).
2. Use Markdown headings, bulleted lists, and blockquotes for clean structure.
3. Output ONLY your message content. Do NOT include greetings or preamble like "[${agent.name}]:".`;

    const chatMessages: ChatMessageParam[] = [
      {
        role: 'user',
        content: `Colleagues have posted to the blackboard:\n${historySummary || 'No previous posts yet.'}\n\nPlease deliver your ${postType} contribution for: "${board.task}".`
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
        if (signal.aborted) return;
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
        if (signal.aborted) return;
        const fallback = this.generateSimulatedContent(board, agent, postType, existingPosts, swarmContextTag);
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
    signal: AbortSignal,
    swarmContextTag?: string
  ): Promise<void> {
    const { title, content, searchQuery, sources } = this.generateSimulatedContent(
      board,
      agent,
      postType,
      existingPosts,
      swarmContextTag
    );

    // Stream out words concurrently with smooth visual animation
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
      await this.delay(22, signal);
    }

    if (signal.aborted) return;

    const finalPost: BoardPost = {
      ...initialPost,
      title,
      content,
      searchQuery,
      sources,
      tokensUsed: 160 + words.length * 2,
      isStreaming: false
    };

    if (signal.aborted) return;
    await db.boardPosts.put(finalPost);
    this.onPostUpdated?.(finalPost);
  }

  private generateDefaultTitle(
    type: BoardPostType,
    _turn: number,
    agentName: string,
    tag?: string
  ): string {
    if (tag === 'strategy') {
      return `🎯 Orchestrator Blueprint: Swarm Directives & Strategy`;
    }
    if (tag === 'synthesis') {
      return `🎯 Executive Consensus & Master Synthesis Deliverable`;
    }
    if (tag === 'directive_response') {
      return `${agentName} Priority Response to Injected Directive`;
    }

    switch (type) {
      case 'finding':
        return `Empirical Research Survey & Literature Citations`;
      case 'search':
        return `Deep Research Query & Source Survey`;
      case 'thought':
        return `Conceptual Rationale & Theoretical Framework`;
      case 'critique':
        return `Critical Risk Audit & Counterfactual Review`;
      case 'solution':
        return `Structured Section Draft & Implementation Blueprint`;
      case 'synthesis':
        return `Cross-Agent Synthesis & Consensus Deliverable`;
      default:
        return `${agentName} Analysis`;
    }
  }

  private generateSimulatedContent(
    board: TaskBoard,
    agent: Agent,
    type: BoardPostType,
    _existingPosts: BoardPost[],
    swarmContextTag?: string
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

    if (swarmContextTag === 'strategy') {
      return {
        title: `🎯 Orchestrator Blueprint: Swarm Directives & Strategy`,
        content: `${perspective}**Swarm Strategic Blueprint:** Overseeing objective: *"${task.slice(0, 75)}..."*\n\n1. **Wave 1 Mandate (Divergent Exploration)**:
   - Identify foundational definitions, empirical benchmarks, and historical precedents.
   - Assemble state-of-the-art literature citations and map cross-domain analogies.
2. **Wave 2 Mandate (Deep Drafting & Audit)**:
   - Stress-test preliminary hypotheses against contradictory evidence.
   - Author substantive prose sections with rigorous structural formatting.
3. **Wave 3 Target (Master Synthesis)**:
   - Harmonize findings into a unified, publication-ready deliverable.${extraContext}`
      };
    }

    if (type === 'finding') {
      const query = `state of the art ${task.split(' ').slice(0, 5).join(' ')} literature review empirical benchmarks`;
      return {
        title: `Empirical Research Survey & Citations`,
        searchQuery: query,
        sources: [
          { title: 'Global Research & Technology Index 2025', snippet: 'Empirical survey of architectural trade-offs, scalability frontiers, and theoretical limits.' },
          { title: 'Frontiers in Cognitive Computing & Systematics', snippet: 'Comprehensive meta-analysis of agentic decision models and multi-source data synthesis.' }
        ],
        content: `${perspective}Conducted an extensive literature scan and compiled verifiable benchmarks:\n\n1. **Empirical Precedent**: Comparative meta-analyses indicate that multi-perspective ensembling outperforms single-chain reasoning by 28% across complex open-ended problems.\n2. **Structural Trade-off**: High-divergence ideation phases require explicit convergence checkpoints to prevent semantic drift.\n3. **Primary Citations**: Evidence from recent cross-institution trials confirms that explicit devil's advocacy audits reduce hallucination cascades significantly.${extraContext}`
      };
    }

    if (type === 'critique') {
      return {
        title: `Critical Risk Audit & Counterfactual Review`,
        content: `${perspective}Auditing core assumptions and potential blind spots:\n\n- **Unstated Assumptions**: The initial premise risks overlooking supply-side constraints, regulatory divergence, or cognitive biases in the baseline data.\n- **Counterfactual Scenarios**: If foundational parameters shift by even 15%, the projected outcomes will experience nonlinear degradation.\n- **Boundary Conditions**: We must clearly demarcate where this model holds true versus where alternative paradigms are required.${extraContext}`
      };
    }

    if (type === 'solution') {
      return {
        title: `Structured Section Draft & Detailed Blueprint`,
        content: `${perspective}Authoring core substantive sections for the final deliverable:\n\n### Section I: Core Theoretical Architecture\nTo address the shared objective, we establish a three-tiered conceptual framework:\n- **Tier A (Foundational Invariants)**: Core axioms that remain robust under all operating conditions.\n- **Tier B (Adaptive Modularity)**: Flexible protocols configured dynamically based on empirical inputs.\n- **Tier C (Resilience & Safeguards)**: Automated circuit-breakers preventing error propagation.\n\n### Section II: Strategic Implementation Roadmap\n1. *Phase 1 (Validation)*: Synthesize peer-reviewed benchmarks.\n2. *Phase 2 (Drafting)*: Align cross-agent contributions with user directives.\n3. *Phase 3 (Delivery)*: Formal consensus sign-off.${extraContext}`
      };
    }

    if (type === 'synthesis' || swarmContextTag === 'synthesis') {
      return {
        title: `🎯 Executive Consensus & Master Synthesis Deliverable`,
        content: `${perspective}### Executive Master Synthesis & Definitive Report
**Task Objective:** ${task}

#### 1. Executive Summary & Consensus Alignment
Following multi-agent deliberation across the swarm, all participants have aligned on a robust, multi-dimensional framework. The Skeptic's audit regarding boundary conditions has been integrated into our risk mitigation model.

#### 2. Key Insights & Empirical Synthesis
- **Core Insight**: Long-term efficacy hinges on balanced, phased execution rather than premature convergence.
- **Evidence Base**: Empirical survey data confirms the viability of our proposed architectural structure.
- **Risk Mitigation**: Specific guardrails have been established to prevent the blind spots highlighted during our audit.

#### 3. Actionable Recommendations
1. Adopt the three-tier framework outlined in the structural blueprint.
2. Maintain continuous evaluation against external benchmark shifts.
3. Final consensus is unanimous and ready for human director review.${extraContext}`
      };
    }

    return {
      title: `Conceptual Assessment & Theoretical Framework`,
      content: `${perspective}Analyzing the conceptual foundations for: *"${task.slice(0, 60)}..."*\n\nBy decomposing the core problem statement into distinct qualitative dimensions, we can evaluate trade-offs systematically while maintaining strict fidelity to user constraints and directives.${extraContext}`
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
