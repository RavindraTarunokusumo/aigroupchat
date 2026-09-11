import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  PlusCircle,
  Download,
  Shield,
  Layers,
  Sparkles,
  Columns3,
  List,
  Search,
  Users,
  SlidersHorizontal,
  Bot,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import type { Agent, TaskBoard, BoardPost } from '../../types';
import { BoardPostCard } from './BoardPostCard';
import { AddInstructionModal } from './AddInstructionModal';
import { NewBoardTaskModal } from './NewBoardTaskModal';

interface MessageBoardPageProps {
  board: TaskBoard | null;
  posts: BoardPost[];
  agents: Agent[];
  engineStatus: {
    isRunning: boolean;
    isPaused: boolean;
    currentAgentId: string | null;
    currentAgentName: string | null;
    phase: string | null;
  };
  onStart: (boardId: string) => void;
  onPause: (boardId: string) => void;
  onStop: (boardId: string) => void;
  onAddInstruction: (boardId: string, text: string, targetAgentId?: string, targetAgentName?: string) => void;
  onCreateNewBoard: (newBoard: Omit<TaskBoard, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const MessageBoardPage: React.FC<MessageBoardPageProps> = ({
  board,
  posts,
  agents,
  engineStatus,
  onStart,
  onPause,
  onStop,
  onAddInstruction,
  onCreateNewBoard
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'stream' | 'kanban'>('stream');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [showDirectivesBanner, setShowDirectivesBanner] = useState(true);
  const [copiedSolution, setCopiedSolution] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabledRef = useRef(true);

  const lastPostContent = posts[posts.length - 1]?.content;

  // Scroll to top when switching view modes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [viewMode]);

  // Handle auto-scroll on new posts in stream mode if user hasn't scrolled up
  useEffect(() => {
    if (viewMode === 'stream' && isAutoScrollEnabledRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [posts.length, lastPostContent, viewMode]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    isAutoScrollEnabledRef.current = isAtBottom;
  };

  // Find latest solution or synthesis post for quick copy
  const finalSolutionPost = useMemo(() => {
    for (let i = posts.length - 1; i >= 0; i--) {
      if (posts[i].type === 'solution' || posts[i].type === 'synthesis') {
        return posts[i];
      }
    }
    return null;
  }, [posts]);

  const handleCopySolution = async () => {
    if (!finalSolutionPost) return;
    try {
      await navigator.clipboard.writeText(finalSolutionPost.content);
      setCopiedSolution(true);
      setTimeout(() => setCopiedSolution(false), 2500);
    } catch {
      // ignore
    }
  };

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      // Filter by agent
      if (selectedAgentFilter !== 'all' && p.agentId !== selectedAgentFilter) return false;

      // Filter by type
      if (activeFilter === 'solutions' && p.type !== 'solution' && p.type !== 'synthesis') return false;
      if (activeFilter === 'findings' && p.type !== 'finding' && p.type !== 'search') return false;
      if (activeFilter === 'critiques' && p.type !== 'critique') return false;
      if (activeFilter === 'thoughts' && p.type !== 'thought') return false;
      if (activeFilter === 'instructions' && p.type !== 'instruction') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const contentMatch = p.content.toLowerCase().includes(q);
        const titleMatch = p.title?.toLowerCase().includes(q);
        const queryMatch = p.searchQuery?.toLowerCase().includes(q);
        if (!contentMatch && !titleMatch && !queryMatch) return false;
      }
      return true;
    });
  }, [posts, activeFilter, selectedAgentFilter, searchQuery]);

  // Counts for tabs
  const counts = useMemo(() => {
    const c = { all: posts.length, solutions: 0, findings: 0, critiques: 0, thoughts: 0, instructions: 0 };
    for (const p of posts) {
      if (p.type === 'solution') c.solutions++;
      else if (p.type === 'finding' || p.type === 'search') c.findings++;
      else if (p.type === 'critique') c.critiques++;
      else if (p.type === 'thought') c.thoughts++;
      else if (p.type === 'instruction') c.instructions++;
    }
    return c;
  }, [posts]);

