import React, { useState } from 'react';
import { Bot, Key, Menu, PlusCircle, Download, MessageSquare, Trash2, Edit2, LayoutGrid } from 'lucide-react';
import type { ChatMode } from '../types';

interface HeaderProps {
  chatMode: ChatMode;
  activePage: 'chat' | 'board';
  onSelectPage: (page: 'chat' | 'board') => void;
  isBoardRunning?: boolean;
  onOpenKeysModal: () => void;
  onToggleMobileSidebar: () => void;
  onNewChat: () => void;
  onExportChat: () => void;
  hasAnyKey: boolean;

  // Stored chats & conversation controls
  conversationTitle?: string;
  onRenameChat?: (newTitle: string) => void;
  onDeleteCurrentChat?: () => void;
  onOpenChatsTab?: () => void;
  conversationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  chatMode,
  activePage,
  onSelectPage,
  isBoardRunning,
  onOpenKeysModal,
  onToggleMobileSidebar,
  onNewChat,
  onExportChat,
  hasAnyKey,
  conversationTitle,
  onRenameChat,
  onDeleteCurrentChat,
  onOpenChatsTab,
  conversationsCount
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [confirmDeleteCurrent, setConfirmDeleteCurrent] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-10 shrink-0 gap-2">
      {/* Left: Mobile menu toggle + Branding */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 lg:hidden shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                AI Group Chat
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-md">
                BYOK
              </span>
              {activePage === 'chat' && (
                <span className="hidden xl:inline-block text-[10px] uppercase font-mono tracking-wider bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md">
                  Mode: {chatMode}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Multi-Agent Collaborative Playground
            </p>
          </div>
        </div>

        {/* Page Switcher Navigation Pill */}
        <nav className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800 shrink-0 ml-1 sm:ml-3">
          <button
            type="button"
            onClick={() => onSelectPage('chat')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activePage === 'chat'
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Chat</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectPage('board')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activePage === 'board'
                ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Message Board</span>
            {isBoardRunning && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
        </nav>

        {/* Current Conversation Title (only in chat view) */}
        {activePage === 'chat' && conversationTitle && (
          <div className="hidden 2xl:flex items-center gap-2 min-w-0 pl-3 border-l border-slate-800 ml-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRenameChat?.(tempTitle);
                      setIsEditingTitle(false);
                    } else if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400 w-44"
                  placeholder="Chat title..."
                />
                <button
                  type="button"
                  onClick={() => {
                    onRenameChat?.(tempTitle);
                    setIsEditingTitle(false);
                  }}
                  className="text-[11px] px-2 py-1 rounded bg-cyan-500 text-slate-950 font-medium hover:bg-cyan-400 transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  className="text-[11px] px-1.5 py-1 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group max-w-[220px]">
                <span
                  className="text-xs font-semibold text-slate-300 truncate"
                  title={conversationTitle}
                >
                  {conversationTitle}
                </span>
                {onRenameChat && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempTitle(conversationTitle);
                      setIsEditingTitle(true);
                    }}
                    className="p-1 rounded text-slate-500 hover:text-cyan-300 opacity-0 group-hover:opacity-100 transition"
                    title="Rename chat"
                    aria-label="Rename chat"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Chat-specific action buttons */}
        {activePage === 'chat' && (
          <>
            {/* Chats History Toggle */}
            {onOpenChatsTab && (
              <button
                type="button"
                onClick={onOpenChatsTab}
                className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 border border-slate-800"
                title="View stored chats"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="hidden md:inline">Chats</span>
                {conversationsCount !== undefined && conversationsCount > 0 && (
                  <span className="text-[10px] bg-slate-800 text-cyan-300 font-mono px-1.5 py-0.2 rounded-full border border-slate-700">
                    {conversationsCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onNewChat}
              className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 border border-slate-800"
              title="Start fresh conversation"
            >
              <PlusCircle className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">New Chat</span>
            </button>

            <button
              type="button"
              onClick={onExportChat}
              className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 border border-slate-800"
              title="Export conversation as Markdown"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span className="hidden lg:inline">Export</span>
            </button>

            {/* Delete current chat quick action */}
            {onDeleteCurrentChat && (
              confirmDeleteCurrent ? (
                <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/60 rounded-xl p-1 text-xs">
                  <span className="text-rose-200 text-[11px] px-1.5 hidden md:inline">Delete chat?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteCurrentChat();
                      setConfirmDeleteCurrent(false);
                    }}
                    className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteCurrent(false)}
                    className="px-1.5 py-0.5 text-slate-300 hover:text-white text-[11px]"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteCurrent(true)}
                  className="p-2 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition border border-slate-800"
                  title="Delete this chat"
                  aria-label="Delete this chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}
          </>
        )}

        {/* API Keys Configuration Button */}
        <button
          type="button"
          onClick={onOpenKeysModal}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 border ${
            hasAnyKey
              ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">API Keys</span>
          <span
            className={`w-2 h-2 rounded-full ${
              hasAnyKey ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
        </button>
      </div>
    </header>
  );
};
