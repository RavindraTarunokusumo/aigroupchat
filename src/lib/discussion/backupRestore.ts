import { db, ensureDatabaseHealth } from '../db';
import type { DiscussionThread, ConversationThread, DiscussionMessage, Agent } from '../../types';

export interface DiscussionBackupArchive {
  version: 1;
  exportedAt: string;
  data: {
    discussions: DiscussionThread[];
    conversationThreads: ConversationThread[];
    discussionMessages: DiscussionMessage[];
    customAgents: Agent[];
  };
}

export interface ArchiveValidationSummary {
  discussionsCount: number;
  threadsCount: number;
  messagesCount: number;
  agentsCount: number;
}

export interface ArchiveValidationResult {
  isValid: boolean;
  summary?: ArchiveValidationSummary;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  importedCounts: {
    discussions: number;
    threads: number;
    messages: number;
    agents: number;
  };
  error?: string;
}

export interface DatabaseArchiveStats {
  discussionsCount: number;
  threadsCount: number;
  messagesCount: number;
  customAgentsCount: number;
}

/**
 * Fetches current counts of deliberation entities stored in IndexedDB.
 */
export async function getDatabaseArchiveStats(): Promise<DatabaseArchiveStats> {
  const [discussionsCount, threadsCount, messagesCount, allAgents] = await Promise.all([
    db.discussions.count(),
    db.conversationThreads.count(),
    db.discussionMessages.count(),
    db.agents.toArray()
  ]);

  const customAgentsCount = allAgents.filter((a) => Boolean(a.isCustom)).length;

  return {
    discussionsCount,
    threadsCount,
    messagesCount,
    customAgentsCount
  };
}

/**
 * Exports all discussions, conversationThreads, discussionMessages, and custom agents
 * into a versioned JSON archive and triggers a browser download.
 */
export async function exportDatabaseArchive(): Promise<void> {
  const [discussions, conversationThreads, discussionMessages, allAgents] = await Promise.all([
    db.discussions.toArray(),
    db.conversationThreads.toArray(),
    db.discussionMessages.toArray(),
    db.agents.toArray()
  ]);

  const customAgents = allAgents.filter((a) => Boolean(a.isCustom));

  const archive: DiscussionBackupArchive = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      discussions,
      conversationThreads,
      discussionMessages,
      customAgents
    }
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const filename = `aigroupchat-backup-${year}-${month}-${day}.json`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const jsonString = JSON.stringify(archive, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}

/**
 * Validates a JSON backup string ensuring correct structure, version, and array contents.
 */
