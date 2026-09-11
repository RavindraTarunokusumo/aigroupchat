import React, { useEffect, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initDatabase } from './lib/db';
import { getAllApiKeys } from './lib/keys';
import { Orchestrator, type TurnStatus } from './lib/orchestrator';
import type { Agent, Conversation, Message, ChatMode } from './types';
import { Header } from './components/Header';
import { AgentSidebar } from './components/AgentSidebar';
import { ChatStage } from './components/ChatStage';
import { PromptBar, type PromptBarHandle } from './components/PromptBar';
import { ApiKeyModal } from './components/ApiKeyModal';
import { NewAgentModal } from './components/NewAgentModal';
import { AgentProfileModal } from './components/AgentProfileModal';

export const App: React.FC = () => {
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

  // Live query for agents
  const agents = useLiveQuery(() => db.agents.toArray(), []) || [];

  // Live query for messages in the current conversation
  const messages =
    useLiveQuery<Message[]>(
      async () => {
        if (!conversation) return [];
        return db.messages.where('conversationId').equals(conversation.id).sortBy('timestamp');
      },
      [conversation?.id]
    ) || [];

  // Orchestrator and prompt bar refs
  const orchestratorRef = useRef<Orchestrator | null>(null);
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

    return () => {
      orchestratorRef.current?.abort();
    };
  }, []);

  // Initialize DB on mount
  useEffect(() => {
    initDatabase().then((conv) => {
      setConversation(conv);
      checkKeyStatus();
    });
  }, []);

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
    await db.conversations.update(conversation.id, { updatedAt: Date.now() });

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
    // Auto-activate in current conversation
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

  const activeAgents = agents.filter((a) => conversation?.activeAgentIds.includes(a.id));

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <Header
        chatMode={conversation?.mode || 'round-table'}
        onOpenKeysModal={() => setIsKeysModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onNewChat={handleNewChat}
        onExportChat={handleExportChat}
        hasAnyKey={hasAnyKey}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Agent Roster Sidebar */}
        <AgentSidebar
          agents={agents}
          activeAgentIds={conversation?.activeAgentIds || []}
          onToggleAgent={handleToggleAgent}
          onOpenNewAgentModal={() => setIsNewAgentModalOpen(true)}
          onInspectAgent={handleInspectAgent}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Central Chat Stage & Input */}
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
    </div>
  );
};
export default App;
