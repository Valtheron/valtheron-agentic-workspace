// Multi-agent collaboration orchestrator.
//
// Until now a collaboration "session" only stored parameters + messages that
// a human typed by hand on behalf of the agents — the agents never actually
// reasoned. This module runs the real thing: the selected agents respond to
// the coordinator's task via real LLM calls, following the chosen delegation
// pattern, and a synthesis is produced per the chosen conflict-resolution.
//
// The LLM call is injected (`LLMFn`) so the orchestration logic is unit-
// testable with a deterministic stub, while production wires it to the real
// callLLM(). There is NO fabricated-response fallback here: if no LLM key is
// configured the caller rejects the run rather than inventing content.

export interface OrchestratorAgent {
  id: string;
  name: string;
  systemPrompt: string;
}

export interface OrchestratorSession {
  task: string; // the coordinator prompt
  delegationStrategy: string;
  conflictResolution: string;
  agents: OrchestratorAgent[];
}

export type CollabMessageType = 'message' | 'system' | 'decision';

export interface OrchestratedMessage {
  senderId: string;
  content: string;
  messageType: CollabMessageType;
}

export interface OrchestrationResult {
  messages: OrchestratedMessage[];
  synthesis: string;
}

/** Injected LLM call: (systemPrompt, userMessage) => assistant text. */
export type LLMFn = (systemPrompt: string, userMessage: string) => Promise<string>;

// Bound fan-out so a single run can't trigger an unbounded number of paid
// LLM calls. Sessions may select more agents; only the first N participate.
export const MAX_PARTICIPANTS = 6;

export class OrchestrationError extends Error {}

function kickoff(session: OrchestratorSession, participants: OrchestratorAgent[]): OrchestratedMessage {
  return {
    senderId: 'coordinator',
    messageType: 'system',
    content:
      `Aufgabe: ${session.task}\n` +
      `Strategie: ${session.delegationStrategy} · Konfliktlösung: ${session.conflictResolution}\n` +
      `Teilnehmer: ${participants.map((a) => a.name).join(', ')}`,
  };
}

/**
 * Run a collaboration session to completion. Pure orchestration — all I/O is
 * the injected `llmFn`. Throws OrchestrationError on invalid input.
 */
export async function orchestrate(session: OrchestratorSession, llmFn: LLMFn): Promise<OrchestrationResult> {
  if (!session.task.trim()) {
    throw new OrchestrationError('Koordinator-Prompt (Aufgabe) erforderlich.');
  }
  const participants = session.agents.slice(0, MAX_PARTICIPANTS);
  if (participants.length < 2) {
    throw new OrchestrationError('Mindestens zwei Agenten erforderlich.');
  }

  const messages: OrchestratedMessage[] = [kickoff(session, participants)];
  const contributions: { agent: OrchestratorAgent; content: string }[] = [];

  if (session.delegationStrategy === 'round-robin') {
    // Sequential delegation: each agent builds on the running transcript.
    let transcript = '';
    for (const agent of participants) {
      const userMessage =
        `Aufgabe des Koordinators:\n${session.task}\n\n` +
        (transcript ? `Bisherige Beiträge:\n${transcript}\n\n` : '') +
        'Trage deinen fachlichen Beitrag bei. Baue auf den bisherigen Beiträgen auf, wiederhole sie nicht.';
      const content = await llmFn(agent.systemPrompt, userMessage);
      contributions.push({ agent, content });
      messages.push({ senderId: agent.id, content, messageType: 'message' });
      transcript += `[${agent.name}]: ${content}\n`;
    }
  } else if (session.delegationStrategy === 'priority') {
    // Hierarchical: first agent coordinates (plans), the rest execute.
    const [coordinator, ...workers] = participants;
    const plan = await llmFn(
      coordinator.systemPrompt,
      `Du bist Koordinator. Zerlege die folgende Aufgabe in klare Teilaufgaben für: ` +
        `${workers.map((w) => w.name).join(', ')}.\n\nAufgabe:\n${session.task}`,
    );
    messages.push({ senderId: coordinator.id, content: plan, messageType: 'decision' });
    contributions.push({ agent: coordinator, content: plan });
    const workerResults = await Promise.all(
      workers.map(async (w) => ({
        agent: w,
        content: await llmFn(
          w.systemPrompt,
          `Koordinator-Plan:\n${plan}\n\nUrsprüngliche Aufgabe:\n${session.task}\n\nBearbeite deinen Teil der Aufgabe.`,
        ),
      })),
    );
    for (const r of workerResults) {
      contributions.push(r);
      messages.push({ senderId: r.agent.id, content: r.content, messageType: 'message' });
    }
  } else {
    // capability-based / load-balanced → parallel consultation: each agent
    // answers the task independently.
    const results = await Promise.all(
      participants.map(async (agent) => ({
        agent,
        content: await llmFn(
          agent.systemPrompt,
          `Aufgabe des Koordinators:\n${session.task}\n\nGib deine unabhängige fachliche Einschätzung bzw. Lösung.`,
        ),
      })),
    );
    for (const r of results) {
      contributions.push(r);
      messages.push({ senderId: r.agent.id, content: r.content, messageType: 'message' });
    }
  }

  // Synthesis per conflict-resolution strategy.
  let synthesis: string;
  if (session.conflictResolution === 'priority-based') {
    // Highest-priority (first) contribution wins — no extra LLM call.
    synthesis = contributions[0]?.content ?? '';
  } else {
    const synthAgent = participants[0];
    const corpus = contributions.map((c) => `[${c.agent.name}]:\n${c.content}`).join('\n\n');
    const instruction =
      session.conflictResolution === 'voting'
        ? 'Wäge die Beiträge gegeneinander ab, benenne die Mehrheitsposition und den tragfähigsten Konsens.'
        : session.conflictResolution === 'merge'
          ? 'Führe die Beiträge zu einer einzigen, widerspruchsfreien Lösung zusammen.'
          : 'Als Koordinator: triff eine Entscheidung und fasse das Ergebnis verbindlich zusammen.';
    synthesis = await llmFn(
      synthAgent.systemPrompt,
      `Aufgabe:\n${session.task}\n\nBeiträge der Agenten:\n${corpus}\n\n${instruction}`,
    );
  }
  messages.push({ senderId: participants[0].id, content: synthesis, messageType: 'decision' });

  return { messages, synthesis };
}
