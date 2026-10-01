import React from 'react';
import type { DiscussionStatus } from '../../types';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
  KeyIcon,
  ActivityIcon,
  ExternalLinkIcon
} from '../icons/MinimalIcons';

interface DiscussionHeaderProps {
  status: DiscussionStatus | null;
  isRunning: boolean;
  isPaused: boolean;
  configuredKeysCount: number;
  hasOpenRouterKey?: boolean;
  braintrustActive?: boolean;
  braintrustLogsUrl?: string;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onOpenKeysModal: () => void;
  onOpenNewDiscussionModal: () => void;
}

export const DiscussionHeader: React.FC<DiscussionHeaderProps> = ({
  status,
  isRunning,
  isPaused,
  configuredKeysCount,
  hasOpenRouterKey,
  braintrustActive,
  braintrustLogsUrl,
  onStart,
  onPause,
  onStop,
  onOpenKeysModal,
  onOpenNewDiscussionModal
}) => {
  const getStatusBadge = () => {
    if (status === 'active' || (isRunning && !isPaused)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase bg-[#EDF3EC] text-[#346538]">
          Active Deliberation
        </span>
      );
    }
    if (status === 'paused' || isPaused) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase bg-[#FDEBEC] text-[#9F2F2D]">
          Paused
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase bg-[#E1F3FE] text-[#1F6C9F]">
          Concluded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase bg-[#F7F6F3] text-[#787774]">
        Idle
      </span>
    );
  };

  return (
    <header className="w-full bg-[#FFFFFF] border-b border-[#EAEAEA] px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-2.5">
          <h1 className="font-serif text-xl font-medium tracking-tight text-[#111111] leading-none">
            AI Group Chat
          </h1>
          <span className="text-xs text-[#787774] font-sans">
            Autonomous Multi-Agent Deliberation
          </span>
        </div>
        {getStatusBadge()}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenNewDiscussionModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium text-[#111111] bg-white border border-[#EAEAEA] rounded-[6px] hover:bg-[#F9F9F8] transition-colors"
          title="Create a new deliberation discussion"
        >
          <PlusIcon size={13} />
          <span>New Discussion</span>
        </button>

        <button
          onClick={onOpenKeysModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium text-[#111111] bg-white border border-[#EAEAEA] rounded-[6px] hover:bg-[#F9F9F8] transition-colors"
          title="Configure BYOK provider API keys"
        >
          <KeyIcon size={13} />
          <span>
            API Keys {configuredKeysCount > 0 ? `(${hasOpenRouterKey ? 'OpenRouter Live' : `${configuredKeysCount} keys`})` : ''}
          </span>
          {hasOpenRouterKey && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#346538] animate-pulse" title="OpenRouter key active for current models" />
          )}
        </button>

        {braintrustActive && (
          <a
            href={braintrustLogsUrl || 'https://www.braintrust.dev/app/~/logs?project_id=3e0ba1ce-e50d-4c77-ac7d-4b715e83ad96'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-sans font-medium text-[#1F6C9F] bg-[#E1F3FE] border border-[#BCE1FA] rounded-[6px] hover:bg-[#D4EDFD] transition-colors"
            title="Braintrust tracing active — Click to view live traces in Braintrust"
          >
            <ActivityIcon size={12} className="text-[#1F6C9F]" />
            <span>Traces</span>
            <ExternalLinkIcon size={10} className="text-[#1F6C9F]/70" />
          </a>
        )}

        <div className="h-4 w-[1px] bg-[#EAEAEA] mx-1" />

        {/* Clean 3-Button Control Strip: Start / Pause / Stop */}
        <div className="flex items-center gap-1 bg-[#F7F6F3] p-1 rounded-[6px] border border-[#EAEAEA]">
          <button
            type="button"
            onClick={onStart}
            disabled={isRunning && !isPaused}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-medium rounded-[5px] transition-colors ${
              !isRunning || isPaused
                ? 'bg-[#111111] text-white hover:bg-[#2F3437]'
                : 'text-[#B0AEA9] cursor-not-allowed'
            }`}
            title={isPaused ? 'Resume discussion' : 'Start discussion'}
          >
            <PlayIcon size={11} />
            <span>{isPaused ? 'Resume' : 'Start'}</span>
          </button>

          <button
            type="button"
            onClick={onPause}
            disabled={!isRunning || isPaused}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-medium rounded-[5px] transition-colors ${
              isRunning && !isPaused
                ? 'bg-white text-[#111111] border border-[#EAEAEA] hover:bg-[#F9F9F8]'
                : 'text-[#B0AEA9] cursor-not-allowed'
            }`}
            title="Pause discussion"
          >
            <PauseIcon size={11} />
            <span>Pause</span>
          </button>

          <button
            type="button"
            onClick={onStop}
            disabled={!isRunning && !isPaused}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-medium rounded-[5px] transition-colors ${
              isRunning || isPaused
                ? 'bg-white text-[#9F2F2D] border border-[#EAEAEA] hover:bg-[#FDEBEC]'
                : 'text-[#B0AEA9] cursor-not-allowed'
            }`}
            title="Stop discussion"
          >
            <StopIcon size={11} />
            <span>Stop</span>
          </button>
        </div>
      </div>
    </header>
  );
};
