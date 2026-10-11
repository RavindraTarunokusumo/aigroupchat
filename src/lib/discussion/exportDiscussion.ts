import type {
  DiscussionThread,
  ConversationThread,
  DiscussionMessage,
  Agent,
  MessageAttachment,
  ThreadActionType
} from '../../types';

/**
 * Escapes raw strings for safe HTML inclusion
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats timestamps into human-readable locale strings
 */
function formatDateTime(timestamp?: number): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString();
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Maps ThreadActionType into clear, human-readable editorial labels
 */
function getActionLabel(actionType: ThreadActionType, senderType?: string): string {
  if (senderType === 'user') return 'Director Directive';

  switch (actionType) {
    case 'initial_response':
      return 'Initial Framing Stance';
    case 'reply_main':
      return 'Main Thread Contribution';
    case 'reply_thread':
      return 'Sub-Thread Reply';
    case 'spawn_thread':
      return 'Branch Sub-Thread';
    case 'join_thread':
      return 'Join Sub-Thread';
    case 'leave_thread':
      return 'Leave Sub-Thread';
    case 'synthesize_to_main':
      return 'Synthesis to Main Thread';
    case 'propose_conclude':
      return 'Propose Conclusion';
    case 'agree_conclude':
      return 'Agree Conclusion';
    case 'contest_conclude':
      return 'Contest Conclusion';
    case 'concluded':
      return 'Deliberation Concluded';
    default:
      return 'Contribution';
  }
}

/**
 * Resolves sender display metadata from agents roster or system/user roles
 */
interface SenderMeta {
  name: string;
  role: string;
  monogram: string;
  color: string;
  isUser: boolean;
  isSystem: boolean;
  model: string;
}

function resolveSenderMeta(
  senderId: string,
  senderType: 'user' | 'agent' | 'system',
  agentMap: Map<string, Agent>,
  modelUsed?: string
): SenderMeta {
  if (senderType === 'user' || senderId === 'user') {
    return {
      name: 'Human Director',
      role: 'Deliberation Facilitator',
      monogram: 'DIR',
      color: '#111111',
      isUser: true,
      isSystem: false,
      model: 'Human Steering'
    };
  }

  if (senderType === 'system' || senderId === 'system') {
    return {
      name: 'System Synthesizer',
      role: 'Autonomous Coordinator',
      monogram: 'SYS',
      color: '#787774',
      isUser: false,
      isSystem: true,
      model: 'Autonomous Engine'
    };
  }

  const agent = agentMap.get(senderId);
  return {
    name: agent?.name || 'Deliberation Agent',
    role: agent?.role || 'Deliberation Participant',
    monogram: agent?.monogram || agent?.name?.slice(0, 2).toUpperCase() || 'AI',
    color: agent?.color || '#111111',
    isUser: false,
    isSystem: false,
    model: modelUsed || (agent ? `${agent.provider}/${agent.model}` : 'Simulated Agent')
  };
}

/**
 * Lightweight, safe offline Markdown to HTML renderer for standalone HTML exports.
 * Escapes input first, then converts headings, quotes, lists, bold/italics, and code fences.
 */
function safeMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  const raw = markdown.replace(/\r\n/g, '\n').trim();

  // 1. Extract triple-backtick code blocks to protect them from downstream regexes
  const codeBlocks: string[] = [];
  const withoutCodeBlocks = raw.replace(
    /```([a-zA-Z0-9_-]*)[ \t]*\n([\s\S]*?)\n```/g,
    (_, lang, code) => {
      const idx = codeBlocks.length;
      const escapedCode = escapeHtml(code);
      const langAttr = lang ? ` data-lang="${escapeHtml(lang)}"` : '';
      codeBlocks.push(
        `<pre class="code-block"${langAttr}><code class="lang-${escapeHtml(lang || 'text')}">${escapedCode}</code></pre>`
      );
      return `__CODE_BLOCK_SLOT_${idx}__`;
    }
  );

  // 2. Extract inline backtick code snippets
  const inlineCodes: string[] = [];
  const withoutInline = withoutCodeBlocks.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(`<code class="inline-code">${escapeHtml(code)}</code>`);
    return `__INLINE_CODE_SLOT_${idx}__`;
  });

  // 3. Escape HTML on the surrounding prose
  let prose = escapeHtml(withoutInline);

  // 4. Headers (h1, h2, h3, h4)
  prose = prose.replace(/^#### (.*?)$/gm, '<h4 class="md-h4">$1</h4>');
  prose = prose.replace(/^### (.*?)$/gm, '<h3 class="md-h3">$1</h3>');
  prose = prose.replace(/^## (.*?)$/gm, '<h2 class="md-h2">$1</h2>');
  prose = prose.replace(/^# (.*?)$/gm, '<h1 class="md-h1">$1</h1>');

  // 5. Blockquotes (lines starting with &gt;)
  prose = prose.replace(
    /^(?:&gt;[ \t]*(.*?)(?:\n|$))+/gm,
    (match) => {
      const inner = match
        .split('\n')
        .map((line) => line.replace(/^&gt;[ \t]?/, '').trim())
        .filter(Boolean)
        .join('<br/>');
      return `<blockquote class="md-blockquote">${inner}</blockquote>\n`;
    }
  );

  // 6. Bold and italic formatting
  prose = prose.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  prose = prose.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  prose = prose.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  prose = prose.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 7. Unordered lists
  prose = prose.replace(
    /^(?:-[ \t]+(.*?)(?:\n|$))+/gm,
    (match) => {
      const items = match
        .split('\n')
        .map((line) => line.replace(/^-[ \t]+/, '').trim())
        .filter(Boolean)
        .map((item) => `<li>${item}</li>`)
        .join('');
      return `<ul class="md-ul">${items}</ul>\n`;
    }
  );

  // 8. Ordered lists
  prose = prose.replace(
    /^(?:\d+\.[ \t]+(.*?)(?:\n|$))+/gm,
    (match) => {
      const items = match
        .split('\n')
        .map((line) => line.replace(/^\d+\.[ \t]+/, '').trim())
        .filter(Boolean)
        .map((item) => `<li>${item}</li>`)
        .join('');
      return `<ol class="md-ol">${items}</ol>\n`;
    }
  );

  // 9. Horizontal rules
  prose = prose.replace(/^---$/gm, '<hr class="md-hr"/>');

  // 10. Restore code snippets and blocks
  inlineCodes.forEach((code, idx) => {
    prose = prose.replace(`__INLINE_CODE_SLOT_${idx}__`, code);
  });
  codeBlocks.forEach((block, idx) => {
    prose = prose.replace(`__CODE_BLOCK_SLOT_${idx}__`, block);
  });

  // 11. Convert paragraphs / double newlines to paragraph wrappers
  const paragraphs = prose
    .split(/\n\n+/)
    .map((chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return '';
      // If block starts with a block tag, do not wrap in <p>
      if (/^<(h[1-4]|blockquote|ul|ol|pre|hr)/.test(trimmed)) {
        return trimmed;
      }
      return `<p class="md-p">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .filter(Boolean);

  return paragraphs.join('\n');
}

/**
 * Formats a message attachment into clean Markdown
 */
function formatAttachmentMarkdown(att: MessageAttachment): string {
  let md = `\n> 📎 **Attachment: \`${att.name}\`**`;
  if (att.title) md += ` — *${att.title}*`;
  md += `\n`;
  if (att.summary) {
    md += `> *Summary:* ${att.summary}\n`;
  }
  const lang = att.language || (att.type === 'json' ? 'json' : att.type === 'code' ? 'ts' : 'markdown');
  md += `\n\`\`\`${lang}\n${att.content.trim()}\n\`\`\`\n`;
  return md;
}

/**
 * Export complete discussion as publication-grade Markdown (.md)
 */
export function exportDiscussionAsMarkdown(
  discussion: DiscussionThread,
  threads: ConversationThread[],
  messages: DiscussionMessage[],
  agents: Agent[]
): string {
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const participatingAgents = agents.filter((a) => discussion.activeAgentIds.includes(a.id));

  // Partition messages
  const barrierMessages = messages.filter(
    (m) => m.threadId == null && m.actionType === 'initial_response'
  );
  const mainThreadMessages = messages.filter(
    (m) => m.threadId == null && m.actionType !== 'initial_response'
  );
  const subThreadsMap = new Map<string, DiscussionMessage[]>();
  threads.forEach((t) => {
    subThreadsMap.set(
      t.id,
      messages.filter((m) => m.threadId === t.id)
    );
  });

  let md = `# Deliberation Report: ${discussion.title}\n\n`;
  md += `> **Core Thesis:** ${discussion.topic}\n\n`;
  md += `---\n\n`;

  // --- 1. Discussion Metadata ---
  md += `## 📋 Deliberation Metadata\n\n`;
  md += `- **Discussion ID:** \`${discussion.id}\`\n`;
  md += `- **Status:** \`${discussion.status.toUpperCase()}\`\n`;
  md += `- **Initiated:** ${formatDateTime(discussion.createdAt)}\n`;
  md += `- **Last Updated:** ${formatDateTime(discussion.updatedAt)}\n`;

  const budgetStr =
    discussion.tokenBudget && discussion.tokenBudget > 0
      ? `${(discussion.tokensUsed || 0).toLocaleString()} / ${discussion.tokenBudget.toLocaleString()} tokens (${Math.min(
          100,
          Math.round(((discussion.tokensUsed || 0) / discussion.tokenBudget) * 100)
        )}%)`
      : `${(discussion.tokensUsed || 0).toLocaleString()} tokens (Unlimited budget)`;
  md += `- **Token Utilization:** ${budgetStr}\n`;

  if (discussion.status === 'completed') {
    const reasonLabel =
      discussion.concludedReason === 'token_budget'
        ? 'Token Budget Exhausted'
        : discussion.concludedReason === 'agent_consensus'
        ? 'Supermajority Agent Consensus'
        : 'Director Manual Intervention';
    md += `- **Conclusion Reason:** ${reasonLabel}\n`;
    if (discussion.concludeVotes?.length) {
      const voterNames = discussion.concludeVotes
        .map((id) => agentMap.get(id)?.name || id)
        .join(', ');
      md += `- **Consensus Voters:** ${voterNames}\n`;
    }
  }

  if (discussion.barrierTotal) {
    md += `- **Synchronization Barrier:** ${discussion.barrierResponded || 0}/${discussion.barrierTotal} agent framing stances received\n`;
  }
  md += `- **Specialized Sub-Threads Spawned:** ${threads.length}\n`;
  md += `- **Total Deliberation Turns:** ${messages.length}\n\n`;

  // --- 2. Participating Agents ---
  md += `## 👥 Participating Agents Swarm (${participatingAgents.length})\n\n`;
  participatingAgents.forEach((agent) => {
    md += `- **${agent.name}** (\`${agent.monogram}\`) — *${agent.role}*\n`;
    md += `  - **Model:** \`${agent.provider}/${agent.model}\` | **Temperature:** ${agent.temperature}\n`;
  });
  md += `\n---\n\n`;

  // --- 3. Phase 1: Synchronization Barrier (Initial Framing Stances) ---
  md += `## 🛡️ Phase 1: Synchronization Barrier (Initial Framing Stances)\n\n`;
  md += `*Independent baseline propositions and formal invariants formulated by each agent prior to concurrent cross-thread debate:*\n\n`;

  if (barrierMessages.length === 0) {
    md += `*No initial barrier stances recorded.*\n\n`;
  } else {
    barrierMessages.forEach((msg, idx) => {
      const sender = resolveSenderMeta(msg.senderId, msg.senderType, agentMap, msg.modelUsed);
      const timeStr = formatTime(msg.timestamp);
      const telemetryStr = msg.telemetry
        ? ` (${msg.telemetry.isLive ? 'Live BYOK' : 'Simulated'}, ~${msg.telemetry.tokensUsed || 0} tok, ${(
            (msg.telemetry.latencyMs || 0) / 1000
          ).toFixed(1)}s)`
        : '';

      md += `### ${idx + 1}. ${sender.name} (\`${sender.monogram}\`) — ${timeStr}\n\n`;
      md += `**Role:** ${sender.role} | **Model:** \`${sender.model}\`${telemetryStr}\n\n`;

      if (msg.mentions?.length) {
        const mentionNames = msg.mentions.map((id) => agentMap.get(id)?.name || `@${id}`).join(', ');
        md += `*Mentions:* ${mentionNames}\n\n`;
      }

      md += `${msg.content.trim()}\n`;

      if (msg.attachments?.length) {
        msg.attachments.forEach((att) => {
          md += formatAttachmentMarkdown(att);
        });
      }

      md += `\n---\n\n`;
    });
  }

  // --- 4. Main Discussion Thread ---
  md += `## 💬 Main Discussion Thread\n\n`;
  md += `*Overarching deliberation turns, directives, sub-thread forks, and multi-agent synthesis:*\n\n`;

  if (mainThreadMessages.length === 0) {
    md += `*No main thread turns recorded beyond the initial barrier.*\n\n`;
  } else {
    mainThreadMessages.forEach((msg, idx) => {
      const sender = resolveSenderMeta(msg.senderId, msg.senderType, agentMap, msg.modelUsed);
      const timeStr = formatTime(msg.timestamp);
      const actionLabel = getActionLabel(msg.actionType, msg.senderType);
      const telemetryStr = msg.telemetry
        ? ` | ~${msg.telemetry.tokensUsed || 0} tok | ${((msg.telemetry.latencyMs || 0) / 1000).toFixed(1)}s`
        : '';

      md += `### Turn ${idx + 1}: ${sender.name} — ${actionLabel} (${timeStr})\n\n`;
      md += `**Speaker:** ${sender.role} | **Model:** \`${sender.model}\`${telemetryStr}\n\n`;

      if (msg.spawnedTopic) {
        md += `> 🌿 **Branched Sub-Thread:** "${msg.spawnedTopic}"\n\n`;
      }

      if (msg.mentions?.length) {
        const mentionNames = msg.mentions.map((id) => agentMap.get(id)?.name || `@${id}`).join(', ');
        md += `*Mentions:* ${mentionNames}\n\n`;
      }

      md += `${msg.content.trim()}\n`;

      if (msg.attachments?.length) {
        msg.attachments.forEach((att) => {
          md += formatAttachmentMarkdown(att);
        });
      }

      md += `\n---\n\n`;
    });
  }

  // --- 5. Specialized Sub-Threads ---
  if (threads.length > 0) {
    md += `## 🌿 Specialized Sub-Threads (${threads.length})\n\n`;

    threads.forEach((thread, tIdx) => {
      const threadMsgs = subThreadsMap.get(thread.id) || [];
      const initiator = resolveSenderMeta(thread.initiatorAgentId, 'agent', agentMap);
      const activeNames = thread.activeAgentIds
        .map((id) => agentMap.get(id)?.name || id)
        .join(', ');

      md += `### Sub-Thread ${tIdx + 1}: ${thread.topic}\n\n`;
      md += `- **Thread ID:** \`${thread.id}\`\n`;
      md += `- **Initiator:** ${initiator.name} (${initiator.role})\n`;
      md += `- **Status:** \`${thread.status.toUpperCase()}\` | **Turns:** ${thread.turnCount}\n`;
      md += `- **Active Participants:** ${activeNames}\n`;
      md += `- **Created:** ${formatDateTime(thread.createdAt)} | **Updated:** ${formatDateTime(thread.updatedAt)}\n`;

      if (thread.catalystMessageIds?.length) {
        md += `- **Catalyst Messages:** ${thread.catalystMessageIds.map((id) => `\`${id}\``).join(', ')}\n`;
      }
      md += `\n`;

      if (threadMsgs.length === 0) {
        md += `*No contributions recorded in this sub-thread.*\n\n`;
      } else {
        threadMsgs.forEach((msg, mIdx) => {
          const sender = resolveSenderMeta(msg.senderId, msg.senderType, agentMap, msg.modelUsed);
          const timeStr = formatTime(msg.timestamp);
          const actionLabel = getActionLabel(msg.actionType, msg.senderType);

          md += `#### ${tIdx + 1}.${mIdx + 1} ${sender.name} — ${actionLabel} (${timeStr})\n\n`;
          md += `**Model:** \`${sender.model}\`\n\n`;

          if (msg.mentions?.length) {
            const mentionNames = msg.mentions.map((id) => agentMap.get(id)?.name || `@${id}`).join(', ');
            md += `*Mentions:* ${mentionNames}\n\n`;
          }

          md += `${msg.content.trim()}\n`;

          if (msg.attachments?.length) {
            msg.attachments.forEach((att) => {
              md += formatAttachmentMarkdown(att);
            });
          }

          md += `\n`;
        });
      }

      md += `---\n\n`;
    });
  }

  // --- 6. Final Status & Conclusion Sign-Off ---
  md += `## 🏁 Conclusion Status & Verification\n\n`;
  md += `- **Deliberation Status:** \`${discussion.status.toUpperCase()}\`\n`;
  md += `- **Report Generated:** ${new Date().toISOString()}\n`;
  if (discussion.concludedReason) {
    md += `- **Conclusion Reason:** \`${discussion.concludedReason}\`\n`;
  }
  if (discussion.concludeVotes?.length) {
    md += `- **Agreed Voters:** ${discussion.concludeVotes.join(', ')}\n`;
  }
  md += `\n*Deliberation transcript exported via AI Group Chat Multi-Format Exporter.*\n`;

  return md;
}

/**
 * Export complete discussion as structured, clean JSON (.json)
 */
export function exportDiscussionAsJson(
  discussion: DiscussionThread,
  threads: ConversationThread[],
  messages: DiscussionMessage[],
  agents: Agent[]
): string {
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  const formatMessageJson = (msg: DiscussionMessage) => {
    const sender = resolveSenderMeta(msg.senderId, msg.senderType, agentMap, msg.modelUsed);
    return {
      id: msg.id,
      discussionId: msg.discussionId,
      threadId: msg.threadId ?? null,
      senderId: msg.senderId,
      senderType: msg.senderType,
      senderName: sender.name,
      senderRole: sender.role,
      senderMonogram: sender.monogram,
      actionType: msg.actionType,
      actionLabel: getActionLabel(msg.actionType, msg.senderType),
      content: msg.content,
      spawnedTopic: msg.spawnedTopic,
      spawnedThreadId: msg.spawnedThreadId,
      mentions: msg.mentions || [],
      replyToMessageIds: msg.replyToMessageIds || [],
      wakeTrigger: msg.wakeTrigger,
      timestamp: msg.timestamp,
      formattedTime: new Date(msg.timestamp).toISOString(),
      modelUsed: msg.modelUsed,
      telemetry: msg.telemetry,
      attachments: msg.attachments || []
    };
  };

  const barrierMessages = messages.filter(
    (m) => m.threadId == null && m.actionType === 'initial_response'
  );
  const mainThreadMessages = messages.filter(
    (m) => m.threadId == null && m.actionType !== 'initial_response'
  );

  const payload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    discussion: {
      id: discussion.id,
      title: discussion.title,
      topic: discussion.topic,
      status: discussion.status,
      tokenBudget: discussion.tokenBudget ?? null,
      tokensUsed: discussion.tokensUsed ?? 0,
      concludedReason: discussion.concludedReason ?? null,
      concludeVotes: discussion.concludeVotes ?? [],
      barrierTotal: discussion.barrierTotal ?? null,
      barrierResponded: discussion.barrierResponded ?? null,
      createdAt: discussion.createdAt,
      formattedCreatedAt: new Date(discussion.createdAt).toISOString(),
      updatedAt: discussion.updatedAt,
      formattedUpdatedAt: new Date(discussion.updatedAt).toISOString()
    },
    participants: agents
      .filter((a) => discussion.activeAgentIds.includes(a.id))
      .map((a) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        avatar: a.avatar,
        monogram: a.monogram,
        color: a.color,
        provider: a.provider,
        model: a.model,
        temperature: a.temperature
      })),
    barrierStances: barrierMessages.map(formatMessageJson),
    mainThread: {
      turnsCount: mainThreadMessages.length,
      messages: mainThreadMessages.map(formatMessageJson)
    },
    subThreads: threads.map((t) => ({
      id: t.id,
      topic: t.topic,
      initiatorAgentId: t.initiatorAgentId,
      initiatorName:
        agentMap.get(t.initiatorAgentId)?.name ||
        (t.initiatorAgentId === 'user' ? 'Human Director' : t.initiatorAgentId),
      activeAgentIds: t.activeAgentIds,
      activeAgents: t.activeAgentIds.map((id) => agentMap.get(id)?.name || id),
      status: t.status,
      turnCount: t.turnCount,
      catalystMessageIds: t.catalystMessageIds || [],
      createdAt: t.createdAt,
      formattedCreatedAt: new Date(t.createdAt).toISOString(),
      updatedAt: t.updatedAt,
      formattedUpdatedAt: new Date(t.updatedAt).toISOString(),
      messages: messages.filter((m) => m.threadId === t.id).map(formatMessageJson)
    })),
    allMessages: messages.map(formatMessageJson),
    summary: {
      totalMessages: messages.length,
      barrierStancesCount: barrierMessages.length,
      mainThreadTurnsCount: mainThreadMessages.length,
      subThreadsCount: threads.length,
      totalAttachmentsCount: messages.reduce((acc, m) => acc + (m.attachments?.length || 0), 0)
    }
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Render a single message card in HTML format
 */
