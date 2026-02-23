import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';
import { broadcast } from '../services/websocket.js';

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
    id, agentId, title || 'Neue Konversation', now, now
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
  const messages = db.prepare('SELECT * FROM chat_messages WHERE sessionId = ? ORDER BY timestamp ASC').all(req.params.id);
  res.json({ messages });
});

// POST /api/chat/sessions/:id/messages - send a message and get agent reply
router.post('/sessions/:id/messages', (req, res) => {
  const db = getDb();
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });

  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO chat_messages (id, sessionId, sender, senderType, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.params.id, 'user', 'user', content, now);

  db.prepare('UPDATE chat_sessions SET updatedAt = ? WHERE id = ?').run(now, req.params.id);

  const userMsg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(id);

  broadcast({
    type: 'chat_message',
    payload: { sessionId: req.params.id, message: userMsg },
    timestamp: now,
  }, 'chat');

  // Generate simulated agent response
  const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (session) {
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(session.agentId as string) as Record<string, unknown> | undefined;
    if (agent) {
      const responseId = uuid();
      const responseTime = new Date(Date.now() + 800).toISOString();
      const responseContent = generateAgentResponse(agent, content);

      setTimeout(() => {
        db.prepare(
          'INSERT INTO chat_messages (id, sessionId, sender, senderType, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(responseId, req.params.id, agent.id as string, 'agent', responseContent, responseTime);
        db.prepare('UPDATE chat_sessions SET updatedAt = ? WHERE id = ?').run(responseTime, req.params.id);

        broadcast({
          type: 'chat_message',
          payload: {
            sessionId: req.params.id,
            message: { id: responseId, sessionId: req.params.id, sender: agent.id, senderType: 'agent', content: responseContent, timestamp: responseTime },
          },
          timestamp: responseTime,
        }, 'chat');
      }, 600 + Math.random() * 1200);
    }
  }

  res.status(201).json(userMsg);
});

function generateAgentResponse(agent: Record<string, unknown>, _userMessage: string): string {
  const personality = typeof agent.personality === 'string' ? JSON.parse(agent.personality) : (agent.personality || {});
  const style = personality?.communicationStyle || 'technical';
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
      'Marktanalyse abgeschlossen. Aktuelle Volatilität liegt bei 23.5%. Empfehlung: Positionen absichern.',
      'Signal erkannt: Bullish Divergenz auf dem 4h-Chart. RSI bei 42, MACD crossover steht bevor.',
      'Risiko-Assessment: Portfolio-Exposure im akzeptablen Bereich. Sharpe Ratio: 1.8.',
      'Order-Buch analysiert. Starke Unterstützung bei 42,100. Widerstand bei 43,500.',
    ],
    security: [
      'Scan abgeschlossen. 3 niedrige, 1 mittlere Schwachstelle gefunden. Details im Bericht.',
      'Firewall-Regeln aktualisiert. 12 verdächtige IP-Adressen blockiert.',
      'Compliance-Check: GDPR-Anforderungen zu 94% erfüllt. 2 offene Punkte.',
      'Anomalie-Erkennung: Normales Verhaltensmuster. Keine Bedrohungen identifiziert.',
    ],
    development: [
      'Code-Review abgeschlossen. 3 Optimierungsvorschläge: Memoization, Re-Render Fix, Type-Safety.',
      'API-Endpoint implementiert. REST-konform mit Validierung und Error-Handling.',
      'Refactoring: Extraktion einer gemeinsamen Utility-Funktion reduziert Duplikation um 40%.',
      'Build erfolgreich. Bundle-Größe: 245KB (gzip). Lighthouse Score: 94.',
    ],
    qa: [
      'Testlauf: 247/250 Tests bestanden. 3 Flaky Tests identifiziert und getaggt.',
      'Coverage-Report: 87.3% Line Coverage, 79.1% Branch Coverage.',
      'E2E-Tests: Alle kritischen User-Flows stabil. Durchschnittliche Laufzeit: 4.2s.',
      'Performance-Test: P95 Latenz bei 120ms. Kein Memory Leak nach 10.000 Iterationen.',
    ],
    documentation: [
      'Dokumentation aktualisiert. 15 neue API-Endpunkte dokumentiert mit Beispielen.',
      'Tutorial erstellt: "Getting Started" Guide mit 5 Schritten und Code-Snippets.',
      'Changelog generiert: 23 Changes in 3 Kategorien (Features, Fixes, Breaking Changes).',
      'JSDoc-Kommentare für 45 Funktionen hinzugefügt. TypeDoc-Export bereit.',
    ],
    deployment: [
      'Deployment auf Staging erfolgreich. Health-Checks bestanden. Rollback-Plan bereit.',
      'Kubernetes-Cluster skaliert: 3 → 5 Pods. Auto-Scaling aktiviert bei 70% CPU.',
      'CI/CD Pipeline optimiert: Build-Zeit von 8:30 auf 5:45 reduziert.',
      'Blue-Green Deployment vorbereitet. Traffic-Switch in 30 Sekunden.',
    ],
    analyst: [
      'Datenanalyse abgeschlossen. Haupttrend: 15% Wachstum MoM.',
      'Kohorten-Analyse: Retention Rate Q4 bei 78%. Churn bei Segment B.',
      'Revenue-Forecast Q1: €2.4M (±12%). Haupttreiber: Enterprise-Segment.',
      'A/B Test: Variante B zeigt +8.3% Conversion (p < 0.05). Signifikant.',
    ],
    support: [
      'Ticket #4521 eskaliert an Tier 2. SLA-Timer: 2h 15min verbleibend.',
      'Knowledge-Base aktualisiert: 12 neue FAQ-Einträge hinzugefügt.',
      'Kundenzufriedenheit: 4.6/5.0. Verbesserung um 0.3 zum Vormonat.',
      'Auto-Reply konfiguriert. Erwartete Ticket-Reduktion: 25%.',
    ],
    integration: [
      'API-Integration erfolgreich. Webhook aktiv. Retry-Policy: 3x mit Backoff.',
      'ETL-Pipeline: 1.2M Datensätze verarbeitet. 99.8% Datenqualität.',
      'SSO-Konfiguration abgeschlossen. OAuth 2.0 Flow mit 5 Providern getestet.',
      'Kafka-Consumer konfiguriert. Throughput: 5.000 Events/s. Lag: 0.',
    ],
    monitoring: [
      'System-Status: Alle Services grün. Uptime: 99.99% (30 Tage).',
      'Alert-Regel angepasst: CPU-Threshold auf 85% erhöht. Fehlalarme reduziert.',
      'Log-Analyse: 3 Error-Pattern identifiziert. Korrelation bestätigt.',
      'Prometheus-Metriken: P99 Latenz stabil bei 95ms. Keine Anomalien.',
    ],
  };

  const greeting = greetings[style]?.[Math.floor(Math.random() * 3)] || 'Verstanden.';
  const catResponses = responses[category] || responses.development!;
  const response = catResponses[Math.floor(Math.random() * catResponses.length)];

  return `${greeting}\n\n${response}\n\n— ${name} [${category}]`;
}

export default router;
