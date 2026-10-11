import React, { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  getAggregatedUsage,
  formatUsd,
  formatNumber,
  formatLatency,
  formatPricingRate,
  type AggregatedAnalytics,
  type ProviderUsageStats,
  type ModelUsageStats
} from '../../lib/analytics/tokenCost';
import { CloseIcon, ExternalLinkIcon } from '../icons/MinimalIcons';

export interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'models'>('grouped');

  // Reactively query database metrics when dialog is open
  const analytics: AggregatedAnalytics | undefined = useLiveQuery(
    async () => {
      if (!isOpen) return undefined;
      return await getAggregatedUsage();
    },
    [isOpen],
    undefined
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const totalCost = analytics?.totalEstimatedCostUsd ?? 0;
  const totalTokens = analytics?.totalTokens ?? 0;
  const promptTokens = analytics?.promptTokens ?? 0;
  const completionTokens = analytics?.completionTokens ?? 0;
  const totalTurns = analytics?.totalTurns ?? 0;
  const avgLatency = analytics?.avgLatencyMs ?? 0;
  const latencyTurns = analytics?.totalLatencyRecordedTurns ?? 0;
  const byProvider = analytics?.byProvider ?? [];
  const byModel = analytics?.byModel ?? [];

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto p-0 bg-transparent backdrop:bg-black/30 backdrop:backdrop-blur-none max-w-4xl w-full"
    >
      <div className="bg-white border border-[#EAEAEA] rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col max-h-[88vh]">
        {/* Editorial Modal Header */}
        <header className="px-6 py-4 border-b border-[#EAEAEA] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-baseline gap-3">
            <h2 className="font-serif text-lg font-medium tracking-tight text-[#111111] leading-none">
              Cross-Provider Cost & Token Analytics
            </h2>
            <span className="text-[11px] font-mono text-[#787774] hidden sm:inline">
              Audited BYOK Telemetry
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://openrouter.ai/models"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-[#787774] hover:text-[#111111] px-2 py-1 rounded hover:bg-[#F7F6F3] transition-colors"
              title="View live rates on OpenRouter"
            >
              <span>Rates Reference</span>
              <ExternalLinkIcon size={10} className="text-[#787774]" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[#787774] hover:text-[#111111] rounded hover:bg-[#F7F6F3] transition-colors"
              aria-label="Close analytics modal"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        </header>

        {/* High-Level Editorial Metric Cards */}
        <div className="p-6 pb-4 bg-[#F7F6F3] border-b border-[#EAEAEA] shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Card 1: Total Estimated Spend */}
            <div className="bg-white border border-[#EAEAEA] rounded-[8px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#787774]">
                Total Estimated Spend
              </span>
              <div className="mt-2 mb-1">
                <span className="font-serif text-2xl font-medium tracking-tight text-[#111111]">
                  {formatUsd(totalCost)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[9.5px] font-mono font-medium bg-[#EDF3EC] text-[#346538] border border-[#D1E2CF]">
                  USD Estimate
                </span>
                <span className="text-[10px] font-mono text-[#787774]">
                  BYOK Rate Card
                </span>
              </div>
            </div>

            {/* Card 2: Cumulative Tokens */}
            <div className="bg-white border border-[#EAEAEA] rounded-[8px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#787774]">
                Cumulative Tokens
              </span>
              <div className="mt-2 mb-1">
                <span className="font-serif text-2xl font-medium tracking-tight text-[#111111]">
                  {formatNumber(totalTokens)}
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#787774] truncate">
                <span title={`${formatNumber(promptTokens)} prompt tokens`}>{formatNumber(promptTokens)} in</span>
                {' · '}
                <span title={`${formatNumber(completionTokens)} completion tokens`}>{formatNumber(completionTokens)} out</span>
              </div>
            </div>

            {/* Card 3: Total Agent Turns */}
            <div className="bg-white border border-[#EAEAEA] rounded-[8px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#787774]">
                Total Agent Turns
              </span>
              <div className="mt-2 mb-1">
                <span className="font-serif text-2xl font-medium tracking-tight text-[#111111]">
                  {formatNumber(totalTurns)}
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#787774] truncate">
                {analytics?.discussionTurns ?? 0} disc · {analytics?.boardTurns ?? 0} board
              </div>
            </div>

            {/* Card 4: Average Latency */}
            <div className="bg-white border border-[#EAEAEA] rounded-[8px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#787774]">
                Average Latency
              </span>
              <div className="mt-2 mb-1">
                <span className="font-serif text-2xl font-medium tracking-tight text-[#111111]">
                  {formatLatency(avgLatency)}
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#787774] truncate">
                {latencyTurns > 0 ? `${latencyTurns} live calls timed` : 'Telemetry pending'}
              </div>
            </div>
          </div>
        </div>

        {/* Table View Controls & Filters */}
        <div className="px-6 py-2.5 bg-white border-b border-[#EAEAEA] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 bg-[#F7F6F3] p-0.5 rounded-[6px] border border-[#EAEAEA]">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1 text-xs font-sans font-medium rounded-[5px] transition-colors ${
                viewMode === 'grouped'
                  ? 'bg-white text-[#111111] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                  : 'text-[#787774] hover:text-[#111111]'
              }`}
            >
              Grouped by Provider
            </button>
            <button
              type="button"
              onClick={() => setViewMode('models')}
              className={`px-2.5 py-1 text-xs font-sans font-medium rounded-[5px] transition-colors ${
                viewMode === 'models'
                  ? 'bg-white text-[#111111] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                  : 'text-[#787774] hover:text-[#111111]'
              }`}
            >
              All Models ({byModel.length})
            </button>
          </div>

          <span className="text-[11px] font-mono text-[#787774]">
            {byProvider.length} active providers
          </span>
        </div>

        {/* Scrollable Breakdown Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {totalTurns === 0 ? (
            <div className="p-8 text-center rounded-[8px] border border-[#EAEAEA] bg-[#FBFBFA]">
              <h3 className="font-serif text-base font-medium text-[#111111]">
                No Agent Invocations Recorded Yet
              </h3>
              <p className="mt-1 text-xs text-[#787774] font-sans max-w-sm mx-auto">
                Start or resume a deliberation in the stage or a multi-agent task board. Each response will stream live token metrics and compute costs.
              </p>
            </div>
          ) : viewMode === 'grouped' ? (
            <div className="space-y-4">
              {byProvider.map((providerGroup: ProviderUsageStats) => (
                <div
                  key={String(providerGroup.provider)}
                  className="rounded-[8px] border border-[#EAEAEA] overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                >
                  {/* Provider Header Strip */}
                  <div className="px-4 py-2.5 bg-[#FBFBFA] border-b border-[#EAEAEA] flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-xs text-[#111111]">
                        {providerGroup.providerName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-[#EAEAEA] text-[#787774]">
                        {providerGroup.turns} {providerGroup.turns === 1 ? 'turn' : 'turns'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-[#787774] text-[11px]">
                        {formatNumber(providerGroup.totalTokens)} tok
                      </span>
                      {providerGroup.avgLatencyMs > 0 && (
                        <span className="text-[#787774] text-[11px]">
                          avg {formatLatency(providerGroup.avgLatencyMs)}
                        </span>
                      )}
                      <span className="font-semibold text-[#111111] bg-[#EDF3EC] text-[#346538] px-2 py-0.5 rounded border border-[#D1E2CF] text-[11px]">
                        {formatUsd(providerGroup.estimatedCostUsd)}
                      </span>
                    </div>
                  </div>

                  {/* Models Table Under Provider */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#EAEAEA] text-[10px] font-mono uppercase tracking-wider text-[#787774] bg-white">
                          <th className="py-2 px-4 font-medium">Model</th>
                          <th className="py-2 px-3 font-medium text-right">Turns</th>
                          <th className="py-2 px-3 font-medium text-right">Tokens (In / Out)</th>
                          <th className="py-2 px-3 font-medium text-right">Avg Latency</th>
                          <th className="py-2 px-3 font-medium text-right">Rate Card (1M)</th>
                          <th className="py-2 px-4 font-medium text-right">Est. Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEA] font-mono">
                        {providerGroup.models.map((m: ModelUsageStats) => (
                          <tr key={m.modelId} className="hover:bg-[#FBFBFA] transition-colors">
                            <td className="py-2.5 px-4 font-sans font-medium text-[#111111]">
                              <div className="flex flex-col">
                                <span className="text-xs">{m.modelName}</span>
                                <span className="text-[10px] font-mono text-[#787774] truncate max-w-xs">
                                  {m.modelId}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-[#111111]">
                              {m.turns}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="text-[#111111] font-medium">
                                {formatNumber(m.totalTokens)}
                              </span>
                              <div className="text-[9.5px] text-[#787774]">
                                {formatNumber(m.promptTokens)} / {formatNumber(m.completionTokens)}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-[#787774]">
                              {formatLatency(m.avgLatencyMs)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-[#787774] text-[11px]">
                              {formatPricingRate(m.pricing)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-medium text-[#111111]">
                              {formatUsd(m.estimatedCostUsd)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Flat Models Table */
            <div className="rounded-[8px] border border-[#EAEAEA] overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EAEAEA] text-[10px] font-mono uppercase tracking-wider text-[#787774] bg-[#FBFBFA]">
                      <th className="py-2.5 px-4 font-medium">Model</th>
                      <th className="py-2.5 px-3 font-medium">Provider</th>
                      <th className="py-2.5 px-3 font-medium text-right">Turns</th>
                      <th className="py-2.5 px-3 font-medium text-right">Total Tokens</th>
                      <th className="py-2.5 px-3 font-medium text-right">Avg Latency</th>
                      <th className="py-2.5 px-3 font-medium text-right">Rate (1M)</th>
                      <th className="py-2.5 px-4 font-medium text-right">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA] font-mono">
                    {byModel.map((m: ModelUsageStats) => (
                      <tr key={`${m.provider}-${m.modelId}`} className="hover:bg-[#FBFBFA] transition-colors">
                        <td className="py-2.5 px-4 font-sans font-medium text-[#111111]">
                          <div className="flex flex-col">
                            <span className="text-xs">{m.modelName}</span>
                            <span className="text-[10px] font-mono text-[#787774] truncate max-w-xs">
                              {m.modelId}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[#787774] font-sans text-xs">
                          {String(m.provider)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#111111]">
                          {m.turns}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#111111] font-medium">
                            {formatNumber(m.totalTokens)}
                          </span>
                          <div className="text-[9.5px] text-[#787774]">
                            {formatNumber(m.promptTokens)} / {formatNumber(m.completionTokens)}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#787774]">
                          {formatLatency(m.avgLatencyMs)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#787774] text-[11px]">
                          {formatPricingRate(m.pricing)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium text-[#111111]">
                          {formatUsd(m.estimatedCostUsd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Editorial Rationale */}
        <footer className="px-6 py-3 bg-[#FBFBFA] border-t border-[#EAEAEA] flex items-center justify-between shrink-0 flex-wrap gap-2">
          <p className="text-[10.5px] font-sans text-[#787774] max-w-xl leading-relaxed">
            Estimates computed using published vendor rate cards for input and output tokens across standard multi-agent waves. Actual billed charges may vary by prompt caching and regional API tiers.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[6px] text-xs font-sans font-medium text-white bg-[#111111] hover:bg-[#2F3437] transition-colors"
          >
            Close
          </button>
        </footer>
      </div>
    </dialog>
  );
};

export default AnalyticsModal;
