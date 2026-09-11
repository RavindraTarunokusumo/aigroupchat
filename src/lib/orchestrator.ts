import { db } from './db';
import { getApiKey } from './keys';
import { streamCompletion, type ChatMessageParam } from './llm/streamClient';
import { cleanAgentResponseText } from './cleanText';
import type { Agent, Conversation, Message } from '../types';

export interface TurnStatus {
  isExecuting: boolean;
  currentAgentId: string | null;
  currentAgentName: string | null;
  error: string | null;
}

export class Orchestrator {
  private abortController: AbortController | null = null;
  private onStatusChange?: (status: TurnStatus) => void;
  private onMessageUpdated?: (message: Message) => void;

  constructor(
    onStatusChange?: (status: TurnStatus) => void,
    onMessageUpdated?: (message: Message) => void
  ) {
    this.onStatusChange = onStatusChange;
    this.onMessageUpdated = onMessageUpdated;
  }

  public abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.emitStatus({
      isExecuting: false,
      currentAgentId: null,
      currentAgentName: null,
      error: null
    });
  }

  private emitStatus(status: TurnStatus) {
    this.onStatusChange?.(status);
  }

  /**
   * Dispatches the next turns based on conversation mode and mentions
   */
  public async executeTurn(
    conversation: Conversation,
    allAgents: Agent[],
    userPrompt: string
  ): Promise<void> {
    this.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const activeAgents = allAgents.filter((a) => conversation.activeAgentIds.includes(a.id));
    if (activeAgents.length === 0) {
      this.emitStatus({
        isExecuting: false,
        currentAgentId: null,
        currentAgentName: null,
        error: 'No active agents selected for this chat.'
      });
      return;
    }

    // 1. Determine scheduled agents
    const scheduledAgents = this.planSpeakers(conversation, activeAgents, userPrompt);

    if (scheduledAgents.length === 0) {
      this.emitStatus({
        isExecuting: false,
        currentAgentId: null,
        currentAgentName: null,
        error: 'No matching agent found to respond.'
      });
      return;
    }

    this.emitStatus({
      isExecuting: true,
      currentAgentId: scheduledAgents[0].id,
      currentAgentName: scheduledAgents[0].name,
      error: null
    });

    try {
      for (let i = 0; i < scheduledAgents.length; i++) {
        if (signal.aborted) break;

        const agent = scheduledAgents[i];
        this.emitStatus({
          isExecuting: true,
          currentAgentId: agent.id,
          currentAgentName: agent.name,
          error: null
        });

        await this.runAgentResponse(conversation, activeAgents, agent, signal);
      }
    } catch (err: unknown) {
      if (!signal.aborted) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.emitStatus({
          isExecuting: false,
          currentAgentId: null,
          currentAgentName: null,
          error: errorMsg
        });
      }
    } finally {
      if (!signal.aborted) {
        this.emitStatus({
          isExecuting: false,
          currentAgentId: null,
          currentAgentName: null,
          error: null
        });
      }
    }
  }

  private planSpeakers(
    conversation: Conversation,
    activeAgents: Agent[],
    userPrompt: string
  ): Agent[] {
    const promptLower = userPrompt.toLowerCase();

    // Check for explicit @mentions (e.g. @Logician or @"The Logician" or @Creative)
    const mentionedAgents: Agent[] = [];
    for (const agent of activeAgents) {
      const nameKey = agent.name.toLowerCase();
      const simpleKey = nameKey.replace(/^the\s+/, '');
      if (
        promptLower.includes(`@${nameKey}`) ||
        promptLower.includes(`@${simpleKey}`) ||
        promptLower.includes(`@${agent.id}`)
      ) {
        mentionedAgents.push(agent);
      }
    }

    if (mentionedAgents.length > 0) {
      return mentionedAgents;
    }

    // If conversation mode is 'mention' without explicit mention, respond with the first active agent
    if (conversation.mode === 'mention') {
      return [activeAgents[0]];
    }

    // If conversation mode is 'moderated':
    // If a moderator is present, start with moderator, followed by other active agents
    if (conversation.mode === 'moderated') {
      const moderator = activeAgents.find(
        (a) => a.id.includes('moderator') || a.name.toLowerCase().includes('moderator')
      );
      if (moderator) {
        const others = activeAgents.filter((a) => a.id !== moderator.id);
        return [moderator, ...others];
      }
    }

    // Default 'round-table': all active agents speak in order
    return activeAgents;
  }

  private async runAgentResponse(
    conversation: Conversation,
    activeAgents: Agent[],
    agent: Agent,
    signal: AbortSignal
  ): Promise<void> {
    const apiKey = await getApiKey(agent.provider);
    if (!apiKey) {
      // Create a warning message in the chat
      const warningMsg: Message = {
        id: `msg-err-${Date.now()}-${agent.id}`,
        conversationId: conversation.id,
        senderId: agent.id,
        senderType: 'agent',
        content: `⚠️ *Missing API Key*: Could not generate a response because the **${agent.provider.toUpperCase()}** API key is not set. Please click **API Keys** at the top to configure it.`,
        timestamp: Date.now()
      };
      await db.messages.add(warningMsg);
      this.onMessageUpdated?.(warningMsg);
      return;
    }

    // Fetch conversation history
    const history = await db.messages
      .where('conversationId')
      .equals(conversation.id)
      .sortBy('timestamp');

    // Build context with names
    const chatMessages: ChatMessageParam[] = history.map((msg) => {
      let speakerName = 'User';
      if (msg.senderType === 'agent') {
        const found = activeAgents.find((a) => a.id === msg.senderId);
        speakerName = found ? found.name : 'Agent';
      }
      return {
        role: msg.senderType === 'user' ? 'user' : 'assistant',
        name: speakerName,
        content: msg.content
      };
    });

    // Enhanced system prompt with group roster awareness
    const rosterDescription = activeAgents
      .map((a) => `- ${a.name} (${a.role}) [${a.id === agent.id ? 'YOU' : 'Colleague'}]`)
      .join('\n');

    const enhancedSystemPrompt = `${agent.systemPrompt}

---
GROUP CHAT CONTEXT:
You are in a lively group chat with a human user and fellow AI agents:
${rosterDescription}

CONVERSATION INSTRUCTIONS:
1. Stay strictly in your persona.
2. Address the user and your fellow agents naturally (you can mention them by name like @The Logician or The Skeptic).
3. Be engaging, constructive, and concise. Do not produce walls of redundant text; contribute your distinct perspective.
4. CRITICAL FORMATTING RULE: Output ONLY your spoken message. NEVER begin your reply with your name, role, or brackets (e.g. do NOT write '[${agent.name}]:' or '${agent.name}:'). The chat interface already displays your avatar and name.`;

    // Create placeholder message
    const messageId = `msg-${Date.now()}-${agent.id}`;
    const initialMessage: Message = {
      id: messageId,
      conversationId: conversation.id,
      senderId: agent.id,
      senderType: 'agent',
      content: '',
      modelUsed: `${agent.provider}/${agent.model}`,
      timestamp: Date.now(),
      isStreaming: true
    };

    await db.messages.add(initialMessage);
    this.onMessageUpdated?.(initialMessage);

    let accumulatedContent = '';

    await streamCompletion({
      provider: agent.provider,
      model: agent.model,
      apiKey,
      systemPrompt: enhancedSystemPrompt,
      messages: chatMessages,
      temperature: agent.temperature,
      signal,
      onChunk: (delta) => {
        accumulatedContent += delta;
        const cleaned = cleanAgentResponseText(accumulatedContent, agent.name);
        const updated: Message = {
          ...initialMessage,
          content: cleaned,
          isStreaming: true
        };
        this.onMessageUpdated?.(updated);
      },
      onComplete: async (fullText) => {
        const cleaned = cleanAgentResponseText(fullText, agent.name);
        const finalMessage: Message = {
          ...initialMessage,
          content: cleaned,
          isStreaming: false
        };
        await db.messages.put(finalMessage);
        this.onMessageUpdated?.(finalMessage);
      },
      onError: async (err) => {
        const errorMsg: Message = {
          ...initialMessage,
          content: `❌ *Error generating response*: ${err.message}`,
          isStreaming: false
        };
        await db.messages.put(errorMsg);
        this.onMessageUpdated?.(errorMsg);
      }
    });
  }
}
