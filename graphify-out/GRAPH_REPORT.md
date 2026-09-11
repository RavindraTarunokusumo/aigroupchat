# Graph Report - .  (2026-09-11)

## Corpus Check
- 28 files · ~35,042 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 138 nodes · 196 edges · 12 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `BoardOrchestrator` - 20 edges
2. `Orchestrator` - 7 edges
3. `isSoundMuted()` - 5 edges
4. `triggerDownload()` - 4 edges
5. `getAudioContext()` - 4 edges
6. `exportBoardAsHtml()` - 3 edges
7. `toggleSoundMute()` - 3 edges
8. `playTurnChime()` - 3 edges
9. `playActionChime()` - 3 edges
10. `playConsensusChime()` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (2): handleDeleteConversation(), handleNewChat()

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (0): 

### Community 2 - "Community 2"
Cohesion: 0.23
Nodes (1): BoardOrchestrator

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (3): AIGroupChatDatabase, ensureDatabaseHealth(), initDatabase()

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (0): 

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (7): getAudioContext(), isSoundMuted(), playActionChime(), playConsensusChime(), playTurnChime(), setSoundMuted(), toggleSoundMute()

### Community 6 - "Community 6"
Cohesion: 0.52
Nodes (1): Orchestrator

### Community 7 - "Community 7"
Cohesion: 0.6
Nodes (5): escapeHtml(), exportBoardAsHtml(), exportBoardAsJson(), exportBoardAsMarkdown(), triggerDownload()

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (2): handleKeyDown(), submitPrompt()

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 9`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BoardOrchestrator` connect `Community 2` to `Community 3`?**
  _High betweenness centrality (0.248) - this node is a cross-community bridge._
- **Why does `Orchestrator` connect `Community 6` to `Community 3`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._