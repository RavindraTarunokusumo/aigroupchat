import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Copy, Check, Lock, Sparkles, Trash2, Edit3, Save } from 'lucide-react';
import type { Agent, ProviderId } from '../types';
import { AVAILABLE_MODELS, PROVIDER_LABELS } from '../lib/constants';

interface AgentProfileModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateAgent: (updatedAgent: Agent) => void;
  onDeleteAgent?: (agentId: string) => void;
  onDuplicateAsCustom?: (agent: Agent) => void;
}

const PRESET_COLORS = ['#3B82F6', '#A855F7', '#F59E0B', '#10B981', '#EC4899', '#06B6D4', '#EF4444', '#8B5CF6'];

interface AgentProfileContentProps {
  agent: Agent;
  onClose: () => void;
  onUpdateAgent: (updatedAgent: Agent) => void;
  onDeleteAgent?: (agentId: string) => void;
  onDuplicateAsCustom?: (agent: Agent) => void;
}

const AgentProfileContent: React.FC<AgentProfileContentProps> = ({
  agent,
  onClose,
  onUpdateAgent,
  onDeleteAgent,
  onDuplicateAsCustom
}) => {
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [avatar, setAvatar] = useState(agent.avatar);
  const [color, setColor] = useState(agent.color);
  const [provider, setProvider] = useState<ProviderId>(agent.provider);
  const [model, setModel] = useState(agent.model);
  const [temperature, setTemperature] = useState(agent.temperature);
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt);

  const isCustom = Boolean(agent.isCustom);
  const availableProviderModels = AVAILABLE_MODELS.filter((m) => m.provider === provider);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(agent.systemPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProviderChange = (newProvider: ProviderId) => {
    setProvider(newProvider);
    const firstModel = AVAILABLE_MODELS.find((m) => m.provider === newProvider);
    if (firstModel) {
      setModel(firstModel.id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCustom) return;

    const updated: Agent = {
      ...agent,
      name: name.trim(),
      role: role.trim(),
      avatar,
      color,
      provider,
      model,
      temperature,
      systemPrompt: systemPrompt.trim()
    };

    onUpdateAgent(updated);
    onClose();
  };

  const handleDelete = () => {
    if (!isCustom || !onDeleteAgent) return;
    if (window.confirm(`Are you sure you want to delete "${agent.name}"?`)) {
      onDeleteAgent(agent.id);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSave}>
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0"
            style={{
              backgroundColor: `${color}20`,
              borderColor: `${color}50`,
              borderWidth: '1px'
            }}
          >
            {isCustom ? avatar : agent.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                {isCustom ? name || 'Custom Agent' : agent.name}
              </h2>
              {isCustom ? (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Edit3 className="w-2.5 h-2.5" /> Editable
                </span>
              ) : (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Default (Read-Only)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{isCustom ? role : agent.role}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-6 space-y-5 max-h-[68vh] overflow-y-auto">
        {/* Read-only Notice for Default Agents */}
        {!isCustom && (
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>
                This is a built-in default agent. Its persona and instructions cannot be edited directly.
              </span>
              {onDuplicateAsCustom && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onDuplicateAsCustom(agent);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-medium transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-300" /> Duplicate as Custom Agent to Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Model & Provider Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Provider</label>
            {isCustom ? (
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as ProviderId)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((p) => (
                  <option key={p} value={p}>
                    {PROVIDER_LABELS[p].name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono">
                {PROVIDER_LABELS[agent.provider]?.name || agent.provider}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Model</label>
            {isCustom ? (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {availableProviderModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-cyan-400 font-mono truncate">
                {agent.model}
              </div>
            )}
          </div>
        </div>

        {/* If Custom: Name and Role editing */}
        {isCustom && (
          <>
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1 space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Avatar</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value.slice(0, 2))}
                  className="w-full text-center text-xl py-1 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="col-span-3 space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Role / Title</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Color Theme</label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      color === c ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Temperature</span>
                <span className="font-mono text-cyan-400">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          </>
        )}

        {/* System Persona / Instruction Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>Agent Instruction Prompt (Persona / Personality)</span>
            </label>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy Prompt
                </>
              )}
            </button>
          </div>

          {isCustom ? (
            <textarea
              required
              rows={7}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
            />
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
              {agent.systemPrompt}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
        <div>
          {isCustom && onDeleteAgent && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Agent
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs transition"
          >
            {isCustom ? 'Cancel' : 'Close'}
          </button>
          {isCustom && (
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export const AgentProfileModal: React.FC<AgentProfileModalProps> = ({
  agent,
  isOpen,
  onClose,
  onUpdateAgent,
  onDeleteAgent,
  onDuplicateAsCustom
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync open state with native dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Light-dismiss fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (!isContent) {
        onClose();
      }
    };

    dialog.addEventListener('click', handleBackdropClick);
    return () => dialog.removeEventListener('click', handleBackdropClick);
  }, [onClose]);

  if (!agent) return null;

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onClose={onClose}
      className="m-auto p-0 bg-slate-900 text-slate-100 border border-slate-700 rounded-2xl shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-xs max-w-xl w-full"
    >
      <AgentProfileContent
        key={agent.id}
        agent={agent}
        onClose={onClose}
        onUpdateAgent={onUpdateAgent}
        onDeleteAgent={onDeleteAgent}
        onDuplicateAsCustom={onDuplicateAsCustom}
      />
    </dialog>
  );
};
