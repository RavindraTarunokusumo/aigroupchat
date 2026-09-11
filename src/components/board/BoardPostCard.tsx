import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Search,
  Lightbulb,
  AlertTriangle,
  Rocket,
  CheckCircle2,
  FileText,
  User,
  ExternalLink,
  Bot,
  Copy,
  Check,
  Pin,
  Bookmark,
  ThumbsUp
} from 'lucide-react';
import { playActionChime } from '../../lib/sound';
import type { Agent, BoardPost, BoardPostType } from '../../types';

interface BoardPostCardProps {
  post: BoardPost;
  agents: Agent[];
  onTogglePin?: (postId: string) => void;
  onToggleBookmark?: (postId: string) => void;
  onVote?: (postId: string, direction: 'up' | 'down') => void;
}

export const BoardPostCard: React.FC<BoardPostCardProps> = ({
  post,
  agents,
  onTogglePin,
  onToggleBookmark,
  onVote
}) => {
  const isUser = post.agentId === 'user';
  const isSystem = post.agentId === 'system';
  const agent = !isUser && !isSystem ? agents.find((a) => a.id === post.agentId) : null;

  const getTypeMeta = (type: BoardPostType) => {
    switch (type) {
      case 'finding':
        return {
          icon: Search,
          label: 'Research Finding',
          border: 'border-cyan-500/30 hover:border-cyan-500/50',
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          glow: 'from-cyan-500/5 to-transparent'
        };
      case 'search':
        return {
          icon: Search,
          label: 'Exploration Query',
          border: 'border-blue-500/30 hover:border-blue-500/50',
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          glow: 'from-blue-500/5 to-transparent'
        };
      case 'critique':
        return {
          icon: AlertTriangle,
          label: 'Risk Audit & Critique',
          border: 'border-amber-500/30 hover:border-amber-500/50',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          glow: 'from-amber-500/5 to-transparent'
        };
      case 'solution':
        return {
          icon: Rocket,
          label: 'Solution Proposal',
          border: 'border-emerald-500/40 hover:border-emerald-500/60 shadow-emerald-950/20',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          glow: 'from-emerald-500/10 to-transparent'
        };
      case 'synthesis':
        return {
          icon: CheckCircle2,
          label: 'Consensus & Synthesis',
          border: 'border-purple-500/30 hover:border-purple-500/50',
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          glow: 'from-purple-500/5 to-transparent'
        };
      case 'instruction':
        return {
          icon: FileText,
          label: 'User Directive',
          border: 'border-sky-500/40 hover:border-sky-500/60 bg-sky-950/20',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          glow: 'from-sky-500/10 to-transparent'
        };
      case 'thought':
      default:
        return {
          icon: Lightbulb,
          label: 'Conceptual Thought',
          border: 'border-slate-700 hover:border-slate-600',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          glow: 'from-slate-800/10 to-transparent'
        };
    }
  };

  const meta = getTypeMeta(post.type);
  const TypeIcon = meta.icon;

  const timeString = new Date(post.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <article
      className={`relative rounded-2xl border ${
        post.isPinned ? 'border-amber-500/50 ring-1 ring-amber-500/20 shadow-amber-950/20' : meta.border
      } bg-gradient-to-b ${meta.glow} bg-slate-900/60 backdrop-blur-sm p-4 sm:p-5 transition-all duration-200 shadow-lg hover:shadow-xl`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3 border-b border-slate-800/60 pb-2.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-md border border-slate-700/50 bg-slate-800 mt-0.5"
            style={{
              borderColor: agent?.color ? `${agent.color}50` : undefined,
              boxShadow: agent?.color ? `0 0 12px ${agent.color}20` : undefined
            }}
          >
            {isUser ? (
              <User className="w-4 h-4 text-sky-400" />
            ) : isSystem ? (
              <Bot className="w-4 h-4 text-purple-400" />
            ) : (
              agent?.avatar || '🤖'
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs sm:text-sm text-slate-100">
                {isUser ? 'Human Director' : isSystem ? 'System Synthesizer' : agent?.name || 'Agent'}
              </span>
              <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${meta.badge}`}>
                <TypeIcon className="w-2.5 h-2.5" />
                {meta.label}
              </span>
              {post.isPinned && (
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-0.5 font-bold">
                  <Pin className="w-2.5 h-2.5 fill-amber-300" />
                  Pinned
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {isUser ? 'Injected Live Directive' : isSystem ? 'Autonomous Coordinator' : agent?.role || 'Contributor'}
            </p>
          </div>
        </div>

        {/* Actions, Timestamp, Metrics & Copy Button */}
        <div className="flex items-center gap-1 shrink-0 text-right">
          {/* Upvote button */}
          <button
            type="button"
            onClick={() => {
              playActionChime();
              onVote?.(post.id, post.userReaction === 'up' ? 'down' : 'up');
            }}
            className={`px-1.5 py-0.5 text-xs rounded transition flex items-center gap-1 border ${
              post.userReaction === 'up'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800'
            }`}
            title="Upvote contribution"
            aria-label="Upvote contribution"
          >
            <ThumbsUp className={`w-3 h-3 ${post.userReaction === 'up' ? 'fill-emerald-400 text-emerald-400' : ''}`} />
            <span className="text-[10px] font-mono">{post.upvotes || 0}</span>
          </button>

          {/* Bookmark button */}
          <button
            type="button"
            onClick={() => {
              playActionChime();
              onToggleBookmark?.(post.id);
            }}
            className={`p-1 rounded transition ${
              post.isBookmarked
                ? 'text-purple-300 hover:text-purple-200 bg-purple-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={post.isBookmarked ? 'Remove bookmark' : 'Bookmark card'}
            aria-label={post.isBookmarked ? 'Remove bookmark' : 'Bookmark card'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${post.isBookmarked ? 'fill-purple-400 text-purple-400' : ''}`} />
          </button>

          {/* Pin button */}
          <button
            type="button"
            onClick={() => {
              playActionChime();
              onTogglePin?.(post.id);
            }}
            className={`p-1 rounded transition ${
              post.isPinned
                ? 'text-amber-300 hover:text-amber-200 bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={post.isPinned ? 'Unpin card' : 'Pin card to top'}
            aria-label={post.isPinned ? 'Unpin card' : 'Pin card to top'}
          >
            <Pin className={`w-3.5 h-3.5 ${post.isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          {post.tokensUsed && (
            <span className="hidden xl:inline-block text-[9px] font-mono text-slate-500 bg-slate-800/80 px-1 py-0.5 rounded border border-slate-700/50">
              ~{post.tokensUsed}
            </span>
          )}
          <time className="text-[10px] font-mono text-slate-400">{timeString}</time>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition"
            title="Copy post content to clipboard"
            aria-label="Copy post content"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Post Title if available */}
      {post.title && (
        <h3 className="text-sm sm:text-base font-bold text-slate-200 mb-2.5 flex items-center gap-2">
          {post.title}
        </h3>
      )}

      {/* Search Query Callout */}
      {post.searchQuery && (
        <div className="mb-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 p-2.5 flex items-start gap-2 text-xs">
          <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-cyan-400/80 font-mono block">
              Executed Solution Search
            </span>
            <code className="text-cyan-200 font-mono text-xs select-all">
              "{post.searchQuery}"
            </code>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <div className="prose prose-invert prose-slate max-w-none text-xs sm:text-sm leading-relaxed break-words">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
        {post.isStreaming && (
          <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse rounded-sm align-middle" />
        )}
      </div>

      {/* Sources & Citations */}
      {post.sources && post.sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/60">
          <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ExternalLink className="w-3 h-3 text-cyan-400" />
            Cited Findings & Sources ({post.sources.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {post.sources.map((src, i) => (
              <div
                key={i}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-2 text-xs hover:border-slate-700 transition"
              >
                <div className="font-medium text-slate-200 truncate flex items-center justify-between">
                  <span>{src.title}</span>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 ml-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {src.snippet && (
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {src.snippet}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
