import React, { useEffect, useRef, useState } from 'react';
import { Key, CheckCircle2, AlertCircle, ExternalLink, X, Loader2 } from 'lucide-react';
import type { ProviderId } from '../types';
import { PROVIDER_LABELS } from '../lib/constants';
import { getAllApiKeys, saveApiKey, validateApiKey } from '../lib/keys';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeysUpdated }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [keys, setKeys] = useState<Record<ProviderId, string>>({
    gemini: '',
    openai: '',
    anthropic: '',
    groq: '',
    openrouter: ''
  });
  const [testingProvider, setTestingProvider] = useState<ProviderId | null>(null);
  const [statusMap, setStatusMap] = useState<Record<ProviderId, { success?: boolean; msg?: string }>>({
    gemini: {},
    openai: {},
    anthropic: {},
    groq: {},
    openrouter: {}
  });

  const loadKeys = async () => {
    const existing = await getAllApiKeys();
    setKeys(existing);
  };

  // Sync open state with native dialog
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

  // Modern Web Guidance: Light-dismiss fallback for browsers lacking native closedby support
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
        [provider]: { success: true, msg: 'Valid key & saved!' }
      }));
      onKeysUpdated();
    } else {
      setStatusMap((prev) => ({
        ...prev,
        [provider]: { success: false, msg: result.error || 'Validation failed' }
      }));
    }
    setTestingProvider(null);
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onClose={onClose}
      className="m-auto p-0 bg-slate-900 text-slate-100 border border-slate-700 rounded-2xl shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-xs max-w-xl w-full"
    >
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">BYOK API Credentials</h2>
            <p className="text-xs text-slate-400">
              Keys are stored locally in your browser and never sent to any central server.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
        {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((provider) => {
          const config = PROVIDER_LABELS[provider];
          const status = statusMap[provider];
          const isTesting = testingProvider === provider;

          return (
            <div
              key={provider}
              className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200 text-sm flex items-center gap-2">
                  {config.name}
                  {keys[provider]?.trim() && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                      configured
                    </span>
                  )}
                </span>
                <a
                  href={config.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                >
                  Get key <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={keys[provider]}
                  placeholder={config.placeholder}
                  onChange={(e) => handleKeyChange(provider, e.target.value)}
                  onBlur={() => handleSave(provider)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleTest(provider)}
                  disabled={isTesting}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing...
                    </>
                  ) : (
                    'Test & Save'
                  )}
                </button>
              </div>

              {status.msg && (
                <div
                  className={`text-xs flex items-center gap-1.5 ${
                    status.success ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {status.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{status.msg}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800 flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition"
        >
          Done
        </button>
      </div>
    </dialog>
  );
};
