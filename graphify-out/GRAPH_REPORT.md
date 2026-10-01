# Graph Report - .  (2026-10-01)

## Corpus Check
- 33 files · ~47,346 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 167 nodes · 256 edges · 14 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `DiscussionOrchestrator` - 22 edges
2. `BoardOrchestrator` - 20 edges
3. `BraintrustTracer` - 9 edges
4. `Orchestrator` - 7 edges
5. `ConcurrencyLimiter` - 6 edges
6. `isSoundMuted()` - 5 edges
7. `getBraintrustConfig()` - 5 edges
8. `triggerDownload()` - 4 edges
9. `getAudioContext()` - 4 edges
10. `doInitDatabase()` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (2): handleKeyDown(), handleSubmit()

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (5): AIGroupChatDatabase, doInitDatabase(), ensureDatabaseHealth(), initDatabase(), ConcurrencyLimiter

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (1): DiscussionOrchestrator

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (0): 

### Community 4 - "Community 4"
Cohesion: 0.23
Nodes (1): BoardOrchestrator

### Community 5 - "Community 5"
Cohesion: 0.26
Nodes (3): BraintrustTracer, getBraintrustConfig(), saveBraintrustConfig()

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (7): getAudioContext(), isSoundMuted(), playActionChime(), playConsensusChime(), playTurnChime(), setSoundMuted(), toggleSoundMute()

### Community 7 - "Community 7"
Cohesion: 0.52
Nodes (1): Orchestrator

### Community 8 - "Community 8"
Cohesion: 0.6
Nodes (5): escapeHtml(), exportBoardAsHtml(), exportBoardAsJson(), exportBoardAsMarkdown(), triggerDownload()

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (2): handleKeyDown(), submitPrompt()

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 10`** (2 nodes): `BoardSidebar.tsx`, `getStatusBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiscussionOrchestrator` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.218) - this node is a cross-community bridge._
- **Why does `BoardOrchestrator` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.199) - this node is a cross-community bridge._
- **Why does `Orchestrator` connect `Community 7` to `Community 1`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._