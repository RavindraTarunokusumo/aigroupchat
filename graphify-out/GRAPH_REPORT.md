# Graph Report - .  (2026-10-01)

## Corpus Check
- 34 files · ~44,292 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 154 nodes · 206 edges · 31 communities detected
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]

## God Nodes (most connected - your core abstractions)
1. `DiscussionOrchestrator` - 22 edges
2. `BoardOrchestrator` - 20 edges
3. `Orchestrator` - 7 edges
4. `ConcurrencyLimiter` - 6 edges
5. `getAudioContext()` - 5 edges
6. `isSoundMuted()` - 5 edges
7. `playTurnChime()` - 5 edges
8. `playActionChime()` - 5 edges
9. `cleanAgentResponseText()` - 4 edges
10. `doInitDatabase()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `doInitDatabase()` --calls--> `cleanAgentResponseText()`  [INFERRED]
  src\lib\db.ts → src\lib\cleanText.ts
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
Cohesion: 0.16
Nodes (2): cleanAgentResponseText(), DiscussionOrchestrator

### Community 1 - "Community 1"
Cohesion: 0.21
Nodes (1): BoardOrchestrator

### Community 2 - "Community 2"
Cohesion: 0.24
Nodes (7): handleSave(), handleTest(), loadKeys(), getAllApiKeys(), getApiKey(), saveApiKey(), validateApiKey()

### Community 3 - "Community 3"
Cohesion: 0.31
Nodes (2): Orchestrator, streamCompletion()

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (0): 

### Community 5 - "Community 5"
Cohesion: 0.54
Nodes (7): getAudioContext(), isSoundMuted(), playActionChime(), playConsensusChime(), playTurnChime(), setSoundMuted(), toggleSoundMute()

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (1): ConcurrencyLimiter

### Community 7 - "Community 7"
Cohesion: 0.47
Nodes (4): AIGroupChatDatabase, doInitDatabase(), ensureDatabaseHealth(), initDatabase()

### Community 8 - "Community 8"
Cohesion: 0.6
Nodes (5): escapeHtml(), exportBoardAsHtml(), exportBoardAsJson(), exportBoardAsMarkdown(), triggerDownload()

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (2): handleKeyDown(), submitPrompt()

### Community 10 - "Community 10"
Cohesion: 0.5
Nodes (2): handleKeyDown(), handleSubmit()

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
Cohesion: 0.67
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 0.67
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

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 18`** (2 nodes): `verify_board.mjs`, `run()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `verify_four_agents.mjs`, `run()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `getStatusBadge()`, `BoardSidebar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `CelebrationCanvas()`, `CelebrationCanvas.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `PlaybackControls()`, `PlaybackControls.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `getStatusBadge()`, `DiscussionHeader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `PlayIcon()`, `MinimalIcons.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `Header.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `ThreadNavigation.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `boardTemplates.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `constants.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getApiKey()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `DiscussionOrchestrator` connect `Community 0` to `Community 6`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._