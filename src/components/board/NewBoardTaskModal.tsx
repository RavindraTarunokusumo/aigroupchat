import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Users,
  Clock,
  Coins,
  Search,
  Check,
  Zap,
  LayoutGrid,
  Bot,
  Layers
} from 'lucide-react';
import { TASK_TEMPLATES, type TaskTemplate } from '../../lib/boardTemplates';
import type { Agent, TaskBoard } from '../../types';

interface NewBoardTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  onSubmit: (newBoard: Omit<TaskBoard, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const NewBoardTaskModal: React.FC<NewBoardTaskModalProps> = ({
  isOpen,
  onClose,
  agents,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [task, setTask] = useState('');
  const [initialInstruction, setInitialInstruction] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [selectedOrchestratorId, setSelectedOrchestratorId] = useState<string>('');
  const [maxDurationMinutes, setMaxDurationMinutes] = useState(15);
  const [tokenBudget, setTokenBudget] = useState(25000);
  const [turnLimit, setTurnLimit] = useState(12);
  const [turnCadenceSeconds, setTurnCadenceSeconds] = useState(3);
  const [enableSearch, setEnableSearch] = useState(true);

  // If user hasn't toggled specific agents, select all agents by default
  const effectiveAgentIds = useMemo(() => {
    if (selectedAgentIds.length > 0) return selectedAgentIds;
    return agents.map((a) => a.id);
  }, [selectedAgentIds, agents]);

  // Derive orchestrator agent (prefer user selection if still effective, otherwise fallback to 'The Moderator' or first agent)
  const orchestratorAgentId = useMemo(() => {
    if (selectedOrchestratorId && effectiveAgentIds.includes(selectedOrchestratorId)) {
      return selectedOrchestratorId;
    }
    const moderator = agents.find(
      (a) => effectiveAgentIds.includes(a.id) && (a.id.includes('moderator') || a.name.toLowerCase().includes('moderator'))
    );
    if (moderator) return moderator.id;
    return effectiveAgentIds[0] || '';
  }, [selectedOrchestratorId, effectiveAgentIds, agents]);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: TaskTemplate) => {
    setTitle(tpl.title);
    setTask(tpl.task);
    setMaxDurationMinutes(tpl.suggestedDuration);
    setTokenBudget(tpl.suggestedBudget);
    setTurnLimit(tpl.suggestedTurns);
    if (tpl.initialInstruction) {
      setInitialInstruction(tpl.initialInstruction);
    }
  };

  const handleToggleAgent = (id: string) => {
    if (effectiveAgentIds.includes(id)) {
      if (effectiveAgentIds.length > 1) {
        setSelectedAgentIds(effectiveAgentIds.filter((aId) => aId !== id));
      }
    } else {
      setSelectedAgentIds([...effectiveAgentIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !task.trim() || effectiveAgentIds.length === 0) return;

    const extraInstructions = initialInstruction.trim()
      ? [
          {
            id: `inst-${Date.now()}`,
            instruction: initialInstruction.trim(),
            timestamp: Date.now()
          }
        ]
      : [];

    onSubmit({
      title: title.trim(),
      task: task.trim(),
      extraInstructions,
      agentIds: effectiveAgentIds,
      orchestratorAgentId: orchestratorAgentId || effectiveAgentIds[0],
      currentPhase: 'strategy',
      maxDurationMinutes,
      tokenBudget,
      usedTokens: 0,
      turnLimit,
      currentTurn: 0,
      turnCadenceSeconds,
      status: 'running',
      enableSearch,
      elapsedSeconds: 0
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-board-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 id="new-board-title" className="text-base font-bold text-white">
                Assign Task & Launch Phased Swarm
              </h2>
              <p className="text-xs text-slate-400">
                Parallel multi-agent collaboration overseen by an Orchestrator agent
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Task Scoping Banner (V1 Scope: Deep Research & Plain-Text Writing) */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900 border border-cyan-500/30 rounded-xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 text-xs">
              <div className="font-bold text-cyan-300 flex items-center gap-2 flex-wrap">
                <span>V1 Scope: Deep Research & Plain-Text Writing</span>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  Virtual Environments In V2
                </span>
              </div>
              <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                Agents currently operate in a pure cognitive reasoning space without filesystem or terminal sandbox access. Tasks are scoped to literature reviews, strategic research briefs, comparative analyses, and long-form writing. Virtual test environments (e.g., via Namespace.so) will be introduced in V2.
              </p>
            </div>
          </div>

          {/* Quick Task Templates */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Deep Research & Writing Templates (Click to fill)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TASK_TEMPLATES.map((tpl) => (
                <button
                  type="button"
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl)}
                  className="text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-slate-700 transition flex flex-col justify-between group"
                >
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition line-clamp-2">
                    {tpl.title}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-medium border border-slate-700">
                      {tpl.category}
                    </span>
                    <span>{tpl.suggestedDuration}m</span>
                    <span>•</span>
                    <span>{tpl.suggestedTurns} turns</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Task Title */}
          <div>
            <label
              htmlFor="board-task-title"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Task Title *
            </label>
            <input
              id="board-task-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. State of the Art in Agentic Memory & Long-Horizon Reasoning"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Shared Task Objective */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="board-task-desc"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Shared Task Objective (Immutable once started) *
              </label>
              <span className="text-[10px] text-amber-400 font-mono">
                Only extra instructions can be added later
              </span>
            </div>
            <textarea
              id="board-task-desc"
              required
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Describe the research questions, literature comparison points, or document sections for the swarm..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition resize-none"
            />
          </div>

          {/* Initial Extra Instruction */}
          <div>
            <label
              htmlFor="board-initial-inst"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Initial Guideline / Directive (Optional)
            </label>
            <input
              id="board-initial-inst"
              type="text"
              value={initialInstruction}
              onChange={(e) => setInitialInstruction(e.target.value)}
              placeholder="e.g. Include empirical citations and concrete trade-off comparisons."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Participating Agents */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Swarm Participants ({effectiveAgentIds.length}/{agents.length})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAgentIds(agents.map((a) => a.id))}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300"
                >
                  Select All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {agents.map((agent) => {
                const isSelected = effectiveAgentIds.includes(agent.id);
                return (
                  <button
                    type="button"
                    key={agent.id}
                    onClick={() => handleToggleAgent(agent.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                      isSelected
                        ? 'border-cyan-500/50 bg-cyan-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-sm shrink-0">
                      {agent.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate">{agent.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{agent.role}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Designated Orchestrator Agent Selector */}
          <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                Designated Swarm Orchestrator
              </label>
              <span className="text-[10px] text-indigo-300 font-mono bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                Overseer & Master Synthesizer
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              The Orchestrator agent establishes the initial swarm strategy, coordinates parallel wave execution, and synthesizes the final comprehensive deliverable.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {agents
                .filter((a) => effectiveAgentIds.includes(a.id))
                .map((agent) => {
                  const isOrch = orchestratorAgentId === agent.id;
                  return (
                    <button
                      type="button"
                      key={agent.id}
                      onClick={() => setSelectedOrchestratorId(agent.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                        isOrch
                          ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/50'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-sm shrink-0">
                        {agent.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate text-slate-200">{agent.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{agent.role}</div>
                      </div>
                      {isOrch && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Settings Grid: Duration, Token Budget, Cadence, Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            {/* Maximum Duration */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Maximum Duration ({maxDurationMinutes} mins)
              </label>
              <div className="flex items-center gap-1.5">
                {[5, 10, 15, 30, 60].map((mins) => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() => setMaxDurationMinutes(mins)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition ${
                      maxDurationMinutes === mins
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Token Budget */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-cyan-400" />
                Token Budget ({(tokenBudget / 1000).toFixed(0)}k tokens)
              </label>
              <div className="flex items-center gap-1.5">
                {[10000, 25000, 50000, 100000].map((tokens) => (
                  <button
                    type="button"
                    key={tokens}
                    onClick={() => setTokenBudget(tokens)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition ${
                      tokenBudget === tokens
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tokens / 1000}k
                  </button>
                ))}
              </div>
            </div>

            {/* Turn Limit & Cadence */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Turn Limit & Speed
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={turnLimit}
                  onChange={(e) => setTurnLimit(Number(e.target.value))}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value={10}>10 turns</option>
                  <option value={20}>20 turns</option>
                  <option value={30}>30 turns</option>
                  <option value={50}>50 turns</option>
                </select>
                <select
                  value={turnCadenceSeconds}
                  onChange={(e) => setTurnCadenceSeconds(Number(e.target.value))}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value={1.5}>Fast (1.5s)</option>
                  <option value={3}>Normal (3s)</option>
                  <option value={5}>Deliberate (5s)</option>
                </select>
              </div>
            </div>

            {/* Web Search & Solutions Exploration Toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                Solution Search & Sources
              </label>
              <button
                type="button"
                onClick={() => setEnableSearch(!enableSearch)}
                className={`w-full py-1.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-between transition ${
                  enableSearch
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>Autonomous Solution Search</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                    enableSearch
                      ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                      : 'border-slate-600'
                  }`}
                >
                  {enableSearch && '✓'}
                </span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !task.trim() || effectiveAgentIds.length === 0}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Launch Collaborative Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