export function validateArchive(jsonText: string): ArchiveValidationResult {
  if (!jsonText || typeof jsonText !== 'string' || !jsonText.trim()) {
    return { isValid: false, error: 'Empty archive payload' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { isValid: false, error: `Invalid JSON format: ${msg}` };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { isValid: false, error: 'Archive payload must be a JSON object' };
  }

  const record = parsed as Record<string, unknown>;

  if (record.version !== 1) {
    return {
      isValid: false,
      error: `Unsupported or missing archive version (expected 1, received ${String(record.version)})`
    };
  }

  if (!record.data || typeof record.data !== 'object' || Array.isArray(record.data)) {
    return { isValid: false, error: 'Archive is missing required data payload object' };
  }

  const data = record.data as Record<string, unknown>;

  if (!Array.isArray(data.discussions)) {
    return { isValid: false, error: 'Field data.discussions must be an array' };
  }
  if (!Array.isArray(data.conversationThreads)) {
    return { isValid: false, error: 'Field data.conversationThreads must be an array' };
  }
  if (!Array.isArray(data.discussionMessages)) {
    return { isValid: false, error: 'Field data.discussionMessages must be an array' };
  }
  if (data.customAgents !== undefined && !Array.isArray(data.customAgents)) {
    return { isValid: false, error: 'Field data.customAgents must be an array if provided' };
  }

  // Inspect item IDs for primary key integrity
  for (let i = 0; i < data.discussions.length; i++) {
    const item = data.discussions[i];
    if (!item || typeof item !== 'object' || typeof (item as { id?: unknown }).id !== 'string' || !(item as { id: string }).id) {
      return { isValid: false, error: `Invalid discussion at index ${i}: missing required string property 'id'` };
    }
  }

  for (let i = 0; i < data.conversationThreads.length; i++) {
    const item = data.conversationThreads[i];
    if (!item || typeof item !== 'object' || typeof (item as { id?: unknown }).id !== 'string' || !(item as { id: string }).id) {
      return { isValid: false, error: `Invalid conversationThread at index ${i}: missing required string property 'id'` };
    }
  }

  for (let i = 0; i < data.discussionMessages.length; i++) {
    const item = data.discussionMessages[i];
    if (!item || typeof item !== 'object' || typeof (item as { id?: unknown }).id !== 'string' || !(item as { id: string }).id) {
      return { isValid: false, error: `Invalid discussionMessage at index ${i}: missing required string property 'id'` };
    }
  }

  const customAgentsArray = data.customAgents as unknown[] | undefined;
  if (Array.isArray(customAgentsArray)) {
    for (let i = 0; i < customAgentsArray.length; i++) {
      const item = customAgentsArray[i];
      if (!item || typeof item !== 'object' || typeof (item as { id?: unknown }).id !== 'string' || !(item as { id: string }).id) {
        return { isValid: false, error: `Invalid customAgent at index ${i}: missing required string property 'id'` };
      }
    }
  }

  return {
    isValid: true,
    summary: {
      discussionsCount: data.discussions.length,
      threadsCount: data.conversationThreads.length,
      messagesCount: data.discussionMessages.length,
      agentsCount: Array.isArray(customAgentsArray) ? customAgentsArray.length : 0
    }
  };
}

/**
 * Restores a JSON archive into IndexedDB with either 'merge' or 'overwrite' mode.
 * - 'overwrite': Cleans and replaces discussions, conversationThreads, discussionMessages, and custom agents.
 * - 'merge': Performs idempotent bulkPut by primary key.
 */
export async function restoreDatabaseArchive(
  jsonText: string,
  mode: 'merge' | 'overwrite'
): Promise<RestoreResult> {
  const validation = validateArchive(jsonText);
  if (!validation.isValid || !validation.summary) {
    return {
      success: false,
      importedCounts: { discussions: 0, threads: 0, messages: 0, agents: 0 },
      error: validation.error || 'Archive validation failed'
    };
  }

  try {
    const parsed = JSON.parse(jsonText) as DiscussionBackupArchive;
    const discussions: DiscussionThread[] = parsed.data.discussions || [];
    const conversationThreads: ConversationThread[] = parsed.data.conversationThreads || [];
    const discussionMessages: DiscussionMessage[] = parsed.data.discussionMessages || [];
    const customAgents: Agent[] = Array.isArray(parsed.data.customAgents)
      ? parsed.data.customAgents.map((a) => ({ ...a, isCustom: true }))
      : [];

    await db.transaction(
      'rw',
      [db.discussions, db.conversationThreads, db.discussionMessages, db.agents],
      async () => {
        if (mode === 'overwrite') {
          // Clear discussion-related tables cleanly
          await db.discussions.clear();
          await db.conversationThreads.clear();
          await db.discussionMessages.clear();

          // Clear custom agents while preserving default frontier personas
          const existingAgents = await db.agents.toArray();
          const customAgentIds = existingAgents
            .filter((a) => Boolean(a.isCustom))
            .map((a) => a.id);
          if (customAgentIds.length > 0) {
            await db.agents.bulkDelete(customAgentIds);
          }
        }

        // Idempotent bulkPut by primary key
        if (discussions.length > 0) {
          await db.discussions.bulkPut(discussions);
        }
        if (conversationThreads.length > 0) {
          await db.conversationThreads.bulkPut(conversationThreads);
        }
        if (discussionMessages.length > 0) {
          await db.discussionMessages.bulkPut(discussionMessages);
        }
        if (customAgents.length > 0) {
          await db.agents.bulkPut(customAgents);
        }
      }
    );

    // Re-verify database integrity to guarantee frontier agents remain seeded
    await ensureDatabaseHealth();

    return {
      success: true,
      importedCounts: {
        discussions: discussions.length,
        threads: conversationThreads.length,
        messages: discussionMessages.length,
        agents: customAgents.length
      }
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      importedCounts: { discussions: 0, threads: 0, messages: 0, agents: 0 },
      error: `Restore operation failed: ${msg}`
    };
  }
}
