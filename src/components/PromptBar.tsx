import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, Square, AtSign, Users, Mic } from 'lucide-react';
import type { Agent, ChatMode } from '../types';

export interface PromptBarHandle {
  insertMention: (agentName: string) => void;
}

interface PromptBarProps {
  activeAgents: Agent[];
  chatMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  isExecuting: boolean;
  onSend: (prompt: string) => void;
  onStop: () => void;
}

export const PromptBar = forwardRef<PromptBarHandle, PromptBarProps>(({
  activeAgents,
  chatMode,
  onModeChange,
  isExecuting,
  onSend,
  onStop
}, ref) => {
  const [input, setInput] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    insertMention: (agentName: string) => {
      setInput((prev) => {
        const trimmed = prev.trimEnd();
        return trimmed ? `${trimmed} @${agentName} ` : `@${agentName} `;
      });
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 10);
    }
  }));

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Handle input changes and check for '@'
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Look for active @mention at the cursor position
    const cursor = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    if (lastAt !== -1 && !textBeforeCursor.slice(lastAt).includes(' ')) {
      const query = textBeforeCursor.slice(lastAt + 1).toLowerCase();
      setMentionFilter(query);
      setShowMentionMenu(true);
    } else {
      setShowMentionMenu(false);
    }
  };

  const insertMentionFromMenu = (agentName: string) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const textBefore = input.slice(0, cursor);
    const lastAt = textBefore.lastIndexOf('@');
    const textAfter = input.slice(cursor);

    const newInput = `${input.slice(0, lastAt)}@${agentName} ${textAfter}`;
    setInput(newInput);
    setShowMentionMenu(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 10);
  };

  // Modern Web Guidance: IME-Safe Enter-to-Submit
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      // Safari and IME composition guard (event.isComposing and keyCode 229)
      if (event.nativeEvent.isComposing || event.keyCode === 229) {
        return;
      }

      submitPrompt();
    }
  };

  const submitPrompt = () => {
    const trimmed = input.trim();
    if (!trimmed || isExecuting) return;
    onSend(trimmed);
    setInput('');
    setShowMentionMenu(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const filteredAgents = activeAgents.filter(
    (a) =>
      a.name.toLowerCase().includes(mentionFilter) ||
      a.role.toLowerCase().includes(mentionFilter)
  );

  return (
    <div className="relative border-t border-slate-800 bg-slate-900/90 backdrop-blur-md p-4">
      {/* Mention Auto-Complete Dropdown */}
      {showMentionMenu && filteredAgents.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20">
          <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase bg-slate-900/60 border-b border-slate-700">
            Mention Agent
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-700/50">
            {filteredAgents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => insertMentionFromMenu(agent.name)}
                className="w-full px-3 py-2 text-left hover:bg-slate-700/80 transition flex items-center gap-2.5 group"
              >
                <span className="text-lg">{agent.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 group-hover:text-cyan-400 truncate">
                    {agent.name}
                  </div>
                  <div className="text-xs text-slate-400 truncate">{agent.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-2.5">
        {/* Mode & Action Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
            <button
              type="button"
              onClick={() => onModeChange('round-table')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
                chatMode === 'round-table'
                  ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                  : 'hover:text-slate-200'
              }`}
              title="All active agents speak in round-robin order"
            >
              <Users className="w-3.5 h-3.5" /> Round-Table
            </button>
            <button
              type="button"
              onClick={() => onModeChange('mention')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
                chatMode === 'mention'
                  ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                  : 'hover:text-slate-200'
              }`}
              title="Only directly @mentioned agents respond"
            >
              <AtSign className="w-3.5 h-3.5" /> Direct Mention
            </button>
            <button
              type="button"
              onClick={() => onModeChange('moderated')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
                chatMode === 'moderated'
                  ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                  : 'hover:text-slate-200'
              }`}
              title="Moderator directs the discussion and passes the floor"
            >
              <Mic className="w-3.5 h-3.5" /> Moderated
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span>Tip: Type <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">@</kbd> to mention</span>
            <span>•</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Enter</kbd> to send</span>
          </div>
        </div>

        {/* Input Bar */}
        <form
          id="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            submitPrompt();
          }}
          className="flex items-end gap-2 bg-slate-950 border border-slate-700/80 rounded-2xl p-2 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/30 transition shadow-inner"
        >
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isExecuting
                ? 'Agents are deliberating...'
                : 'Prompt the group, ask a question, or type @ to mention an agent...'
            }
            className="flex-1 max-h-48 resize-none bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none leading-relaxed"
          />

          {isExecuting ? (
            <button
              type="button"
              onClick={onStop}
              className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition flex items-center justify-center shrink-0"
              title="Stop Generation"
              aria-label="Stop Generation"
            >
              <Square className="w-4 h-4 fill-amber-300" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-slate-950 font-medium transition flex items-center justify-center shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
});
PromptBar.displayName = 'PromptBar';
