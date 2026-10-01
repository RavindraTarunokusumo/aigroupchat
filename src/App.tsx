import React, { useEffect, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initDatabase } from './lib/db';
import { getAllApiKeys } from './lib/keys';
import { DiscussionOrchestrator, type DiscussionEngineStatus } from './lib/discussionOrchestrator';
import type { DiscussionThread, ConversationThread } from './types';
import { DiscussionHeader } from './components/discussion/DiscussionHeader';
import { ThreadNavigation } from './components/discussion/ThreadNavigation';
import { DiscussionStage } from './components/discussion/DiscussionStage';
import { NewDiscussionModal } from './components/discussion/NewDiscussionModal';
import { NewSubThreadModal } from './components/discussion/NewSubThreadModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { braintrustTracer, syncBraintrustConfigFromDb } from './lib/observability/braintrust';

export const App: React.FC = () => {
  // Navigation & Selection State
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null); // null = #main Root Discussion

  // Modals
  const [isKeysModalOpen, setIsKeysModalOpen] = useState(false);
  const [isNewDiscussionModalOpen, setIsNewDiscussionModalOpen] = useState(false);
  const [isNewSubThreadModalOpen, setIsNewSubThreadModalOpen] = useState(false);
  const [configuredKeysCount, setConfiguredKeysCount] = useState(0);
  const [braintrustActive, setBraintrustActive] = useState(false);
  const [braintrustLogsUrl, setBraintrustLogsUrl] = useState('');

  // Swarm Engine Status
  const [engineStatus, setEngineStatus] = useState<DiscussionEngineStatus>({
    isRunning: false,
    isPaused: false,
    discussionId: null,
    status: null,
    activeThreadId: null,
    currentAgentId: null,
    currentAgentName: null,
    activeCallsCount: 0,
    error: null
  });

  // Orchestrator ref
  const orchestratorRef = useRef<DiscussionOrchestrator | null>(null);

  // Live queries with stable default array
  const agents = useLiveQuery(() => db.agents.toArray(), [], []);
  const discussions = useLiveQuery(() => db.discussions.orderBy('updatedAt').reverse().toArray(), [], []);

  const currentDiscussionId = selectedDiscussionId || (discussions[0]?.id ?? null);
  const activeDiscussion = discussions.find((d) => d.id === currentDiscussionId) || null;

  const conversationThreads = useLiveQuery(
    async () => {
      if (!currentDiscussionId) return [];
      return db.conversationThreads
        .where('discussionId')
        .equals(currentDiscussionId)
        .sortBy('createdAt');
    },
    [currentDiscussionId],
    []
  );

  const activeThread = activeThreadId
    ? conversationThreads.find((t) => t.id === activeThreadId) || null
    : null;

  const messages = useLiveQuery(
    async () => {
      if (!currentDiscussionId) return [];
      return db.discussionMessages
        .where('discussionId')
        .equals(currentDiscussionId)
        .and((m) => (activeThreadId === null ? m.threadId == null : m.threadId === activeThreadId))
        .sortBy('timestamp');
    },
    [currentDiscussionId, activeThreadId],
    []
  );

  const [hasOpenRouterKey, setHasOpenRouterKey] = useState(false);

  // Check API keys status
  const checkKeyStatus = async () => {
    const keys = await getAllApiKeys();
    const count = Object.values(keys).filter((k) => k && k.trim().length > 0).length;
    setConfiguredKeysCount(count);
    setHasOpenRouterKey(Boolean(keys.openrouter && keys.openrouter.trim().length > 0));
    await syncBraintrustConfigFromDb();
    setBraintrustActive(braintrustTracer.isEnabled());
    setBraintrustLogsUrl(braintrustTracer.getAppLogsUrl());
  };

  // Mount setup
  useEffect(() => {
    orchestratorRef.current = new DiscussionOrchestrator((status) => {
      setEngineStatus(status);
    });

    initDatabase().then(() => {
      checkKeyStatus();
    });

    return () => {
      orchestratorRef.current?.abort();
    };
  }, []);

  // Orchestrator Action Handlers
  const handleStart = () => {
    if (!activeDiscussion || agents.length === 0) return;
    orchestratorRef.current?.start(activeDiscussion.id, agents);
  };

  const handlePause = () => {
    if (!activeDiscussion) return;
    orchestratorRef.current?.pause(activeDiscussion.id);
  };

  const handleStop = () => {
    orchestratorRef.current?.abort();
  };

  const handleSelectDiscussion = (id: string) => {
    orchestratorRef.current?.abort();
    setSelectedDiscussionId(id);
    setActiveThreadId(null);
  };

  const handleSelectThread = (threadId: string | null) => {
    setActiveThreadId(threadId);
  };

  const handleInjectDirective = async (content: string) => {
    if (!activeDiscussion) return;
    await orchestratorRef.current?.injectUserMessage(activeDiscussion.id, activeThreadId, content);

    // If engine is not running, start deliberation turn
    if (!engineStatus.isRunning) {
      orchestratorRef.current?.start(activeDiscussion.id, agents);
    }
  };

  const handleCreateDiscussion = async (
    title: string,
    topic: string,
    selectedAgentIds: string[],
    tokenBudget: number = 10000
  ) => {
    orchestratorRef.current?.abort();

    const newDisc: DiscussionThread = {
      id: `disc-${Date.now()}`,
      title,
      topic,
      activeAgentIds: selectedAgentIds,
      status: 'active',
      tokenBudget,
      tokensUsed: 0,
      concludeVotes: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.discussions.add(newDisc);
    setSelectedDiscussionId(newDisc.id);
    setActiveThreadId(null);

    // Auto-start continuous deliberation
    orchestratorRef.current?.start(newDisc.id, agents);
  };

  const handleConcludeDiscussion = async (discussionId: string) => {
    await orchestratorRef.current?.concludeDiscussion(discussionId, 'user_manual', 'Deliberation concluded by Director.');
  };

  const handleCloseThread = async (threadId: string) => {
    await orchestratorRef.current?.closeConversationThread(threadId, 'Sub-thread closed by Director.');
  };

  const handleReopenDiscussion = async (discussionId: string) => {
    await orchestratorRef.current?.reopenDiscussion(discussionId);
  };

  const handleCreateSubThread = async (
    topic: string,
    selectedAgentIds: string[]
  ) => {
    if (!activeDiscussion) return;

    const newSubThreadId = `cthread-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newThread: ConversationThread = {
      id: newSubThreadId,
      discussionId: activeDiscussion.id,
      topic,
      initiatorAgentId: 'user',
      activeAgentIds: selectedAgentIds,
      status: 'active',
      turnCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.conversationThreads.add(newThread);
    setActiveThreadId(newSubThreadId);

    // If engine is running, sub-thread will naturally be included in concurrent turn waves
    if (!engineStatus.isRunning) {
      orchestratorRef.current?.start(activeDiscussion.id, agents);
    }
  };

  const handleDeleteDiscussion = async (discussionId: string) => {
    if (engineStatus.discussionId === discussionId || currentDiscussionId === discussionId) {
      orchestratorRef.current?.abort();
    }

    await db.discussionMessages.where('discussionId').equals(discussionId).delete();
    await db.conversationThreads.where('discussionId').equals(discussionId).delete();
    await db.discussions.delete(discussionId);

    const remaining = discussions.filter((d) => d.id !== discussionId);
    if (selectedDiscussionId === discussionId || currentDiscussionId === discussionId) {
      setSelectedDiscussionId(remaining.length > 0 ? remaining[0].id : null);
      setActiveThreadId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F7F6F3] text-[#111111] font-sans antialiased">
      {/* Editorial Masthead */}
      <DiscussionHeader
        status={engineStatus.status || activeDiscussion?.status || null}
        isRunning={engineStatus.isRunning}
        isPaused={engineStatus.isPaused}
        configuredKeysCount={configuredKeysCount}
        hasOpenRouterKey={hasOpenRouterKey}
        braintrustActive={braintrustActive}
        braintrustLogsUrl={braintrustLogsUrl}
        onStart={handleStart}
        onPause={handlePause}
        onStop={handleStop}
        onOpenKeysModal={() => setIsKeysModalOpen(true)}
        onOpenNewDiscussionModal={() => setIsNewDiscussionModalOpen(true)}
      />

      {/* Bento Grid Body */}
      <div className="flex flex-1 overflow-hidden relative">
        <ThreadNavigation
          discussions={discussions}
          activeDiscussionId={activeDiscussion?.id || null}
          conversationThreads={conversationThreads}
          activeThreadId={activeThreadId}
          agents={agents}
          onSelectDiscussion={handleSelectDiscussion}
          onSelectThread={handleSelectThread}
          onOpenNewSubThreadModal={() => setIsNewSubThreadModalOpen(true)}
          onDeleteDiscussion={handleDeleteDiscussion}
        />

        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <DiscussionStage
            discussion={activeDiscussion}
            activeThread={activeThread}
            messages={messages}
            agents={agents}
            engineError={engineStatus.error}
            onClearError={() => setEngineStatus((prev) => ({ ...prev, error: null }))}
            onOpenKeysModal={() => setIsKeysModalOpen(true)}
            onInjectDirective={handleInjectDirective}
            onNavigateToThread={(threadId) => setActiveThreadId(threadId)}
            onDeleteDiscussion={handleDeleteDiscussion}
            onConcludeDiscussion={handleConcludeDiscussion}
            onCloseThread={handleCloseThread}
            onReopenDiscussion={handleReopenDiscussion}
          />
        </main>
      </div>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isKeysModalOpen}
        onClose={() => setIsKeysModalOpen(false)}
        onKeysUpdated={checkKeyStatus}
      />

      <NewDiscussionModal
        isOpen={isNewDiscussionModalOpen}
        agents={agents}
        onClose={() => setIsNewDiscussionModalOpen(false)}
        onSubmit={handleCreateDiscussion}
      />

      <NewSubThreadModal
        isOpen={isNewSubThreadModalOpen}
        agents={agents}
        onClose={() => setIsNewSubThreadModalOpen(false)}
        onSubmit={handleCreateSubThread}
      />
    </div>
  );
};

export default App;
