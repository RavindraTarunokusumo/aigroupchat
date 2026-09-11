# Graph Report - .  (2026-09-11)

## Corpus Check
- 24 files · ~27,199 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 112 nodes · 149 edges · 14 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `BoardOrchestrator` - 18 edges
2. `Orchestrator` - 7 edges
3. `handleNewChat()` - 2 edges
4. `handleDeleteConversation()` - 2 edges
5. `handleKeyDown()` - 2 edges
6. `submitPrompt()` - 2 edges
7. `AIGroupChatDatabase` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (0): 

### Community 1 - "Community 1"
Cohesion: 0.24
Nodes (1): BoardOrchestrator

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (1): AIGroupChatDatabase

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (0): 

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (0): 

### Community 5 - "Community 5"
Cohesion: 0.52
Nodes (1): Orchestrator

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 0.5
Nodes (2): handleKeyDown(), submitPrompt()

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (2): handleDeleteConversation(), handleNewChat()

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
- **Thin community `Community 8`** (2 nodes): `BoardSidebar.tsx`, `getStatusBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (2 nodes): `AgentSidebar.tsx`, `setTab()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (2 nodes): `handleDeleteConversation()`, `handleNewChat()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BoardOrchestrator` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.270) - this node is a cross-community bridge._
- **Why does `Orchestrator` connect `Community 5` to `Community 2`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._