# Graph Report - .  (2026-10-11)

## Corpus Check
- 47 files · ~70,114 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 243 nodes · 342 edges · 37 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]

## God Nodes (most connected - your core abstractions)
1. `DiscussionOrchestrator` - 24 edges
2. `BoardOrchestrator` - 20 edges
3. `BraintrustTracer` - 11 edges
4. `Orchestrator` - 7 edges
5. `saveBraintrustConfig()` - 7 edges
6. `ConcurrencyLimiter` - 6 edges
7. `renderMessageCardHtml()` - 6 edges
8. `getBraintrustConfig()` - 6 edges
9. `loadKeys()` - 5 edges
10. `cleanAgentResponseText()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `run()` --calls--> `executeInE2BSandbox()`  [INFERRED]
  scripts\verify_math_and_delete.mjs → src\lib\execution\e2bExecutor.ts
- `loadKeys()` --calls--> `getAllApiKeys()`  [INFERRED]
  src\components\ApiKeyModal.tsx → src\lib\keys.ts
- `loadKeys()` --calls--> `getE2BConfig()`  [INFERRED]
  src\components\ApiKeyModal.tsx → src\lib\execution\e2bExecutor.ts
- `handleBtSave()` --calls--> `saveBraintrustConfig()`  [INFERRED]
  src\components\ApiKeyModal.tsx → src\lib\observability\braintrust.ts
- `handleBtToggleEnabled()` --calls--> `saveBraintrustConfig()`  [INFERRED]
  src\components\ApiKeyModal.tsx → src\lib\observability\braintrust.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (21): handleBtSave(), handleBtTest(), handleBtToggleEnabled(), handleSave(), handleTavilySave(), handleTavilyTest(), handleTest(), loadKeys() (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (3): cleanAgentResponseText(), stripThinkingTags(), DiscussionOrchestrator

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (15): handleKeyDown(), handleSubmit(), exportDatabaseArchive(), restoreDatabaseArchive(), validateArchive(), handleClose(), handleDrop(), handleExport() (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (1): BoardOrchestrator

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (11): handleE2BSave(), handleE2BTest(), handleKeyDown(), handleRun(), handleRunSandbox(), handleSubmit(), executeInE2BSandbox(), getE2BConfig() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (12): escapeHtml(), exportDiscussion(), exportDiscussionAsHtml(), exportDiscussionAsJson(), exportDiscussionAsMarkdown(), formatDateTime(), formatTime(), getActionLabel() (+4 more)

### Community 6 - "Community 6"
Cohesion: 0.27
Nodes (3): getApiKey(), Orchestrator, streamCompletion()

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 0.54
Nodes (7): getAudioContext(), isSoundMuted(), playActionChime(), playConsensusChime(), playTurnChime(), setSoundMuted(), toggleSoundMute()

### Community 9 - "Community 9"
Cohesion: 0.38
Nodes (3): handleDelete(), handleStartCreateNew(), loadAgent()

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (1): ConcurrencyLimiter

### Community 11 - "Community 11"
Cohesion: 0.6
Nodes (5): escapeHtml(), exportBoardAsHtml(), exportBoardAsJson(), exportBoardAsMarkdown(), triggerDownload()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (2): handleKeyDown(), submitPrompt()

### Community 13 - "Community 13"
Cohesion: 0.5
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
Cohesion: 0.67
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

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 19`** (2 nodes): `main()`, `inspect_state.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `verify_attachment_markdown.mjs`, `run()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `verify_board.mjs`, `run()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `verify_braintrust_observability.mjs`, `run()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `verify_four_agents.mjs`, `run()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `verify_spawn_and_traces.mjs`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `formatNumber()`, `AnalyticsModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `getStatusBadge()`, `BoardSidebar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `CelebrationCanvas()`, `CelebrationCanvas.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `PlaybackControls()`, `PlaybackControls.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `getStatusBadge()`, `DiscussionHeader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `PlayIcon()`, `MinimalIcons.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `Header.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `ThreadNavigation.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `boardTemplates.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `constants.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getApiKey()` connect `Community 6` to `Community 0`, `Community 1`, `Community 3`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `ensureDatabaseHealth()` connect `Community 2` to `Community 3`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `loadKeys()` connect `Community 0` to `Community 4`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `saveBraintrustConfig()` (e.g. with `handleBtSave()` and `handleBtToggleEnabled()`) actually correct?**
  _`saveBraintrustConfig()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._