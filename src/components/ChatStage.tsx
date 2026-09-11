import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, MessageSquare, Sparkles } from 'lucide-react';
import type { Agent, Message } from '../types';
import { cleanAgentResponseText } from '../lib/cleanText';

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
              className="mx-auto max-w-2xl p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-slate-300 text-sm leading-relaxed shadow-sm [text-wrap:pretty]"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          );
        }

        const isUser = msg.senderType === 'user';
        const agent = !isUser ? agentMap.get(msg.senderId) : null;
        const accentColor = agent?.color || (isUser ? '#06B6D4' : '#94A3B8');
        const displayContent = isUser ? msg.content : cleanAgentResponseText(msg.content, agent?.name);

        if (isUser) {
          // User Message: Aligned to the right, conversational cyan bubble
          return (
            <div
              key={msg.id}
              className="flex items-start justify-end gap-3 max-w-[92%] sm:max-w-[85%] ml-auto group flex-row-reverse"
            >
              {/* User Avatar */}
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-md shrink-0 font-medium select-none mt-1 bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 transition-transform group-hover:scale-105"
                title="You (Director)"
              >
                👤
              </div>

              {/* User Bubble Column */}
              <div className="flex flex-col items-end min-w-0">
                <div className="flex items-center gap-2 mb-1.5 px-1 text-xs">
                  <span className="text-[11px] text-slate-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="font-semibold text-cyan-300">You (Director)</span>
                </div>

                <div className="relative rounded-2xl rounded-tr-sm px-5 py-3.5 sm:py-4 bg-gradient-to-br from-cyan-950/70 via-slate-900/90 to-slate-900/95 border border-cyan-500/35 shadow-lg text-slate-100 backdrop-blur-sm transition-all border-r-[3.5px] border-r-cyan-400">
                  <div className="text-[15.5px] sm:text-base leading-[1.75] text-slate-100 prose prose-invert max-w-none [text-wrap:pretty] prose-p:my-1.5 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-pre:p-3 prose-pre:text-sm prose-code:text-cyan-300 prose-code:bg-slate-900/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-[13.5px]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
                  </div>

                  {/* Copy button */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-slate-900/90 backdrop-blur-md rounded-lg p-0.5 border border-slate-700/60 shadow-md">
                    <button
                      onClick={() => copyToClipboard(displayContent, msg.id)}
                      className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
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
              </div>
            </div>
          );
        }

        // Agent Message: Aligned to the left, avatar outside, responsive speech bubble
        return (
          <div
            key={msg.id}
            className="flex items-start gap-3 max-w-[92%] sm:max-w-[85%] mr-auto group"
          >
            {/* Agent Avatar */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-md shrink-0 font-medium select-none mt-1 transition-transform group-hover:scale-105"
              style={{
                backgroundColor: `${accentColor}18`,
                color: accentColor,
                borderColor: `${accentColor}35`,
                borderWidth: '1.5px',
                boxShadow: `0 2px 10px ${accentColor}15`
              }}
              title={agent ? `${agent.name} (${agent.role})` : 'Agent'}
            >
              {agent?.avatar || '🤖'}
            </div>

            {/* Agent Bubble Column */}
            <div className="flex flex-col items-start min-w-0">
              {/* Header / Identity Line */}
              <div className="flex items-center flex-wrap gap-2 mb-1.5 px-1">
                <span className="font-semibold text-sm" style={{ color: accentColor }}>
                  {agent?.name || 'Agent'}
                </span>
                {agent?.role && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/50 text-slate-300 font-medium">
                    {agent.role}
                  </span>
                )}
                <span className="text-[11px] text-slate-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.modelUsed && (
                  <span className="text-[10px] font-mono bg-slate-900/80 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800/80">
                    {msg.modelUsed}
                  </span>
                )}
              </div>

              {/* Speech Bubble */}
              <div
                className="relative rounded-2xl rounded-tl-sm px-5 py-3.5 sm:py-4 bg-slate-800/95 border border-slate-700/60 shadow-lg text-slate-100 backdrop-blur-sm transition-all"
                style={{
                  borderLeftWidth: '3.5px',
                  borderLeftColor: accentColor
                }}
              >
                <div className="text-[15.5px] sm:text-base leading-[1.75] text-slate-100 prose prose-invert max-w-none [text-wrap:pretty] prose-p:my-2 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-pre:p-3.5 prose-pre:text-sm prose-code:text-cyan-300 prose-code:bg-slate-900/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-[13.5px] prose-a:text-cyan-400 prose-a:underline hover:prose-a:text-cyan-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
                  {msg.isStreaming && (
                    <span className="inline-block w-2.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle rounded-sm" />
                  )}
                </div>

                {/* Quick Action buttons */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-slate-900/90 backdrop-blur-md rounded-lg p-0.5 border border-slate-700/60 shadow-md">
                  {onMentionAgent && agent && (
                    <button
                      onClick={() => onMentionAgent(agent.name)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                      title={`Reply to @${agent.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(displayContent, msg.id)}
                    className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
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
            </div>
          </div>
        );
      })}

      {/* Live active thinking badge */}
      {activeAgentSpeaking && (
        <div className="flex items-center gap-3 max-w-md mr-auto animate-pulse-subtle">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-base bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-slate-900/80 border border-slate-800 text-xs text-slate-300 shadow-sm">
            <strong className="text-cyan-300 font-semibold">{activeAgentSpeaking.name}</strong> is deliberating & typing...
          </div>
        </div>
      )}
    </div>
  );
};
