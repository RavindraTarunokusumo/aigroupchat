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

### 3.1 Sidebar (Agent Management & Sessions)
- **Agent Roster**: Toggle agents into/out of the current conversation with one click.
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

---

## 4. Accessibility & Responsiveness
- Full mobile responsive layout with collapsible agent drawer.
- Keyboard navigation shortcuts (`Cmd/Ctrl + Enter` to send, `@` to mention, `Esc` to stop/close modals).
- WCAG AA contrast compliance across all agent accent badges and text blocks.
