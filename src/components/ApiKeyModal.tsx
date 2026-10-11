import React, { useEffect, useRef, useState } from 'react';
import type { ProviderId } from '../types';
import { PROVIDER_LABELS } from '../lib/constants';
import { getAllApiKeys, saveApiKey, validateApiKey } from '../lib/keys';
import { KeyIcon, CloseIcon, CheckIcon, ActivityIcon, ExternalLinkIcon, TerminalIcon, SearchIcon } from './icons/MinimalIcons';
import {
  getBraintrustConfig,
  saveBraintrustConfig,
  validateBraintrustKey,
  syncBraintrustConfigFromDb,
  type BraintrustConfig
} from '../lib/observability/braintrust';
import {
  getE2BConfig,
  saveE2BConfig,
  validateE2BKey,
  DEFAULT_E2B_KEY
} from '../lib/execution/e2bExecutor';
import {
  getTavilyApiKey,
  saveTavilyApiKey,
  validateTavilyKey
} from '../lib/search/tavilySearch';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeysUpdated }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [keys, setKeys] = useState<Record<ProviderId, string>>({
    openrouter: '',
    gemini: '',
    openai: '',
    anthropic: '',
    groq: ''
  });
  const [testingProvider, setTestingProvider] = useState<ProviderId | null>(null);
  const [statusMap, setStatusMap] = useState<Record<ProviderId, { success?: boolean; msg?: string }>>({
    openrouter: {},
    gemini: {},
    openai: {},
    anthropic: {},
    groq: {}
  });

  const [btConfig, setBtConfig] = useState<BraintrustConfig>(getBraintrustConfig());
  const [btTesting, setBtTesting] = useState(false);
  const [btStatus, setBtStatus] = useState<{ success?: boolean; msg?: string }>({});

  const [e2bKey, setE2bKey] = useState(DEFAULT_E2B_KEY);
  const [e2bLanguage, setE2bLanguage] = useState<'python' | 'js' | 'bash'>('python');
  const [e2bTesting, setE2bTesting] = useState(false);
  const [e2bStatus, setE2bStatus] = useState<{ success?: boolean; msg?: string }>({});

  const [tavilyKey, setTavilyKey] = useState('');
  const [tavilyTesting, setTavilyTesting] = useState(false);
  const [tavilyStatus, setTavilyStatus] = useState<{ success?: boolean; msg?: string }>({});

  const loadKeys = async () => {
    const existing = await getAllApiKeys();
    setKeys(existing);
    const syncedBt = await syncBraintrustConfigFromDb();
    setBtConfig(syncedBt);

    const e2b = await getE2BConfig();
    setE2bKey(e2b.apiKey);
    setE2bLanguage(e2b.defaultLanguage);

    const tavily = await getTavilyApiKey();
    setTavilyKey(tavily || '');
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      loadKeys();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

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

  const handleKeyChange = (provider: ProviderId, value: string) => {
    setKeys((prev) => ({ ...prev, [provider]: value }));
    setStatusMap((prev) => ({ ...prev, [provider]: {} }));
  };

  const handleSave = async (provider: ProviderId) => {
    await saveApiKey(provider, keys[provider]);
    onKeysUpdated();
  };

  const handleTest = async (provider: ProviderId) => {
    const key = keys[provider];
    if (!key.trim()) {
      setStatusMap((prev) => ({
        ...prev,
        [provider]: { success: false, msg: 'Please enter a key first' }
      }));
      return;
    }

    setTestingProvider(provider);
    setStatusMap((prev) => ({ ...prev, [provider]: {} }));

    const result = await validateApiKey(provider, key);
    if (result.success) {
      await saveApiKey(provider, key);
      setStatusMap((prev) => ({
        ...prev,
        [provider]: { success: true, msg: 'Valid key verified and saved.' }
      }));
      onKeysUpdated();
    } else {
      setStatusMap((prev) => ({
        ...prev,
        [provider]: { success: false, msg: result.error || 'Validation failed.' }
      }));
    }
    setTestingProvider(null);
  };

  const handleBtKeyChange = (value: string) => {
    setBtConfig((prev) => ({ ...prev, apiKey: value }));
    setBtStatus({});
  };

  const handleBtSave = () => {
    saveBraintrustConfig(btConfig);
    onKeysUpdated();
  };

  const handleBtToggleEnabled = (enabled: boolean) => {
    const updated = { ...btConfig, enabled };
    setBtConfig(updated);
    saveBraintrustConfig(updated);
    onKeysUpdated();
  };

  const handleBtTest = async () => {
    const key = btConfig.apiKey.trim();
    if (!key) {
      setBtStatus({ success: false, msg: 'Please enter a Braintrust API key first.' });
      return;
    }

    setBtTesting(true);
    setBtStatus({});

    const result = await validateBraintrustKey(key, btConfig.appUrl);
    if (result.success) {
      saveBraintrustConfig(btConfig);
      setBtStatus({ success: true, msg: 'Valid Braintrust key verified and saved.' });
      onKeysUpdated();
    } else {
      setBtStatus({ success: false, msg: result.error || 'Validation failed.' });
    }
    setBtTesting(false);
  };

  const handleE2BSave = async () => {
    await saveE2BConfig(e2bKey, e2bLanguage);
    onKeysUpdated();
  };

  const handleE2BTest = async () => {
    if (!e2bKey.trim()) {
      setE2bStatus({ success: false, msg: 'Please enter an E2B key first' });
      return;
    }
    setE2bTesting(true);
    setE2bStatus({});
    const res = await validateE2BKey(e2bKey);
    if (res.success) {
      await saveE2BConfig(e2bKey, e2bLanguage);
      setE2bStatus({ success: true, msg: 'E2B microVM sandbox connectivity verified and active.' });
      onKeysUpdated();
    } else {
      setE2bStatus({ success: false, msg: res.error || 'Failed to connect to E2B' });
    }
    setE2bTesting(false);
  };

  const handleTavilySave = async () => {
    await saveTavilyApiKey(tavilyKey);
    onKeysUpdated();
  };

  const handleTavilyTest = async () => {
    if (!tavilyKey.trim()) {
      setTavilyStatus({ success: false, msg: 'Please enter a Tavily key first' });
      return;
    }
    setTavilyTesting(true);
    setTavilyStatus({});
    const res = await validateTavilyKey(tavilyKey);
    if (res.success) {
      await saveTavilyApiKey(tavilyKey);
      setTavilyStatus({ success: true, msg: 'Tavily Search API key verified and active.' });
      onKeysUpdated();
    } else {
      setTavilyStatus({ success: false, msg: res.error || 'Failed to connect to Tavily' });
    }
    setTavilyTesting(false);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto p-0 bg-transparent backdrop:bg-black/30 backdrop:backdrop-blur-none max-w-lg w-full"
    >
      <div className="bg-white border border-[#EAEAEA] rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#EAEAEA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F7F6F3] text-[#111111] rounded-[6px] border border-[#EAEAEA]">
              <KeyIcon size={16} />
            </div>
            <div>
              <h2 className="font-serif text-lg font-medium text-[#111111] leading-none">
                BYOK API Credentials
              </h2>
              <p className="text-xs text-[#787774] font-sans mt-1">
                Keys remain stored exclusively in local storage and IndexedDB.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#787774] hover:text-[#111111] rounded hover:bg-[#F7F6F3] transition-colors"
            aria-label="Close dialog"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Section: LLM Providers */}
          <div>
            <div className="pb-2 border-b border-[#EAEAEA]">
              <span className="font-serif text-sm font-medium text-[#111111]">
                LLM Inference Providers
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((provider) => {
                const config = PROVIDER_LABELS[provider];
                const status = statusMap[provider];
                const isTesting = testingProvider === provider;
                const hasValue = Boolean(keys[provider]?.trim());

                return (
                  <div
                    key={provider}
                    className="p-3.5 rounded-[6px] bg-[#FBFBFA] border border-[#EAEAEA] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-medium text-xs text-[#111111]">
                          {config.name}
                        </span>
                        {hasValue && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#EDF3EC] text-[#346538]">
                            configured
                          </span>
                        )}
                      </div>
                      <a
                        href={config.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-sans text-[#787774] hover:text-[#111111] underline"
                      >
                        Obtain key
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={keys[provider]}
                        placeholder={config.placeholder}
                        onChange={(e) => handleKeyChange(provider, e.target.value)}
                        onBlur={() => handleSave(provider)}
                        className="flex-1 bg-white border border-[#EAEAEA] rounded-[6px] px-3 py-1.5 text-xs font-mono text-[#111111] placeholder-[#787774] focus:outline-none focus:border-[#111111]"
                      />
                      <button
                        type="button"
                        onClick={() => handleTest(provider)}
                        disabled={isTesting}
                        className="px-3 py-1.5 text-xs font-sans font-medium rounded-[6px] bg-white border border-[#EAEAEA] hover:bg-[#F9F9F8] text-[#111111] transition-colors disabled:opacity-40 shrink-0"
                      >
                        {isTesting ? 'Testing...' : 'Test & Save'}
                      </button>
                    </div>

                    {status.msg && (
                      <div
                        className={`text-[11px] font-sans flex items-center gap-1.5 ${
                          status.success ? 'text-[#346538]' : 'text-[#9F2F2D]'
                        }`}
                      >
                        {status.success && <CheckIcon size={12} className="shrink-0" />}
                        <span>{status.msg}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Observability & Tracing */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA]">
              <span className="font-serif text-sm font-medium text-[#111111]">
                Observability & Tracing
              </span>
              <span className="text-[10px] font-mono text-[#787774]">
                Project: 3e0ba1ce
              </span>
            </div>

            <div className="mt-3 p-3.5 rounded-[6px] bg-[#FBFBFA] border border-[#EAEAEA] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-[#F7F6F3] text-[#111111] rounded border border-[#EAEAEA]">
                    <ActivityIcon size={12} />
                  </div>
                  <span className="font-sans font-medium text-xs text-[#111111]">
                    Braintrust Tracing
                  </span>
                  {btConfig.apiKey.trim() && btConfig.enabled && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#EDF3EC] text-[#346538]">
                      active
                    </span>
                  )}
                  {btConfig.apiKey.trim() && !btConfig.enabled && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#FBF3DB] text-[#956400]">
                      disabled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.braintrust.dev/app/~/configuration/org/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-sans text-[#787774] hover:text-[#111111] underline"
                  >
                    Obtain key
                  </a>
                  <a
                    href="https://www.braintrust.dev/app/~/logs?project_id=3e0ba1ce-e50d-4c77-ac7d-4b715e83ad96"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-sans text-[#1F6C9F] hover:underline"
                  >
                    <span>View logs</span>
                    <ExternalLinkIcon size={10} />
                  </a>
                </div>
              </div>

              <p className="text-[11px] font-sans text-[#787774] leading-relaxed">
                Logs and traces multi-agent deliberation sessions, conversation threads, system prompts, raw outputs, latencies, and token metrics.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={btConfig.apiKey}
                  placeholder="sk-..."
                  onChange={(e) => handleBtKeyChange(e.target.value)}
                  onBlur={handleBtSave}
                  className="flex-1 bg-white border border-[#EAEAEA] rounded-[6px] px-3 py-1.5 text-xs font-mono text-[#111111] placeholder-[#787774] focus:outline-none focus:border-[#111111]"
                />
                <button
                  type="button"
                  onClick={handleBtTest}
                  disabled={btTesting}
                  className="px-3 py-1.5 text-xs font-sans font-medium rounded-[6px] bg-white border border-[#EAEAEA] hover:bg-[#F9F9F8] text-[#111111] transition-colors disabled:opacity-40 shrink-0"
                >
                  {btTesting ? 'Testing...' : 'Test & Save'}
                </button>
              </div>

              {btStatus.msg && (
                <div
                  className={`text-[11px] font-sans flex items-center gap-1.5 ${
                    btStatus.success ? 'text-[#346538]' : 'text-[#9F2F2D]'
                  }`}
                >
                  {btStatus.success && <CheckIcon size={12} className="shrink-0" />}
                  <span>{btStatus.msg}</span>
                </div>
              )}

              {/* Endpoint & Project details */}
              <div className="pt-2 border-t border-[#EAEAEA]/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#787774]">
                <div className="flex items-center gap-2">
                  <span>API: <code className="text-[#111111]">api-eu.braintrust.dev</code></span>
                  <span>•</span>
                  <span>Org: <code className="text-[#111111]">da63e6aa...</code></span>
                </div>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-sans text-[#111111]">
                  <input
                    type="checkbox"
                    checked={btConfig.enabled}
                    onChange={(e) => handleBtToggleEnabled(e.target.checked)}
                    className="rounded border-[#EAEAEA] text-[#111111] focus:ring-0"
                  />
                  <span>Enable Tracing</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section: Live Web Search (Tavily) */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA]">
              <span className="font-serif text-sm font-medium text-[#111111]">
                Live Web Search
              </span>
              <span className="text-[10px] font-mono text-[#787774]">
                Provider: Tavily API
              </span>
            </div>

            <div className="mt-3 p-3.5 rounded-[6px] bg-[#FBFBFA] border border-[#EAEAEA] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-[#F7F6F3] text-[#111111] rounded border border-[#EAEAEA]">
                    <SearchIcon size={12} />
                  </div>
                  <span className="font-sans font-medium text-xs text-[#111111]">
                    Tavily Search Engine
                  </span>
                  {tavilyKey.trim() && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#EDF3EC] text-[#346538]">
                      configured
                    </span>
                  )}
                </div>
                <a
                  href="https://tavily.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-sans text-[#1F6C9F] hover:underline"
                >
                  <span>tavily.com</span>
                  <ExternalLinkIcon size={10} />
                </a>
              </div>

              <p className="text-[11px] font-sans text-[#787774] leading-relaxed">
                Connects deliberation agents to real-time search queries, empirical literature citations, and web research snippets during exploration waves.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={tavilyKey}
                  placeholder="tvly-..."
                  onChange={(e) => setTavilyKey(e.target.value)}
                  onBlur={handleTavilySave}
                  className="flex-1 bg-white border border-[#EAEAEA] rounded-[6px] px-3 py-1.5 text-xs font-mono text-[#111111] placeholder-[#787774] focus:outline-none focus:border-[#111111]"
                />
                <button
                  type="button"
                  onClick={handleTavilyTest}
                  disabled={tavilyTesting}
                  className="px-3 py-1.5 text-xs font-sans font-medium rounded-[6px] bg-white border border-[#EAEAEA] hover:bg-[#F9F9F8] text-[#111111] transition-colors disabled:opacity-40 shrink-0"
                >
                  {tavilyTesting ? 'Testing...' : 'Test & Save'}
                </button>
              </div>

              {tavilyStatus.msg && (
                <div
                  className={`text-[11px] font-sans flex items-center gap-1.5 ${
                    tavilyStatus.success ? 'text-[#346538]' : 'text-[#9F2F2D]'
                  }`}
                >
                  {tavilyStatus.success && <CheckIcon size={12} className="shrink-0" />}
                  <span>{tavilyStatus.msg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Sandboxed Code Execution (E2B V2) */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA]">
              <span className="font-serif text-sm font-medium text-[#111111]">
                Sandboxed Execution Containers (V2)
              </span>
              <span className="text-[10px] font-mono text-[#787774]">
                Engine: E2B microVMs
              </span>
            </div>

            <div className="mt-3 p-3.5 rounded-[6px] bg-[#FBFBFA] border border-[#EAEAEA] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-[#F7F6F3] text-[#111111] rounded border border-[#EAEAEA]">
                    <TerminalIcon size={12} />
                  </div>
                  <span className="font-sans font-medium text-xs text-[#111111]">
                    E2B Cloud Sandboxes
                  </span>
                  {e2bKey.trim() && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#EDF3EC] text-[#346538]">
                      active microVM
                    </span>
                  )}
                </div>
                <a
                  href="https://e2b.dev/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-sans text-[#1F6C9F] hover:underline"
                >
                  <span>e2b.dev</span>
                  <ExternalLinkIcon size={10} />
                </a>
              </div>

              <p className="text-[11px] font-sans text-[#787774] leading-relaxed">
                Empowers deliberation agents to execute Python scripts, run benchmark simulations, generate data visualizations, and verify runtime code safely in ephemeral cloud microVMs.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={e2bKey}
                  placeholder="e2b_..."
                  onChange={(e) => setE2bKey(e.target.value)}
                  onBlur={handleE2BSave}
                  className="flex-1 bg-white border border-[#EAEAEA] rounded-[6px] px-3 py-1.5 text-xs font-mono text-[#111111] placeholder-[#787774] focus:outline-none focus:border-[#111111]"
                />
                <button
                  type="button"
                  onClick={handleE2BTest}
                  disabled={e2bTesting}
                  className="px-3 py-1.5 text-xs font-sans font-medium rounded-[6px] bg-white border border-[#EAEAEA] hover:bg-[#F9F9F8] text-[#111111] transition-colors disabled:opacity-40 shrink-0"
                >
                  {e2bTesting ? 'Testing...' : 'Test & Save'}
                </button>
              </div>

              <div className="pt-2 border-t border-[#EAEAEA]/80 flex items-center justify-between text-xs font-sans">
                <span className="text-[11px] text-[#787774]">Default Language Runtime:</span>
                <select
                  value={e2bLanguage}
                  onChange={(e) => {
                    const l = e.target.value as 'python' | 'js' | 'bash';
                    setE2bLanguage(l);
                    saveE2BConfig(e2bKey, l);
                  }}
                  className="bg-white border border-[#EAEAEA] rounded-[4px] px-2 py-1 text-xs font-mono text-[#111111] focus:outline-none"
                >
                  <option value="python">Python (Default)</option>
                  <option value="js">JavaScript (Node.js)</option>
                  <option value="bash">Bash (Linux Shell)</option>
                </select>
              </div>

              {e2bStatus.msg && (
                <div
                  className={`text-[11px] font-sans flex items-center gap-1.5 ${
                    e2bStatus.success ? 'text-[#346538]' : 'text-[#9F2F2D]'
                  }`}
                >
                  {e2bStatus.success && <CheckIcon size={12} className="shrink-0" />}
                  <span>{e2bStatus.msg}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EAEAEA] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[6px] bg-[#111111] hover:bg-[#2F3437] text-white font-sans font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
};
