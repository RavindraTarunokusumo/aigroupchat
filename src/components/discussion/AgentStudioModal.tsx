import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import type { Agent, ProviderId } from '../../types';
import { DEFAULT_AGENTS, PROVIDER_LABELS, AVAILABLE_MODELS } from '../../lib/constants';
import {
  CloseIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ShieldIcon,
  EditIcon
} from '../icons/MinimalIcons';

export interface AgentStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_SWATCHES = [
  { label: 'Emerald', hex: '#059669' },
  { label: 'Green', hex: '#10B981' },
  { label: 'Blue', hex: '#3B82F6' },
  { label: 'Indigo', hex: '#6366F1' },
  { label: 'Purple', hex: '#8B5CF6' },
  { label: 'Rose', hex: '#E11D48' },
  { label: 'Amber', hex: '#D97706' },
  { label: 'Crimson', hex: '#DC2626' },
  { label: 'Teal', hex: '#0D9488' },
  { label: 'Slate', hex: '#4B5563' }
];

const MODEL_PRESETS: { label: string; model: string; provider: ProviderId }[] = [
  { label: 'DeepSeek V4.1 Flash', model: 'deepseek/deepseek-v4.1-flash', provider: 'openrouter' },
  { label: 'Qwen 3.8 27B Free', model: 'qwen/qwen3.8-27b:free', provider: 'openrouter' },
  { label: 'Nemotron 3 Ultra Free', model: 'nvidia/nemotron-3-ultra-550b-a55b:free', provider: 'openrouter' },
  { label: 'GLM 5.3 Flash', model: 'z-ai/glm-5.3-flash', provider: 'openrouter' },
  { label: 'Gemini 3.7 Flash', model: 'gemini-3.7-flash', provider: 'gemini' },
  { label: 'GPT-5.6 Sol', model: 'gpt-5.6-sol', provider: 'openai' },
  { label: 'Claude Sonnet 5', model: 'claude-sonnet-5', provider: 'anthropic' },
  { label: 'Llama 3.3 70B', model: 'llama-3.3-70b-versatile', provider: 'groq' }
];

const DEFAULT_SYSTEM_PROMPT = `You are participating in an editorial multi-agent deliberation.
Contribute your distinct domain perspectives objectively and concisely.

COMMUNICATION STYLE (STRICT):
- Be conversational rather than expository. Speak directly with colleagues in concise, natural peer dialogue (2–4 sentences).
- Do NOT dump long essays into the message body.
- When delivering a formal proposition, algorithm, schema, or proof, attach it as a document:
  [ATTACHMENT: filename.ext | Document Title]
  \`\`\`markdown
  ... structured specification ...
  \`\`\`
  [END_ATTACHMENT]`;

interface AgentStudioContentProps {
  onClose: () => void;
}

