import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { DiscussionThread, ConversationThread, DiscussionMessage, Agent } from '../../types';
import { SendIcon, CheckIcon, TerminalIcon } from '../icons/MinimalIcons';

interface DiscussionStageProps {
  discussion: DiscussionThread | null;
  activeThread: ConversationThread | null; // null = Main Root Thread
  messages: DiscussionMessage[];
  agents: Agent[];
  onInjectDirective: (content: string) => Promise<void>;
  onNavigateToThread?: (threadId: string) => void;
}

export const DiscussionStage: React.FC<DiscussionStageProps> = ({
  discussion,
  activeThread,
  messages,
  agents,
  onInjectDirective,
  onNavigateToThread
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F6F3] overflow-hidden">
      {/* Scrollable Main Stage Canvas */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-4xl w-full mx-auto"
      >
        {/* Thesis Anchor Banner */}
        {discussion && (
          <div className="bg-white border border-[#EAEAEA] border-l-2 border-l-[#111111] rounded-[8px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">
                {activeThread ? `Sub-Thread / ${activeThread.topic}` : 'Core Deliberation Thesis'}
              </span>
              <span className="text-[10px] font-mono text-[#787774]">
                {new Date(discussion.createdAt).toLocaleDateString()}
              </span>
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
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-[#787774]">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {msg.modelUsed && (
                            <span className="font-mono text-[9px] text-[#787774]">
                              {msg.modelUsed.split('/').pop()}
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
                        remarkPlugins={[remarkGfm]}
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
