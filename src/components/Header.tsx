import React from 'react';
import { Bot, Key, Menu, PlusCircle, Download } from 'lucide-react';
import type { ChatMode } from '../types';

interface HeaderProps {
  chatMode: ChatMode;
  onOpenKeysModal: () => void;
  onToggleMobileSidebar: () => void;
  onNewChat: () => void;
  onExportChat: () => void;
  hasAnyKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  chatMode,
  onOpenKeysModal,
  onToggleMobileSidebar,
  onNewChat,
  onExportChat,
  hasAnyKey
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0">
      {/* Left: Mobile menu toggle + Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 lg:hidden"
          aria-label="Open agents sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                AI Group Chat
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-md">
                BYOK
              </span>
              <span className="hidden md:inline-block text-[10px] uppercase font-mono tracking-wider bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md">
                Mode: {chatMode}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Multi-Agent Collaborative Playground
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onNewChat}
          className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5"
          title="Start fresh conversation"
        >
          <PlusCircle className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        <button
          type="button"
          onClick={onExportChat}
          className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5"
          title="Export conversation as Markdown"
        >
          <Download className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Export</span>
        </button>

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
