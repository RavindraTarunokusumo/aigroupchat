# UI/UX Design Profile & Interaction Guide

## 1. Vision & Tone
- **Audience**: General public, tech enthusiasts, students, and professionals.
- **Tone**: Playful yet powerful, vibrant, collaborative, transparent.
- **Key Feeling**: Feeling like you are the director or chairman of a high-powered room of diverse AI specialists.

---

## 2. Visual Identity & Color Palette

### 2.1 Theme & Foundations
- **Dark / Light Modes**: Modern slate/zinc dark theme by default (high contrast, readable code blocks), with full light theme support.
- **Glassmorphism & Depth**: Subtle border outlines (`border-slate-700/50`), subtle background blurs for floating control bars and modals.

### 2.2 Agent Personalities & Color Accents
Each agent is assigned a distinctive color identity that permeates their avatar, border glow, name tag, and typing pulse:

| Persona | Accent Color | Visual Meaning |
| :--- | :--- | :--- |
| **The Logician** | Blue (`#3B82F6` / `text-blue-400`) | Rationality, architectural rigor, structure |
| **The Creative** | Purple / Violet (`#A855F7` / `text-purple-400`) | Lateral thinking, imagination, brainstorming |
| **The Skeptic** | Amber / Orange (`#F59E0B` / `text-amber-400`) | Critical thinking, risk mitigation, devils advocate |
| **The Moderator**| Emerald / Green (`#10B981` / `text-emerald-400`) | Balance, facilitation, synthesis, next steps |
| **The Comedian** | Rose / Pink (`#EC4899` / `text-pink-400`) | Wit, relatable analogies, comic relief |
| **User (You)** | Cyan / Teal (`#06B6D4` / `text-cyan-400`) | Direct human leadership |

---

## 3. Key Interface Surfaces

### 3.1 Sidebar & Agent Profile Modal
- **Agent Roster**: Toggle agents into/out of the current conversation with one click.
- **Agent Profile Inspection & Editing**:
  - **Default Agents**: View-only mode with full persona instructions prompt, role, and model. Includes "Duplicate as Custom Agent" to enable customization without mutating presets.
  - **Custom Agents**: Full in-place editing of name, role, avatar, accent color, provider, model, temperature, and system prompt, plus deletion controls.
- **Status Badges**: Visual indicator (idle, thinking, speaking) for each agent.
- **Key Status**: Top-level badge indicating which API providers have active keys configured.
- **Session History**: Easily switch between saved group conversations.

### 3.2 Main Chat Stage
- **Agent Message Bubbles**: Distinctive headers showing the agent's avatar, role badge, and model used.
- **Streaming Experience**: Real-time token streaming with smooth auto-scroll (with user scroll-interruption detection).
- **Thinking / Collaboration Indicators**: Interactive animated indicators when an agent is deliberating or when agents invoke one another.
- **Quick Actions on Messages**:
  - Direct reply: `@Agent` prompt targeting that specific response.
  - Copy markdown or code snippet.
  - Branch conversation from this message.

### 3.3 Dynamic Bottom Prompt Bar
- Mention suggestions when user types `@...`.
- One-click mode toggle: **Direct Mention**, **Round Robin**, **Moderated Debate**.
- Stop generation button (`Escape` or click) that cleanly terminates the streaming SSE connection.
- **Zero-Agent Guard**: When zero agents are toggled active in the conversation, the prompt bar automatically disables input with an amber guidance banner: *"No agents are currently active. Please select at least one agent from the sidebar to chat."*

### 3.4 Autonomous Message Board Interface
- **Top Navigation Switcher**: Seamless switching between the conversational **Chat** stage and the autonomous **Message Board**. Includes a live pulsating execution badge on the board pill when active.
- **Task Header & Immutable Objective**: Highlights the immutable core task assignment with an integrity badge alongside real-time control actions (**Pause**, **Resume/Restart**, **Stop**, **Replay**, **+ Add Instruction**, **New Board**, **Export Dropdown**).
- **Injected Directives & Targeting**:
  - Direct constraint injection modal with quick-fill preset chips (Low Latency, Zero-Trust, Cloud Cost Budget, Zero-Downtime Rollback).
  - Target selector allowing users to broadcast to all agents or address a specific agent (`@AgentName`).
  - Distinct visual callout banner displaying all human directives injected during the session with timestamps.
