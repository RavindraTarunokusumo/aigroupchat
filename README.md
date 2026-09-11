# AI Group Chat (BYOK)

> **Bring-Your-Own-Key (BYOK) multi-agent playground to host, direct, and observe AI agents collaborating, debating, and problem-solving in real-time.**

---

## 🌟 Highlights

- **100% Client-Side BYOK Privacy**: Your API keys and private discussions never leave your browser. All state is stored locally in `IndexedDB`.
- **Multi-Provider Support**: Connect directly with:
  - **Google Gemini** (Gemini 2.5 Flash, 2.0 Flash, 1.5 Pro)
  - **OpenAI** (GPT-4o, GPT-4o-mini, o3-mini)
  - **Anthropic Claude** (Claude 3.5 Sonnet, 3.5 Haiku via direct browser header)
  - **Groq** (Llama 3.3 70B, Mixtral - sub-second token streaming)
  - **OpenRouter** (Universal gateway to 100+ open and proprietary models)
- **Built-in Agent Personas**:
  - 🧠 **The Logician**: Analytical, structural, and architectural precision.
  - 🎨 **The Creative**: Visionary, imaginative, and lateral brainstorming.
  - 🧐 **The Skeptic**: Constructive risk auditor and devil's advocate.
  - 🎙️ **The Moderator**: Synthesizer, discussion guide, and facilitator.
  - ⚡ **The Comedian**: Witty, energetic, and engaging humor.
- **Custom Agent Builder**: Easily craft bespoke agents with custom avatars, colors, system prompts, temperatures, and model assignments.
- **Dynamic Interaction Modes**:
  - **Round-Table**: All active agents contribute in turn.
  - **Direct Mention**: Use `@AgentName` to trigger specific agents.
  - **Moderated**: The moderator facilitates the discussion and passes the floor.
- **Modern Web Standards**:
  - IME-safe Enter-to-submit (supporting Japanese/Chinese/Korean composition without premature dispatch).
  - Native `<dialog closedby="any">` modals with light-dismiss fallbacks.
  - Instant Markdown rendering, code highlighting, and one-click chat export.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Node 20+
- npm

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd aigroupchat

# Install dependencies and git hooks
npm install

# Start development server
npm run dev
```

### Production Build & Lint
```bash
# Run linter
npm run lint

# Compile and package for production
npm run build

# Preview build locally
npm run preview
```

---

## 📚 Documentation
- [`docs/architecture.md`](./docs/architecture.md): System design, streaming adapter pattern, and security model.
- [`docs/database.md`](./docs/database.md): IndexedDB schema and local persistence.
- [`docs/ui-ux.md`](./docs/ui-ux.md): UI/UX design profile, color system, and interaction guidelines.
- [`AGENTS.md`](./AGENTS.md): Repository governance rules and workflow policies.

---

## 🕸️ Code Knowledge Graph (Graphify)
The codebase is automatically indexed with **Graphify**. Git hooks are installed to rebuild the code graph after commits:
```bash
# Query the graph
graphify query "How does the orchestrator dispatch turns?"

# Rebuild code graph
graphify update .
```
