import React, { useState, useEffect } from 'react';
import { PlusCircle, X, ShieldAlert, Sparkles, Users, Zap, Lock, DollarSign, RefreshCw } from 'lucide-react';
import type { Agent } from '../../types';

interface AddInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (instruction: string, targetAgentId?: string, targetAgentName?: string) => void;
  originalTask: string;
  agents?: Agent[];
}

const CONSTRAINT_PRESETS = [
  {
    icon: Zap,
    label: 'Low Latency (<50ms)',
    text: 'Enforce strict p99 latency target below 50ms under concurrent load with pre-warmed connection pools.'
  },
  {
    icon: Lock,
    label: 'Zero-Trust & Privacy',
    text: 'Mandate zero-trust encryption at rest and in transit; no customer data logged unhashed.'
  },
  {
    icon: DollarSign,
    label: 'Cost Budget (<$50/mo)',
    text: 'Architect must stay strictly within a $50/month infrastructure cost ceiling using serverless/shared tiers.'
  },
  {
    icon: RefreshCw,
    label: 'Zero-Downtime Rollback',
    text: 'Ensure automated canary health checks and automated 1-click rollback on partition failure.'
  }
];

export const AddInstructionModal: React.FC<AddInstructionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  originalTask,
  agents = []
}) => {
  const [instruction, setInstruction] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');

  const handleClose = React.useCallback(() => {
    setInstruction('');
    setSelectedAgentId('all');
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    if (selectedAgentId === 'all') {
      onSubmit(instruction.trim());
    } else {
      const target = agents.find((a) => a.id === selectedAgentId);
      onSubmit(instruction.trim(), selectedAgentId, target?.name);
    }
    handleClose();
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-instruction-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 id="add-instruction-title" className="text-base font-bold text-white">
                Add Extra Instruction
              </h2>
              <p className="text-xs text-slate-400">
                Inject live constraints or guidance to the collaborative agents
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Read-only Immutable Task Notice */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Original Shared Task (Immutable)
            </div>
            <p className="text-xs text-slate-300 italic line-clamp-3">
              "{originalTask}"
            </p>
          </div>

          {/* Target Agent Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Direct Constraint To
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedAgentId('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border ${
                  selectedAgentId === 'all'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>All Agents (Broadcast)</span>
              </button>
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border ${
                    selectedAgentId === agent.id
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{agent.avatar || '🤖'}</span>
                  <span>{agent.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Constraint Preset Chips */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Quick Constraint Presets
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CONSTRAINT_PRESETS.map((preset, idx) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInstruction(preset.text);
                    }}
                    className="p-2 rounded-xl bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/30 text-left transition flex items-center gap-2 group"
                  >
                    <Icon className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-[11px] font-medium text-slate-300 group-hover:text-sky-200 truncate">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* New Instruction Textarea */}
          <div>
            <label
              htmlFor="instruction-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Extra Directive / Constraint
            </label>
            <textarea
              id="instruction-input"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Note: Must be compatible with AWS Graviton (ARM64) and achieve zero data loss under simulated zone failure."
              rows={3}
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
              {selectedAgent
                ? `@${selectedAgent.name} will be scheduled next to address this directive directly.`
                : 'Agents will incorporate this constraint into all subsequent collaboration turns.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!instruction.trim()}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-md shadow-sky-500/20"
            >
              {selectedAgent ? `Inject for @${selectedAgent.name}` : 'Inject Directive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
