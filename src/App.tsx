import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initDatabase } from './lib/db';
import { getAllApiKeys } from './lib/keys';
import { Orchestrator, type TurnStatus } from './lib/orchestrator';
import { BoardOrchestrator, type BoardEngineStatus } from './lib/boardOrchestrator';
import type { Agent, Conversation, Message, ChatMode, TaskBoard } from './types';
import { Header } from './components/Header';
import { AgentSidebar } from './components/AgentSidebar';
import { ChatStage } from './components/ChatStage';
import { PromptBar, type PromptBarHandle } from './components/PromptBar';
import { ApiKeyModal } from './components/ApiKeyModal';
import { NewAgentModal } from './components/NewAgentModal';
import { AgentProfileModal } from './components/AgentProfileModal';
import { BoardSidebar } from './components/board/BoardSidebar';
import { MessageBoardPage } from './components/board/MessageBoardPage';
import { NewBoardTaskModal } from './components/board/NewBoardTaskModal';

export const App: React.FC = () => {
  // Navigation: Chat vs Message Board
  const [activePage, setActivePage] = useState<'chat' | 'board'>('chat');

  // --- CHAT STATE ---
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [turnStatus, setTurnStatus] = useState<TurnStatus>({
    isExecuting: false,
    currentAgentId: null,
    currentAgentName: null,
    error: null
  });
  const [hasAnyKey, setHasAnyKey] = useState(false);
  const [isKeysModalOpen, setIsKeysModalOpen] = useState(false);
  const [isNewAgentModalOpen, setIsNewAgentModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedProfileAgent, setSelectedProfileAgent] = useState<Agent | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'agents' | 'chats'>('agents');

  // --- MESSAGE BOARD STATE ---
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [isMobileBoardSidebarOpen, setIsMobileBoardSidebarOpen] = useState(false);
  const [boardEngineStatus, setBoardEngineStatus] = useState<BoardEngineStatus>({
    isRunning: false,
    isPaused: false,
    activeBoardId: null,
    orchestratorAgentId: null,
    currentSwarmPhase: null,
    activeSwarmAgents: [],
    currentAgentId: null,
    currentAgentName: null,
    phase: null
  });

  // Live query for agents
  const agents = useLiveQuery(() => db.agents.toArray(), []) || [];

  // Live query for all conversations (stored chats)
  const conversations = useLiveQuery(() => db.conversations.orderBy('updatedAt').reverse().toArray(), []) || [];

  // Live query for all messages (to track message counts across chats)
  const allMessages = useLiveQuery(() => db.messages.toArray());
  const messageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (allMessages) {
      for (const m of allMessages) {
        counts[m.conversationId] = (counts[m.conversationId] || 0) + 1;
      }
    }
    return counts;
  }, [allMessages]);

  // Live query for messages in the current conversation
  const messages =
    useLiveQuery<Message[]>(
      async () => {
        if (!conversation) return [];
        return db.messages.where('conversationId').equals(conversation.id).sortBy('timestamp');
      },
      [conversation?.id]
    ) || [];

  // --- TASK BOARDS LIVE QUERIES ---
  const taskBoards = useLiveQuery(() => db.taskBoards.orderBy('updatedAt').reverse().toArray());

  const activeBoard = useMemo(() => {
    if (!taskBoards || !taskBoards.length) return null;
    if (selectedBoardId) {
      return taskBoards.find((b) => b.id === selectedBoardId) || taskBoards[0];
    }
    return taskBoards[0];
  }, [taskBoards, selectedBoardId]);

  const allBoardPosts = useLiveQuery(() => db.boardPosts.toArray());
  const boardPostCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (allBoardPosts) {
      for (const p of allBoardPosts) {
        counts[p.boardId] = (counts[p.boardId] || 0) + 1;
      }
    }
    return counts;
  }, [allBoardPosts]);

  const currentBoardPosts =
    useLiveQuery(
      async () => {
        if (!activeBoard) return [];
        return db.boardPosts.where('boardId').equals(activeBoard.id).sortBy('timestamp');
      },
      [activeBoard?.id]
    ) || [];

  // Orchestrator refs
  const orchestratorRef = useRef<Orchestrator | null>(null);
  const boardOrchestratorRef = useRef<BoardOrchestrator | null>(null);
  const promptBarRef = useRef<PromptBarHandle>(null);

  const checkKeyStatus = async () => {
    const keys = await getAllApiKeys();
    const configured = Object.values(keys).some((k) => k.trim().length > 0);
    setHasAnyKey(configured);
  };

  useEffect(() => {
    orchestratorRef.current = new Orchestrator((status) => {
      setTurnStatus(status);
    });

    boardOrchestratorRef.current = new BoardOrchestrator((status) => {
      setBoardEngineStatus(status);
    });

    return () => {
      orchestratorRef.current?.abort();
      boardOrchestratorRef.current?.abort();
    };
  }, []);

  // Initialize DB on mount
  useEffect(() => {
    initDatabase().then((conv) => {
      setConversation(conv);
      checkKeyStatus();
    });
  }, []);

  // --- CHAT ACTIONS ---
  const handleSend = async (prompt: string) => {
    if (!conversation) return;

    // 1. Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      conversationId: conversation.id,
      senderId: 'user',
      senderType: 'user',
      content: prompt,
      timestamp: Date.now()
    };

    await db.messages.add(userMsg);

    // Auto-title conversation if it still has generic default title
    if (
      conversation.title.startsWith('Group Chat ') ||
      conversation.title === 'Welcome to AI Group Chat!'
    ) {
      const cleanPrompt = prompt.replace(/^@\S+\s+/, '').trim();
      if (cleanPrompt) {
        const derivedTitle = cleanPrompt.slice(0, 36) + (cleanPrompt.length > 36 ? '...' : '');
        await db.conversations.update(conversation.id, { title: derivedTitle, updatedAt: Date.now() });
        setConversation((prev) => (prev ? { ...prev, title: derivedTitle } : null));
      }
    } else {
      await db.conversations.update(conversation.id, { updatedAt: Date.now() });
    }

    // 2. Trigger multi-agent turn
    if (orchestratorRef.current) {
      await orchestratorRef.current.executeTurn(conversation, agents, prompt);
    }
  };

  const handleStop = () => {
    orchestratorRef.current?.abort();
  };

  const handleToggleAgent = async (agentId: string) => {
    if (!conversation) return;
    const currentList = conversation.activeAgentIds || [];
    const updated = currentList.includes(agentId)
      ? currentList.filter((id) => id !== agentId)
      : [...currentList, agentId];

    await db.conversations.update(conversation.id, { activeAgentIds: updated });
    setConversation({ ...conversation, activeAgentIds: updated });
  };

  const handleModeChange = async (mode: ChatMode) => {
    if (!conversation) return;
    await db.conversations.update(conversation.id, { mode });
    setConversation({ ...conversation, mode });
  };

  const handleSaveCustomAgent = async (newAgent: Agent) => {
    await db.agents.add(newAgent);
    if (conversation) {
      const updated = [...conversation.activeAgentIds, newAgent.id];
      await db.conversations.update(conversation.id, { activeAgentIds: updated });
      setConversation({ ...conversation, activeAgentIds: updated });
    }
  };

  const handleInspectAgent = (agent: Agent) => {
    setSelectedProfileAgent(agent);
    setIsProfileModalOpen(true);
  };

  const handleUpdateAgent = async (updatedAgent: Agent) => {
    await db.agents.put(updatedAgent);
    setSelectedProfileAgent(updatedAgent);
  };

  const handleDeleteAgent = async (agentId: string) => {
    await db.agents.delete(agentId);
    if (conversation) {
      const updated = (conversation.activeAgentIds || []).filter((id) => id !== agentId);
      await db.conversations.update(conversation.id, { activeAgentIds: updated });
      setConversation({ ...conversation, activeAgentIds: updated });
    }
    setIsProfileModalOpen(false);
  };

  const handleDuplicateAsCustom = async (sourceAgent: Agent) => {
    const customCopy: Agent = {
      ...sourceAgent,
      id: `agent-custom-${Date.now()}`,
      name: `${sourceAgent.name} (Custom)`,
      isCustom: true
    };
    await db.agents.add(customCopy);
    if (conversation) {
      const updated = [...(conversation.activeAgentIds || []), customCopy.id];
      await db.conversations.update(conversation.id, { activeAgentIds: updated });
      setConversation({ ...conversation, activeAgentIds: updated });
    }
    setSelectedProfileAgent(customCopy);
    setIsProfileModalOpen(true);
  };

  const handleNewChat = async () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: `Group Chat ${new Date().toLocaleDateString()}`,
      activeAgentIds: agents.map((a) => a.id),
      mode: 'round-table',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.conversations.add(newConv);
    setConversation(newConv);
  };

  const handleSelectConversation = async (convId: string) => {
    orchestratorRef.current?.abort();
    const found = await db.conversations.get(convId);
    if (found) {
      setConversation(found);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (conversation?.id === convId) {
      orchestratorRef.current?.abort();
    }
    await db.messages.where('conversationId').equals(convId).delete();
    await db.conversations.delete(convId);

    if (conversation?.id === convId) {
      const remaining = await db.conversations.orderBy('updatedAt').reverse().toArray();
      if (remaining.length > 0) {
        setConversation(remaining[0]);
      } else {
        await handleNewChat();
      }
    }
  };

  const handleRenameConversation = async (convId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await db.conversations.update(convId, { title: trimmed, updatedAt: Date.now() });
    if (conversation?.id === convId) {
      setConversation((prev) => (prev ? { ...prev, title: trimmed } : null));
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    await db.messages.delete(messageId);
  };

  const handleExportChat = () => {
    if (!messages.length) return;
    const agentMap = new Map(agents.map((a) => [a.id, a.name]));

    let markdown = `# ${conversation?.title || 'AI Group Chat'}\n\n`;
    markdown += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

    for (const msg of messages) {
      const sender =
        msg.senderType === 'user'
          ? '👤 User'
          : msg.senderType === 'system'
          ? '⚙️ System'
          : `🤖 ${agentMap.get(msg.senderId) || 'Agent'}`;

      const time = new Date(msg.timestamp).toLocaleTimeString();
      markdown += `### ${sender} (${time})\n\n${msg.content}\n\n---\n\n`;
    }

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `group-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- MESSAGE BOARD ACTIONS ---
  const handleStartBoard = (boardId: string) => {
    boardOrchestratorRef.current?.start(boardId, agents);
  };

  const handlePauseBoard = (boardId: string) => {
    boardOrchestratorRef.current?.pause(boardId);
  };

  const handleStopBoard = (boardId: string) => {
    boardOrchestratorRef.current?.stop(boardId);
  };

  const handleAddBoardInstruction = (
    boardId: string,
    text: string,
    targetAgentId?: string,
    targetAgentName?: string
  ) => {
    boardOrchestratorRef.current?.addInstruction(boardId, text, targetAgentId, targetAgentName);
  };

  const handleCreateNewBoard = async (newBoardData: Omit<TaskBoard, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `board-${Date.now()}`;
    const newBoard: TaskBoard = {
      ...newBoardData,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.taskBoards.add(newBoard);
    setSelectedBoardId(newId);
    // Auto start execution
    boardOrchestratorRef.current?.start(newId, agents);
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (boardEngineStatus.activeBoardId === boardId) {
      boardOrchestratorRef.current?.abort();
    }
    await db.boardPosts.where('boardId').equals(boardId).delete();
    await db.taskBoards.delete(boardId);

    const remaining = await db.taskBoards.orderBy('updatedAt').reverse().toArray();
    if (remaining.length > 0) {
      setSelectedBoardId(remaining[0].id);
    } else {
      setSelectedBoardId(null);
    }
  };

  const handleRenameBoard = async (boardId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await db.taskBoards.update(boardId, { title: trimmed, updatedAt: Date.now() });
  };

  const activeAgents = agents.filter((a) => conversation?.activeAgentIds.includes(a.id));

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <Header
        chatMode={conversation?.mode || 'round-table'}
        activePage={activePage}
        onSelectPage={setActivePage}
        isBoardRunning={boardEngineStatus.isRunning}
        onOpenKeysModal={() => setIsKeysModalOpen(true)}
        onToggleMobileSidebar={() => {
          if (activePage === 'chat') {
            setIsMobileSidebarOpen(true);
          } else {
            setIsMobileBoardSidebarOpen(true);
          }
        }}
        onNewChat={handleNewChat}
        onExportChat={handleExportChat}
        hasAnyKey={hasAnyKey}
        conversationTitle={conversation?.title}
        onRenameChat={(newTitle) => conversation && handleRenameConversation(conversation.id, newTitle)}
        onDeleteCurrentChat={() => conversation && handleDeleteConversation(conversation.id)}
        onOpenChatsTab={() => {
          setSidebarTab('chats');
          setIsMobileSidebarOpen(true);
        }}
        conversationsCount={conversations.length}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {activePage === 'chat' ? (
          /* ================= CHAT PAGE ================= */
          <>
            <AgentSidebar
              agents={agents}
              activeAgentIds={conversation?.activeAgentIds || []}
              onToggleAgent={handleToggleAgent}
              onOpenNewAgentModal={() => setIsNewAgentModalOpen(true)}
              onInspectAgent={handleInspectAgent}
              isOpenMobile={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              conversations={conversations}
              activeConversationId={conversation?.id}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              onRenameConversation={handleRenameConversation}
              onNewChat={handleNewChat}
              messageCounts={messageCounts}
              activeTab={sidebarTab}
              onTabChange={setSidebarTab}
            />

            <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
              {/* Missing Keys Banner */}
              {!hasAnyKey && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
                  <span>
                    🔑 <strong>BYOK Notice</strong>: You haven't added any API keys yet. Click below to add a key to start chatting!
                  </span>
                  <button
                    onClick={() => setIsKeysModalOpen(true)}
                    className="underline font-semibold hover:text-amber-200"
                  >
                    Configure Keys
                  </button>
                </div>
              )}

              {/* Error Banner */}
              {turnStatus.error && (
                <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 text-xs text-rose-300 flex items-center justify-between">
                  <span>{turnStatus.error}</span>
                </div>
              )}

              <ChatStage
                messages={messages}
                agents={agents}
                activeAgentSpeaking={
                  turnStatus.isExecuting && turnStatus.currentAgentId && turnStatus.currentAgentName
                    ? { id: turnStatus.currentAgentId, name: turnStatus.currentAgentName }
                    : null
                }
                onMentionAgent={(agentName) => {
                  promptBarRef.current?.insertMention(agentName);
                }}
                onDeleteMessage={handleDeleteMessage}
              />

              <PromptBar
                ref={promptBarRef}
                activeAgents={activeAgents}
                chatMode={conversation?.mode || 'round-table'}
                onModeChange={handleModeChange}
                isExecuting={turnStatus.isExecuting}
                onSend={handleSend}
                onStop={handleStop}
              />
            </main>
          </>
        ) : (
          /* ================= MESSAGE BOARD PAGE ================= */
          <>
            <BoardSidebar
              boards={taskBoards || []}
              activeBoardId={activeBoard?.id || null}
              onSelectBoard={(id) => setSelectedBoardId(id)}
              onOpenNewBoardModal={() => setIsNewBoardModalOpen(true)}
              onDeleteBoard={handleDeleteBoard}
              onRenameBoard={handleRenameBoard}
              isOpenMobile={isMobileBoardSidebarOpen}
              onCloseMobile={() => setIsMobileBoardSidebarOpen(false)}
              postCounts={boardPostCounts}
            />

            <MessageBoardPage
              board={activeBoard}
              posts={currentBoardPosts}
              agents={agents}
              engineStatus={boardEngineStatus}
              onStart={handleStartBoard}
              onPause={handlePauseBoard}
              onStop={handleStopBoard}
              onAddInstruction={handleAddBoardInstruction}
              onCreateNewBoard={handleCreateNewBoard}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isKeysModalOpen}
        onClose={() => setIsKeysModalOpen(false)}
        onKeysUpdated={checkKeyStatus}
      />

      <NewAgentModal
        isOpen={isNewAgentModalOpen}
        onClose={() => setIsNewAgentModalOpen(false)}
        onSaveAgent={handleSaveCustomAgent}
      />

      <AgentProfileModal
        agent={selectedProfileAgent}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdateAgent={handleUpdateAgent}
        onDeleteAgent={handleDeleteAgent}
        onDuplicateAsCustom={handleDuplicateAsCustom}
      />

      <NewBoardTaskModal
        isOpen={isNewBoardModalOpen}
        onClose={() => setIsNewBoardModalOpen(false)}
        agents={agents}
        onSubmit={handleCreateNewBoard}
      />
    </div>
  );
};
export default App;
