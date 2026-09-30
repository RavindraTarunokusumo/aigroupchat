import React from 'react';
import type { DiscussionThread, ConversationThread, Agent } from '../../types';
import { HashIcon, BranchIcon, PlusIcon } from '../icons/MinimalIcons';

interface ThreadNavigationProps {
  discussions: DiscussionThread[];
  activeDiscussionId: string | null;
  conversationThreads: ConversationThread[];
  activeThreadId: string | null; // null = #main, string = sub-thread id
  agents: Agent[];
  onSelectDiscussion: (id: string) => void;
  onSelectThread: (threadId: string | null) => void;
  onOpenNewSubThreadModal: () => void;
}

export const ThreadNavigation: React.FC<ThreadNavigationProps> = ({
  discussions,
  activeDiscussionId,
  conversationThreads,
  activeThreadId,
  agents,
  onSelectDiscussion,
  onSelectThread,
  onOpenNewSubThreadModal
}) => {
  const activeDiscussion = discussions.find((d) => d.id === activeDiscussionId);
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  return (
    <aside className="w-72 lg:w-80 border-r border-[#EAEAEA] bg-[#FBFBFA] flex flex-col h-full overflow-hidden shrink-0 select-none">
      {/* Upper Section: Discussion Topics */}
      <div className="p-3 border-b border-[#EAEAEA]">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">
            Discussions
          </span>
          <span className="text-[10px] font-mono text-[#787774]">
            {discussions.length}
          </span>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {discussions.map((d) => {
            const isSelected = d.id === activeDiscussionId;
            return (
              <button
                key={d.id}
                onClick={() => onSelectDiscussion(d.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition-colors flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-white text-[#111111] font-medium border border-[#EAEAEA] shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                    : 'text-[#787774] hover:bg-[#F2F1ED] hover:text-[#111111]'
                }`}
              >
                <span className="truncate">{d.title}</span>
                {d.status === 'barrier_wait' && (
                  <span className="shrink-0 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-[#FBF3DB] text-[#956400]">
                    barrier
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Section: Threads Under Active Discussion */}
      <div className="flex-1 p-3 overflow-y-auto flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between px-1 mb-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">
              Conversation Threads
            </span>
          </div>

          <div className="space-y-1.5">
            {/* #main Root Discussion Thread */}
            <button
              onClick={() => onSelectThread(null)}
              className={`w-full text-left p-2.5 rounded-[6px] transition-all flex flex-col gap-1 border ${
                activeThreadId === null
                  ? 'bg-white border-[#111111] text-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                  : 'bg-transparent border-transparent hover:bg-[#F2F1ED] text-[#787774] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#111111]">
                  <HashIcon size={12} className="text-[#787774]" />
                  main
                </span>
                <span className="text-[10px] font-mono text-[#787774]">
                  Root
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#787774]">
                <span>
                  {activeDiscussion?.activeAgentIds.length || agents.length} participants
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#EDF3EC] text-[#346538]">
                  active
                </span>
              </div>
            </button>

            {/* Dynamic Sub-Threads */}
            {conversationThreads.map((thread) => {
              const isSelected = activeThreadId === thread.id;
              const isConcluded = thread.status === 'concluded';

              return (
                <button
                  key={thread.id}
                  onClick={() => onSelectThread(thread.id)}
                  className={`w-full text-left p-2.5 rounded-[6px] transition-all flex flex-col gap-1.5 border ${
                    isSelected
                      ? 'bg-white border-[#111111] text-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                      : 'bg-transparent border-transparent hover:bg-[#F2F1ED] text-[#787774] hover:text-[#111111]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-[#111111] leading-snug">
                      <BranchIcon size={12} className="text-[#787774] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{thread.topic}</span>
                    </span>
                    <span
                      className={`shrink-0 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full ${
                        isConcluded
                          ? 'bg-[#F7F6F3] text-[#787774]'
                          : 'bg-[#EDF3EC] text-[#346538]'
                      }`}
                    >
                      {thread.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    {/* Active Presence Chips with Monograms */}
                    <div className="flex items-center gap-1">
                      {thread.activeAgentIds.slice(0, 4).map((agentId) => {
                        const ag = agentMap.get(agentId);
                        const monogram = ag?.monogram || ag?.name.slice(0, 2).toUpperCase() || 'AI';
                        return (
                          <span
                            key={agentId}
                            className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-mono font-medium bg-white border border-[#EAEAEA] text-[#111111]"
                            title={ag?.name || 'Agent'}
                          >
                            {monogram}
                          </span>
                        );
                      })}
                      {thread.activeAgentIds.length > 4 && (
                        <span className="text-[9px] font-mono text-[#787774]">
                          +{thread.activeAgentIds.length - 4}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-[#787774]">
                      {thread.turnCount} turns
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trigger: New Sub-Thread */}
        <div className="pt-3 border-t border-[#EAEAEA]">
          <button
            onClick={onOpenNewSubThreadModal}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-[#D4D4D0] hover:border-[#111111] text-[#787774] hover:text-[#111111] rounded-[6px] text-xs font-sans font-medium transition-colors"
          >
            <PlusIcon size={12} />
            <span>New Sub-Thread</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
