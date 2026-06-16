// Server-side browser driven through the Playwright MCP server
// (@playwright/mcp). This is the "#3 Playwright-MCP as a tool" backend: the
// MCP server owns a real headless Chromium and exposes browser_* tools; we
// connect as an MCP client and call them. No LLM is required to call a tool
// directly — an agentic loop (an LLM choosing tools) layers on top of this.
//
// Safety note: callers MUST pass URLs through assertSafeUrl() (urlGuard.ts)
// and check the kill switch BEFORE invoking mcpBrowse().

import { createRequire } from 'node:module';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const require = createRequire(import.meta.url);

let clientPromise: Promise<Client> | null = null;

// The package's `exports` map blocks resolving './cli.js' directly, so locate
// it via the (exported) package.json instead.
function resolveMcpCli(): string {
  const pkgJson = require.resolve('@playwright/mcp/package.json');
  return path.join(path.dirname(pkgJson), 'cli.js');
}

function serverArgs(): string[] {
  const cli = resolveMcpCli();
  const args = [cli, '--headless', '--browser', 'chromium', '--isolated'];
  // Only for environments behind a TLS-intercepting proxy (dev/sandbox).
  // Defaults OFF — never weaken cert checks in production.
  if (process.env.BROWSE_IGNORE_HTTPS_ERRORS === 'true') args.push('--ignore-https-errors');
  return args;
}

async function getClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const transport = new StdioClientTransport({
        command: 'node',
        args: serverArgs(),
        env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers' },
      });
      const client = new Client({ name: 'valtheron-browser', version: '1.0.0' }, { capabilities: {} });
      await client.connect(transport);
      return client;
    })().catch((e) => {
      clientPromise = null; // allow a later retry
      throw e;
    });
  }
  return clientPromise;
}

export interface BrowseResult {
  title: string;
  /** The MCP page snapshot (accessibility tree + text), trimmed. */
  content: string;
}

const MAX_CONTENT = 20_000;

/** Navigate to a (pre-validated) URL and return its title + page snapshot. */
export async function mcpBrowse(url: string): Promise<BrowseResult> {
  const client = await getClient();
  const res = (await client.callTool({ name: 'browser_navigate', arguments: { url } })) as {
    isError?: boolean;
    content?: { type: string; text?: string }[];
  };
  const text = (res.content ?? []).map((c) => c.text ?? '').join('\n');
  if (res.isError) throw new Error(text.replace(/\s+/g, ' ').slice(0, 300) || 'Navigation fehlgeschlagen');
  const title = text.match(/Page Title:\s*(.+)/)?.[1]?.trim() ?? '';
  return { title, content: text.slice(0, MAX_CONTENT) };
}

/** Close the browser/MCP connection (e.g. on shutdown). */
export async function closeBrowser(): Promise<void> {
  if (!clientPromise) return;
  const c = await clientPromise.catch(() => null);
  clientPromise = null;
  if (c) await c.close().catch(() => {});
}
