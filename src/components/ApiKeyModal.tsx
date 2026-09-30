import React, { useEffect, useRef, useState } from 'react';
import type { ProviderId } from '../types';
import { PROVIDER_LABELS } from '../lib/constants';
import { getAllApiKeys, saveApiKey, validateApiKey } from '../lib/keys';
import { KeyIcon, CloseIcon, CheckIcon } from './icons/MinimalIcons';

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

  const loadKeys = async () => {
    const existing = await getAllApiKeys();
    setKeys(existing);
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
                Keys remain stored exclusively in local IndexedDB.
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
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
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
