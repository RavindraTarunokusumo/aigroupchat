# Graph Report - .  (2026-09-11)

## Corpus Check
- 29 files · ~32,774 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 137 nodes · 174 edges · 25 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]

## God Nodes (most connected - your core abstractions)
1. `BoardOrchestrator` - 18 edges
2. `Orchestrator` - 7 edges
3. `isSoundMuted()` - 5 edges
4. `playTurnChime()` - 5 edges
5. `playActionChime()` - 5 edges
6. `triggerDownload()` - 4 edges
7. `getAudioContext()` - 4 edges
8. `handleDeleteConversation()` - 3 edges
9. `handleTest()` - 3 edges
10. `ensureDatabaseHealth()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `checkKeyStatus()` --calls--> `getAllApiKeys()`  [INFERRED]
  src\App.tsx → src\lib\keys.ts
- `loadKeys()` --calls--> `getAllApiKeys()`  [INFERRED]
  src\components\ApiKeyModal.tsx → src\lib\keys.ts
- `handleSave()` --calls--> `saveApiKey()`  [INFERRED]
  src\components\ApiKeyModal.tsx → src\lib\keys.ts
- `handleTest()` --calls--> `validateApiKey()`  [INFERRED]
  src\components\ApiKeyModal.tsx → src\lib\keys.ts
- `handleTest()` --calls--> `saveApiKey()`  [INFERRED]
  src\components\ApiKeyModal.tsx → src\lib\keys.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (7): handleAddBoardInstruction(), handleDeleteBoard(), handleDeleteConversation(), handleNewChat(), handleSelectConversation(), handleStop(), handleStopBoard()

### Community 1 - "Community 1"
Cohesion: 0.19
Nodes (4): handleCreateNewBoard(), handlePauseBoard(), handleStartBoard(), BoardOrchestrator

### Community 2 - "Community 2"
Cohesion: 0.21
Nodes (8): handleSave(), handleTest(), loadKeys(), checkKeyStatus(), getAllApiKeys(), getApiKey(), saveApiKey(), validateApiKey()

### Community 3 - "Community 3"
Cohesion: 0.27
Nodes (3): handleSend(), Orchestrator, streamCompletion()

### Community 4 - "Community 4"
Cohesion: 0.47
Nodes (7): getAudioContext(), isSoundMuted(), playActionChime(), playConsensusChime(), playTurnChime(), setSoundMuted(), toggleSoundMute()

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (4): cleanAgentResponseText(), AIGroupChatDatabase, ensureDatabaseHealth(), initDatabase()

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 0.6
Nodes (5): escapeHtml(), exportBoardAsHtml(), exportBoardAsJson(), exportBoardAsMarkdown(), triggerDownload()

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (2): handleKeyDown(), submitPrompt()

### Community 10 - "Community 10"
Cohesion: 0.5
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 0.67
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 15`** (2 nodes): `verify_board.mjs`, `run()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `setTab()`, `AgentSidebar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `getStatusBadge()`, `BoardSidebar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `CelebrationCanvas()`, `CelebrationCanvas.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `PlaybackControls()`, `PlaybackControls.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `Header.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `boardTemplates.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `constants.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BoardOrchestrator` connect `Community 1` to `Community 0`, `Community 4`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `getApiKey()` connect `Community 2` to `Community 1`, `Community 3`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `ensureDatabaseHealth()` connect `Community 6` to `Community 1`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `playTurnChime()` (e.g. with `.start()` and `.stop()`) actually correct?**
  _`playTurnChime()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `playActionChime()` (e.g. with `.start()` and `.stop()`) actually correct?**
  _`playActionChime()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._