  // Export board to Markdown
  const handleExportReport = () => {
    if (!board) return;
    const agentMap = new Map(agents.map((a) => [a.id, a.name]));

    let md = `# Message Board Report: ${board.title}\n\n`;
    md += `**Status:** ${board.status.toUpperCase()} | **Generated:** ${new Date().toLocaleString()}\n\n`;
    md += `## 🎯 Shared Task Objective\n> ${board.task}\n\n`;

    if (board.extraInstructions?.length) {
      md += `### 📢 Added Directives & Constraints\n`;
      board.extraInstructions.forEach((ins, i) => {
        md += `${i + 1}. ${ins.instruction} *(${new Date(ins.timestamp).toLocaleTimeString()})*\n`;
      });
      md += `\n`;
    }

    md += `## 👥 Participating Agents\n`;
    board.agentIds.forEach((id) => {
      const a = agents.find((ag) => ag.id === id);
      if (a) md += `- **${a.name}** (${a.role})\n`;
    });
    md += `\n---\n\n## 📝 Collaboration Transcript\n\n`;

    posts.forEach((p) => {
      const speaker = p.agentId === 'user' ? '👤 Human Director' : p.agentId === 'system' ? '⚙️ System' : `🤖 ${agentMap.get(p.agentId) || 'Agent'}`;
      const time = new Date(p.timestamp).toLocaleTimeString();
      md += `### [${p.type.toUpperCase()}] ${p.title || 'Note'} — ${speaker} (${time})\n\n`;
      if (p.searchQuery) {
        md += `*Search Query:* \`${p.searchQuery}\`\n\n`;
      }
      md += `${p.content}\n\n`;
      if (p.sources?.length) {
        md += `**Sources:**\n`;
        p.sources.forEach((s) => (md += `- [${s.title}](${s.url || '#'}): ${s.snippet || ''}\n`));
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `board-${board.id}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!board) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-xl">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Active Task Board</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Assign a shared task, define your token budget and duration, and observe autonomous AI agents collaborate and search for solutions.
        </p>
        <button
          onClick={() => setIsNewTaskModalOpen(true)}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:from-cyan-300 hover:to-indigo-400 transition flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Assign New Task Board
        </button>
        <NewBoardTaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          agents={agents}
          onSubmit={onCreateNewBoard}
        />
      </div>
    );
  }

  const elapsedMins = Math.floor((board.elapsedSeconds || 0) / 60);
  const elapsedSecs = (board.elapsedSeconds || 0) % 60;
  const timeFormatted = `${String(elapsedMins).padStart(2, '0')}:${String(elapsedSecs).padStart(2, '0')}`;
  const maxTimeFormatted = `${String(board.maxDurationMinutes).padStart(2, '0')}:00`;
  const timeProgressPct = Math.min(100, ((board.elapsedSeconds || 0) / (board.maxDurationMinutes * 60)) * 100);
  const tokenProgressPct = Math.min(100, ((board.usedTokens || 0) / board.tokenBudget) * 100);
  const turnProgressPct = Math.min(100, (board.currentTurn / board.turnLimit) * 100);

  const isRunning = board.status === 'running';

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden relative">
      {/* Top Banner: Task Info & Master Controls */}
      <section className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md p-4 sm:p-5 shrink-0 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title and Status Badge */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {board.title}
              </h2>
              {/* Status pill */}
              {board.status === 'running' && (
                <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-sm shadow-emerald-500/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Autonomous Execution
                </span>
              )}
              {board.status === 'paused' && (
                <span className="flex items-center gap-1 text-xs font-mono font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  <Pause className="w-3 h-3 fill-amber-400" />
                  Paused
                </span>
              )}
              {board.status === 'completed' && (
                <span className="flex items-center gap-1 text-xs font-mono font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                  Completed
                </span>
              )}
              {board.status === 'stopped' && (
                <span className="flex items-center gap-1 text-xs font-mono font-semibold text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
                  Stopped
                </span>
              )}
            </div>

            {/* Original Task Prompt with Immutable Shield */}
            <div className="flex items-start gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-300">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-slate-200">Shared Task Objective: </span>
                <span className="text-slate-300">{board.task}</span>
              </div>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {isRunning ? (
              <button
                type="button"
                onClick={() => onPause(board.id)}
                className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="Pause agent collaboration"
              >
                <Pause className="w-3.5 h-3.5 fill-amber-400" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStart(board.id)}
                className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-500/10"
                title="Start or resume agent collaboration"
              >
                <Play className="w-3.5 h-3.5 fill-emerald-400" />
                <span>{board.status === 'completed' ? 'Restart' : 'Resume'}</span>
              </button>
            )}

            {isRunning && (
              <button
                type="button"
                onClick={() => onStop(board.id)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
                title="Stop execution"
              >
                <Square className="w-3.5 h-3.5 fill-slate-400" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            )}

            {/* Add Extra Instruction Button */}
            <button
              type="button"
              onClick={() => setIsInstructionModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-sky-500/10 to-cyan-500/10 hover:from-sky-500/20 hover:to-cyan-500/20 border border-sky-500/30 text-sky-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Add directive / constraint without altering original task"
            >
              <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Add Instruction</span>
            </button>

            {/* Export Markdown */}
            <button
              type="button"
              onClick={handleExportReport}
              className="p-2 sm:px-3 sm:py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
              title="Export report as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export</span>
            </button>

            {/* New Task Button */}
            <button
              type="button"
              onClick={() => setIsNewTaskModalOpen(true)}
              className="p-2 sm:px-3 sm:py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
              title="Assign a new task board"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">New Board</span>
            </button>
          </div>
        </div>

        {/* Injected Extra Directives Banner (if any) */}
        {board.extraInstructions && board.extraInstructions.length > 0 && (
          <div className="bg-sky-950/30 border border-sky-500/20 rounded-xl p-3 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Active Injected Directives ({board.extraInstructions.length})
              </span>
              <button
                type="button"
                onClick={() => setShowDirectivesBanner(!showDirectivesBanner)}
                className="text-[11px] text-sky-400 hover:text-sky-300 underline"
              >
                {showDirectivesBanner ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {showDirectivesBanner && (
              <ul className="space-y-1 mt-2">
                {board.extraInstructions.map((ins, i) => (
                  <li key={ins.id} className="flex items-start gap-2 text-slate-300">
                    <span className="font-mono text-sky-400 shrink-0">{i + 1}.</span>
                    <span className="flex-1">{ins.instruction}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {new Date(ins.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Real-time Progress Metrics & Gauge Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          {/* Duration Gauge */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Duration</span>
              <span className="font-mono text-slate-200">{timeFormatted} / {maxTimeFormatted}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${timeProgressPct}%` }}
              />
            </div>
          </div>

          {/* Turn Budget */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Turns</span>
              <span className="font-mono text-slate-200">{board.currentTurn} / {board.turnLimit}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                style={{ width: `${turnProgressPct}%` }}
              />
            </div>
          </div>

          {/* Token Gauge */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Token Budget</span>
              <span className="font-mono text-slate-200">
                {(board.usedTokens || 0).toLocaleString()} / {(board.tokenBudget || 0).toLocaleString()}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full transition-all duration-300"
                style={{ width: `${tokenProgressPct}%` }}
              />
            </div>
          </div>

          {/* Active Agent Deliberating */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs shrink-0">
              {engineStatus.isRunning ? (
                <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
              ) : (
                <Users className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono text-slate-400 truncate">
                {engineStatus.isRunning ? 'Active Contributor' : 'Board Status'}
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate">
                {engineStatus.isRunning && engineStatus.currentAgentName
                  ? `${engineStatus.currentAgentName} (${engineStatus.phase || 'Thinking...'})`
                  : board.status.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & View Mode Controls Bar */}
      <section className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-3 shrink-0 flex-wrap">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>All Posts</span>
            <span className="text-[10px] bg-slate-700 px-1 rounded-full">{counts.all}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('solutions')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'solutions'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🚀 Solutions</span>
            {counts.solutions > 0 && (
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1 rounded-full">
                {counts.solutions}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('findings')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'findings'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🔍 Findings</span>
            {counts.findings > 0 && (
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1 rounded-full">
                {counts.findings}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('critiques')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'critiques'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⚖️ Critiques</span>
            {counts.critiques > 0 && (
              <span className="text-[10px] bg-amber-950 text-amber-300 px-1 rounded-full">
                {counts.critiques}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('thoughts')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'thoughts'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>💡 Thoughts</span>
            {counts.thoughts > 0 && (
              <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1 rounded-full">
                {counts.thoughts}
              </span>
            )}
          </button>
          {counts.instructions > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('instructions')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeFilter === 'instructions'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📢 Directives</span>
              <span className="text-[10px] bg-sky-950 text-sky-300 px-1 rounded-full">
                {counts.instructions}
              </span>
            </button>
          )}
        </div>

        {/* Right Search and View Layout Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Agent / Contributor Filter */}
          <div className="relative">
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              title="Filter posts by contributor"
            >
              <option value="all">All Contributors</option>
              <option value="user">👤 Human Director</option>
              {agents
                .filter((a) => board.agentIds.includes(a.id))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.avatar || '🤖'} {a.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-28 sm:w-40 transition"
            />
          </div>

          {/* Stream vs Kanban View Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('stream')}
              className={`p-1 rounded ${viewMode === 'stream' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Stream view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1 rounded ${viewMode === 'kanban' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Column / Kanban view"
            >
              <Columns3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Board Post Content Stage */}
      <main
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6"
      >
        {/* Completed Task Consensus Banner */}
        {board.status === 'completed' && (
          <div className="mb-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-purple-950/40 to-slate-900 border border-emerald-500/30 p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Autonomous Collaboration Completed
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Consensus Reached
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  All {board.currentTurn} collaborative turns completed across {board.agentIds.length} agents. Total tokens used: {(board.usedTokens || 0).toLocaleString()}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              {finalSolutionPost && (
                <button
                  type="button"
                  onClick={handleCopySolution}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  {copiedSolution ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied Solution!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Solution</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={handleExportReport}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 shadow-lg">
              <Bot className={`w-6 h-6 ${isRunning ? 'animate-bounce' : ''}`} />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              {isRunning ? 'Autonomous Agents Convening...' : 'Session Ready to Begin'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {isRunning
                ? 'Agents are reviewing the shared task objective, analyzing constraints, and preparing their initial findings and search queries.'
                : 'Click "Resume" or "Restart" above to initiate autonomous collaboration.'}
            </p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <SlidersHorizontal className="w-10 h-10 mb-2 stroke-1" />
            <p className="text-sm">No posts match the current filter or search criteria.</p>
          </div>
        ) : viewMode === 'stream' ? (
          /* Stream View */
          <div className="max-w-4xl mx-auto space-y-4">
            {filteredPosts.map((post) => (
              <BoardPostCard key={post.id} post={post} agents={agents} />
            ))}
          </div>
        ) : (
          /* Kanban / Multi-Column View (4 Columns) */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {/* Column 1: Directives & Guidance */}
            <div className="space-y-3 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-3">
              <div className="flex items-center justify-between pb-2 border-b border-sky-500/20 text-xs font-bold uppercase tracking-wider text-sky-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Directives & Task
                </span>
                <span className="text-[10px] bg-sky-950 px-1.5 py-0.5 rounded-full">
                  {filteredPosts.filter((p) => p.type === 'instruction').length}
                </span>
              </div>
              <div className="space-y-3">
                {/* Always show pinned immutable task in first column */}
                <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 text-xs space-y-1.5">
                  <div className="font-semibold text-sky-300 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-sky-400" />
                    Pinned Task Objective
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {board.task}
                  </p>
                </div>
                {filteredPosts
                  .filter((p) => p.type === 'instruction')
                  .map((post) => (
                    <BoardPostCard key={post.id} post={post} agents={agents} />
                  ))}
              </div>
            </div>

            {/* Column 2: Findings & Research */}
            <div className="space-y-3 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-3">
              <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <span className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" />
                  Research & Findings
                </span>
                <span className="text-[10px] bg-cyan-950 px-1.5 py-0.5 rounded-full">
                  {filteredPosts.filter((p) => p.type === 'finding' || p.type === 'search').length}
                </span>
              </div>
              <div className="space-y-3">
                {filteredPosts.filter((p) => p.type === 'finding' || p.type === 'search').length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 italic">
                    No findings yet
                  </div>
                ) : (
                  filteredPosts
                    .filter((p) => p.type === 'finding' || p.type === 'search')
                    .map((post) => (
                      <BoardPostCard key={post.id} post={post} agents={agents} />
                    ))
                )}
              </div>
            </div>

            {/* Column 3: Thoughts & Critiques */}
            <div className="space-y-3 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/20 text-xs font-bold uppercase tracking-wider text-amber-400">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Deliberation & Audit
                </span>
                <span className="text-[10px] bg-amber-950 px-1.5 py-0.5 rounded-full">
                  {filteredPosts.filter((p) => p.type === 'thought' || p.type === 'critique').length}
                </span>
              </div>
              <div className="space-y-3">
                {filteredPosts.filter((p) => p.type === 'thought' || p.type === 'critique').length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 italic">
                    No critiques yet
                  </div>
                ) : (
                  filteredPosts
                    .filter((p) => p.type === 'thought' || p.type === 'critique')
                    .map((post) => (
                      <BoardPostCard key={post.id} post={post} agents={agents} />
                    ))
                )}
              </div>
            </div>

            {/* Column 4: Solutions & Synthesis */}
            <div className="space-y-3 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Solutions & Consensus
                </span>
                <span className="text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded-full">
                  {filteredPosts.filter((p) => p.type === 'solution' || p.type === 'synthesis').length}
                </span>
              </div>
              <div className="space-y-3">
                {filteredPosts.filter((p) => p.type === 'solution' || p.type === 'synthesis').length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 italic">
                    No solutions proposed yet
                  </div>
                ) : (
                  filteredPosts
                    .filter((p) => p.type === 'solution' || p.type === 'synthesis')
                    .map((post) => (
                      <BoardPostCard key={post.id} post={post} agents={agents} />
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AddInstructionModal
        isOpen={isInstructionModalOpen}
        onClose={() => setIsInstructionModalOpen(false)}
        onSubmit={(text, targetAgentId, targetAgentName) =>
          onAddInstruction(board.id, text, targetAgentId, targetAgentName)
        }
        originalTask={board.task}
        agents={agents.filter((a) => board.agentIds.includes(a.id))}
      />

      <NewBoardTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        agents={agents}
        onSubmit={onCreateNewBoard}
      />
    </div>
  );
};
