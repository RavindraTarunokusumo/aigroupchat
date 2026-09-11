import React from 'react';
import { Plus, Users, Check, Sparkles, X, Eye, Edit3 } from 'lucide-react';
import type { Agent } from '../types';

interface AgentSidebarProps {
  agents: Agent[];
  activeAgentIds: string[];
  onToggleAgent: (agentId: string) => void;
  onOpenNewAgentModal: () => void;
  onInspectAgent: (agent: Agent) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const AgentSidebar: React.FC<AgentSidebarProps> = ({
  agents,
  activeAgentIds,
  onToggleAgent,
  onOpenNewAgentModal,
  onInspectAgent,
  isOpenMobile,
  onCloseMobile
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold text-slate-100 text-sm">Agent Roster</h2>
            <span className="text-[11px] bg-slate-800 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
              {activeAgentIds.length}/{agents.length} active
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: Create custom agent */}
        <div className="p-3 border-b border-slate-800/80">
          <button
            onClick={onOpenNewAgentModal}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-2 group shadow-xs"
          >
            <Plus className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
            <span>Create Custom Agent</span>
          </button>
        </div>

        {/* Agent Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {agents.map((agent) => {
            const isActive = activeAgentIds.includes(agent.id);
            return (
              <div
                key={agent.id}
                onClick={() => onToggleAgent(agent.id)}
                className={`p-3 rounded-xl border transition cursor-pointer select-none relative overflow-hidden group ${
                  isActive
                    ? 'bg-slate-800/80 border-slate-700 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-60 hover:opacity-90'
                }`}
              >
                {/* Active Accent Indicator */}
                {isActive && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: agent.color }}
                  />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="text-xl p-1.5 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${agent.color}15` }}
                    >
                      {agent.avatar}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5 truncate">
                        <span className="truncate">{agent.name}</span>
                        {agent.isCustom && (
                          <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {agent.role}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Inspect Profile Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectAgent(agent);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-700/60 transition"
                      title={agent.isCustom ? 'Edit Profile & Prompt' : 'View Instructions (Read-only)'}
                      aria-label={agent.isCustom ? `Edit ${agent.name} profile` : `View ${agent.name} instructions`}
                    >
                      {agent.isCustom ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    {/* Toggle Indicator Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                        isActive
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                          : 'border-slate-700 bg-slate-950'
                      }`}
                    >
                      {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className="capitalize">{agent.provider}</span>
                  <span className="truncate max-w-[130px]">{agent.model}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer Tip */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
          Click an agent to toggle chat participation, or click <Eye className="w-3 h-3 inline mx-0.5 text-cyan-400" /> to view/edit instructions.
        </div>
      </aside>
    </>
  );
};
