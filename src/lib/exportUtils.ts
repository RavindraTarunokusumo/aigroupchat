import type { TaskBoard, BoardPost, Agent } from '../types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Message Board as formatted Markdown (.md)
 */
export function exportBoardAsMarkdown(
  board: TaskBoard,
  posts: BoardPost[],
  agents: Agent[]
): void {
  const agentMap = new Map(agents.map((a) => [a.id, a.name]));

  let md = `# Message Board Report: ${board.title}\n\n`;
  md += `**Status:** ${board.status.toUpperCase()} | **Generated:** ${new Date().toLocaleString()}\n`;
  md += `**Elapsed:** ${Math.floor((board.elapsedSeconds || 0) / 60)}m ${((board.elapsedSeconds || 0) % 60)}s | **Turns:** ${board.currentTurn}/${board.turnLimit} | **Tokens:** ${(board.usedTokens || 0).toLocaleString()}/${board.tokenBudget.toLocaleString()}\n\n`;
  md += `## 🎯 Shared Task Objective\n> ${board.task}\n\n`;

  if (board.extraInstructions?.length) {
    md += `### 📢 Added Directives & Constraints\n`;
    board.extraInstructions.forEach((ins, i) => {
      const target = ins.targetAgentName ? ` (Target: @${ins.targetAgentName})` : '';
      md += `${i + 1}. ${ins.instruction}${target} *(${new Date(ins.timestamp).toLocaleTimeString()})*\n`;
    });
    md += `\n`;
  }

  md += `## 👥 Participating Agents\n`;
  board.agentIds.forEach((id) => {
    const a = agents.find((ag) => ag.id === id);
    if (a) md += `- **${a.name}** (${a.role}) [${a.provider}/${a.model}]\n`;
  });
  md += `\n---\n\n## 📝 Collaboration Transcript\n\n`;

  posts.forEach((p) => {
    const speaker =
      p.agentId === 'user'
        ? '👤 Human Director'
        : p.agentId === 'system'
        ? '⚙️ System'
        : `🤖 ${agentMap.get(p.agentId) || 'Agent'}`;
    const time = new Date(p.timestamp).toLocaleTimeString();
    const pinBadge = p.isPinned ? ' [📌 PINNED]' : '';
    const bookmarkBadge = p.isBookmarked ? ' [⭐ BOOKMARKED]' : '';
    const voteBadge = (p.upvotes || 0) > 0 ? ` [👍 +${p.upvotes}]` : '';

    md += `### [${p.type.toUpperCase()}] ${p.title || 'Contribution'}${pinBadge}${bookmarkBadge}${voteBadge} — ${speaker} (${time})\n\n`;
    if (p.searchQuery) {
      md += `*Search Query:* \`${p.searchQuery}\`\n\n`;
    }
    md += `${p.content}\n\n`;
    if (p.sources?.length) {
      md += `**Sources:**\n`;
      p.sources.forEach((s) => (md += `- [${s.title}](${s.url || '#'}): ${s.snippet || ''}\n`));
      md += `\n`;
    }
    md += `---\n\n`;
  });

  triggerDownload(
    `board-${board.id}-${Date.now()}.md`,
    md,
    'text/markdown;charset=utf-8'
  );
}

/**
 * Export Message Board as formatted JSON (.json)
 */
export function exportBoardAsJson(
  board: TaskBoard,
  posts: BoardPost[],
  agents: Agent[]
): void {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    board: {
      id: board.id,
      title: board.title,
      task: board.task,
      status: board.status,
      maxDurationMinutes: board.maxDurationMinutes,
      elapsedSeconds: board.elapsedSeconds,
      tokenBudget: board.tokenBudget,
      usedTokens: board.usedTokens,
      turnLimit: board.turnLimit,
      currentTurn: board.currentTurn,
      extraInstructions: board.extraInstructions || [],
      participatingAgents: agents
        .filter((a) => board.agentIds.includes(a.id))
        .map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          provider: a.provider,
          model: a.model,
          avatar: a.avatar,
          color: a.color
        }))
    },
    posts: posts.map((p) => ({
      id: p.id,
      agentId: p.agentId,
      type: p.type,
      title: p.title,
      content: p.content,
      searchQuery: p.searchQuery,
      sources: p.sources,
      tokensUsed: p.tokensUsed,
      timestamp: p.timestamp,
      formattedTime: new Date(p.timestamp).toISOString(),
      isPinned: !!p.isPinned,
      isBookmarked: !!p.isBookmarked,
      upvotes: p.upvotes || 0
    }))
  };

  triggerDownload(
    `board-${board.id}-${Date.now()}.json`,
    JSON.stringify(exportData, null, 2),
    'application/json;charset=utf-8'
  );
}

