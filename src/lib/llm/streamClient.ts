import type { ProviderId } from '../../types';

export interface ChatMessageParam {
  role: 'user' | 'assistant' | 'system';
  name?: string;
  content: string;
}

export interface StreamOptions {
  provider: ProviderId;
  model: string;
  apiKey: string;
  systemPrompt: string;
  messages: ChatMessageParam[];
  temperature?: number;
  signal?: AbortSignal;
  onChunk: (delta: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (err: Error) => void;
}

export async function streamCompletion(options: StreamOptions): Promise<string> {
  const {
    provider,
    model,
    apiKey,
    systemPrompt,
    messages,
    temperature = 0.7,
    signal,
    onChunk,
    onComplete,
    onError
  } = options;

  let fullResponse = '';

  try {
    if (provider === 'gemini') {
      await streamGemini();
    } else if (provider === 'anthropic') {
      await streamAnthropic();
    } else {
      // openai, groq, openrouter (OpenAI-compatible)
      await streamOpenAICompatible();
    }

    onComplete?.(fullResponse);
    return fullResponse;
  } catch (err: unknown) {
    if (signal?.aborted) {
      // Graceful cancellation
      onComplete?.(fullResponse);
      return fullResponse;
    }
    const errorObj = err instanceof Error ? err : new Error(String(err));
    onError?.(errorObj);
    throw errorObj;
  }

  // --- GEMINI SSE IMPLEMENTATION ---
  async function streamGemini() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

    // Convert messages to Gemini format
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.name ? `${m.name}: ${m.content}` : m.content }]
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature
      }
    };

    if (systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: systemPrompt }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Gemini API error: HTTP ${response.status}`);
    }

    if (!response.body) throw new Error('Response body is null');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.substring(6).trim();
          if (!jsonStr) continue;
          try {
            const data = JSON.parse(jsonStr);
            const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) {
              fullResponse += textChunk;
              onChunk(textChunk);
            }
          } catch {
            // Partial JSON or heartbeat
          }
        }
      }
    }
  }

  // --- OPENAI / GROQ / OPENROUTER (OpenAI-compatible) ---
  async function streamOpenAICompatible() {
    let endpoint = 'https://api.openai.com/v1/chat/completions';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    };

    if (provider === 'groq') {
      endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    } else if (provider === 'openrouter') {
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      headers['HTTP-Referer'] = window.location.origin || 'https://aigroupchat.local';
      headers['X-Title'] = 'AI Group Chat BYOK';
    }

    const formattedMessages: { role: string; content: string; name?: string }[] = [];

    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const m of messages) {
      const msgObj: { role: string; content: string; name?: string } = {
        role: m.role,
        content: m.content
      };
      if (m.name) {
        msgObj.name = m.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
      }
      formattedMessages.push(msgObj);
    }

    let targetModel = model;
    let response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages: formattedMessages,
        temperature,
        stream: true
      }),
      signal
    });

    // Automatic fallback from :free to paid model if free tier is unavailable/rate-limited
    if (!response.ok && provider === 'openrouter' && targetModel.endsWith(':free')) {
      const fallbackModel = targetModel.replace(/:free$/, '');
      console.warn(`[OpenRouter] Model '${targetModel}' returned HTTP ${response.status}. Automatically retrying with paid version '${fallbackModel}'...`);
      targetModel = fallbackModel;
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: targetModel,
          messages: formattedMessages,
          temperature,
          stream: true
        }),
        signal
      });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `${provider.toUpperCase()} API error: HTTP ${response.status}`);
    }

    if (!response.body) throw new Error('Response body is null');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const payload = trimmed.substring(6).trim();
          if (payload === '[DONE]') break;
          try {
            const data = JSON.parse(payload);
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              fullResponse += delta;
              onChunk(delta);
            }
          } catch {
            // Partial chunk
          }
        }
      }
    }
  }

  // --- ANTHROPIC CLAUDE DIRECT STREAM ---
  async function streamAnthropic() {
    const endpoint = 'https://api.anthropic.com/v1/messages';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    };

    const formattedMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.name ? `${m.name}: ${m.content}` : m.content
      }));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        system: systemPrompt,
        max_tokens: 4096,
        temperature,
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Anthropic API error: HTTP ${response.status}`);
    }

    if (!response.body) throw new Error('Response body is null');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const payload = trimmed.substring(6).trim();
          try {
            const data = JSON.parse(payload);
            if (data.type === 'content_block_delta' && data.delta?.text) {
              fullResponse += data.delta.text;
              onChunk(data.delta.text);
            }
          } catch {
            // Ignore parse errors on SSE events
          }
        }
      }
    }
  }
}
