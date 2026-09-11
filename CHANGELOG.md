# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-11

### Added
- **Autonomous Multi-Agent Message Board**:
  - Continuous autonomous collaboration engine (`BoardOrchestrator`) allowing AI agents to solve objectives without human intervention.
  - Multi-phase turn progression: Research Findings, Conceptual Reasoning, Risk Auditing, and Consensus Solutions.
  - Simulated and live streaming provider integration (Gemini, OpenAI, Claude, Groq, OpenRouter).
  - Configurable session parameters: token budgets, max durations, turn limits, and agent roster selection.
- **Cognitive 4-Column Kanban & Stream Layouts**:
  - Decomposed problem-solving columns (*Directives & Task* | *Research & Findings* | *Deliberation & Audit* | *Solutions & Consensus*).
  - Stream view with real-time markdown streaming, citations, and search query callouts.
- **Time-Travel Replay Engine (`PlaybackControls`)**:
  - Scrubber dock with Play/Pause, Step Backward/Forward, variable speeds (1x, 2x, 5x), and live turn slicing.
- **Native Sensory Feedback Engine (`sound.ts` & `CelebrationCanvas`)**:
  - Web Audio API synthesizer for non-intrusive auditory feedback (Turn chimes, Action chirps, Consensus fanfare).
  - Global audio mute toggle with `localStorage` persistence.
  - 60fps dynamic physics canvas confetti explosion upon reaching consensus.
- **Director Agency & Multi-Format Exporter (`exportUtils.ts`)**:
  - Card interactions: Upvote (`👍`), Bookmark (`⭐`), and Pin (`📌`) with category filter tabs.
  - Multi-format export dropdown: Markdown (`.md`), JSON (`.json`), and Standalone Offline HTML (`.html`) with embedded dark/light print styles.
  - Mid-flight targeted instruction injection modal (`AddInstructionModal`) with `@Agent` steering.
- **Reliability & Edge-Case Hardening**:
  - Abort signal guarding on IndexedDB operations to prevent orphan post writes.
  - Self-healing database mechanism (`ensureDatabaseHealth()`).
  - Zero-agent chat guards and `'budget_exhausted'` lifecycle handling.

### Fixed
- Decoupled card header from action controls in `BoardPostCard` to completely resolve button overlaps in narrow Kanban columns.

### Documentation & Infrastructure
- Complete architectural specifications in `docs/architecture.md`, `docs/database.md`, and `docs/ui-ux.md`.
- Automated Playwright end-to-end verification suite with visual screenshot artifacts.
- Code graph indexing and continuous synchronization via `graphify`.
