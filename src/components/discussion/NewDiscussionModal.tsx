import React, { useState, useEffect, useRef } from 'react';
import type { Agent } from '../../types';
import { CloseIcon, CheckIcon } from '../icons/MinimalIcons';

interface NewDiscussionModalProps {
  isOpen: boolean;
  agents: Agent[];
  onClose: () => void;
  onSubmit: (title: string, topic: string, selectedAgentIds: string[], tokenBudget: number) => Promise<void>;
}

export const NewDiscussionModal: React.FC<NewDiscussionModalProps> = ({
  isOpen,
  agents,
  onClose,
  onSubmit
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [tokenBudget, setTokenBudget] = useState<number>(10000);
  const [deselectedAgentIds, setDeselectedAgentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAgentIds = agents
    .filter((a) => !deselectedAgentIds.includes(a.id))
    .map((a) => a.id);

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
    setDeselectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || selectedAgentIds.length === 0 || isSubmitting) return;

    const finalTitle =
      title.trim() ||
      topic.trim().slice(0, 36) + (topic.trim().length > 36 ? '...' : '');

    try {
      setIsSubmitting(true);
      await onSubmit(finalTitle, topic.trim(), selectedAgentIds, tokenBudget);
      setTitle('');
      setTopic('');
      setTokenBudget(10000);
      setDeselectedAgentIds([]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const budgetPresets = [
    { label: '5k', value: 5000 },
    { label: '10k', value: 10000 },
    { label: '25k', value: 25000 },
    { label: '50k', value: 50000 },
    { label: 'Unlimited', value: 0 }
  ];

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto p-0 bg-transparent backdrop:bg-black/30 backdrop:backdrop-blur-none max-w-lg w-full"
    >
      <div className="bg-white border border-[#EAEAEA] rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#EAEAEA] flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#111111] leading-none">
              New Deliberation
            </h2>
            <p className="text-xs text-[#787774] font-sans mt-1">
              Formulate a core thesis for the autonomous swarm to address.
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#787774] mb-1.5">
              Discussion Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Constitutional AI in Swarm Architecture"
              className="w-full bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] px-3 py-2 text-xs font-sans text-[#111111] placeholder-[#787774] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#787774] mb-1.5">
              Core Thesis or Problem Prompt
            </label>
            <textarea
              required
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="State the primary dilemma, question, or proposition in detail..."
              className="w-full bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] px-3 py-2 text-xs font-sans text-[#111111] placeholder-[#787774] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Token Budget Configuration */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#787774]">
                Token Budget Ceiling
              </label>
              <span className="text-[10px] font-mono text-[#787774]">
                {tokenBudget > 0 ? `${tokenBudget.toLocaleString()} tokens` : 'Unlimited'}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <input
                type="number"
                min={0}
                step={1000}
                value={tokenBudget}
                onChange={(e) => setTokenBudget(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="flex-1 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] px-3 py-1.5 text-xs font-mono text-[#111111] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
                placeholder="10000"
              />
              <div className="flex items-center gap-1">
                {budgetPresets.map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() => setTokenBudget(preset.value)}
                    className={`px-2 py-1 text-[10px] font-mono rounded-[4px] border transition-colors ${
                      tokenBudget === preset.value
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-[#FBFBFA] text-[#787774] border-[#EAEAEA] hover:border-[#111111]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10.5px] font-sans text-[#787774]">
              Deliberation automatically concludes when cumulative token consumption across all channels reaches this budget (0 = no limit).
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#787774]">
                Participating Agents
              </label>
              <span className="text-[10px] font-mono text-[#787774]">
                {selectedAgentIds.length} of {agents.length} active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
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
              Create Discussion
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
