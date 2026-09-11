import React, { useState } from 'react';
import {
  PlusCircle,
  LayoutGrid,
  Clock,
  Trash2,
  Edit2,
  X,
  Play,
  Pause,
  CheckCircle2,
  Square
} from 'lucide-react';
import type { TaskBoard } from '../../types';

interface BoardSidebarProps {
  boards: TaskBoard[];
  activeBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onOpenNewBoardModal: () => void;
  onDeleteBoard: (boardId: string) => void;
  onRenameBoard: (boardId: string, newTitle: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  postCounts?: Record<string, number>;
}

export const BoardSidebar: React.FC<BoardSidebarProps> = ({
  boards,
  activeBoardId,
  onSelectBoard,
  onOpenNewBoardModal,
  onDeleteBoard,
  onRenameBoard,
  isOpenMobile,
  onCloseMobile,
  postCounts = {}
}) => {
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getStatusBadge = (status: TaskBoard['status']) => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <Play className="w-2.5 h-2.5 fill-emerald-400" />
            RUNNING
          </span>
        );
      case 'paused':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
            <Pause className="w-2.5 h-2.5 fill-amber-400" />
            PAUSED
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-2.5 h-2.5" />
            DONE
          </span>
        );
      case 'budget_exhausted':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full">
            <Square className="w-2.5 h-2.5 fill-orange-400" />
            LIMIT HIT
          </span>
        );
      case 'stopped':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-full">
            <Square className="w-2.5 h-2.5 fill-slate-400" />
            STOPPED
          </span>
        );
    }
  };

  const content = (
    <aside className="w-72 lg:w-80 h-full border-r border-slate-800 bg-slate-900/95 flex flex-col shrink-0 select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Task Boards ({boards.length})
          </h2>
        </div>
        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* New Task Button */}
      <div className="p-3 border-b border-slate-800">
        <button
          type="button"
          onClick={() => {
            onOpenNewBoardModal();
            onCloseMobile();
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 transition group"
        >
          <PlusCircle className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>Assign New Task</span>
        </button>
      </div>

      {/* Task Boards List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {boards.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No task boards yet. Click above to assign a task to the agents!
          </div>
        ) : (
          boards.map((board) => {
            const isActive = board.id === activeBoardId;
            const count = postCounts[board.id] || 0;
            const isEditing = editingBoardId === board.id;
            const isDeleting = confirmDeleteId === board.id;

            return (
              <div
                key={board.id}
                onClick={() => {
                  if (!isEditing && !isDeleting) {
                    onSelectBoard(board.id);
                    onCloseMobile();
                  }
                }}
                className={`group relative rounded-xl p-3 border transition cursor-pointer flex flex-col gap-2 ${
                  isActive
                    ? 'border-cyan-500/50 bg-cyan-950/20 shadow-md shadow-cyan-950/20'
                    : 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                {/* Title or Edit Input */}
                {isEditing ? (
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onRenameBoard(board.id, tempTitle);
                          setEditingBoardId(null);
                        } else if (e.key === 'Escape') {
                          setEditingBoardId(null);
                        }
                      }}
                      autoFocus
                      className="flex-1 bg-slate-900 border border-cyan-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onRenameBoard(board.id, tempTitle);
                        setEditingBoardId(null);
                      }}
                      className="text-[10px] px-2 py-0.5 bg-cyan-500 text-slate-950 font-bold rounded"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBoardId(null)}
                      className="text-[10px] px-1 text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug group-hover:text-cyan-300 transition">
                      {board.title}
                    </h3>
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setTempTitle(board.title);
                          setEditingBoardId(board.id);
                        }}
                        className="p-1 text-slate-400 hover:text-cyan-300 rounded"
                        title="Rename task"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(board.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded"
                        title="Delete task board"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Delete Confirmation */}
                {isDeleting && (
                  <div
                    className="flex items-center justify-between p-1.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-rose-200 text-[10px]">Delete task board?</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteBoard(board.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-[10px]"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1.5 py-0.5 text-slate-300 hover:text-white text-[10px]"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Badge & Metrics */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-850/60">
                  {getStatusBadge(board.status)}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span title="Total board contributions">{count} posts</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5" title="Elapsed duration">
                      <Clock className="w-2.5 h-2.5" />
                      {Math.floor((board.elapsedSeconds || 0) / 60)}m
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">{content}</div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 h-full">{content}</div>
        </div>
      )}
    </>
  );
};
