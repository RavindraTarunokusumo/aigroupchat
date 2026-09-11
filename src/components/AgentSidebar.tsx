import React, { useState } from 'react';
import { Plus, Users, Check, Sparkles, X, Eye, Edit3, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import type { Agent, Conversation } from '../types';

interface AgentSidebarProps {
  agents: Agent[];
  activeAgentIds: string[];
  onToggleAgent: (agentId: string) => void;
  onOpenNewAgentModal: () => void;
  onInspectAgent: (agent: Agent) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;

  // Conversations management
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (convId: string) => void;
  onDeleteConversation: (convId: string) => void;
  onRenameConversation: (convId: string, newTitle: string) => void;
  onNewChat: () => void;
  messageCounts?: Record<string, number>;
  activeTab?: 'agents' | 'chats';
  onTabChange?: (tab: 'agents' | 'chats') => void;
}

export const AgentSidebar: React.FC<AgentSidebarProps> = ({
  agents,
  activeAgentIds,
  onToggleAgent,
  onOpenNewAgentModal,
  onInspectAgent,
  isOpenMobile,
  onCloseMobile,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onNewChat,
  messageCounts = {},
  activeTab = 'agents',
  onTabChange
}) => {
  const [internalTab, setInternalTab] = useState<'agents' | 'chats'>('agents');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const currentTab = onTabChange ? activeTab : internalTab;
  const setTab = (tab: 'agents' | 'chats') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

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
        className={`fixed inset-y-0 left-0 z-40 w-80 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Tabs Header */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 flex-1">
            <button
              type="button"
              onClick={() => setTab('agents')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                currentTab === 'agents'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Agents</span>
              <span className="text-[10px] bg-slate-900/90 text-cyan-400 px-1.5 py-0.2 rounded-full border border-slate-800">
                {activeAgentIds.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab('chats')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                currentTab === 'chats'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chats</span>
              <span className="text-[10px] bg-slate-900/90 text-slate-400 px-1.5 py-0.2 rounded-full border border-slate-800">
                {conversations.length}
              </span>
            </button>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB 1: AGENTS ROSTER */}
        {currentTab === 'agents' && (
          <>
            {/* Action Button: Create custom agent */}
            <div className="p-3 border-b border-slate-800/80">
              <button
                type="button"
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
          </>
        )}

        {/* TAB 2: STORED CHATS */}
        {currentTab === 'chats' && (
          <>
            {/* Action Button: Start New Chat */}
            <div className="p-3 border-b border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  onNewChat();
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-2 group shadow-xs"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition stroke-[2.5]" />
                <span>Start New Chat</span>
              </button>
            </div>

            {/* Stored Conversations List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center py-12 px-4 text-xs text-slate-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  No stored chats yet. Click above to start a new chat!
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  const msgCount = messageCounts[conv.id] ?? 0;
                  const isEditing = editingId === conv.id;
                  const isConfirmingDelete = confirmDeleteId === conv.id;

                  if (isConfirmingDelete) {
                    return (
                      <div
                        key={conv.id}
                        className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-xs space-y-2.5 animate-fadeIn"
                      >
                        <p className="font-semibold text-rose-300">
                          Delete &quot;{conv.title}&quot;?
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          This will permanently remove this chat and its {msgCount} messages.
                        </p>
                        <div className="flex items-center gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteConversation(conv.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition flex items-center gap-1 shadow-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (isEditing) {
                    return (
                      <div
                        key={conv.id}
                        className="p-3 rounded-xl bg-slate-800/90 border border-cyan-500/50 space-y-2"
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onRenameConversation(conv.id, editTitle);
                              setEditingId(null);
                            } else if (e.key === 'Escape') {
                              setEditingId(null);
                            }
                          }}
                          autoFocus
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
                          placeholder="Chat title..."
                        />
                        <div className="flex items-center gap-2 justify-end text-[11px]">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2 py-0.5 rounded text-slate-400 hover:text-slate-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onRenameConversation(conv.id, editTitle);
                              setEditingId(null);
                            }}
                            className="px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-medium hover:bg-cyan-400 text-xs"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        if (isOpenMobile) onCloseMobile();
                      }}
                      className={`group relative p-3 rounded-xl border transition cursor-pointer select-none ${
                        isActive
                          ? 'bg-cyan-950/40 border-cyan-500/40 shadow-sm'
                          : 'bg-slate-900/50 border-slate-800/70 hover:bg-slate-800/60 hover:border-slate-700/80'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-l-xl" />
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div
                            className={`font-semibold text-xs truncate ${
                              isActive ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'
                            }`}
                          >
                            {conv.title}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            <span>
                              {new Date(conv.updatedAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            <span>•</span>
                            <span>{msgCount} {msgCount === 1 ? 'msg' : 'msgs'}</span>
                            <span className="capitalize hidden sm:inline">• {conv.mode}</span>
                          </div>
                        </div>

                        {/* Actions: Rename & Delete */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(conv.id);
                              setEditTitle(conv.title);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                            title="Rename chat"
                            aria-label="Rename chat"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(conv.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Delete chat"
                            aria-label="Delete chat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar Footer Tip */}
            <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
              Chats are stored offline in your browser&apos;s IndexedDB.
            </div>
          </>
        )}
      </aside>
    </>
  );
};
