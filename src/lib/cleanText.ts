/**
 * Cleans unwanted model prefixes such as "[The Skeptic]:", "[The Creative]:",
 * "**[The Moderator]**:", "The Skeptic:", etc. from agent outputs.
 */
export function cleanAgentResponseText(text: string, agentName?: string): string {
  if (!text) return '';
  let cleaned = text;

  // 1. Strip leading bracketed tags like [The Skeptic]: or [The Creative]: or [The Skeptic] \n
  // Do NOT strip structural tags like [ATTACHMENT:], [ACTION:], [MENTION:], [WAKE:]
  cleaned = cleaned.replace(/^\s*\[(?!(?:ATTACHMENT|ACTION|MENTION|WAKE|END_ATTACHMENT|\/ATTACHMENT|SUB-THREAD|SYNTHESIS)\b)[^\]\n]+\](?:\s*:\s*|\s*[-–—]\s*|\s*\n|\s+)/i, '');

  // 2. Strip leading bolded bracketed tags like **[The Skeptic]**: or **[The Creative]**:
  cleaned = cleaned.replace(/^\s*\*\*\[[^\]\n]+\]\*\*(?:\s*:\s*|\s*[-–—]\s*|\s*\n|\s+)/i, '');

  // 3. Strip leading bolded names like **The Skeptic**: or **The Moderator**:
  cleaned = cleaned.replace(/^\s*\*\*[\w\s.'"-]+\*\*(?:\s*:\s*|\s*[-–—]\s*|\s*\n|\s+)/i, '');

  // 4. If agent name provided, strip literal Name: or The Name:
  if (agentName) {
    const escaped = agentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(
      new RegExp(`^\\s*(?:\\[?${escaped}\\]?|\\*\\*${escaped}\\*\\*)(?:\\s*:\\s*|\\s*[-–—]\\s*|\\s*\\n|\\s+)`, 'i'),
      ''
    );

    // Also strip without "The " if name starts with "The "
    const simple = agentName.replace(/^the\s+/i, '');
    if (simple !== agentName) {
      const escapedSimple = simple.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(
        new RegExp(`^\\s*(?:\\[?${escapedSimple}\\]?|\\*\\*${escapedSimple}\\*\\*)(?:\\s*:\\s*|\\s*[-–—]\\s*|\\s*\\n|\\s+)`, 'i'),
        ''
      );
    }
  }

  // 5. Strip generic role prefixes like "Agent:", "Assistant:", "Model:"
  cleaned = cleaned.replace(/^\s*(?:Agent|Assistant|Model)\s*:\s*/i, '');

  return cleaned.trimStart();
}

