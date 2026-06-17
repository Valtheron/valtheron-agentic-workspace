// Autonomous web-browsing agent loop (ReAct-style) — "#3 part 2".
//
// An agent LLM is given the browser as tools and decides itself what to do:
// navigate → read the page snapshot → navigate again → … → finish. We use a
// JSON-action ReAct loop (not native tool-calling) so it works with the
// existing text-only callLLM across all providers.
//
// Everything external is injected (llm, tools, url guard, kill-switch check)
// so the loop logic is fully unit-testable with a stubbed LLM — no network,
// no real LLM, no fabricated responses in the product path. The live run
// simply needs a funded LLM key, wired in routes/browse.ts.

export type LLMComplete = (systemPrompt: string, userMessage: string) => Promise<string>;

export interface BrowseTools {
  /** Navigate to a URL and return the page snapshot/text. */
  navigate(url: string): Promise<string>;
}

export interface BrowseAgentDeps {
  llm: LLMComplete;
  tools: BrowseTools;
  /** Throws (BrowseError) when the URL is not safe to fetch (SSRF guard). */
  assertUrlSafe: (url: string) => Promise<void>;
  /** True while the kill switch is active — the loop stops immediately. */
  isKillSwitchActive: () => boolean;
}

export interface BrowseStep {
  thought?: string;
  tool: 'navigate' | 'invalid' | 'unknown';
  arg?: string;
  observation: string;
}

export type StoppedReason = 'done' | 'max_steps' | 'kill_switch';

export interface BrowseAgentResult {
  answer: string;
  steps: BrowseStep[];
  stoppedReason: StoppedReason;
}

export class BrowseAgentError extends Error {}

export const DEFAULT_MAX_STEPS = 8;
const OBS_LIMIT = 4000;

const SYSTEM_PROMPT = `Du bist ein autonomer Web-Recherche-Agent. Du löst die Aufgabe, indem du echte Webseiten besuchst und liest.

Antworte bei JEDEM Schritt AUSSCHLIESSLICH mit einem einzigen JSON-Objekt, ohne weiteren Text, in einem dieser zwei Formate:
{"thought":"kurz, was du tust und warum","action":{"tool":"navigate","url":"https://…"}}
{"thought":"kurz","action":{"tool":"finish","answer":"deine finale, belegte Antwort"}}

Regeln:
- Nutze nur öffentliche http/https-URLs. Keine lokalen/privaten Adressen.
- Lies die Beobachtung (Seiten-Snapshot) nach jedem navigate und entscheide den nächsten Schritt.
- Wenn du genug Information hast, beende mit "finish" und einer konkreten Antwort.`;

interface ParsedAction {
  thought?: string;
  tool: string;
  url?: string;
  answer?: string;
}

/** Extract and parse the first JSON object from an LLM reply. */
export function parseAction(raw: string): ParsedAction | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  const o = obj as { thought?: unknown; action?: { tool?: unknown; url?: unknown; answer?: unknown } };
  const action = o.action;
  if (!action || typeof action.tool !== 'string') return null;
  return {
    thought: typeof o.thought === 'string' ? o.thought : undefined,
    tool: action.tool,
    url: typeof action.url === 'string' ? action.url : undefined,
    answer: typeof action.answer === 'string' ? action.answer : undefined,
  };
}

/**
 * Run the autonomous browse loop. Pure orchestration — all I/O is injected.
 */
export async function runBrowseAgent(
  task: string,
  startUrl: string | undefined,
  deps: BrowseAgentDeps,
  maxSteps: number = DEFAULT_MAX_STEPS,
): Promise<BrowseAgentResult> {
  if (!task.trim()) throw new BrowseAgentError('Aufgabe (task) erforderlich.');

  const steps: BrowseStep[] = [];
  let context = `Aufgabe: ${task}\n` + (startUrl ? `Start-URL-Vorschlag: ${startUrl}\n` : '');

  for (let i = 0; i < maxSteps; i++) {
    if (deps.isKillSwitchActive()) return { answer: '', steps, stoppedReason: 'kill_switch' };

    const raw = await deps.llm(SYSTEM_PROMPT, `${context}\nNächste Aktion? Antworte NUR mit JSON.`);
    const action = parseAction(raw);

    if (!action) {
      steps.push({ tool: 'invalid', observation: 'Antwort war kein gültiges JSON-Aktionsobjekt.' });
      context += '\nFehler: Deine letzte Antwort war kein gültiges JSON. Antworte nur mit dem JSON-Objekt.';
      continue;
    }
    if (action.tool === 'finish') {
      return { answer: action.answer ?? '', steps, stoppedReason: 'done' };
    }
    if (action.tool === 'navigate') {
      const url = action.url ?? '';
      let observation: string;
      try {
        await deps.assertUrlSafe(url);
        observation = (await deps.tools.navigate(url)).slice(0, OBS_LIMIT);
      } catch (e) {
        observation = `Fehler: ${e instanceof Error ? e.message : String(e)}`;
      }
      steps.push({ thought: action.thought, tool: 'navigate', arg: url, observation });
      context += `\n[navigate ${url}] Beobachtung:\n${observation}\n`;
      continue;
    }
    steps.push({
      thought: action.thought,
      tool: 'unknown',
      arg: action.tool,
      observation: `Unbekanntes Tool "${action.tool}".`,
    });
    context += `\nFehler: unbekanntes Tool "${action.tool}". Nutze "navigate" oder "finish".`;
  }

  // Step budget exhausted → ask once for a best-effort final answer.
  if (deps.isKillSwitchActive()) return { answer: '', steps, stoppedReason: 'kill_switch' };
  const finalRaw = await deps.llm(
    SYSTEM_PROMPT,
    `${context}\nMax. Schritte erreicht. Gib jetzt deine beste Antwort als {"action":{"tool":"finish","answer":"…"}}.`,
  );
  const finalAction = parseAction(finalRaw);
  return { answer: finalAction?.answer ?? '', steps, stoppedReason: 'max_steps' };
}