/**
 * Export Message Board as a self-contained standalone HTML report (.html)
 * Embedded styling, zero external CDNs, dark/light print mode, offline search & category filter
 */
export function exportBoardAsHtml(
  board: TaskBoard,
  posts: BoardPost[],
  agents: Agent[]
): void {
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  const postsHtml = posts
    .map((p) => {
      const isUser = p.agentId === 'user';
      const isSystem = p.agentId === 'system';
      const agent = !isUser && !isSystem ? agentMap.get(p.agentId) : null;
      const speakerName = isUser
        ? 'Human Director'
        : isSystem
        ? 'System Synthesizer'
        : agent?.name || 'Agent';
      const speakerRole = isUser
        ? 'Injected Live Directive'
        : isSystem
        ? 'Autonomous Coordinator'
        : agent?.role || 'Contributor';
      const avatar = isUser ? '👤' : isSystem ? '⚙️' : agent?.avatar || '🤖';
      const timeStr = new Date(p.timestamp).toLocaleTimeString();

      const sourcesHtml =
        p.sources && p.sources.length > 0
          ? `<div class="sources-box">
              <div class="sources-title">Cited Findings &amp; Sources (${p.sources.length}):</div>
              <ul>
                ${p.sources
                  .map(
                    (s) =>
                      `<li><strong>${escapeHtml(s.title)}</strong>${
                        s.snippet ? ` &mdash; <span>${escapeHtml(s.snippet)}</span>` : ''
                      }</li>`
                  )
                  .join('')}
              </ul>
            </div>`
          : '';

      const searchHtml = p.searchQuery
        ? `<div class="search-box">
            <span class="search-tag">Executed Search</span>
            <code>${escapeHtml(p.searchQuery)}</code>
          </div>`
        : '';

      const badgesHtml = `
        ${p.isPinned ? '<span class="badge badge-pinned">📌 Pinned</span>' : ''}
        ${p.isBookmarked ? '<span class="badge badge-bookmark">⭐ Bookmarked</span>' : ''}
        ${(p.upvotes || 0) > 0 ? `<span class="badge badge-vote">👍 +${p.upvotes}</span>` : ''}
      `;

      return `
        <article class="post-card post-${p.type}" data-type="${p.type}" data-agent="${escapeHtml(p.agentId)}">
          <header class="post-header">
            <div class="author-info">
              <span class="avatar">${avatar}</span>
              <div>
                <div class="author-name">${escapeHtml(speakerName)} <span class="type-pill pill-${p.type}">${escapeHtml(p.type.toUpperCase())}</span> ${badgesHtml}</div>
                <div class="author-role">${escapeHtml(speakerRole)}</div>
              </div>
            </div>
            <time class="post-time">${timeStr}</time>
          </header>
          ${p.title ? `<h3 class="post-title">${escapeHtml(p.title)}</h3>` : ''}
          ${searchHtml}
          <div class="post-content">${escapeHtml(p.content).replace(/\n/g, '<br/>')}</div>
          ${sourcesHtml}
        </article>
      `;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(board.title)} - Multi-Agent Board Report</title>
  <style>
    :root {
      --bg: #0b0f19;
      --surface: #111827;
      --surface-border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #06b6d4;
      --accent: #6366f1;
      --font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font);
      line-height: 1.5;
      padding: 24px;
    }
    .container { max-width: 900px; margin: 0 auto; }
    header.report-header {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    h1 { font-size: 1.5rem; color: #fff; margin-bottom: 8px; }
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    .task-box {
      background: rgba(6, 182, 212, 0.08);
      border: 1px solid rgba(6, 182, 212, 0.25);
      border-radius: 12px;
      padding: 14px;
      font-size: 0.9rem;
      color: #e0f2fe;
    }
    .task-label { font-weight: 700; color: #38bdf8; margin-bottom: 4px; }
    .filter-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      align-items: center;
    }
    .filter-btn {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .filter-btn:hover, .filter-btn.active {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }
    .search-input {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      color: #fff;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      flex: 1;
      min-width: 180px;
    }
    .post-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 16px;
      transition: transform 0.1s;
    }
    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 10px;
    }
    .author-info { display: flex; gap: 12px; align-items: center; }
    .avatar { font-size: 1.5rem; }
    .author-name { font-size: 0.9rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .author-role { font-size: 0.75rem; color: var(--text-muted); }
    .post-time { font-size: 0.75rem; color: var(--text-muted); font-family: monospace; }
    .type-pill {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      letter-spacing: 0.5px;
    }
    .pill-finding { background: rgba(6, 182, 212, 0.2); color: #22d3ee; }
    .pill-thought { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
    .pill-critique { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .pill-solution { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .pill-synthesis { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
    .pill-instruction { background: rgba(14, 165, 233, 0.2); color: #38bdf8; }
    .badge { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; }
    .badge-pinned { background: rgba(234, 179, 8, 0.2); color: #facc15; }
    .badge-bookmark { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; }
    .badge-vote { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
    .post-title { font-size: 1rem; font-weight: 700; color: #e2e8f0; margin-bottom: 8px; }
    .post-content { font-size: 0.85rem; color: #cbd5e1; line-height: 1.6; word-break: break-word; }
    .search-box {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(6, 182, 212, 0.3);
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      margin-bottom: 10px;
    }
    .search-tag { font-size: 0.7rem; color: #22d3ee; display: block; font-weight: 600; text-transform: uppercase; }
    .sources-box {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .sources-box ul { padding-left: 18px; margin-top: 4px; }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .filter-bar { display: none; }
      .post-card { border: 1px solid #ddd; background: #fff; color: #000; break-inside: avoid; }
      .author-name, .post-title { color: #000; }
      .task-box { background: #f0fdf4; border: 1px solid #86efac; color: #000; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="report-header">
      <h1>${escapeHtml(board.title)}</h1>
      <div class="meta-bar">
        <span>Status: <strong>${board.status.toUpperCase()}</strong></span>
        <span>Turns: <strong>${board.currentTurn} / ${board.turnLimit}</strong></span>
        <span>Tokens Used: <strong>${(board.usedTokens || 0).toLocaleString()}</strong></span>
        <span>Duration: <strong>${Math.floor((board.elapsedSeconds || 0) / 60)}m ${(board.elapsedSeconds || 0) % 60}s</strong></span>
        <span>Exported: <strong>${new Date().toLocaleString()}</strong></span>
      </div>
      <div class="task-box">
        <div class="task-label">🎯 Shared Task Objective</div>
        <div>${escapeHtml(board.task)}</div>
      </div>
    </header>

    <div class="filter-bar">
      <button class="filter-btn active" onclick="filterPosts('all', this)">All</button>
      <button class="filter-btn" onclick="filterPosts('solution', this)">Solutions</button>
      <button class="filter-btn" onclick="filterPosts('finding', this)">Findings</button>
      <button class="filter-btn" onclick="filterPosts('critique', this)">Critiques</button>
      <button class="filter-btn" onclick="filterPosts('thought', this)">Thoughts</button>
      <button class="filter-btn" onclick="filterPosts('instruction', this)">Directives</button>
      <input type="text" class="search-input" id="searchInput" placeholder="Search transcript..." oninput="handleSearch(this.value)">
    </div>

    <main id="postsContainer">
      ${postsHtml}
    </main>
  </div>

  <script>
    let activeType = 'all';
    let searchQuery = '';

    function filterPosts(type, btn) {
      activeType = type;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      applyFilters();
    }

    function handleSearch(val) {
      searchQuery = val.toLowerCase().trim();
      applyFilters();
    }

    function applyFilters() {
      const cards = document.querySelectorAll('.post-card');
      cards.forEach(card => {
        const matchesType = activeType === 'all' || card.getAttribute('data-type') === activeType;
        const text = card.textContent.toLowerCase();
        const matchesSearch = !searchQuery || text.includes(searchQuery);
        card.style.display = matchesType && matchesSearch ? 'block' : 'none';
      });
    }
  </script>
</body>
</html>`;

  triggerDownload(
    `board-${board.id}-${Date.now()}.html`,
    html,
    'text/html;charset=utf-8'
  );
}