function renderMessageCardHtml(
  msg: DiscussionMessage,
  agentMap: Map<string, Agent>,
  threadContextLabel?: string
): string {
  const sender = resolveSenderMeta(msg.senderId, msg.senderType, agentMap, msg.modelUsed);
  const actionLabel = getActionLabel(msg.actionType, msg.senderType);
  const timeStr = formatTime(msg.timestamp);

  const telemetryBadges = `
    ${
      msg.telemetry?.isLive
        ? `<span class="badge badge-live"><span class="live-dot"></span> Live [${escapeHtml(msg.telemetry.provider)}]</span>`
        : !sender.isUser && !sender.isSystem
        ? `<span class="badge badge-sim">Simulated</span>`
        : ''
    }
    ${
      msg.telemetry?.tokensUsed
        ? `<span class="badge badge-meta">~${msg.telemetry.tokensUsed} tok</span>`
        : ''
    }
    ${
      msg.telemetry?.latencyMs
        ? `<span class="badge badge-meta">${((msg.telemetry.latencyMs || 0) / 1000).toFixed(1)}s</span>`
        : ''
    }
  `;

  const mentionsHtml =
    msg.mentions && msg.mentions.length > 0
      ? `<div class="message-mentions">
          <span class="mention-label">Mentions:</span>
          ${msg.mentions
            .map((id) => {
              const name = agentMap.get(id)?.name || `@${id}`;
              return `<span class="mention-pill">${escapeHtml(name)}</span>`;
            })
            .join(' ')}
        </div>`
      : '';

  const spawnedThreadHtml =
    msg.spawnedTopic && msg.spawnedThreadId
      ? `<div class="spawned-thread-callout">
          <div class="spawned-header">
            <span class="spawned-tag">🌿 Spawned Sub-Thread</span>
            <span class="spawned-title">${escapeHtml(msg.spawnedTopic)}</span>
          </div>
          <span class="spawned-id font-mono">ID: ${escapeHtml(msg.spawnedThreadId)}</span>
        </div>`
      : '';

  const attachmentsHtml =
    msg.attachments && msg.attachments.length > 0
      ? `<div class="attachments-container">
          <div class="attachments-label">Document Attachments (${msg.attachments.length}):</div>
          ${msg.attachments
            .map((att) => {
              const lang = att.language || att.type || 'text';
              return `
                <details class="attachment-box" open>
                  <summary class="attachment-header">
                    <div class="attachment-meta">
                      <span class="doc-icon">📄</span>
                      <strong class="doc-name font-mono">${escapeHtml(att.name)}</strong>
                      ${att.title ? `<span class="doc-title">— ${escapeHtml(att.title)}</span>` : ''}
                      <span class="doc-lang-pill font-mono">${escapeHtml(lang.toUpperCase())}</span>
                    </div>
                    <button type="button" class="copy-doc-btn" onclick="copyAttachmentText('${escapeHtml(att.id)}', this)">Copy</button>
                  </summary>
                  ${att.summary ? `<div class="doc-summary">${escapeHtml(att.summary)}</div>` : ''}
                  <pre class="doc-body font-mono"><code id="doc-content-${escapeHtml(att.id)}">${escapeHtml(att.content.trim())}</code></pre>
                </details>
              `;
            })
            .join('\n')}
        </div>`
      : '';

  const actionPillClass = `pill-${msg.actionType.replace(/_/g, '-')}`;

  return `
    <article class="message-card" data-action="${escapeHtml(msg.actionType)}" data-sender="${escapeHtml(msg.senderId)}" data-thread="${escapeHtml(msg.threadId || 'main')}">
      <header class="message-header">
        <div class="speaker-meta">
          <div class="monogram-badge font-mono" style="border-color: ${escapeHtml(sender.color)};">
            ${escapeHtml(sender.monogram)}
          </div>
          <div class="speaker-text">
            <div class="speaker-title-line">
              <span class="speaker-name">${escapeHtml(sender.name)}</span>
              <span class="speaker-role">${escapeHtml(sender.role)}</span>
              ${threadContextLabel ? `<span class="thread-context-tag font-mono">${escapeHtml(threadContextLabel)}</span>` : ''}
            </div>
            <div class="speaker-subline">
              <time class="time-stamp font-mono">${timeStr}</time>
              <span class="model-badge font-mono">${escapeHtml(sender.model)}</span>
              ${telemetryBadges}
            </div>
          </div>
        </div>
        <div class="action-badges-strip">
          <span class="action-pill font-mono ${actionPillClass}">
            ${escapeHtml(actionLabel)}
          </span>
        </div>
      </header>

      ${spawnedThreadHtml}
      ${mentionsHtml}

      <div class="message-body prose-content">
        ${safeMarkdownToHtml(msg.content)}
      </div>

      ${attachmentsHtml}
    </article>
  `;
}

