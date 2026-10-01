import React, { useState, useEffect, useRef } from 'react';
import type { Agent } from '../../types';
import { CloseIcon, CheckIcon } from '../icons/MinimalIcons';

interface NewSubThreadModalProps {
  isOpen: boolean;
  agents: Agent[];
  onClose: () => void;
  onSubmit: (topic: string, selectedAgentIds: string[]) => Promise<void>;
}

export const NewSubThreadModal: React.FC<NewSubThreadModalProps> = ({
  isOpen,
  agents,
  onClose,
  onSubmit
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [topic, setTopic] = useState('');
  const [userSelectedIds, setUserSelectedIds] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAgentIds = userSelectedIds ?? agents.slice(0, 3).map((a) => a.id);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const toggleAgent = (agentId: string) => {
    setUserSelectedIds((prev) => {
      const current = prev ?? agents.slice(0, 3).map((a) => a.id);
      return current.includes(agentId)
        ? current.filter((id) => id !== agentId)
        : [...current, agentId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || selectedAgentIds.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(topic.trim(), selectedAgentIds);
      setTopic('');
      setUserSelectedIds(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto p-0 bg-transparent backdrop:bg-black/30 backdrop:backdrop-blur-none max-w-lg w-full"
    >
      <div className="bg-white border border-[#EAEAEA] rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EAEAEA] flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#111111] leading-none">
              New Sub-Thread
            </h2>
            <p className="text-xs text-[#787774] font-sans mt-1">
              Branch off a specialized topic or dispute for deep-dive investigation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#787774] hover:text-[#111111] rounded hover:bg-[#F7F6F3] transition-colors"
            aria-label="Close dialog"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#787774] mb-1.5">
              Sub-Topic Title
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Dynamic Canary Auditing vs Static Formal Contracts"
              className="w-full bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] px-3 py-2 text-xs font-sans text-[#111111] placeholder-[#787774] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#787774]">
                Assigned Agents
              </label>
              <span className="text-[10px] font-mono text-[#787774]">
                {selectedAgentIds.length} assigned
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {agents.map((agent) => {
                const isSelected = selectedAgentIds.includes(agent.id);
                const monogram = agent.monogram || agent.name.slice(0, 2).toUpperCase() || 'AI';

                return (
                  <button
                    type="button"
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs transition-colors border text-left ${
                      isSelected
                        ? 'bg-white border-[#111111] text-[#111111]'
                        : 'bg-[#FBFBFA] border-[#EAEAEA] text-[#787774] hover:border-[#D4D4D0]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-semibold text-[10px] px-1 py-0.2 rounded border border-[#EAEAEA] bg-white">
                        {monogram}
                      </span>
                      <span className="truncate font-sans font-medium">
                        {agent.name}
                      </span>
                    </div>
                    {isSelected && <CheckIcon size={12} className="shrink-0 text-[#111111]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-[6px] text-xs font-sans font-medium text-[#787774] hover:text-[#111111] border border-[#EAEAEA] bg-white hover:bg-[#F9F9F8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topic.trim() || selectedAgentIds.length === 0 || isSubmitting}
              className="px-4 py-1.5 rounded-[6px] text-xs font-sans font-medium text-white bg-[#111111] hover:bg-[#2F3437] disabled:opacity-40 transition-colors"
            >
              Create Sub-Thread
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
