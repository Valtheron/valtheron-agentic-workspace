import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/schema.js';
import { assertSafeUrl, BrowseError } from '../services/urlGuard.js';
import { mcpBrowse } from '../services/browserMcp.js';
import { callLLM } from '../services/llmClient.js';
import { runBrowseAgent, BrowseAgentError } from '../services/browseAgent.js';

const router = Router();

function killSwitchActive(): boolean {
  const ks = getDb().prepare('SELECT aktiv FROM kill_switch WHERE id = 1').get() as { aktiv: number } | undefined;
  return !!ks?.aktiv;
}

function audit(action: string, details: string, riskLevel: 'low' | 'medium' | 'high' | 'critical'): void {
  getDb()
    .prepare('INSERT INTO audit_log (id, agentId, action, details, timestamp, riskLevel) VALUES (?, ?, ?, ?, ?, ?)')
    .run(uuid(), 'system', action, details, new Date().toISOString(), riskLevel);
}

function allowlist(): string[] {
  return (process.env.BROWSE_ALLOWLIST || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// POST /api/browse — fetch a web page via the Playwright MCP browser.
// Gated by: feature flag, kill switch, SSRF URL guard, optional domain
// allowlist. Every attempt is written to the audit log.
router.post('/', async (req: Request, res: Response) => {
  if (process.env.BROWSE_ENABLED === 'false') {
    return res.status(403).json({ error: 'Web-Browsing ist deaktiviert (BROWSE_ENABLED=false).' });
  }
  if (killSwitchActive()) {
    audit('browse_blocked', 'Kill-Switch aktiv — Browsing gesperrt', 'high');
    return res.status(423).json({ error: 'Kill-Switch ist aktiv — Browsing ist gesperrt.' });
  }

  const { url } = req.body ?? {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url (string) erforderlich' });
  }

  let safe: URL;
  try {
    safe = await assertSafeUrl(url, { allowlist: allowlist() });
  } catch (e) {
    if (e instanceof BrowseError) {
      audit('browse_blocked', `${url}: ${e.message}`, 'medium');
      return res.status(400).json({ error: e.message });
    }
    throw e;
  }

  try {
    const result = await mcpBrowse(safe.toString());
    audit('browse', `${safe.toString()} → "${result.title}"`, 'low');
    res.json({ url: safe.toString(), title: result.title, content: result.content });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    audit('browse_error', `${safe.toString()}: ${msg}`, 'medium');
    res.status(502).json({ error: `Browse fehlgeschlagen: ${msg}` });
  }
});

// POST /api/browse/agent — autonomous web-research agent. The agent LLM
// decides which pages to visit. LLM credentials come via x-llm-* headers
// (same as chat); without a key the run is rejected (no simulation).
router.post('/agent', async (req: Request, res: Response) => {
  if (process.env.BROWSE_ENABLED === 'false') {
    return res.status(403).json({ error: 'Web-Browsing ist deaktiviert (BROWSE_ENABLED=false).' });
  }
  if (killSwitchActive()) {
    audit('browse_agent_blocked', 'Kill-Switch aktiv', 'high');
    return res.status(423).json({ error: 'Kill-Switch ist aktiv — Browsing ist gesperrt.' });
  }

  const { task, startUrl } = req.body ?? {};
  if (!task || typeof task !== 'string') {
    return res.status(400).json({ error: 'task (string) erforderlich' });
  }

  const apiKey = req.headers['x-llm-api-key'] as string | undefined;
  const provider = (req.headers['x-llm-provider'] as string | undefined) || 'anthropic';
  const model = (req.headers['x-llm-model'] as string | undefined) || 'claude-sonnet-4-5-20250929';
  if (!apiKey) {
    return res.status(400).json({
      error:
        'LLM-API-Key erforderlich: bitte in den LLM-Einstellungen einen Provider mit Key aktivieren. Es wird nichts simuliert.',
    });
  }

  const al = allowlist();
  try {
    const result = await runBrowseAgent(task, typeof startUrl === 'string' ? startUrl : undefined, {
      llm: (systemPrompt, userMessage) =>
        callLLM({
          provider,
          model,
          apiKey,
          systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
          maxTokens: 800,
          temperature: 0,
        }),
      tools: { navigate: async (url) => (await mcpBrowse(url)).content },
      assertUrlSafe: async (url) => {
        await assertSafeUrl(url, { allowlist: al });
      },
      isKillSwitchActive: killSwitchActive,
    });
    audit(
      'browse_agent',
      `task="${task.slice(0, 80)}" steps=${result.steps.length} stopped=${result.stoppedReason}`,
      'low',
    );
    res.json(result);
  } catch (e) {
    if (e instanceof BrowseAgentError) return res.status(400).json({ error: e.message });
    const msg = e instanceof Error ? e.message : String(e);
    audit('browse_agent_error', `${task.slice(0, 80)}: ${msg}`, 'medium');
    res.status(502).json({ error: `Browse-Agent fehlgeschlagen: ${msg}` });
  }
});

export default router;
