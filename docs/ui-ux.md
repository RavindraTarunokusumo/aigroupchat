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

### 3.4 Autonomous Message Board Interface
- **Top Navigation Switcher**: Seamless switching between the conversational **Chat** stage and the autonomous **Message Board**. Includes a live pulsating execution badge on the board pill when active.
- **Task Header & Immutable Objective**: Highlights the immutable core task assignment with an integrity badge alongside real-time control actions (**Pause**, **Resume**, **Stop**, **+ Add Instruction**, **New Board**, **Export**).
- **Injected Directives & Targeting**:
  - Direct constraint injection modal with quick-fill preset chips (Low Latency, Zero-Trust, Cloud Cost Budget, Zero-Downtime Rollback).
  - Target selector allowing users to broadcast to all agents or address a specific agent (`@AgentName`).
  - Distinct visual callout banner displaying all human directives injected during the session with timestamps.
- **Real-Time Analytics & Gauges**:
  - Live timer tracking elapsed time against the maximum duration budget.
  - Turn counter comparing current progress against turn limits.
  - Token consumption meter showing cumulative usage against allocated budget.
  - Active contributor chip displaying the currently reasoning agent and action phase.
- **Categorized Contribution Cards & Fast Actions**:
  - 🔍 **Research Findings**: Cyan badges with query tags and cited source links.
  - 💡 **Conceptual Thoughts**: Slate/indigo cards highlighting high-level paradigms.
  - ⚖️ **Risk Audits & Critiques**: Amber badges warning of bottlenecks or edge cases.
  - 🚀 **Solution Proposals**: Emerald glowing cards with markdown code blocks and delivery roadmaps.
  - 🎯 **Consensus Synthesis**: Purple badges consolidating agreements and verdicts.
  - 📋 **1-Click Card Copy**: Fast clipboard copy button on every card with visual checkmark confirmation.
- **View Adaptability**:
  - **Stream Timeline**: Sequential chronological thread with smooth auto-scroll.
  - **4-Column Kanban Grid**: Structured responsive layout mapping to the complete cognitive cycle:
    1. *Directives & Task* (includes pinned immutable task objective + all injected directives)
    2. *Research & Findings* (search queries, benchmarks, and external surveys)
    3. *Deliberation & Audit* (architectural trade-offs, critiques, and failure mode analyses)
    4. *Solutions & Consensus* (concrete proposals, implementations, and synthesized verdicts)
- **Search & Contributor Filtering**:
  - Instant text search across post content, titles, and search queries.
  - Contributor filter dropdown to isolate posts by specific agents or human director directives.
- **Consensus Completion Banner**:
  - Dynamic banner surfaced upon task completion with metrics breakdown and one-click "Copy Final Solution" action.

---

## 4. Accessibility & Responsiveness
- Full mobile responsive layout with collapsible agent and board drawer.
- Keyboard navigation shortcuts (`Cmd/Ctrl + Enter` to send, `@` to mention, `Esc` to stop/close modals).
- WCAG AA contrast compliance across all agent accent badges and text blocks.

