/**
 * Strips all thinking / reasoning blocks (<think>...</think>, <thought>...</thought>, <thinking>...</thinking>)
 * from a complete text string, including unclosed tags.
 */
export function stripThinkingTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think(?:\s[^>]*)?>[\s\S]*?(?:<\/think>|$)/gi, '')
    .replace(/<thought(?:\s[^>]*)?>[\s\S]*?(?:<\/thought>|$)/gi, '')
    .replace(/<thinking(?:\s[^>]*)?>[\s\S]*?(?:<\/thinking>|$)/gi, '')
    .trim();
}

/**
 * Creates a streaming filter that suppresses thinking / reasoning tokens
 * (<think>...</think>, <thought>...</thought>, <thinking>...</thinking>)
 * in real-time so that only the final assistant output is streamed to the UI.
 */
export function createThinkingFilter(onChunk: (delta: string) => void) {
  let inThinking = false;
  let buffer = '';

  return {
    push(chunk: string) {
      buffer += chunk;

      while (buffer.length > 0) {
        if (!inThinking) {
          // Look for opening thinking tag: <think>, <thought>, <thinking>
          const thinkMatch = buffer.match(/<(think|thought|thinking)(?:>|\s[^>]*>)/i);
          if (thinkMatch && thinkMatch.index !== undefined) {
            // Text before the opening tag is assistant output
            const beforeTag = buffer.slice(0, thinkMatch.index);
            if (beforeTag) {
              onChunk(beforeTag);
            }
            inThinking = true;
            buffer = buffer.slice(thinkMatch.index + thinkMatch[0].length);
          } else {
            // Check if buffer ends with a potential opening tag prefix (e.g. "<", "<th", "<think")
            const partialMatch = buffer.match(/<(?:\/?)(?:t(?:h(?:i(?:n(?:k(?:i(?:n(?:g)?)?)?)?)?)?|o(?:u(?:g(?:h(?:t)?)?)?)?)?)?$/i);
            if (partialMatch && partialMatch.index !== undefined && partialMatch.index > 0) {
              const safePrefix = buffer.slice(0, partialMatch.index);
              onChunk(safePrefix);
              buffer = buffer.slice(partialMatch.index);
              break;
            } else if (partialMatch && partialMatch.index === 0) {
              // Wait for next chunk to determine if it's a think tag
              break;
            } else {
              // No tag and no partial tag prefix
              onChunk(buffer);
              buffer = '';
            }
          }
        } else {
          // We are inside thinking block; look for closing tag </think>, </thought>, </thinking>
          const closeMatch = buffer.match(/<\/(think|thought|thinking)>/i);
          if (closeMatch && closeMatch.index !== undefined) {
            inThinking = false;
            buffer = buffer.slice(closeMatch.index + closeMatch[0].length);
          } else {
            // Still inside thinking block; discard everything except possible partial closing tag at the end
            // Keep at most 15 chars in case </thinking> is split across chunks
            if (buffer.length > 15) {
              buffer = buffer.slice(-15);
            }
            break;
          }
        }
      }
    },
    flush() {
      if (!inThinking && buffer.length > 0) {
        onChunk(buffer);
        buffer = '';
      }
    }
  };
}

/**
 * Cleans unwanted model prefixes such as "[The Skeptic]:", "[The Creative]:",
 * "**[The Moderator]**:", "The Skeptic:", etc. from agent outputs.
 */
export function cleanAgentResponseText(text: string, agentName?: string): string {
  if (!text) return '';
  let cleaned = stripThinkingTags(text);

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
