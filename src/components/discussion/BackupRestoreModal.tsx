import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  exportDatabaseArchive,
  validateArchive,
  restoreDatabaseArchive,
  getDatabaseArchiveStats,
  type DatabaseArchiveStats,
  type ArchiveValidationSummary,
  type RestoreResult
} from '../../lib/discussion/backupRestore';
import {
  CloseIcon,
  CheckIcon,
  AlertCircleIcon,
  DownloadIcon,
  UploadIcon,
  DocumentIcon
} from '../icons/MinimalIcons';

export interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored?: () => void;
}

type TabType = 'export' | 'restore';
type RestoreMode = 'merge' | 'overwrite';

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onRestored
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>('export');
  const [stats, setStats] = useState<DatabaseArchiveStats | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Restore State
  const [dragOver, setDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [archiveJson, setArchiveJson] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<ArchiveValidationSummary | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);

  // Refresh current database stats
  const refreshStats = useCallback(async () => {
    try {
      const data = await getDatabaseArchiveStats();
      setStats(data);
    } catch (e) {
      console.warn('Failed to fetch database stats:', e);
    }
  }, []);

  // Sync dialog visibility
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      refreshStats();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen, refreshStats]);

  // Clean reset when modal closes
  const handleClose = () => {
    setExportSuccessMessage(null);
    setValidationError(null);
    setValidationSummary(null);
    setSelectedFileName(null);
    setSelectedFileSize(null);
    setArchiveJson(null);
    setRestoreResult(null);
    onClose();
  };

  // Handle Export
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportSuccessMessage(null);
      await exportDatabaseArchive();
      const dateStr = new Date().toISOString().split('T')[0];
      setExportSuccessMessage(`Archive downloaded: aigroupchat-backup-${dateStr}.json`);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Process File Contents
  const processFile = (file: File) => {
    setSelectedFileName(file.name);
    setSelectedFileSize(file.size);
    setValidationError(null);
    setValidationSummary(null);
    setArchiveJson(null);
    setRestoreResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') {
        setValidationError('Failed to read file contents as text');
        return;
      }

      setArchiveJson(text);
      const validation = validateArchive(text);
      if (!validation.isValid) {
        setValidationError(validation.error || 'Invalid archive structure');
        setValidationSummary(null);
      } else {
        setValidationError(null);
        setValidationSummary(validation.summary || null);
      }
    };
    reader.onerror = () => {
      setValidationError('Error reading file from disk');
    };
    reader.readAsText(file);
  };

  // Handle File Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // Handle Input File Selection
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Handle Restore Execution
  const handleRestore = async () => {
    if (!archiveJson || isRestoring) return;

    try {
      setIsRestoring(true);
      const result = await restoreDatabaseArchive(archiveJson, restoreMode);
      setRestoreResult(result);
      if (result.success) {
        await refreshStats();
        onRestored?.();
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="m-auto p-0 bg-transparent backdrop:bg-black/30 backdrop:backdrop-blur-none max-w-xl w-full"
    >
      <div className="bg-white border border-[#EAEAEA] rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#EAEAEA] flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#111111] leading-none">
              Deliberation Backup & Restore
            </h2>
            <p className="text-xs text-[#787774] font-sans mt-1">
              Export database snapshots or inspect and restore JSON deliberation archives.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-[#787774] hover:text-[#111111] rounded hover:bg-[#F7F6F3] transition-colors"
            aria-label="Close dialog"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-3 border-b border-[#EAEAEA] flex gap-6 bg-[#FBFBFA]">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`text-xs font-sans pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-[#111111] text-[#111111] font-semibold'
                : 'border-transparent text-[#787774] hover:text-[#111111]'
            }`}
          >
            <DownloadIcon size={13} />
            <span>Export Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`text-xs font-sans pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'restore'
                ? 'border-[#111111] text-[#111111] font-semibold'
                : 'border-transparent text-[#787774] hover:text-[#111111]'
            }`}
          >
            <UploadIcon size={13} />
            <span>Restore Archive</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {activeTab === 'export' ? (
            /* TAB 1: EXPORT */
            <div className="space-y-4">
              <div className="text-xs text-[#2F3437] leading-relaxed">
                Generates a versioned (<span className="font-mono text-[#111111]">v1</span>) JSON archive containing all structured discussions, focused conversation sub-threads, messages with attached markdown specifications, and custom agent personas.
              </div>

              {/* Current IndexedDB Inventory */}
              <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] p-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#787774] mb-2">
                  Current Database Inventory
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 bg-white border border-[#EAEAEA] rounded-[4px] text-center">
                    <div className="text-base font-serif font-medium text-[#111111]">
                      {stats ? stats.discussionsCount : '-'}
                    </div>
                    <div className="text-[10px] font-mono text-[#787774] uppercase">Discussions</div>
                  </div>
                  <div className="p-2 bg-white border border-[#EAEAEA] rounded-[4px] text-center">
                    <div className="text-base font-serif font-medium text-[#111111]">
                      {stats ? stats.threadsCount : '-'}
                    </div>
                    <div className="text-[10px] font-mono text-[#787774] uppercase">Sub-Threads</div>
                  </div>
                  <div className="p-2 bg-white border border-[#EAEAEA] rounded-[4px] text-center">
                    <div className="text-base font-serif font-medium text-[#111111]">
                      {stats ? stats.messagesCount : '-'}
                    </div>
                    <div className="text-[10px] font-mono text-[#787774] uppercase">Messages</div>
                  </div>
                  <div className="p-2 bg-white border border-[#EAEAEA] rounded-[4px] text-center">
                    <div className="text-base font-serif font-medium text-[#111111]">
                      {stats ? stats.customAgentsCount : '-'}
                    </div>
                    <div className="text-[10px] font-mono text-[#787774] uppercase">Custom Agents</div>
                  </div>
                </div>
              </div>

              {exportSuccessMessage && (
                <div className="flex items-center gap-2 p-2.5 bg-[#EDF3EC] border border-[#C6E1C7] rounded-[6px] text-xs text-[#346538]">
                  <CheckIcon size={14} className="shrink-0 text-[#346538]" />
                  <span>{exportSuccessMessage}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-sans font-medium text-white bg-[#111111] rounded-[6px] hover:bg-[#2F3437] transition-colors disabled:opacity-50"
                >
                  <DownloadIcon size={13} />
                  <span>{isExporting ? 'Generating JSON Archive...' : 'Download JSON Archive'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* TAB 2: RESTORE */
            <div className="space-y-4">
              {/* File Dropzone */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[6px] p-6 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-[#111111] bg-[#F7F6F3]'
                    : 'border-[#EAEAEA] hover:border-[#B0AEA9] bg-[#FBFBFA]'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <DocumentIcon size={24} className="text-[#787774]" />
                  {selectedFileName ? (
                    <div className="text-xs font-medium text-[#111111]">
                      {selectedFileName}{' '}
                      <span className="font-mono text-[#787774]">
                        ({selectedFileSize ? formatFileSize(selectedFileSize) : ''})
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs font-medium text-[#111111]">
                        Select a JSON backup file or drag and drop here
                      </div>
                      <div className="text-[11px] text-[#787774]">
                        Accepts version 1 archives (e.g. aigroupchat-backup-YYYY-MM-DD.json)
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Validation Error Alert */}
              {validationError && (
                <div className="flex items-start gap-2 p-3 bg-[#FDEBEC] border border-[#F5C2C4] rounded-[6px] text-xs text-[#9F2F2D]">
                  <AlertCircleIcon size={14} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">Invalid Archive Payload</div>
                    <div className="mt-0.5">{validationError}</div>
                  </div>
                </div>
              )}

              {/* Validation Success & Inspection Summary */}
              {validationSummary && (
                <div className="space-y-4">
                  <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">
                        Archive Contents Verified
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#EDF3EC] text-[#346538]">
                        <CheckIcon size={10} /> schema v1
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-2 bg-white border border-[#EAEAEA] rounded-[4px] text-center">
                        <div className="text-base font-serif font-medium text-[#111111]">
                          {validationSummary.discussionsCount}
                        </div>
                        <div className="text-[10px] font-mono text-[#787774] uppercase">Discussions</div>
                      </div>
                      <div className="p-2 bg-white border border-[#EAEAEA] rounded-[4px] text-center">
                        <div className="text-base font-serif font-medium text-[#111111]">
                          {validationSummary.threadsCount}
                        </div>
                        <div className="text-[10px] font-mono text-[#787774] uppercase">Sub-Threads</div>
                      </div>
                      <div className="p-2 bg-white border border-[#EAEAEA] rounded-[4px] text-center">
                        <div className="text-base font-serif font-medium text-[#111111]">
                          {validationSummary.messagesCount}
                        </div>
                        <div className="text-[10px] font-mono text-[#787774] uppercase">Messages</div>
                      </div>
                      <div className="p-2 bg-white border border-[#EAEAEA] rounded-[4px] text-center">
                        <div className="text-base font-serif font-medium text-[#111111]">
                          {validationSummary.agentsCount}
                        </div>
                        <div className="text-[10px] font-mono text-[#787774] uppercase">Custom Agents</div>
                      </div>
                    </div>
                  </div>

                  {/* Mode Selection */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-[#787774] block">
                      Restore Mode
                    </label>

                    <div className="space-y-2">
                      <label
                        className={`flex items-start gap-3 p-3 border rounded-[6px] cursor-pointer transition-colors ${
                          restoreMode === 'merge'
                            ? 'bg-white border-[#111111]'
                            : 'bg-[#FBFBFA] border-[#EAEAEA] hover:border-[#D4D4D0]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="restoreMode"
                          value="merge"
                          checked={restoreMode === 'merge'}
                          onChange={() => setRestoreMode('merge')}
                          className="mt-0.5 accent-[#111111]"
                        />
                        <div className="flex-1">
                          <div className="text-xs font-medium text-[#111111]">
                            Merge with Existing Records (Recommended)
                          </div>
                          <div className="text-[11px] text-[#787774] mt-0.5">
                            Performs idempotent updates by primary key. Existing discussions not present in the archive are preserved intact.
                          </div>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-3 border rounded-[6px] cursor-pointer transition-colors ${
                          restoreMode === 'overwrite'
                            ? 'bg-white border-[#9F2F2D]'
                            : 'bg-[#FBFBFA] border-[#EAEAEA] hover:border-[#D4D4D0]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="restoreMode"
                          value="overwrite"
                          checked={restoreMode === 'overwrite'}
                          onChange={() => setRestoreMode('overwrite')}
                          className="mt-0.5 accent-[#9F2F2D]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[#111111]">
                              Clean Overwrite & Replace
                            </span>
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full bg-[#FDEBEC] text-[#9F2F2D]">
                              destructive
                            </span>
                          </div>
                          <div className="text-[11px] text-[#787774] mt-0.5">
                            Cleanly clears current discussions, conversation threads, and messages, replacing them completely with archive records.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Restore Completion Feedback */}
                  {restoreResult && (
                    <div
                      className={`p-3 rounded-[6px] text-xs border ${
                        restoreResult.success
                          ? 'bg-[#EDF3EC] border-[#C6E1C7] text-[#346538]'
                          : 'bg-[#FDEBEC] border-[#F5C2C4] text-[#9F2F2D]'
                      }`}
                    >
                      {restoreResult.success ? (
                        <div className="flex items-start gap-2">
                          <CheckIcon size={14} className="shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold">Restore Complete!</div>
                            <div className="mt-0.5">
                              Imported {restoreResult.importedCounts.discussions} discussions,{' '}
                              {restoreResult.importedCounts.threads} sub-threads,{' '}
                              {restoreResult.importedCounts.messages} messages, and{' '}
                              {restoreResult.importedCounts.agents} custom agents.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <AlertCircleIcon size={14} className="shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold">Restore Failed</div>
                            <div className="mt-0.5">{restoreResult.error}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Controls */}
                  <div className="pt-2 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFileName(null);
                        setSelectedFileSize(null);
                        setArchiveJson(null);
                        setValidationSummary(null);
                        setRestoreResult(null);
                      }}
                      className="text-xs font-sans text-[#787774] hover:text-[#111111] transition-colors"
                    >
                      Clear File
                    </button>

                    <button
                      type="button"
                      onClick={handleRestore}
                      disabled={isRestoring || !archiveJson}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-sans font-medium rounded-[6px] text-white transition-colors disabled:opacity-50 ${
                        restoreMode === 'overwrite'
                          ? 'bg-[#9F2F2D] hover:bg-[#7D2423]'
                          : 'bg-[#111111] hover:bg-[#2F3437]'
                      }`}
                    >
                      <UploadIcon size={13} />
                      <span>
                        {isRestoring
                          ? 'Restoring...'
                          : restoreMode === 'overwrite'
                          ? 'Execute Clean Overwrite'
                          : 'Execute Merge Restore'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
};
