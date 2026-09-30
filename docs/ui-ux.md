# Minimalist UI & Editorial Discussion Workspace Design System

## 1. Vision & Editorial Philosophy
The AI Group Chat interface is modeled as an **editorial deliberation workspace** rather than a casual chat room or crowded task board. Inspired by print typography, academic discourse, and high-focus research tools, the design prioritizes substantive multi-agent reasoning, deep-dive sub-threads, and clear visual hierarchy.

- **Audience**: General public, researchers, designers, and systems architects exploring multi-agent autonomy.
- **Tone**: Calm, editorial, intellectual, and mathematically rigorous.
- **Design Philosophy**: High typographic fidelity, warm bone backgrounds, crisp flat borders, zero emojis, and zero unnecessary visual ornamentation.

---

## 2. Color Palette & Visual Hierarchy

### 2.1 Surfaces & Canvas
| Token | Hex Value | Purpose |
| :--- | :--- | :--- |
| **Canvas Background** | `#F7F6F3` | Main stage and outer layout background |
| **Subtle Canvas** | `#FBFBFA` | Sidebar navigation, drawer backgrounds, and input wells |
| **Primary Card Surface** | `#FFFFFF` | Message cards, thesis banners, and dialog windows |
| **Border Line** | `#EAEAEA` | Universal 1px flat structural boundary |
| **Active Border Accent** | `#111111` | Selected threads, active inputs, and primary buttons |

### 2.2 Typography Colors
| Token | Hex Value | Purpose |
| :--- | :--- | :--- |
| **Off-Black Charcoal** | `#111111` | Headings, thesis quotes, agent titles, and primary action controls |
| **Body Charcoal** | `#2F3437` | Markdown paragraphs, bullet points, and reasoning content (line-height 1.6) |
| **Secondary Muted** | `#787774` | Timestamps, agent roles, keystroke shortcuts, and auxiliary labels |

### 2.3 Muted Pastel Status Badges
Status indicators and action tags use muted pastels with high-contrast text:

| Classification | Background | Text Color | Usage |
| :--- | :--- | :--- | :--- |
| **Pale Green** | `#EDF3EC` | `#346538` | `Active Deliberation`, `Synthesis to Main`, Configured Keys |
| **Pale Blue** | `#E1F3FE` | `#1F6C9F` | `Branch Sub-Thread`, `Concluded`, Universal Providers |
| **Pale Yellow** | `#FBF3DB` | `#956400` | `Barrier Wait`, Initial Framing stances |
| **Pale Red** | `#FDEBEC` | `#9F2F2D` | `Paused` state, critical alerts |

---

## 3. Typography Hierarchy

### 3.1 Editorial Serif (`Newsreader`)
- **Font Stack**: `'Newsreader', 'Playfair Display', Georgia, serif`
- **Tracking**: `-0.025em` to `-0.04em`
- **Line Height**: `1.15` to `1.25`
- **Application**: Deliberation masthead title, thesis quotes, modal titles, and section headers.

### 3.2 Primary Sans (`Geist Sans`)
- **Font Stack**: `'Geist Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif`
- **Application**: Body copy, agent roles, card headers, button labels, and system messages.

### 3.3 Monospace (`Geist Mono`)
- **Font Stack**: `'Geist Mono', 'SF Mono', monospace`
- **Application**: Agent monograms, action tags, timestamps, keystroke indicators, and inline code.

---

## 4. Negative Constraints & Design Rules

To preserve architectural restraint, the following patterns are strictly enforced:
- **Zero Emojis**: Emojis are strictly banned from UI labels, button text, headings, status indicators, and alt text.
- **Zero Generic Thin-Line Icon Packs**: External icon libraries (e.g. Lucide, Feather, Heroicons) are replaced by bespoke SVG primitives in `src/components/icons/MinimalIcons.tsx`.
- **Flat 1px Borders**: No heavy drop shadows (`shadow-md`, `shadow-lg`). All cards feature `border: 1px solid #EAEAEA` and flat elevation (maximum `box-shadow: 0 1px 3px rgba(0,0,0,0.02)`).
- **No Gradients or Neon Highlights**: Large backgrounds use warm monochrome shades (`#F7F6F3` / `#FBFBFA` / `#FFFFFF`).
- **Crisp Corner Radii**: Cards and containers use `rounded-[8px]`, buttons and inputs use `rounded-[6px]`. Fully rounded pills (`rounded-full`) are reserved exclusively for status badges.

---

## 5. Architectural Workspace Components

### 5.1 Editorial Masthead (`DiscussionHeader`)
- Displays the publication masthead: **AI Group Chat** with subtitle *Autonomous Multi-Agent Deliberation*.
- Dynamic pastel pill reflecting orchestrator state: `BARRIER WAIT`, `ACTIVE DELIBERATION`, `PAUSED`, or `CONCLUDED`.
- Controls for `New Discussion`, `API Keys` (with configured provider count), and Run Controls (`Start`, `Pause`, `Stop`).

### 5.2 Bento Navigation Column (`ThreadNavigation`)
- **Discussions Roster**: Quick switching between stored deliberation topics with real-time status indicators.
- **Conversation Threads**:
  - `#main` Root Discussion Thread tracking global participant count.
  - Dynamic sub-threads (e.g. `#formal-vs-immune`) tracking turn count, active agent presence chips (using 2-letter monograms like `LG`, `SK`, `MD`), and status badges.
- **New Sub-Thread Trigger**: Allows the user to prompt a specialized branch topic.

### 5.3 Central Deliberation Stage (`DiscussionStage`)
- **Thesis Anchor Banner**: Editorial quote block featuring `Newsreader` serif typography, solid off-black left accent line, and date stamp.
- **Phase 1 Synchronization Barrier Banner**: Displays live progress (`N of M Agents Responded`) and a visual agent checklist (`Framing...` vs `Framed`).
- **Structured Message Feed**: Crisp white cards with agent monogram, persona role, timestamp, action tag badge (`[INITIAL FRAMING]`, `[BRANCH SUB-THREAD]`, `[SYNTHESIS TO MAIN]`, `[THREAD REPLY]`), and markdown formatting.
- **Director Steering Prompt Bar**: Docked input dock at the base of the stage with keystroke prompt `<kbd>Enter to send</kbd>` allowing the human director to guide the active thread.

### 5.4 Dialog Suite
- **`NewDiscussionModal`**: Minimal modal for launching new deliberations with topic prompt and agent selection checklist.
- **`NewSubThreadModal`**: Modal for branching off a focused sub-topic with assigned agent delegates.
- **`ApiKeyModal`**: Restyled BYOK credentials manager with local IndexedDB storage, test verification, and provider portal links.
