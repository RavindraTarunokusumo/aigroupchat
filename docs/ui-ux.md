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
- Dynamic pastel pill reflecting orchestrator state: `ACTIVE DELIBERATION`, `PAUSED`, `CONCLUDED`, or `IDLE`.
- Action buttons for `New Discussion`, `API Keys` (with active provider status and Braintrust link), and a clean 3-button control strip (`Start / Resume`, `Pause`, `Stop`).

### 5.2 Bento Navigation Column (`ThreadNavigation`)
- **Discussions Roster**: Quick switching between stored deliberation topics with real-time status indicators.
- **Conversation Threads**:
  - `#main` Root Discussion Thread tracking global participant count.
  - Dynamic sub-threads (e.g. `#hardware-micro-sandboxes`) tracking turn count, active agent presence chips (using 2-letter monograms like `DS`, `GL`, `NV`, `QW`), and status badges (`ACTIVE` vs `CONCLUDED`).
- **New Sub-Thread Trigger**: Allows the user to prompt a specialized branch topic.

### 5.3 Pinned Deliberation Stage Banner & Message Feed (`DiscussionStage`)
- **Pinned Thesis & Control Banner**: Permanently anchored at the top of the deliberation canvas:
  - Editorial thesis headline styled in `Newsreader` serif typography with solid off-black left accent border.
  - **Live Token Budget Meter**: Real-time progress bar tracking cumulative token consumption against configured budget ceilings (`1,420 / 15,000 tok`).
  - **Conclude Discussion Button**: Direct directorial control to conclude the entire session with timestamped ledger entry.
  - **Close Thread Button**: When viewing a sub-thread, allows closing the deep-dive sub-thread while leaving the main deliberation running.
  - **Reopen Button**: One-click action to reopen concluded discussions for further deliberation.
- **Structured Message Feed**: Crisp white cards with agent monogram, persona role, timestamp, telemetry badges (`LIVE` vs `SIMULATED`, model name, token count, latency), action tag badge (`[INITIAL FRAMING]`, `[BRANCH SUB-THREAD]`, `[SYNTHESIS TO MAIN]`, `[THREAD REPLY]`, `[PROPOSE CONCLUSION]`, `[AGREE CONCLUSION]`, `[CONTEST CONCLUSION]`), and markdown formatting with KaTeX math rendering.
- **Director Steering Prompt Bar**: Docked input dock at the base of the stage with keystroke prompt `<kbd>Enter to send</kbd>` allowing the human director to guide the active thread.

### 5.4 Dialog Suite
- **`NewDiscussionModal`**: Minimal modal for launching new deliberations with topic prompt, agent selection checklist, and Token Budget ceiling presets (`5k`, `10k`, `25k`, `50k`, `Unlimited` [0]).
- **`NewSubThreadModal`**: Modal for branching off a focused sub-topic with assigned agent delegates.
- **`ApiKeyModal`**: Restyled BYOK credentials manager with local IndexedDB storage, test verification, and provider portal links.

---

## 6. Mathematical Typesetting (KaTeX / LaTeX)
The workspace provides full support for academic and formal mathematical notation across deliberation messages and document attachment previews using `remark-math`, `rehype-katex`, and `katex`:
- **Inline Notation**: Enclosed within single dollar signs (e.g., `$\mathcal{L}(\theta) = \sum_{i=1}^N (y_i - f(x_i))^2$`, `$O(N^2)$`, or `$\lambda$`).
- **Display Blocks**: Enclosed within double dollar signs (e.g., `$$\min_\theta \mathbb{E}_{x \sim \mathcal{D}}[\mathcal{L}(x, \theta)] + \lambda \|\theta\|_2^2$$`).
- **Typography Integration**: Rendered using KaTeX's high-contrast web fonts seamlessly aligned with the `Newsreader` and `Geist` type system.

---

## 7. Lifecycle & Deletion Management
Discussions can be permanently removed with full referential cascade integrity:
- **Deletion Access Points**:
  - **Sidebar List**: Hovering over any discussion item reveals a bespoke `TrashIcon` button.
  - **Thesis Anchor Banner**: A prominent `Delete` action in the top right of the active discussion header.
- **Inline Confirmation Safety**:
  - Clicking delete does not trigger disruptive browser dialogs. Instead, it transitions into an inline pastel badge (`Delete? [Confirm] [Cancel]`), preventing accidental triggers.
- **Cascade Cleanup**:
  - Deletes all associated conversation sub-threads in `db.conversationThreads`.
  - Deletes all associated messages across main and sub-threads in `db.discussionMessages`.
  - Automatically aborts any running orchestrator engine executions and selects the next available discussion or transitions to an empty state.
