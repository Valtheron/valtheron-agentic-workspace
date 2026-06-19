# 📖 Handbuch: Erstellung und Verwaltung von Agenten-Workflows im Valtheron Workspace

Dieses Dokument dient als offizielle, praxisnahe Dokumentation für die Konzeptionierung, Definition und Überwachung komplexer Multi-Agenten-Workflow-Modelle innerhalb des Valtheron-Sicherheitssystems.

---

## 1. Grundlagen der Workflow-Spezifikation (DAG-Architektur)

Im Valtheron Agentic Workspace werden Arbeitsabläufe als **gerichtete kreisfreie Graphen (Directed Acyclic Graphs - DAGs)** deklariert. Ein Workflow besteht aus:
- **Nodes (Nodes):** Einzelne spezialisierte KI-Agenten, die für eine Teilaufgabe lizenziert sind.
- **Edges (Dependencies):** Datenflussverbindungen, die vorschreiben, welche Daten nach erfolgreichem Abschluss eines Agentenschritts an den nächsten übermittelt werden.
- **Conditional Rules (Entscheidungs-Routing):** Logische Weggabelungen basierend auf Klassifizierungs-Ergebnissen oder Sentiment-Scores der Zwischenschritte.

---

## 2. Definition von Abhängigkeiten, Bedingter Logik und Fehlerbehandlung

### 2.1 Modellierung im JSON-Format
Die formale Struktur wird dezentral deklariert, um kryptografische Signaturen für jeden State-Handoff zu gewährleisten:

```json
{
  "workflowId": "wf-support-automation-01",
  "name": "Customer Support Automation Pipeline",
  "steps": [
    {
      "stepId": "01_triage",
      "agent": "SupportTriageAgent",
      "dependencies": [],
      "onSuccess": "02_sentiment_eval",
      "onFailure": "error_rollback"
    },
    {
      "stepId": "02_sentiment_eval",
      "agent": "SentimentClassifierAgent",
      "dependencies": ["01_triage"],
      "onSuccess": {
        "condition": "lastResult.sentiment === 'critical'",
        "truePath": "03_escalation_engine",
        "falsePath": "04_standard_response"
      },
      "onFailure": "04_standard_response"
    }
  ]
}
```

### 2.2 Fehlertoleranz & Absicherungskriterien
Um die Systemintegrität aufrechtzuerhalten, gelten drei primäre Sicherheitsmechanismen:
1. **State Rollback (Transaktions-Rollback):** Schlägt ein Teilschritt fehl, wird der Zustand im WORM-Ledger auf den letzten kryptografisch validierten Block zurückgesetzt.
2. **Circuit Breaker (Sicherungsschutz):** Blockiert externe API-Abfragen temporär, falls aufeinanderfolgende Timeouts auftreten, um Token-Ressourcen zu schonen.
3. **Dead-Letter Queues (DLQ):** Unzustellbare Agentennachrichten werden in einem isolierten Speichersegment abgelegt und lösen eine `CRITICAL`-Sicherheitswarnung im Überwachungs-Dashboard aus.

---

## 3. Praxisnahe Anwendungsfälle & Codebeispiele

### Fallbeispiel 1: Automatisierung von Kundensupportanfragen
Dieses Szenario veranschaulicht das Routing eingehender Supportanfragen basierend auf der Dringlichkeit:

#### Architektur (Datenfluss):
```
Eingehende E-Mail ──► [SupportTriageAgent] 
                          │
            ┌─────────────┴─────────────┐
            ▼ (Kritisch / Wütend)       ▼ (Frage / Allgemein)
[EscalationResponseAgent]      [FAQResponderAgent]
            │                           │
            └─────────────┬─────────────┘
                          ▼
              [QualityAuditorAgent] ──► E-Mail-Ausgang
```

#### TypeScript-Schnittstellen und Implementierung:
```typescript
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Request, Response } from 'express';

interface StepPayload {
  emailBody: string;
  priority?: 'high' | 'normal';
  assignedAgent?: string;
  replyDraft?: string;
}

export async function executeSupportWorkflow(req: Request, res: Response) {
  try {
    const { emailBody } = req.body;
    
    if (!emailBody) {
      return res.status(400).json({ error: "Missing email content parameter" });
    }

    // Triage-Schritt: Priorisierung ermitteln
    let currentPayload: StepPayload = { emailBody };
    const priorityResult = emailBody.includes("Sofort kündigen") || emailBody.includes("Anwalt") 
      ? 'high' 
      : 'normal';
    
    currentPayload.priority = priorityResult;

    // Wegevorderung
    if (currentPayload.priority === 'high') {
      currentPayload.assignedAgent = "EscalationResponseAgent-09";
      currentPayload.replyDraft = "Vielen Dank für Ihre E-Mail. Wir bedauern die Probleme zutiefst und haben Ihre Anfrage priorisiert. Ein Ticket wurde für unser Senior-Team erstellt.";
    } else {
      currentPayload.assignedAgent = "FAQResponderAgent-41";
      currentPayload.replyDraft = "Vielen Dank für Ihre Anfrage. Details zu Ihrer Konfiguration finden Sie in der standardmäßigen Valtheron-Dokumentation.";
    }

    res.json({
      workflowStatus: "COMPLETED",
      assignedAgent: currentPayload.assignedAgent,
      compiledReply: currentPayload.replyDraft,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      workflowStatus: "FAILED",
      error: error.message || "Cascading workflow failure resolved securely."
    });
  }
}
```

---

## 4. Praxisbeispiel 2: Automatisierte Finanzmarktdatenanalyse

In diesem Szenario erfasst eine Kette von Hintergrund-Agenten aggregierte CoinGecko-Daten, analysiert Risikoschwellenwerte und schreibt kryptografisch signierte Warnungen in das Dashboard.

```typescript
export async function runMarketAnalysisWorkflow() {
  const dataset = [
    { asset: "BTC", priceUsd: 67300, volatility: 0.04 },
    { asset: "ETH", priceUsd: 3500, volatility: 0.12 }
  ];

  const analysisResult = dataset.map(coin => {
    // Volatilität über 10% löst Risikoalarm aus
    const status = coin.volatility > 0.10 ? "HIGH_RISK" : "STABLE";
    return {
      coin: coin.asset,
      riskLevel: status,
      recommendation: status === "HIGH_RISK" ? "Schutzpositionen einrichten / Absichern" : "Halten"
    };
  });

  return {
    workflow: "MarketVolatilitySweep",
    analyzedAssets: analysisResult.length,
    results: analysisResult
  };
}
```
