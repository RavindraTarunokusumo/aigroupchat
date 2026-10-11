import { db } from '../db';

export const DEFAULT_E2B_KEY = 'e2b_cf412980c84001af9e806654bf41984491abb42d';
export const DEFAULT_E2B_RUNTIME = 'python';

export interface SandboxExecutionResult {
  success: boolean;
  stdout: string[];
  stderr: string[];
  exitCode?: number;
  durationMs: number;
  error?: string;
  charts?: string[]; // base64 images if matplotlib or media produced
}

export async function getE2BConfig(): Promise<{ apiKey: string; defaultLanguage: 'python' | 'js' | 'bash' }> {
  try {
    const fromStorage = localStorage.getItem('aigroupchat_e2b_key');
    const langFromStorage = (localStorage.getItem('aigroupchat_e2b_language') as 'python' | 'js' | 'bash') || DEFAULT_E2B_RUNTIME;
    if (fromStorage && fromStorage.trim().length > 0) {
      return { apiKey: fromStorage.trim(), defaultLanguage: langFromStorage };
    }

    const fromDb = await db.apiKeys.get('e2b' as any);
    if (fromDb?.key && fromDb.key.trim().length > 0) {
      return { apiKey: fromDb.key.trim(), defaultLanguage: langFromStorage };
    }
  } catch {
    // fallback if SSR or storage inaccessible
  }

  return {
    apiKey: DEFAULT_E2B_KEY,
    defaultLanguage: DEFAULT_E2B_RUNTIME
  };
}

export async function saveE2BConfig(apiKey: string, defaultLanguage: 'python' | 'js' | 'bash' = 'python'): Promise<void> {
  const trimmed = apiKey.trim();
  try {
    localStorage.setItem('aigroupchat_e2b_key', trimmed);
    localStorage.setItem('aigroupchat_e2b_language', defaultLanguage);

    await db.apiKeys.put({
      provider: 'e2b' as any,
      key: trimmed,
      isValidated: true,
      lastVerified: Date.now()
    });
  } catch (err) {
    console.error('Failed to save E2B config:', err);
  }
}

export async function validateE2BKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return { success: false, error: 'E2B API key cannot be empty.' };
  }

  try {
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const endpoint = isLocalhost ? '/api/e2b/sandboxes' : 'https://api.e2b.dev/sandboxes';

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'X-API-KEY': trimmed
      }
    });

    if (res.ok) {
      return { success: true };
    }

    const errJson = await res.json().catch(() => ({}));
    return { success: false, error: (errJson as any)?.message || `HTTP ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to connect to E2B API' };
  }
}

export async function executeInE2BSandbox(
  code: string,
  language: 'python' | 'js' | 'bash' = 'python',
  overrideApiKey?: string
): Promise<SandboxExecutionResult> {
  const startTime = Date.now();
  const config = await getE2BConfig();
  const apiKey = overrideApiKey?.trim() || config.apiKey;

  if (!apiKey) {
    return {
      success: false,
      stdout: [],
      stderr: ['Error: No E2B API Key configured. Please enter your E2B Key in API Credentials.'],
      durationMs: 0,
      error: 'Missing E2B API Key'
    };
  }

  try {
    // Dynamic import to support both Vite client bundle and Node execution
    const { Sandbox } = await import('@e2b/code-interpreter');
    const sandbox = await Sandbox.create({ apiKey });

    try {
      let stdoutLines: string[] = [];
      let stderrLines: string[] = [];
      const charts: string[] = [];

      if (language === 'python') {
        const execution = await sandbox.runCode(code);
        stdoutLines = (execution.logs?.stdout || []).map((s: string) => s.trimEnd());
        stderrLines = (execution.logs?.stderr || []).map((s: string) => s.trimEnd());
        if ((execution as any).results) {
          for (const res of (execution as any).results) {
            if (res.png) charts.push(`data:image/png;base64,${res.png}`);
            if (res.jpeg) charts.push(`data:image/jpeg;base64,${res.jpeg}`);
          }
        }
      } else {
        const cmdResult = await sandbox.commands.run(code);
        stdoutLines = (cmdResult.stdout || '').split('\n').filter(Boolean);
        stderrLines = (cmdResult.stderr || '').split('\n').filter(Boolean);
      }

      await sandbox.kill();

      return {
        success: stderrLines.length === 0,
        stdout: stdoutLines,
        stderr: stderrLines,
        charts,
        durationMs: Date.now() - startTime
      };
    } catch (execErr: any) {
      await sandbox.kill().catch(() => {});
      return {
        success: false,
        stdout: [],
        stderr: [execErr?.message || String(execErr)],
        durationMs: Date.now() - startTime,
        error: execErr?.message || 'Execution error'
      };
    }
  } catch (initErr: any) {
    return {
      success: false,
      stdout: [],
      stderr: [`Failed to initialize E2B Sandbox: ${initErr?.message || String(initErr)}`],
      durationMs: Date.now() - startTime,
      error: initErr?.message || 'Sandbox initialization failure'
    };
  }
}
