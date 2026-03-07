import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';
import { broadcast } from '../services/websocket.js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const router = Router();

// GET /api/chat/sessions
router.get('/sessions', (req, res) => {
  const db = getDb();
  const { agentId } = req.query;
  let sessions;
  if (agentId) {
    sessions = db.prepare('SELECT * FROM chat_sessions WHERE agentId = ? ORDER BY updatedAt DESC').all(agentId);
  } else {
    sessions = db.prepare('SELECT * FROM chat_sessions ORDER BY updatedAt DESC').all();
  }
  res.json({ sessions });
});

// POST /api/chat/sessions
router.post('/sessions', (req, res) => {
  const db = getDb();
  const { agentId, title } = req.body;
  if (!agentId) return res.status(400).json({ error: 'agentId is required' });

  const id = uuid();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO chat_sessions (id, agentId, title, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)').run(
    id,
    agentId,
    title || 'Neue Konversation',
    now,
    now,
  );
  const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(id);
  res.status(201).json(session);
});

// DELETE /api/chat/sessions/:id
router.delete('/sessions/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM chat_messages WHERE sessionId = ?').run(req.params.id);
  const result = db.prepare('DELETE FROM chat_sessions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Session not found' });
  res.json({ success: true });
});

// GET /api/chat/sessions/:id/messages
router.get('/sessions/:id/messages', (req, res) => {
  const db = getDb();
  const messages = db
    .prepare('SELECT * FROM chat_messages WHERE sessionId = ? ORDER BY timestamp ASC')
    .all(req.params.id);
  res.json({ messages });
});

// POST /api/chat/sessions/:id/messages - send message + get real or simulated agent reply
router.post('/sessions/:id/messages', async (req, res) => {
  const db = getDb();
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });

  // Read LLM config from headers
  const apiKey = req.headers['x-llm-api-key'] as string | undefined;
  const provider = (req.headers['x-llm-provider'] as string | undefined) || 'anthropic';
  const model = (req.headers['x-llm-model'] as string | undefined) || 'claude-sonnet-4-5-20250929';

  const id = uuid();
  const now = new Date().toISOString();

  // Save user message
  db.prepare(
    'INSERT INTO chat_messages (id, sessionId, sender, senderType, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, req.params.id, 'user', 'user', content, now);
  db.prepare('UPDATE chat_sessions SET updatedAt = ? WHERE id = ?').run(now, req.params.id);
  const userMsg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(id);

  broadcast({ type: 'chat_message', payload: { sessionId: req.params.id, message: userMsg }, timestamp: now }, 'chat');
  res.status(201).json(userMsg); // respond immediately so UI is snappy

  // Get agent context
  const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!session) return;
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(session.agentId as string) as
    | Record<string, unknown>
    | undefined;
  if (!agent) return;

  // Get previous messages for context (last 10)
  const history = db
    .prepare(
      'SELECT senderType, content FROM chat_messages WHERE sessionId = ? AND id != ? ORDER BY timestamp DESC LIMIT 10',
    )
    .all(req.params.id, id) as { senderType: string; content: string }[];
  history.reverse();

  // Build system prompt from agent config
  const personality =
    typeof agent.personality === 'string' ? JSON.parse(agent.personality as string) : agent.personality || {};
  const params = typeof agent.parameters === 'string' ? JSON.parse(agent.parameters as string) : agent.parameters || {};
  const systemPrompt = buildSystemPrompt(agent, personality);

  let responseContent: string;

  if (apiKey) {
    try {
      responseContent = await callLLM({ provider, model, apiKey, systemPrompt, history, userMessage: content, params });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      responseContent = `[LLM-Fehler: ${errMsg}]\n\n${generateFallbackResponse(agent, personality)}`;
    }
  } else {
    // No API key - use simulation
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 1000));
    responseContent = generateFallbackResponse(agent, personality);
  }

  const responseId = uuid();
  const responseTime = new Date().toISOString();
  db.prepare(
    'INSERT INTO chat_messages (id, sessionId, sender, senderType, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(responseId, req.params.id, agent.id as string, 'agent', responseContent, responseTime);
  db.prepare('UPDATE chat_sessions SET updatedAt = ? WHERE id = ?').run(responseTime, req.params.id);

  broadcast(
    {
      type: 'chat_message',
      payload: {
        sessionId: req.params.id,
        message: {
          id: responseId,
          sessionId: req.params.id,
          sender: agent.id,
          senderType: 'agent',
          content: responseContent,
          timestamp: responseTime,
        },
      },
      timestamp: responseTime,
    },
    'chat',
  );
});

function buildSystemPrompt(agent: Record<string, unknown>, personality: Record<string, unknown>): string {
  const basePrompt = (agent.systemPrompt as string) || '';
  const style = personality.communicationStyle || 'technical';
  const archetype = personality.archetype || 'analytiker';
  const creativity = personality.creativity || 5;
  const analytical = personality.analyticalDepth || 5;
  const risk = personality.riskTolerance || 5;

  return `${basePrompt}

Persönlichkeitsprofil:
- Kommunikationsstil: ${style}
- Archetyp: ${archetype}
- Kreativität: ${creativity}/10
- Analytische Tiefe: ${analytical}/10
- Risikotoleranz: ${risk}/10
- Domäne: ${agent.category}
- Rolle: ${agent.role}

Antworte immer auf Deutsch, präzise und in deinem Charakterstil. Du bist ein autonomer Agent im Valtheron Workspace.`;
}

