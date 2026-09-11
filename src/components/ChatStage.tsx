import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, MessageSquare, Sparkles } from 'lucide-react';
import type { Agent, Message } from '../types';

interface ChatStageProps {
  messages: Message[];
  agents: Agent[];
  activeAgentSpeaking?: { id: string; name: string } | null;
  onMentionAgent?: (agentName: string) => void;
}

export const ChatStage: React.FC<ChatStageProps> = ({
  messages,
  agents,
  activeAgentSpeaking,
  onMentionAgent
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const agentMap = React.useMemo(() => {
    const map = new Map<string, Agent>();
    for (const a of agents) map.set(a.id, a);
    return map;
  }, [agents]);

  // Handle user scroll vs auto-scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
    isAutoScrollEnabled.current = isAtBottom;
  };

  useEffect(() => {
    if (isAutoScrollEnabled.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, activeAgentSpeaking]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-4xl mx-auto w-full"
    >
      {messages.map((msg) => {
        if (msg.senderType === 'system') {
          return (
            <div
              key={msg.id}
              className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-slate-300 text-sm leading-relaxed"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          );
        }

        const isUser = msg.senderType === 'user';
        const agent = !isUser ? agentMap.get(msg.senderId) : null;
        const accentColor = agent?.color || (isUser ? '#06B6D4' : '#94A3B8');

        return (
          <div
            key={msg.id}
            className={`flex flex-col space-y-2 rounded-2xl p-4 sm:p-5 transition ${
              isUser
                ? 'bg-slate-900/60 border border-slate-800/80 ml-8'
                : 'bg-slate-800/40 border border-slate-700/50'
            }`}
            style={{
              borderLeftWidth: '4px',
              borderLeftColor: accentColor
            }}
          >
            {/* Header / Avatar / Identity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm shrink-0 font-medium"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    color: accentColor,
                    borderColor: `${accentColor}40`,
                    borderWidth: '1px'
                  }}
                >
                  {isUser ? '👤' : agent?.avatar || '🤖'}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-100">
                      {isUser ? 'You (Director)' : agent?.name || 'Agent'}
                    </span>
                    {!isUser && agent && (
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        • {agent.role}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.modelUsed && (
                      <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Quick Actions */}
              <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition">
                {!isUser && agent && onMentionAgent && (
                  <button
                    onClick={() => onMentionAgent(agent.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-700/50 text-xs flex items-center gap-1"
                    title={`Reply to @${agent.name}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => copyToClipboard(msg.content, msg.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 text-xs"
                  title="Copy message"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div className="text-slate-200 text-sm leading-relaxed prose prose-invert max-w-none prose-p:my-2 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              {msg.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
              )}
            </div>
          </div>
        );
      })}

      {/* Live active thinking badge */}
      {activeAgentSpeaking && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 animate-pulse-subtle max-w-md">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>
            <strong className="text-cyan-300">{activeAgentSpeaking.name}</strong> is deliberating & typing...
          </span>
        </div>
      )}
    </div>
  );
};
