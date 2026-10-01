import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type {
  DiscussionThread,
  ConversationThread,
  DiscussionMessage,
  Agent,
  MessageAttachment
} from '../../types';
import {
  SendIcon,
  CheckIcon,
  TerminalIcon,
  DocumentIcon,
  CopyIcon,
  ChevronDownIcon,
  AlertCircleIcon,
  TrashIcon
} from '../icons/MinimalIcons';

interface DiscussionStageProps {
  discussion: DiscussionThread | null;
  activeThread: ConversationThread | null; // null = Main Root Thread
  messages: DiscussionMessage[];
  agents: Agent[];
  engineError?: string | null;
  onClearError?: () => void;
  onOpenKeysModal?: () => void;
  onInjectDirective: (content: string) => Promise<void>;
  onNavigateToThread?: (threadId: string) => void;
  onDeleteDiscussion?: (discussionId: string) => Promise<void> | void;
}

const MessageAttachmentView: React.FC<{ attachment: MessageAttachment }> = ({ attachment }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(attachment.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failures
    }
  };

  return (
    <div className="mt-2.5 rounded-[6px] border border-[#EAEAEA] bg-[#FBFBFA] overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#EAEAEA] bg-[#F9F9F8]">
        <div className="flex items-center gap-2 min-w-0">
          <DocumentIcon size={14} className="text-[#111111] shrink-0" />
          <span className="font-mono text-xs font-semibold text-[#111111] truncate">
            {attachment.name}
          </span>
          {attachment.title && (
            <span className="text-[11px] text-[#787774] truncate hidden sm:inline">
              — {attachment.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans font-medium text-[#787774] hover:text-[#111111] bg-white border border-[#EAEAEA] rounded hover:bg-[#F7F6F3] transition-colors"
            title="Copy document content"
          >
            {copied ? <CheckIcon size={10} className="text-[#346538]" /> : <CopyIcon size={10} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans font-medium text-[#111111] bg-white border border-[#EAEAEA] rounded hover:bg-[#F7F6F3] transition-colors"
          >
            <span>{isExpanded ? 'Collapse' : 'Preview'}</span>
            <ChevronDownIcon
              size={10}
              className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="p-3.5 bg-white font-sans text-xs leading-relaxed text-[#2F3437] overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {attachment.content}
          </ReactMarkdown>
        </div>
      ) : attachment.summary ? (
        <div className="px-3 py-2 text-[11px] text-[#787774] font-sans italic truncate">
          {attachment.summary}
        </div>
      ) : null}
    </div>
  );
};

export const DiscussionStage: React.FC<DiscussionStageProps> = ({
  discussion,
  activeThread,
  messages,
  agents,
  engineError,
  onClearError,
  onOpenKeysModal,
  onInjectDirective,
  onNavigateToThread,
  onDeleteDiscussion
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDeleteDiscussionId, setConfirmingDeleteDiscussionId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isConfirmingDelete = Boolean(discussion && confirmingDeleteDiscussionId === discussion.id);
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messages.length]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onInjectDirective(trimmed);
      setInputText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getActionBadge = (msg: DiscussionMessage) => {
    if (msg.senderType === 'user') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-[#111111] text-white">
          Director Directive
        </span>
      );
    }

    switch (msg.actionType) {
      case 'initial_response':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-[#FBF3DB] text-[#956400]">
            Initial Framing
          </span>
        );
      case 'spawn_thread':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-[#E1F3FE] text-[#1F6C9F]">
            Branch Sub-Thread
          </span>
        );
      case 'synthesize_to_main':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-[#EDF3EC] text-[#346538]">
            Synthesis to Main
          </span>
        );
      case 'reply_thread':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-[#F7F6F3] text-[#787774]">
            Thread Reply
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-[#F7F6F3] text-[#787774]">
            Reply
          </span>
        );
    }
  };

  // Agent response status map for Barrier Phase
  const initialRespondedSet = new Set(
    messages
      .filter((m) => m.threadId == null && m.actionType === 'initial_response')
      .map((m) => m.senderId)
  );

  if (!discussion) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center bg-[#F7F6F3]">
        <div className="max-w-md space-y-3">
          <h2 className="font-serif text-xl font-medium text-[#111111]">
            No Discussion Selected
          </h2>
          <p className="font-sans text-xs text-[#787774] leading-relaxed">
            Select an existing deliberation topic from the sidebar, or create a new discussion to assemble the multi-agent swarm.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F6F3] overflow-hidden">
      {/* Scrollable Main Stage Canvas */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-4xl w-full mx-auto"
      >
        {/* Thesis Anchor Banner */}
        <div className="bg-white border border-[#EAEAEA] border-l-2 border-l-[#111111] rounded-[8px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">
              {activeThread ? `Sub-Thread / ${activeThread.topic}` : 'Core Deliberation Thesis'}
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-[#787774]">
                {new Date(discussion.createdAt).toLocaleDateString()}
              </span>
              {onDeleteDiscussion && !activeThread && (
                isConfirmingDelete ? (
                  <div className="flex items-center gap-1.5 bg-[#FDEBEC] px-2 py-0.5 rounded-[4px] border border-[#F5C2C4] text-[10px]">
                    <span className="text-[#9F2F2D] font-medium">Delete?</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await onDeleteDiscussion(discussion.id);
                        setConfirmingDeleteDiscussionId(null);
                      }}
                      className="px-1.5 py-0.5 bg-[#9F2F2D] text-white font-mono rounded hover:bg-[#7D2423] transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteDiscussionId(null)}
                      className="px-1.5 py-0.5 bg-white text-[#787774] border border-[#EAEAEA] rounded hover:text-[#111111] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteDiscussionId(discussion.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-sans text-[#787774] hover:text-[#9F2F2D] transition-colors px-1.5 py-0.5 rounded hover:bg-[#FDEBEC]"
                    title="Delete this discussion"
                  >
                    <TrashIcon size={12} />
                    <span>Delete</span>
                  </button>
                )
              )}
            </div>
          </div>
          <h2 className="font-serif text-lg lg:text-xl font-medium tracking-tight text-[#111111] leading-snug">
            {activeThread ? activeThread.topic : discussion.topic}
          </h2>
          {activeThread && (
            <p className="mt-2 text-xs font-sans text-[#787774]">
              Root thesis: {discussion.topic}
            </p>
          )}
        </div>

        {/* Engine Notice / Error Banner */}
        {engineError && (
          <div className="bg-[#FDEBEC] border border-[#F5C2C4] rounded-[8px] p-4 flex items-start justify-between gap-3 text-[#9F2F2D]">
            <div className="flex items-start gap-2.5">
              <AlertCircleIcon size={16} className="shrink-0 mt-0.5 text-[#9F2F2D]" />
              <div className="space-y-1">
                <p className="font-sans font-medium text-xs">
                  Deliberation Engine Notice:
                </p>
                <p className="font-mono text-[11px] leading-relaxed break-all text-[#9F2F2D]">
                  {engineError}
                </p>
                <p className="text-[11px] font-sans text-[#787774] pt-0.5">
                  If this is an OpenRouter rate-limit (429) or balance error (402), check your account credits or switch models.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onOpenKeysModal && (
                <button
                  type="button"
                  onClick={onOpenKeysModal}
                  className="px-2.5 py-1 text-[11px] font-sans font-medium bg-white text-[#111111] border border-[#EAEAEA] rounded hover:bg-[#F7F6F3] transition-colors"
                >
                  API Keys
                </button>
              )}
              {onClearError && (
                <button
                  type="button"
                  onClick={onClearError}
                  className="text-xs text-[#9F2F2D] hover:underline"
                  title="Dismiss notice"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {/* Phase 1 Synchronization Barrier Banner */}
        {discussion?.status === 'barrier_wait' && !activeThread && (
          <div className="bg-white border border-[#EAEAEA] rounded-[8px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#956400] animate-pulse" />
                <span className="font-mono text-xs font-semibold text-[#111111]">
                  Phase 1 Synchronization Barrier
                </span>
              </div>
              <span className="font-mono text-xs text-[#787774]">
                {discussion.barrierResponded} of {discussion.barrierTotal} Agents Responded
              </span>
            </div>

            <p className="text-xs text-[#787774] font-sans">
              Waiting for all participating agents to register their opening foundational stance before advancing to concurrent discussion.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
              {discussion.activeAgentIds.map((agentId) => {
                const ag = agentMap.get(agentId);
                const hasResponded = initialRespondedSet.has(agentId);
                const monogram = ag?.monogram || ag?.name.slice(0, 2).toUpperCase() || 'AI';

                return (
                  <div
                    key={agentId}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-[6px] border text-xs ${
                      hasResponded
                        ? 'bg-[#EDF3EC] border-[#D1E2CF] text-[#346538]'
                        : 'bg-[#FBF3DB] border-[#F2E4B8] text-[#956400]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono font-bold text-[10px]">
                        {monogram}
                      </span>
                      <span className="truncate text-[11px] font-sans">
                        {ag?.name.replace('The ', '') || agentId}
                      </span>
                    </div>
                    {hasResponded ? (
                      <CheckIcon size={12} className="shrink-0" />
                    ) : (
                      <span className="text-[9px] font-mono uppercase shrink-0">
                        wait
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Feed */}
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="bg-white border border-[#EAEAEA] rounded-[8px] p-8 text-center text-[#787774] text-xs font-sans">
              No contributions recorded in this thread yet.
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.senderType === 'user';
              const agent = isUser ? null : agentMap.get(msg.senderId);
              const monogram = isUser
                ? 'DIR'
                : agent?.monogram || agent?.name.slice(0, 2).toUpperCase() || 'AI';
              const name = isUser ? 'Director' : agent?.name || 'Agent';
              const role = isUser ? 'Human Facilitator' : agent?.role || 'Deliberation Participant';

              return (
                <article
                  key={msg.id}
                  className="bg-white border border-[#EAEAEA] rounded-[8px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all"
                >
                  {/* Message Card Header */}
                  <header className="flex items-start justify-between gap-3 pb-3 border-b border-[#EAEAEA]">
                    <div className="flex items-center gap-3">
                      {/* Monogram Badge */}
                      <div
                        className="w-8 h-8 rounded-[6px] flex items-center justify-center font-mono font-semibold text-xs border"
                        style={{
                          backgroundColor: '#F9F9F8',
                          borderColor: agent?.color || '#111111',
                          color: '#111111'
                        }}
                      >
                        {monogram}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-medium text-xs text-[#111111]">
                            {name}
                          </span>
                          <span className="text-[11px] font-sans text-[#787774]">
                            {role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="font-mono text-[10px] text-[#787774]">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>

                          {!isUser && (
                            msg.telemetry?.isLive ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono uppercase bg-[#EDF3EC] text-[#346538] border border-[#D1E2CF]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#346538] animate-pulse" />
                                Live [{msg.telemetry.provider}]
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-mono uppercase bg-[#FBF3DB] text-[#956400] border border-[#F2E4B8]">
                                Simulated
                              </span>
                            )
                          )}

                          {msg.modelUsed && (
                            <span className="font-mono text-[9px] text-[#787774]">
                              {msg.modelUsed.split('/').pop()}
                            </span>
                          )}

                          {msg.telemetry?.tokensUsed && (
                            <span className="font-mono text-[9px] text-[#787774]">
                              ~{msg.telemetry.tokensUsed} tok
                            </span>
                          )}

                          {msg.telemetry?.latencyMs && (
                            <span className="font-mono text-[9px] text-[#787774]">
                              {(msg.telemetry.latencyMs / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getActionBadge(msg)}
                      {msg.wakeTrigger && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-[#787774] bg-[#F7F6F3] border border-[#EAEAEA]">
                          wake: {msg.wakeTrigger.mode}
                        </span>
                      )}
                    </div>
                  </header>

                  {/* Body Text rendered with ReactMarkdown */}
                  <div className="pt-3 text-[13.5px] leading-relaxed text-[#2F3437] font-sans break-words space-y-2">
                    {msg.isStreaming && !msg.content ? (
                      <span className="inline-flex items-center gap-2 text-xs font-mono text-[#787774]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#111111] animate-ping" />
                        Formulating argument...
                      </span>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          h1: ({ ...props }) => (
                            <h1 className="font-serif text-base font-semibold text-[#111111] mt-3 mb-1.5" {...props} />
                          ),
                          h2: ({ ...props }) => (
                            <h2 className="font-serif text-sm font-semibold text-[#111111] mt-2.5 mb-1" {...props} />
                          ),
                          h3: ({ ...props }) => (
                            <h3 className="font-serif text-xs font-semibold uppercase tracking-wider text-[#111111] mt-2 mb-1" {...props} />
                          ),
                          p: ({ ...props }) => (
                            <p className="my-1.5 text-[13.5px] leading-relaxed text-[#2F3437]" {...props} />
                          ),
                          ul: ({ ...props }) => (
                            <ul className="list-disc pl-5 my-2 space-y-1 text-[13px] text-[#2F3437]" {...props} />
                          ),
                          ol: ({ ...props }) => (
                            <ol className="list-decimal pl-5 my-2 space-y-1 text-[13px] text-[#2F3437]" {...props} />
                          ),
                          li: ({ ...props }) => (
                            <li className="text-[13px] text-[#2F3437]" {...props} />
                          ),
                          blockquote: ({ ...props }) => (
                            <blockquote className="border-l-2 border-[#111111] pl-3 italic text-[#787774] my-2 text-[13px]" {...props} />
                          ),
                          code: ({ inline, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) => {
                            return inline ? (
                              <code className="font-mono text-xs bg-[#F7F6F3] px-1 py-0.5 rounded border border-[#EAEAEA] text-[#111111]" {...props}>
                                {children}
                              </code>
                            ) : (
                              <code className="font-mono text-xs bg-[#F7F6F3] p-3 rounded-[6px] border border-[#EAEAEA] block overflow-x-auto my-2 text-[#111111]" {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}

                    {/* Document / Blob Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {msg.attachments.map((att) => (
                          <MessageAttachmentView key={att.id} attachment={att} />
                        ))}
                      </div>
                    )}

                    {/* Spawned Sub-Thread Clickable Link Banner */}
                    {msg.spawnedTopic && msg.spawnedThreadId && onNavigateToThread && (
                      <div className="mt-3 p-2.5 rounded-[6px] bg-[#F7F6F3] border border-[#EAEAEA] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#E1F3FE] text-[#1F6C9F]">
                            Sub-Thread
                          </span>
                          <span className="text-xs font-mono font-medium text-[#111111]">
                            {msg.spawnedTopic}
                          </span>
                        </div>
                        <button
                          onClick={() => onNavigateToThread(msg.spawnedThreadId!)}
                          className="text-xs font-sans font-medium text-[#111111] hover:underline"
                        >
                          View Thread
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Director Steering Prompt Bar (Docked at Bottom) */}
      <footer className="p-4 border-t border-[#EAEAEA] bg-white shrink-0">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto flex items-center gap-2 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] px-3 py-2 focus-within:border-[#111111] focus-within:bg-white transition-colors"
        >
          <span className="text-[#787774] shrink-0" title="Director Prompt">
            <TerminalIcon size={14} />
          </span>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeThread
                ? `Inject directive into sub-thread "${activeThread.topic}"...`
                : 'Inject directive or prompt the deliberation swarm...'
            }
            className="flex-1 bg-transparent text-xs font-sans text-[#111111] placeholder-[#787774] focus:outline-none"
          />

          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-[#787774] bg-[#F7F6F3] border border-[#EAEAEA] rounded shrink-0">
            Enter to send
          </kbd>

          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className="p-1.5 bg-[#111111] text-white hover:bg-[#2F3437] disabled:opacity-30 rounded-[4px] transition-colors shrink-0"
            title="Send directive"
          >
            <SendIcon size={12} />
          </button>
        </form>
      </footer>
    </div>
  );
};