/**
 * Export discussion as self-contained standalone HTML report (.html)
 * Styled with editorial typography (serif Newsreader/Georgia for headings, sans-serif for body, monospace for code/telemetry),
 * print styles, responsive layout, search filter, and tab navigation between Main Discussion and Sub-Threads.
 */
export function exportDiscussionAsHtml(
  discussion: DiscussionThread,
  threads: ConversationThread[],
  messages: DiscussionMessage[],
  agents: Agent[]
): string {
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const participatingAgents = agents.filter((a) => discussion.activeAgentIds.includes(a.id));

  const barrierMessages = messages.filter(
    (m) => m.threadId == null && m.actionType === 'initial_response'
  );
  const mainThreadMessages = messages.filter(
    (m) => m.threadId == null && m.actionType !== 'initial_response'
  );

  // Pre-render Barrier Stances HTML
  const barrierCardsHtml =
    barrierMessages.length > 0
      ? barrierMessages.map((m) => renderMessageCardHtml(m, agentMap, 'Phase 1 Barrier')).join('\n')
      : '<div class="empty-state">No initial framing stances recorded.</div>';

  // Pre-render Main Deliberation Turns HTML
  const mainCardsHtml =
    mainThreadMessages.length > 0
      ? mainThreadMessages.map((m) => renderMessageCardHtml(m, agentMap, 'Main Thread')).join('\n')
      : '<div class="empty-state">No main thread turns recorded beyond the initial barrier.</div>';

  // Pre-render Sub-Threads Panes HTML
  const subThreadsPanesHtml = threads
    .map((thread) => {
      const threadMsgs = messages.filter((m) => m.threadId === thread.id);
      const initiator = resolveSenderMeta(thread.initiatorAgentId, 'agent', agentMap);
      const activeNames = thread.activeAgentIds
        .map((id) => agentMap.get(id)?.name || id)
        .join(', ');

      const cardsHtml =
        threadMsgs.length > 0
          ? threadMsgs.map((m) => renderMessageCardHtml(m, agentMap, thread.topic)).join('\n')
          : '<div class="empty-state">No contributions recorded in this sub-thread yet.</div>';

      const catalystHtml =
        thread.catalystMessageIds && thread.catalystMessageIds.length > 0
          ? `<div class="subthread-catalyst font-mono">
              <strong>Catalyst Main-Thread Messages:</strong> ${thread.catalystMessageIds
                .map((id) => `<span>#${escapeHtml(id)}</span>`)
                .join(', ')}
            </div>`
          : '';

      return `
        <section id="pane-thread-${escapeHtml(thread.id)}" class="tab-pane" data-pane="thread-${escapeHtml(thread.id)}">
          <div class="subthread-header-card">
            <div class="subthread-title-strip">
              <span class="subthread-badge font-mono uppercase">Specialized Sub-Thread</span>
              <span class="thread-status-badge font-mono uppercase status-${escapeHtml(thread.status)}">${escapeHtml(thread.status)}</span>
            </div>
            <h2 class="subthread-topic-heading">${escapeHtml(thread.topic)}</h2>
            <div class="subthread-meta-grid font-sans">
              <div><strong>Initiator:</strong> ${escapeHtml(initiator.name)} (${escapeHtml(initiator.role)})</div>
              <div><strong>Turns:</strong> ${thread.turnCount}</div>
              <div><strong>Created:</strong> ${formatDateTime(thread.createdAt)}</div>
              <div><strong>Active Agents:</strong> ${escapeHtml(activeNames)}</div>
            </div>
            ${catalystHtml}
          </div>

          <div class="cards-stream">
            ${cardsHtml}
          </div>
        </section>
      `;
    })
    .join('\n');

  // Pre-render Unified All-Timeline Pane HTML
  const allCardsHtml =
    messages.length > 0
      ? messages
          .map((m) => {
            const threadTopic = m.threadId
              ? threads.find((t) => t.id === m.threadId)?.topic || 'Sub-Thread'
              : m.actionType === 'initial_response'
              ? 'Phase 1 Barrier'
              : 'Main Thread';
            return renderMessageCardHtml(m, agentMap, threadTopic);
          })
          .join('\n')
      : '<div class="empty-state">No contributions recorded.</div>';

  // Budget calculations
  const budgetPercentage =
    discussion.tokenBudget && discussion.tokenBudget > 0
      ? Math.min(
          100,
          Math.round(((discussion.tokensUsed || 0) / discussion.tokenBudget) * 100)
        )
      : null;

  const conclusionReasonText =
    discussion.status === 'completed'
      ? discussion.concludedReason === 'token_budget'
        ? 'Token Ceiling Reached'
        : discussion.concludedReason === 'agent_consensus'
        ? 'Supermajority Consensus'
        : 'Director Intervention'
      : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(discussion.title)} — Autonomous Deliberation Report</title>
  <style>
    /* --- CSS RESET & ROOT VARIABLES --- */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --bg: #F7F6F3;
      --surface: #FFFFFF;
      --surface-border: #EAEAEA;
      --surface-subtle: #F9F9F8;
      --text: #111111;
      --text-muted: #787774;
      --text-prose: #2F3437;
      --accent: #111111;
      --accent-hover: #2F3437;
      --border-focus: #111111;

      /* Editorial typography stack */
      --font-serif: Newsreader, "Playfair Display", Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, "Times New Roman", serif;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      padding: 32px 16px 64px;
    }

    .container {
      max-width: 960px;
      margin: 0 auto;
    }

    /* --- EDITORIAL MASTHEAD --- */
    .masthead {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .masthead-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .publication-eyebrow {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-active { background: #EDF3EC; color: #346538; }
    .status-paused { background: #FDEBEC; color: #9F2F2D; }
    .status-completed { background: #E1F3FE; color: #1F6C9F; }
    .status-barrier_wait { background: #FBF3DB; color: #956400; }

    .masthead-title {
      font-family: var(--font-serif);
      font-size: 2rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      line-height: 1.25;
      color: var(--text);
      margin-bottom: 20px;
    }

    /* Thesis Callout */
    .thesis-box {
      background: #FBFBFA;
      border-left: 3px solid var(--accent);
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin-bottom: 24px;
    }

    .thesis-label {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .thesis-text {
      font-family: var(--font-serif);
      font-size: 1.15rem;
      font-style: italic;
      color: var(--text);
      line-height: 1.5;
    }

    /* Metadata Bar */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--surface-border);
      font-size: 12px;
      color: var(--text-muted);
    }

    .meta-item strong {
      color: var(--text);
      font-weight: 600;
    }

    .token-meter-wrapper {
      margin-top: 4px;
      height: 4px;
      background: #EAEAEA;
      border-radius: 9999px;
      overflow: hidden;
    }

    .token-meter-fill {
      height: 100%;
      background: #346538;
      border-radius: 9999px;
    }

    /* Participants Strip */
    .participants-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--surface-border);
    }

    .participants-title {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 10px;
    }

    .participants-roster {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .participant-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--surface-subtle);
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
    }

    .participant-mono {
      font-family: var(--font-mono);
      font-weight: 600;
      font-size: 10px;
    }

    .participant-role {
      color: var(--text-muted);
      font-size: 11px;
    }

    /* --- INTERACTIVE TOOLBAR --- */
    .toolbar-section {
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .tabs-strip {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--surface-border);
    }

    .tab-btn {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      padding: 8px 14px;
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      color: var(--text);
    }

    .tab-btn.active {
      color: var(--text);
      font-weight: 600;
      border-bottom-color: var(--text);
    }

    .tab-counter {
      font-family: var(--font-mono);
      font-size: 10px;
      background: #EAEAEA;
      color: var(--text);
      padding: 1px 6px;
      border-radius: 9999px;
      margin-left: 4px;
    }

    .controls-strip {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-input-box {
      flex: 1;
      min-width: 240px;
      position: relative;
    }

    .search-input {
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 12px;
      font-family: var(--font-sans);
      color: var(--text);
      outline: none;
      transition: border-color 0.15s;
    }

    .search-input:focus {
      border-color: var(--border-focus);
    }

    .action-filters {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .filter-btn {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 11px;
      font-family: var(--font-sans);
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .filter-btn:hover, .filter-btn.active {
      background: var(--text);
      color: #FFFFFF;
      border-color: var(--text);
    }

    .results-count {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
      margin-left: auto;
    }

    /* --- PANES & CARDS STREAM --- */
    .tab-pane {
      display: none;
    }

    .tab-pane.active {
      display: block;
    }

    .section-intro-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      padding: 18px 24px;
      margin-bottom: 20px;
    }

    .section-intro-card h3 {
      font-family: var(--font-serif);
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .section-intro-card p {
      color: var(--text-muted);
      font-size: 12px;
    }

    .cards-stream {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* --- MESSAGE CARD --- */
    .message-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      padding: 20px 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      transition: box-shadow 0.15s;
    }

    .message-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--surface-border);
      margin-bottom: 14px;
      flex-wrap: wrap;
    }

    .speaker-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .monogram-badge {
      width: 34px;
      height: 34px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      border: 2px solid #111111;
      background: var(--surface-subtle);
      color: #111111;
      flex-shrink: 0;
    }

    .speaker-title-line {
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
    }

    .speaker-name {
      font-weight: 600;
      font-size: 13px;
      color: var(--text);
    }

    .speaker-role {
      font-size: 11px;
      color: var(--text-muted);
    }

    .thread-context-tag {
      font-size: 9px;
      background: #F7F6F3;
      border: 1px solid var(--surface-border);
      border-radius: 4px;
      padding: 1px 6px;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .speaker-subline {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
      flex-wrap: wrap;
    }

    .time-stamp {
      font-size: 10px;
    }

    .model-badge {
      font-size: 10px;
      color: var(--text-muted);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: var(--font-mono);
      font-size: 9px;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .badge-live { background: #EDF3EC; color: #346538; border: 1px solid #D1E2CF; }
    .badge-sim { background: #FBF3DB; color: #956400; border: 1px solid #F2E4B8; }
    .badge-meta { background: #F7F6F3; color: var(--text-muted); border: 1px solid #EAEAEA; }

    .live-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #346538;
      display: inline-block;
    }

    .action-badges-strip {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .action-pill {
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 9999px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .pill-initial-response { background: #FBF3DB; color: #956400; }
    .pill-reply-main { background: #F7F6F3; color: #787774; }
    .pill-reply-thread { background: #F7F6F3; color: #787774; }
    .pill-spawn-thread { background: #E1F3FE; color: #1F6C9F; }
    .pill-synthesize-to-main { background: #EDF3EC; color: #346538; }
    .pill-propose-conclude { background: #FBF3DB; color: #956400; }
    .pill-agree-conclude { background: #EDF3EC; color: #346538; }
    .pill-contest-conclude { background: #FDEBEC; color: #9F2F2D; }
    .pill-concluded { background: #E1F3FE; color: #1F6C9F; }

    /* Callouts & Mentions */
    .spawned-thread-callout {
      background: #F7F6F3;
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .spawned-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .spawned-tag {
      font-family: var(--font-mono);
      font-size: 9px;
      text-transform: uppercase;
      background: #E1F3FE;
      color: #1F6C9F;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    .spawned-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
    }

    .spawned-id {
      font-size: 10px;
      color: var(--text-muted);
    }

    .message-mentions {
      font-size: 11px;
      margin-bottom: 10px;
      color: var(--text-muted);
    }

    .mention-label {
      font-weight: 500;
    }

    .mention-pill {
      background: #F7F6F3;
      border: 1px solid var(--surface-border);
      border-radius: 4px;
      padding: 1px 6px;
      color: var(--text);
      font-weight: 500;
    }

    /* Message Prose Formatting */
    .prose-content {
      font-size: 13.5px;
      color: var(--text-prose);
      line-height: 1.65;
      word-break: break-word;
    }

    .prose-content p { margin-bottom: 10px; }
    .prose-content p:last-child { margin-bottom: 0; }

    .md-h1 { font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; margin: 16px 0 8px; color: var(--text); }
    .md-h2 { font-family: var(--font-serif); font-size: 1.15rem; font-weight: 600; margin: 14px 0 6px; color: var(--text); }
    .md-h3 { font-family: var(--font-serif); font-size: 1rem; font-weight: 600; margin: 12px 0 4px; color: var(--text); }
    .md-h4 { font-family: var(--font-sans); font-size: 0.9rem; font-weight: 600; margin: 10px 0 4px; color: var(--text); }

    .md-blockquote {
      border-left: 2px solid var(--text);
      background: #FBFBFA;
      padding: 8px 14px;
      margin: 10px 0;
      color: var(--text-muted);
      font-style: italic;
      font-size: 13px;
    }

    .md-ul, .md-ol {
      padding-left: 20px;
      margin: 8px 0 12px;
    }

    .md-ul li, .md-ol li {
      margin-bottom: 4px;
    }

    .inline-code {
      font-family: var(--font-mono);
      font-size: 11px;
      background: #F7F6F3;
      border: 1px solid var(--surface-border);
      border-radius: 4px;
      padding: 1px 5px;
      color: #9F2F2D;
    }

    .code-block {
      background: #F7F6F3;
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      padding: 12px 16px;
      overflow-x: auto;
      font-family: var(--font-mono);
      font-size: 11.5px;
      line-height: 1.5;
      color: #111111;
      margin: 10px 0;
    }

    .md-hr {
      border: 0;
      border-top: 1px solid var(--surface-border);
      margin: 16px 0;
    }

    /* Attachments in Card */
    .attachments-container {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .attachments-label {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .attachment-box {
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      background: #FBFBFA;
      overflow: hidden;
      font-size: 12px;
    }

    .attachment-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #F9F9F8;
      border-bottom: 1px solid var(--surface-border);
      cursor: pointer;
      user-select: none;
    }

    .attachment-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .doc-icon { font-size: 12px; }
    .doc-name { color: var(--text); font-size: 11px; }
    .doc-title { color: var(--text-muted); font-size: 11px; }

    .doc-lang-pill {
      font-size: 9px;
      background: #EAEAEA;
      color: var(--text-muted);
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 600;
    }

    .copy-doc-btn {
      background: #FFFFFF;
      border: 1px solid var(--surface-border);
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 10px;
      font-family: var(--font-sans);
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.1s;
    }

    .copy-doc-btn:hover {
      background: #F7F6F3;
      color: var(--text);
    }

    .doc-summary {
      padding: 8px 12px;
      font-size: 11px;
      font-style: italic;
      color: var(--text-muted);
      border-bottom: 1px solid var(--surface-border);
    }

    .doc-body {
      padding: 12px;
      font-size: 11px;
      background: #FFFFFF;
      overflow-x: auto;
      white-space: pre-wrap;
      line-height: 1.5;
    }

    /* Sub-thread Header Card */
    .subthread-header-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .subthread-title-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .subthread-badge {
      font-size: 10px;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .thread-status-badge {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 9999px;
      font-weight: 600;
    }

    .subthread-topic-heading {
      font-family: var(--font-serif);
      font-size: 1.5rem;
      font-weight: 600;
      line-height: 1.3;
      color: var(--text);
      margin-bottom: 14px;
    }

    .subthread-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      font-size: 12px;
      color: var(--text-muted);
      border-top: 1px solid var(--surface-border);
      padding-top: 12px;
    }

    .subthread-catalyst {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid var(--surface-border);
      font-size: 11px;
      color: var(--text-muted);
    }

    .empty-state {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
    }

    /* Utility */
    .font-mono { font-family: var(--font-mono); }
    .font-serif { font-family: var(--font-serif); }
    .font-sans { font-family: var(--font-sans); }

    /* --- PRINT STYLES --- */
    @media print {
      body {
        background: #FFFFFF !important;
        color: #000000 !important;
        padding: 0 !important;
      }

      .no-print,
      .toolbar-section,
      .copy-doc-btn {
        display: none !important;
      }

      .masthead,
      .message-card,
      .subthread-header-card,
      .section-intro-card {
        box-shadow: none !important;
        border: 1px solid #CCCCCC !important;
        background: #FFFFFF !important;
        break-inside: avoid;
        margin-bottom: 18px !important;
      }

      .tab-pane {
        display: block !important;
        page-break-after: auto;
      }

      #pane-all {
        display: none !important; /* Avoid duplicate printing of the combined chronology */
      }

      .message-body,
      .doc-body {
        color: #000000 !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Editorial Masthead -->
    <header class="masthead">
      <div class="masthead-top">
        <span class="publication-eyebrow">AI Group Chat &bull; Deliberation Monograph</span>
        <span class="status-badge status-${escapeHtml(discussion.status)}">
          ${escapeHtml(discussion.status.toUpperCase())}
          ${conclusionReasonText ? ` &mdash; ${escapeHtml(conclusionReasonText)}` : ''}
        </span>
      </div>

      <h1 class="masthead-title">${escapeHtml(discussion.title)}</h1>

      <div class="thesis-box">
        <div class="thesis-label">Core Deliberation Thesis</div>
        <div class="thesis-text">&ldquo;${escapeHtml(discussion.topic)}&rdquo;</div>
      </div>

      <div class="meta-grid font-sans">
        <div class="meta-item">
          <strong>Discussion ID:</strong>
          <span class="font-mono">${escapeHtml(discussion.id)}</span>
        </div>
        <div class="meta-item">
          <strong>Initiated:</strong>
          <span>${formatDateTime(discussion.createdAt)}</span>
        </div>
        <div class="meta-item">
          <strong>Last Activity:</strong>
          <span>${formatDateTime(discussion.updatedAt)}</span>
        </div>
        <div class="meta-item">
          <strong>Token Ceiling:</strong>
          <span>${(discussion.tokensUsed || 0).toLocaleString()} ${
            discussion.tokenBudget ? `/ ${discussion.tokenBudget.toLocaleString()} tok` : 'tokens'
          }</span>
          ${
            budgetPercentage !== null
              ? `<div class="token-meter-wrapper">
                  <div class="token-meter-fill" style="width: ${budgetPercentage}%;"></div>
                </div>`
              : ''
          }
        </div>
      </div>

      <div class="participants-section">
        <div class="participants-title">Participating Swarm Roster (${participatingAgents.length} Agents)</div>
        <div class="participants-roster">
          ${participatingAgents
            .map((agent) => {
              return `
                <div class="participant-pill">
                  <span class="participant-mono font-mono" style="color: ${escapeHtml(agent.color)};">
                    [${escapeHtml(agent.monogram)}]
                  </span>
                  <strong>${escapeHtml(agent.name)}</strong>
                  <span class="participant-role">(${escapeHtml(agent.role)})</span>
                  <span class="font-mono text-muted" style="font-size: 10px;">${escapeHtml(agent.model)}</span>
                </div>
              `;
            })
            .join('\n')}
        </div>
      </div>
    </header>

    <!-- Interactive Navigation & Filter Toolbar -->
    <section class="toolbar-section no-print">
      <nav class="tabs-strip">
        <button type="button" class="tab-btn active" data-tab-target="main" onclick="switchDiscussionTab('main', this)">
          Main Discussion <span class="tab-counter">${barrierMessages.length + mainThreadMessages.length}</span>
        </button>
        ${threads
          .map((t) => {
            const count = messages.filter((m) => m.threadId === t.id).length;
            return `
              <button type="button" class="tab-btn" data-tab-target="thread-${escapeHtml(t.id)}" onclick="switchDiscussionTab('thread-${escapeHtml(t.id)}', this)">
                🌿 ${escapeHtml(t.topic)} <span class="tab-counter">${count}</span>
              </button>
            `;
          })
          .join('\n')}
        <button type="button" class="tab-btn" data-tab-target="all" onclick="switchDiscussionTab('all', this)">
          All Timeline <span class="tab-counter">${messages.length}</span>
        </button>
      </nav>

      <div class="controls-strip">
        <div class="search-input-box">
          <input
            type="text"
            id="searchInput"
            class="search-input"
            placeholder="Search arguments, documents, code, or agents..."
            oninput="handleSearch(this.value)"
          />
        </div>

        <div class="action-filters">
          <button type="button" class="filter-btn active" onclick="filterAction('all', this)">All</button>
          <button type="button" class="filter-btn" onclick="filterAction('initial_response', this)">Barrier Stances</button>
          <button type="button" class="filter-btn" onclick="filterAction('spawn_thread', this)">Thread Forks</button>
          <button type="button" class="filter-btn" onclick="filterAction('synthesize_to_main', this)">Syntheses</button>
          <button type="button" class="filter-btn" onclick="filterAction('propose_conclude', this)">Conclusions</button>
        </div>

        <div class="results-count" id="resultsCount">
          Showing ${barrierMessages.length + mainThreadMessages.length} contributions
        </div>
      </div>
    </section>

    <!-- Main Discussion Pane (Barrier + Main Deliberation) -->
    <main id="pane-main" class="tab-pane active" data-pane="main">
      <div class="section-intro-card">
        <h3>Phase 1: Synchronization Barrier</h3>
        <p>Independent baseline propositions, safety invariants, and initial framing stances formulated by participating models.</p>
      </div>

      <div class="cards-stream" style="margin-bottom: 32px;">
        ${barrierCardsHtml}
      </div>

      <div class="section-intro-card">
        <h3>Main Deliberation Turns</h3>
        <p>Continuous cross-model debate, Director directives, sub-thread spawning, and global synthesis.</p>
      </div>

      <div class="cards-stream">
        ${mainCardsHtml}
      </div>
    </main>

    <!-- Sub-Thread Panes -->
    ${subThreadsPanesHtml}

    <!-- All-Chronological Combined Pane -->
    <section id="pane-all" class="tab-pane" data-pane="all">
      <div class="section-intro-card">
        <h3>Complete Deliberation Chronology</h3>
        <p>Unified chronological stream across Main Discussion, Synchronization Barrier, and all branched Sub-Threads.</p>
      </div>
      <div class="cards-stream">
        ${allCardsHtml}
      </div>
    </section>
  </div>

  <!-- Interactive Offline Vanilla JS -->
  <script>
    let activeTabId = 'main';
    let searchQuery = '';
    let activeActionFilter = 'all';

    function switchDiscussionTab(tabId, btn) {
      activeTabId = tabId;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');

      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      const targetPane = document.getElementById('pane-' + tabId);
      if (targetPane) targetPane.classList.add('active');

      applyCardFilters();
    }

    function filterAction(action, btn) {
      activeActionFilter = action;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      applyCardFilters();
    }

    function handleSearch(val) {
      searchQuery = val.toLowerCase().trim();
      applyCardFilters();
    }

    function applyCardFilters() {
      const activePane = document.getElementById('pane-' + activeTabId);
      if (!activePane) return;

      const cards = activePane.querySelectorAll('.message-card');
      let visibleCount = 0;

      cards.forEach(card => {
        const action = card.getAttribute('data-action') || '';
        const text = card.textContent.toLowerCase();

        const matchesAction = activeActionFilter === 'all' || action === activeActionFilter;
        const matchesSearch = !searchQuery || text.includes(searchQuery);

        if (matchesAction && matchesSearch) {
          card.style.display = 'block';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      const countLabel = document.getElementById('resultsCount');
      if (countLabel) {
        countLabel.textContent = 'Showing ' + visibleCount + ' contribution' + (visibleCount === 1 ? '' : 's');
      }
    }

    function copyAttachmentText(id, btn) {
      const el = document.getElementById('doc-content-' + id);
      if (!el) return;
      const originalText = btn.textContent;
      navigator.clipboard.writeText(el.textContent).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = originalText; }, 2000);
      }).catch(() => {
        btn.textContent = 'Failed';
        setTimeout(() => { btn.textContent = originalText; }, 2000);
      });
    }
  </script>
</body>
</html>`;
}

/**
 * Triggers a client-side browser file download for a generated string payload
 */
export function triggerDiscussionDownload(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Multi-format export coordinator for discussions
 */
export function exportDiscussion(
  format: 'markdown' | 'json' | 'html',
  discussion: DiscussionThread,
  threads: ConversationThread[],
  messages: DiscussionMessage[],
  agents: Agent[]
): void {
  const sanitizedTitle = (discussion.title || 'discussion')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
  const timestamp = Date.now();

  switch (format) {
    case 'markdown': {
      const content = exportDiscussionAsMarkdown(discussion, threads, messages, agents);
      triggerDiscussionDownload(
        content,
        `${sanitizedTitle}-${discussion.id}-${timestamp}.md`,
        'text/markdown;charset=utf-8'
      );
      break;
    }
    case 'json': {
      const content = exportDiscussionAsJson(discussion, threads, messages, agents);
      triggerDiscussionDownload(
        content,
        `${sanitizedTitle}-${discussion.id}-${timestamp}.json`,
        'application/json;charset=utf-8'
      );
      break;
    }
    case 'html': {
      const content = exportDiscussionAsHtml(discussion, threads, messages, agents);
      triggerDiscussionDownload(
        content,
        `${sanitizedTitle}-${discussion.id}-${timestamp}.html`,
        'text/html;charset=utf-8'
      );
      break;
    }
  }
}
