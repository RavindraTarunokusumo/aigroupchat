import { db, type StoredApiKey } from './db';
import type { ProviderId } from '../types';

export async function getApiKey(provider: ProviderId): Promise<string | null> {
  const item = await db.apiKeys.get(provider);
  return item?.key?.trim() || null;
}

export async function getAllApiKeys(): Promise<Record<ProviderId, string>> {
  const all = await db.apiKeys.toArray();
  const map: Record<ProviderId, string> = {
    gemini: '',
    openai: '',
    anthropic: '',
    groq: '',
    openrouter: ''
  };
  for (const item of all) {
    if (item.provider) {
      map[item.provider] = item.key;
    }
  }
  return map;
}

export async function saveApiKey(provider: ProviderId, key: string): Promise<void> {
  const trimmed = key.trim();
  const existing = await db.apiKeys.get(provider);
  const data: StoredApiKey = {
    provider,
    key: trimmed,
    isValidated: existing?.isValidated || false,
    lastVerified: Date.now()
  };
  await db.apiKeys.put(data);
}

export async function validateApiKey(provider: ProviderId, key: string): Promise<{ success: boolean; error?: string }> {
  const trimmed = key.trim();
  if (!trimmed) {
    return { success: false, error: 'Key cannot be empty.' };
  }

  try {
    if (provider === 'gemini') {
      // Gemini ping: models.list
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmed}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error?.message || `HTTP ${res.status}` };
      }
      return { success: true };
    }

    if (provider === 'openai') {
      // OpenAI ping: models.list
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${trimmed}` }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error?.message || `HTTP ${res.status}` };
      }
      return { success: true };
    }

    if (provider === 'groq') {
      // Groq ping: models.list
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${trimmed}` }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error?.message || `HTTP ${res.status}` };
      }
      return { success: true };
    }

    if (provider === 'openrouter') {
      // OpenRouter auth check
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${trimmed}` }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error?.message || `HTTP ${res.status}` };
      }
      return { success: true };
    }

    if (provider === 'anthropic') {
      // Note: Anthropic restricts browser CORS without specific proxy or headers.
      // Standard key syntax check:
      if (!trimmed.startsWith('sk-ant-')) {
        return { success: false, error: 'Anthropic key typically starts with sk-ant-' };
      }
      return { success: true };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
