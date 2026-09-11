import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Sparkles } from 'lucide-react';
import type { Agent, ProviderId } from '../types';
import { AVAILABLE_MODELS, PROVIDER_LABELS } from '../lib/constants';

interface NewAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAgent: (agent: Agent) => void;
}

const PRESET_COLORS = ['#3B82F6', '#A855F7', '#F59E0B', '#10B981', '#EC4899', '#06B6D4', '#EF4444', '#8B5CF6'];
const PRESET_AVATARS = ['🤖', '🧠', '🎨', '🧐', '🎙️', '⚡', '🔬', '🛡️', '🧙‍♂️', '🚀'];

export const NewAgentModal: React.FC<NewAgentModalProps> = ({
  isOpen,
  onClose,
  onSaveAgent
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [color, setColor] = useState('#3B82F6');
  const [provider, setProvider] = useState<ProviderId>('openrouter');
  const [model, setModel] = useState('deepseek/deepseek-v4.1-flash');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Fallback for light dismiss
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

  // Filter models based on selected provider
  const availableProviderModels = AVAILABLE_MODELS.filter((m) => m.provider === provider);

  const handleProviderChange = (newProvider: ProviderId) => {
    setProvider(newProvider);
    const firstModel = AVAILABLE_MODELS.find((m) => m.provider === newProvider);
    if (firstModel) {
      setModel(firstModel.id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    const newAgent: Agent = {
      id: `agent-custom-${Date.now()}`,
      name: name.trim(),
      role: role.trim() || 'AI Specialist',
      avatar,
      color,
      provider,
      model,
      temperature,
      systemPrompt: systemPrompt.trim(),
      isCustom: true
    };

    onSaveAgent(newAgent);
    onClose();

    // Reset form
    setName('');
    setRole('');
    setSystemPrompt('');
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onClose={onClose}
      className="m-auto p-0 bg-slate-900 text-slate-100 border border-slate-700 rounded-2xl shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-xs max-w-lg w-full"
    >
      <form onSubmit={handleSave}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Create Custom Agent</h2>
              <p className="text-xs text-slate-400">Design a new persona to join your group chats.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Avatar and Name */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Avatar</label>
              <div className="relative">
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value.slice(0, 2))}
                  className="w-full text-center text-2xl py-1.5 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div className="col-span-3 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Strategist"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Quick Avatar Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {PRESET_AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                className={`p-1 text-lg rounded hover:bg-slate-800 transition ${
                  avatar === emoji ? 'bg-slate-800 ring-1 ring-cyan-500' : ''
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Role / Title</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. High-Level Strategy & Forecasting"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Color theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Accent Color</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    color === c ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Provider & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Provider</label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as ProviderId)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((p) => (
                  <option key={p} value={p}>
                    {PROVIDER_LABELS[p].name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Model</label>
                <button
                  type="button"
                  onClick={() => setIsCustomModel(!isCustomModel)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                >
                  {isCustomModel ? 'Pick from list' : 'Custom model ID'}
                </button>
              </div>
              {isCustomModel ? (
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. openai/gpt-6-astra"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                />
              ) : (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {availableProviderModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Temperature */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span>Creativity / Temperature</span>
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

          {/* System Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">System Persona Prompt</label>
            <textarea
              required
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Describe how this agent behaves, their perspective, strengths, quirks, and communication style..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Create Agent
          </button>
        </div>
      </form>
    </dialog>
  );
};