const AgentStudioContent: React.FC<AgentStudioContentProps> = ({ onClose }) => {
  const agents = useLiveQuery(() => db.agents.toArray(), [], []);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [monogram, setMonogram] = useState('');
  const [role, setRole] = useState('');
  const [provider, setProvider] = useState<ProviderId>('openrouter');
  const [model, setModel] = useState('deepseek/deepseek-v4.1-flash');
  const [temperature, setTemperature] = useState<number>(0.3);
  const [color, setColor] = useState('#3B82F6');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);

  // Feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [monogramManuallyEdited, setMonogramManuallyEdited] = useState(false);
  const [hasInitializedFirstAgent, setHasInitializedFirstAgent] = useState(false);

  // Initial selection of first agent when loaded
  if (!hasInitializedFirstAgent && agents.length > 0) {
    const first = agents[0];
    setSelectedAgentId(first.id);
    setName(first.name);
    setMonogram(first.monogram);
    setRole(first.role);
    setProvider(first.provider);
    setModel(first.model);
    setTemperature(first.temperature ?? 0.3);
    setColor(first.color || '#3B82F6');
    setSystemPrompt(first.systemPrompt || DEFAULT_SYSTEM_PROMPT);
    setMonogramManuallyEdited(true);
    setHasInitializedFirstAgent(true);
  }

  const loadAgent = (agent: Agent) => {
    setSelectedAgentId(agent.id);
    setIsCreatingNew(false);
    setName(agent.name);
    setMonogram(agent.monogram);
    setRole(agent.role);
    setProvider(agent.provider);
    setModel(agent.model);
    setTemperature(agent.temperature ?? 0.3);
    setColor(agent.color || '#3B82F6');
    setSystemPrompt(agent.systemPrompt || DEFAULT_SYSTEM_PROMPT);
    setMonogramManuallyEdited(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsConfirmingDelete(false);
  };

  const handleStartCreateNew = () => {
    setSelectedAgentId(null);
    setIsCreatingNew(true);
    setName('');
    setMonogram('');
    setRole('');
    setProvider('openrouter');
    setModel('deepseek/deepseek-v4.1-flash');
    setTemperature(0.3);
    setColor('#3B82F6');
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setMonogramManuallyEdited(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsConfirmingDelete(false);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!monogramManuallyEdited) {
      const trimmed = val.trim();
      if (!trimmed) {
        setMonogram('');
        return;
      }
      const words = trimmed.split(/\s+/).filter(Boolean);
      let derived = '';
      if (words.length >= 2) {
        derived = (words[0][0] + words[1][0]).toUpperCase();
      } else {
        derived = trimmed.slice(0, 2).toUpperCase();
      }
      setMonogram(derived);
    }
  };

  const handleMonogramChange = (val: string) => {
    setMonogramManuallyEdited(true);
    setMonogram(val.toUpperCase().slice(0, 2));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    const cleanMonogram = monogram.trim().toUpperCase();
    const trimmedRole = role.trim();
    const trimmedModel = model.trim();
    const trimmedPrompt = systemPrompt.trim();

    if (!trimmedName) {
      setErrorMessage('Agent name is required.');
      return;
    }

    if (cleanMonogram.length !== 2 || !/^[A-Z0-9]{2}$/.test(cleanMonogram)) {
      setErrorMessage('Monogram must be strictly 2 uppercase characters (e.g. "FO").');
      return;
    }

    if (!trimmedRole) {
      setErrorMessage('Role / Subtitle is required.');
      return;
    }

    if (!trimmedModel) {
      setErrorMessage('Default model is required.');
      return;
    }

    if (!trimmedPrompt) {
      setErrorMessage('System prompt is required.');
      return;
    }

    try {
      const now = Date.now();
      const existingAgent = selectedAgentId ? agents.find((a) => a.id === selectedAgentId) : null;
      const targetId = isCreatingNew || !selectedAgentId
        ? `agent-custom-${now}-${Math.random().toString(36).slice(2, 6)}`
        : selectedAgentId;

      const agentData: Agent = {
        id: targetId,
        name: trimmedName,
        role: trimmedRole,
        avatar: cleanMonogram,
        monogram: cleanMonogram,
        color: color.trim() || '#3B82F6',
        systemPrompt: trimmedPrompt,
        provider,
        model: trimmedModel,
        temperature: Number(temperature.toFixed(1)),
        isCustom: true,
        createdAt: existingAgent?.createdAt ?? now,
        updatedAt: now
      };

      await db.agents.put(agentData);
      setSelectedAgentId(targetId);
      setIsCreatingNew(false);
      setSuccessMessage(`Agent "${trimmedName}" saved successfully.`);
    } catch (err) {
      setErrorMessage(`Failed to save agent: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgentId) return;
    const isBuiltIn = DEFAULT_AGENTS.some((preset) => preset.id === selectedAgentId);
    if (isBuiltIn) {
      setErrorMessage('Built-in presets cannot be deleted.');
      setIsConfirmingDelete(false);
      return;
    }

    try {
      await db.agents.delete(selectedAgentId);
      setIsConfirmingDelete(false);
      setSuccessMessage('Custom agent deleted.');
      const remaining = agents.filter((a) => a.id !== selectedAgentId);
      if (remaining.length > 0) {
        loadAgent(remaining[0]);
      } else {
        handleStartCreateNew();
      }
    } catch (err) {
      setErrorMessage(`Failed to delete agent: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const isSelectedPreset = selectedAgentId
    ? DEFAULT_AGENTS.some((preset) => preset.id === selectedAgentId)
    : false;
  const canDeleteCurrent = !isSelectedPreset && Boolean(selectedAgent?.isCustom);

  // Models matching current provider
  const providerModels = AVAILABLE_MODELS.filter((m) => m.provider === provider);

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col max-h-[90vh]">
      {/* Modal Header */}
      <div className="px-6 py-4 border-b border-[#EAEAEA] flex items-center justify-between shrink-0 bg-[#FFFFFF]">
        <div>
          <h2 className="font-serif text-lg font-medium text-[#111111] leading-none">
            Agent Studio
          </h2>
          <p className="text-xs text-[#787774] font-sans mt-1">
            Configure deliberation personas, foundation models, and cognitive directives.
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

      {/* Modal Two-Pane Content */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left Column: Deliberation Roster */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#EAEAEA] bg-[#FBFBFA] flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-[#EAEAEA] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#787774]">
                Deliberation Roster
              </span>
              <span className="text-[10px] font-mono text-[#787774] bg-[#FFFFFF] border border-[#EAEAEA] px-1.5 py-0.2 rounded">
                {agents.length}
              </span>
            </div>
            <button
              type="button"
              onClick={handleStartCreateNew}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-sans font-medium rounded-[5px] border transition-colors ${
                isCreatingNew
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-[#111111] border-[#EAEAEA] hover:border-[#111111]'
              }`}
              title="Create a new custom persona"
            >
              <PlusIcon size={11} />
              <span>New Agent</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {agents.map((agent) => {
              const isSelected = !isCreatingNew && selectedAgentId === agent.id;
              const isPreset = DEFAULT_AGENTS.some((p) => p.id === agent.id);
              const displayMonogram = agent.monogram || agent.avatar || agent.name.slice(0, 2).toUpperCase();

              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => loadAgent(agent)}
                  className={`w-full text-left p-2.5 rounded-[6px] border transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-white border-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                      : 'bg-[#FBFBFA] border-[#EAEAEA] hover:bg-white hover:border-[#D4D4D0]'
                  }`}
                >
                  {/* Monogram Box */}
                  <div
                    className="w-8 h-8 rounded-[5px] border flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${agent.color || '#3B82F6'}15`,
                      borderColor: agent.color || '#3B82F6',
                      color: agent.color || '#3B82F6'
                    }}
                  >
                    {displayMonogram}
                  </div>

                  {/* Agent Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-sans font-medium text-xs text-[#111111] truncate">
                        {agent.name}
                      </span>
                      {isPreset ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono tracking-wider uppercase bg-[#E1F3FE] text-[#1F6C9F] shrink-0">
                          <ShieldIcon size={9} />
                          <span>Preset</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-mono tracking-wider uppercase bg-[#EDF3EC] text-[#346538] shrink-0">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-[11px] text-[#787774] truncate mt-0.5">
                      {agent.role}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-mono text-[10px] text-[#787774] truncate">
                        {agent.model}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Persona Form */}
        <div className="flex-1 bg-white flex flex-col overflow-y-auto">
          <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between">
            <div className="p-6 space-y-5">
              {/* Mode Indicator & Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
                <div>
                  <h3 className="font-serif text-base font-medium text-[#111111] flex items-center gap-2">
                    {!isCreatingNew && <EditIcon size={14} className="text-[#787774]" />}
                    <span>{isCreatingNew ? 'Create Deliberation Persona' : `Edit Persona: ${name || 'Agent'}`}</span>
                  </h3>
                  <p className="font-sans text-xs text-[#787774] mt-0.5">
                    {isCreatingNew
                      ? 'Define an autonomous persona with specialized cognitive traits.'
                      : isSelectedPreset
                      ? 'Built-in baseline model. Saving will persist customized parameters.'
                      : 'Custom editorial agent stored in local IndexedDB.'}
                  </p>
                </div>

                {/* Live Monogram Badge Preview */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">
                    Preview
                  </span>
                  <div
                    className="w-9 h-9 rounded-[6px] border flex items-center justify-center font-mono font-bold text-xs"
                    style={{
                      backgroundColor: `${color || '#3B82F6'}15`,
                      borderColor: color || '#3B82F6',
                      color: color || '#3B82F6'
                    }}
                  >
                    {monogram || '??'}
                  </div>
                </div>
              </div>

              {/* Feedback Alerts */}
              {errorMessage && (
                <div className="px-3 py-2 rounded-[6px] bg-[#FDEBEC] border border-[#F5C2C4] text-[11.5px] font-sans text-[#9F2F2D]">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="px-3 py-2 rounded-[6px] bg-[#EDF3EC] border border-[#C5E1C5] text-[11.5px] font-sans text-[#346538]">
                  {successMessage}
                </div>
              )}

              {/* Primary Identifiers: Name, Monogram, Role */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#787774] mb-1.5">
                    Persona Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. The Formalist"
                    className="w-full bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] px-3 py-2 text-xs font-sans text-[#111111] placeholder-[#787774] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#787774] mb-1.5">
                    Monogram *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={monogram}
                    onChange={(e) => handleMonogramChange(e.target.value)}
                    placeholder="FO"
                    className="w-full bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] px-3 py-2 text-xs font-mono font-bold uppercase text-center text-[#111111] placeholder-[#787774] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#787774] mb-1.5">
                    Role / Subtitle *
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Formal Verification & Type Theorist"
                    className="w-full bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] px-3 py-2 text-xs font-sans text-[#111111] placeholder-[#787774] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#787774] mb-1.5">
                  Default Provider
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((pid) => {
                    const isSelected = provider === pid;
                    return (
                      <button
                        key={pid}
                        type="button"
                        onClick={() => setProvider(pid)}
                        className={`px-2.5 py-1.5 text-xs font-sans rounded-[6px] border text-center transition-colors ${
                          isSelected
                            ? 'bg-[#111111] text-white border-[#111111] font-medium'
                            : 'bg-[#FBFBFA] border-[#EAEAEA] text-[#787774] hover:border-[#111111] hover:text-[#111111]'
                        }`}
                      >
                        {pid === 'openrouter' ? 'OpenRouter' : pid.charAt(0).toUpperCase() + pid.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Model Input & Preset Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#787774]">
                    Default Model Identifier *
                  </label>
                  <span className="text-[10px] font-mono text-[#787774]">
                    Provider: {provider}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. deepseek/deepseek-v4.1-flash"
                  className="w-full bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] px-3 py-2 text-xs font-mono text-[#111111] placeholder-[#787774] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
                />

                {/* Preset Chips */}
                <div className="mt-2">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-[#787774] mb-1">
                    Quick Model Presets
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {MODEL_PRESETS.map((preset) => {
                      const isActive = model === preset.model;
                      return (
                        <button
                          key={preset.model}
                          type="button"
                          onClick={() => {
                            setModel(preset.model);
                            setProvider(preset.provider);
                          }}
                          className={`px-2 py-0.8 text-[10px] font-mono rounded-[4px] border transition-colors ${
                            isActive
                              ? 'bg-[#111111] text-white border-[#111111]'
                              : 'bg-[#FBFBFA] text-[#787774] border-[#EAEAEA] hover:border-[#111111] hover:text-[#111111]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional provider-specific suggestions if available */}
                {providerModels.length > 0 && (
                  <div className="mt-2">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-[#787774] mb-1">
                      Available from {provider}
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {providerModels.map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setModel(pm.id)}
                          className={`px-2 py-0.5 text-[10px] font-mono rounded-[4px] border transition-colors ${
                            model === pm.id
                              ? 'bg-[#EDF3EC] text-[#346538] border-[#C5E1C5]'
                              : 'bg-white text-[#787774] border-[#EAEAEA] hover:border-[#787774]'
                          }`}
                        >
                          {pm.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Temperature & Accent Color */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Temperature Slider */}
                <div className="bg-[#FBFBFA] border border-[#EAEAEA] p-3 rounded-[6px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-[#787774]">
                      Sampling Temperature
                    </label>
                    <span className="font-mono text-xs font-semibold text-[#111111] bg-white border border-[#EAEAEA] px-1.5 py-0.2 rounded">
                      {temperature.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.5}
                    step={0.1}
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-[#111111] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#787774] mt-1">
                    <span>0.0 Deterministic</span>
                    <span>0.7 Balanced</span>
                    <span>1.5 Divergent</span>
                  </div>
                </div>

                {/* Color Accent */}
                <div className="bg-[#FBFBFA] border border-[#EAEAEA] p-3 rounded-[6px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-[#787774]">
                      Monogram Accent Color
                    </label>
                    <span className="text-[10px] font-mono text-[#787774]">{color}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-[4px] border border-[#EAEAEA] shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1 bg-white border border-[#EAEAEA] rounded-[4px] px-2 py-1 text-xs font-mono text-[#111111] focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setColor(swatch.hex)}
                        className={`w-5 h-5 rounded-[4px] border transition-transform hover:scale-105 ${
                          color.toLowerCase() === swatch.hex.toLowerCase()
                            ? 'ring-2 ring-[#111111] ring-offset-1 border-white'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* System Prompt Multi-line Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#787774]">
                    System Prompt & Cognitive Directives *
                  </label>
                  <span className="text-[10px] font-mono text-[#787774]">
                    Markdown enabled
                  </span>
                </div>
                <textarea
                  required
                  rows={7}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Provide persona instructions, domain constraints, and deliberation directives..."
                  className="w-full bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] px-3 py-2 text-xs font-mono text-[#111111] placeholder-[#787774] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors resize-y leading-relaxed"
                />
                <p className="text-[10.5px] font-sans text-[#787774] mt-1">
                  Directives dictate argumentation posture, mathematical rigor, and attachment protocols.
                </p>
              </div>
            </div>

            {/* Form Sticky Action Footer */}
            <div className="sticky bottom-0 bg-white border-t border-[#EAEAEA] px-6 py-3 flex items-center justify-between shrink-0">
              <div>
                {canDeleteCurrent && (
                  <>
                    {isConfirmingDelete ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#FDEBEC] border border-[#F5C2C4] text-[11px] font-mono text-[#9F2F2D]">
                        <span>Delete agent?</span>
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="font-semibold underline hover:text-[#781B19]"
                        >
                          Confirm
                        </button>
                        <span className="text-[#F5C2C4]">|</span>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDelete(false)}
                          className="text-[#787774] hover:text-[#111111]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-xs font-sans font-medium text-[#9F2F2D] hover:bg-[#FDEBEC] border border-transparent hover:border-[#F5C2C4] transition-colors"
                      >
                        <TrashIcon size={12} />
                        <span>Delete Agent</span>
                      </button>
                    )}
                  </>
                )}

                {isSelectedPreset && !isCreatingNew && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-sans text-[#787774]">
                    <ShieldIcon size={12} className="text-[#1F6C9F]" />
                    <span>Built-in preset protected from deletion.</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-[6px] text-xs font-sans font-medium text-[#787774] hover:text-[#111111] border border-[#EAEAEA] bg-white hover:bg-[#F9F9F8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] text-xs font-sans font-medium text-white bg-[#111111] hover:bg-[#2F3437] transition-colors"
                >
                  <CheckIcon size={12} />
                  <span>{isCreatingNew ? 'Create Agent' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const AgentStudioModal: React.FC<AgentStudioModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto p-0 bg-transparent backdrop:bg-black/30 backdrop:backdrop-blur-none max-w-5xl w-full"
    >
      {isOpen && <AgentStudioContent onClose={onClose} />}
    </dialog>
  );
};