async function callLLM(opts: {
  provider: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
  history: { senderType: string; content: string }[];
  userMessage: string;
  params: Record<string, unknown>;
}): Promise<string> {
  const { provider, model, apiKey, systemPrompt, history, userMessage, params } = opts;
  const maxTokens = (params.maxTokens as number) || 1024;
  const temperature = (params.temperature as number) || 0.7;

  // Build message history
  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...history.map((m) => ({
      role: (m.senderType === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  if (provider === 'anthropic' || provider === 'claude') {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: Math.min(maxTokens, 2048),
      temperature,
      system: systemPrompt,
      messages,
    });
    const block = response.content[0];
    return block.type === 'text' ? block.text : '[Keine Antwort]';
  }

  if (provider === 'openai') {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model,
      max_tokens: Math.min(maxTokens, 2048),
      temperature,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    });
    return response.choices[0]?.message?.content || '[Keine Antwort]';
  }

  if (provider === 'ollama') {
    const ollamaBase = (params.ollamaEndpoint as string) || 'http://localhost:11434';
    const response = await fetch(`${ollamaBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.2',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: false,
        options: { temperature, num_predict: Math.min(maxTokens, 2048) },
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama ${response.status}: ${errText}`);
    }
    const data = (await response.json()) as { message?: { content?: string } };
    return data.message?.content || '[Keine Antwort]';
  }

  if (provider === 'custom') {
    const endpoint = params.customEndpoint as string;
    if (!endpoint) throw new Error('Custom provider requires "customEndpoint" in agent parameters');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: Math.min(maxTokens, 2048),
        temperature,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Custom endpoint ${response.status}: ${errText}`);
    }
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content || '[Keine Antwort]';
  }

  throw new Error(`Unbekannter Provider: ${provider}`);
}

function generateFallbackResponse(agent: Record<string, unknown>, personality: Record<string, unknown>): string {
  const style = (personality?.communicationStyle as string) || 'technical';
  const category = agent.category as string;
  const name = agent.name as string;

  const greetings: Record<string, string[]> = {
    formal: ['Sehr geehrter Benutzer,', 'Vielen Dank für Ihre Anfrage.', 'Ich habe Ihre Nachricht analysiert.'],
    casual: ['Hey!', 'Klar, schaue ich mir an.', 'Alles klar!'],
    technical: ['Analyse läuft...', 'Verarbeite Anfrage.', 'Technische Bewertung:'],
    diplomatic: ['Danke für den Hinweis.', 'Ich verstehe Ihr Anliegen.', 'Lassen Sie mich das prüfen.'],
  };

  const responses: Record<string, string[]> = {
    trading: [
      'Marktanalyse: Volatilität 23.5%. Empfehlung: Positionen absichern.',
      'Signal: Bullish Divergenz 4h-Chart. RSI 42, MACD crossover bevorstehend.',
      'Risiko-Assessment: Sharpe Ratio 1.8. Exposure akzeptabel.',
    ],
    security: [
      'Scan: 3 niedrige, 1 mittlere Schwachstelle. Bericht bereit.',
      'Firewall aktualisiert. 12 IPs blockiert. GDPR-Compliance 94%.',
      'Anomalie-Check: Normales Verhaltensmuster. Keine Threats.',
    ],
    development: [
      'Code-Review: 3 Optimierungen (Memoization, Re-Render, Type-Safety).',
      'API implementiert. REST-konform, Validierung, Error-Handling fertig.',
      'Build: 245KB gzip. Lighthouse 94. Alle Tests grün.',
    ],
    qa: [
      '247/250 Tests bestanden. 3 Flaky Tests getaggt.',
      'Coverage: 87.3% Lines, 79.1% Branches. P95 Latenz 120ms.',
      'E2E: Alle kritischen Flows stabil. Laufzeit Ø 4.2s.',
    ],
    documentation: [
      '15 API-Endpunkte dokumentiert. JSDoc für 45 Funktionen fertig.',
      'Changelog: 23 Changes (Features/Fixes/Breaking). TypeDoc bereit.',
      'Tutorial "Getting Started": 5 Schritte, Code-Snippets, Beispiele.',
    ],
    deployment: [
      'Staging-Deploy erfolgreich. Health-Checks OK. Rollback bereit.',
      'K8s: 3→5 Pods skaliert. Auto-Scaling bei 70% CPU aktiv.',
      'Blue-Green vorbereitet. Traffic-Switch in 30s.',
    ],
    analyst: [
      'Trend: +15% MoM. Saisonale Korrektur erwartet Q2.',
      'Retention Q4: 78%. Churn-Cluster bei Segment B identifiziert.',
      'A/B Test: Variante B +8.3% Conversion (p<0.05). Signifikant.',
    ],
    support: [
      'Ticket-Routing konfiguriert. SLA-Timer läuft. Tier-2 ready.',
      'KB: 12 neue FAQ-Einträge. CSAT 4.6/5.0 (+0.3 MoM).',
      'Auto-Reply aktiv. Erwartete Reduktion: 25% Ticket-Volumen.',
    ],
    integration: [
      'Webhook aktiv. Retry 3x Backoff. ETL: 1.2M Datensätze, 99.8% Qualität.',
      'OAuth 2.0 Flow mit 5 Providern getestet. SSO bereit.',
      'Kafka: 5.000 Events/s. Lag 0. Consumer-Group stabil.',
    ],
    monitoring: [
      'Status: alle Services grün. Uptime 99.99% (30 Tage).',
      'Prometheus: P99 95ms stabil. Keine Anomalien. 3 Alert-Regeln angepasst.',
      'Log-Analyse: 3 Error-Pattern. Korrelation mit Memory-Spikes bestätigt.',
    ],
  };

  const g = (greetings[style] || greetings.technical)[Math.floor(Math.random() * 3)];
  const r = (responses[category] || responses.development)[Math.floor(Math.random() * 3)];
  return `${g}\n\n${r}\n\n— ${name} [${category}] *(Simulation — kein API-Key konfiguriert)*`;
}

export default router;