- **Real-Time Analytics & Gauges**:
  - Live timer tracking elapsed time against the maximum duration budget.
  - Turn counter comparing current progress against turn limits.
  - Token consumption meter showing cumulative usage against allocated budget.
  - Active contributor chip displaying the currently reasoning agent and action phase.
- **Director Micro-Interactions on Contribution Cards**:
  - 📌 **Pin Contribution**: Pins critical findings to the top of the feed with an amber `PINNED` badge and warm golden border halo (`border-amber-500/50`).
  - ⭐ **Bookmark Card**: Saves high-leverage insights to the user's curated bookmarks collection with interactive purple illumination.
  - 👍 **Director Upvote**: Endorses standout agent proposals with real-time reaction counters and auditory haptic click feedback.
  - 📋 **1-Click Card Copy**: Fast clipboard copy button on every card with visual checkmark confirmation.
- **Categorized Filter Tabs & Views**:
  - `All Posts`, `📌 Pinned`, `⭐ Bookmarked`, `🚀 Solutions`, `🔍 Findings`, `⚖️ Critiques`, `💡 Thoughts`, `📢 Directives`.
  - Pinned cards float directly to the top of the `All Posts` feed to ensure high-priority directives or solutions remain in focal view.
- **Multi-Format Export Suite Dropdown**:
  - Replaces single generic export with a modular dropdown offering:
    - 📝 **Markdown Report (`.md`)**: Full markdown transcript with metadata and agent model details.
    - 📊 **Raw JSON Data (`.json`)**: Structured schema including full timestamps, token counts, and reactions.
    - 🌐 **Standalone HTML (`.html`)**: Self-contained, responsive offline report featuring print media styling, zero external CDNs, and instant search/filtering.

### 3.5 Time-Travel Replay Mode (`PlaybackControls`)
- **Scrubber Dock**: Floating glassmorphism bottom toolbar allowing users to inspect the deliberation step-by-step.
- **Dynamic Slicing**: Slices visible board items up to the selected replay turn, recalculating kanban layout and stats in real-time.
- **Variable-Speed Playback**: 1x, 2x, and 5x speed multipliers accompanied by synchronized audio blips.
- **Controls**: Play/Pause, Step Backward, Step Forward, Reset to Start, Jump to Latest, and Exit Replay.

### 3.6 Sensory Feedback & Celebration Confetti
- **Pure Web Audio API**: Zero-asset sound engine providing non-intrusive auditory feedback:
  - 🎶 **Consensus Fanfare**: 5-note pentatonic arpeggio celebrating goal completion.
  - 🔔 **Turn Progression Blip**: Crisp frequency chime as agents formulate thoughts.
  - 🔘 **Action Chirp**: Haptic auditory confirmation on pins, bookmarks, and upvotes.
  - 🔇 **Global Audio Toggle**: Volume button (`Volume2` / `VolumeX`) in the application header with `localStorage` persistence.
- **60fps Celebration Canvas**: Full-screen particle confetti burst styled in agent accent colors (`#06B6D4`, `#3B82F6`, `#A855F7`, `#10B981`, `#F59E0B`, `#EC4899`) with strict `prefers-reduced-motion` compliance.

---

## 4. Accessibility & Responsiveness
- Full mobile responsive layout with collapsible agent and board drawer.
- Keyboard navigation shortcuts (`Cmd/Ctrl + Enter` to send, `@` to mention, `Esc` to stop/close modals).
- WCAG AA contrast compliance across all agent accent badges and text blocks.
- Respect for user motion preferences (`prefers-reduced-motion: reduce`) automatically disabling particle physics.

