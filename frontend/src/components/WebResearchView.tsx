import { useState } from 'react';
import { browseAPI, getActiveLLMSelection, getLLMHeaders, type BrowseAgentResult } from '../services/api';

const stoppedLabel: Record<BrowseAgentResult['stoppedReason'], string> = {
  done: 'abgeschlossen',
  max_steps: 'Schritt-Limit erreicht',
  kill_switch: 'durch Kill-Switch gestoppt',
};

export default function WebResearchView() {
  const [task, setTask] = useState('');
  const [startUrl, setStartUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BrowseAgentResult | null>(null);

  const sel = getActiveLLMSelection();

  const run = async () => {
    if (!task.trim() || running) return;
    const headers = getLLMHeaders();
    if (!headers) {
      setError(
        'Kein aktiver LLM-Provider mit API-Key. Hinterlege einen Key unter „LLM Provider" (mit Guthaben) — es wird nichts simuliert.',
      );
      return;
    }
    setError(null);
    setResult(null);
    setRunning(true);
    try {
      const res = await browseAPI.agent(task.trim(), startUrl.trim() || undefined, headers);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recherche fehlgeschlagen.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="card mb-16">
        <div className="flex-between mb-8">
          <span className="card-title">Autonome Web-Recherche</span>
          {sel ? (
            <span className="badge valid" title="Aktiver LLM-Provider für die Recherche">
              {sel.fellBack ? '↪ ' : ''}
              {sel.providerName} · {sel.model || '—'}
            </span>
          ) : (
            <span className="badge warning" title="Kein Provider mit Key aktiv">
              ⚠ kein LLM-Key
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
          Ein Agent besucht eigenständig echte Webseiten (navigate → lesen → … → Antwort). Sicherheit: SSRF-Guard,
          Domain-Allowlist, Kill-Switch, Schritt-Limit. Es werden nur echte LLM-Antworten genutzt — keine Simulation.
        </div>

        <label className="collab-label" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Aufgabe
        </label>
        <textarea
          className="collab-textarea"
          rows={3}
          placeholder="z. B. Was ist die aktuell stabile Node.js-LTS-Version laut nodejs.org?"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <label className="collab-label" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Start-URL (optional)
        </label>
        <input
          className="chat-search-input"
          placeholder="https://nodejs.org"
          value={startUrl}
          onChange={(e) => setStartUrl(e.target.value)}
          style={{ width: '100%', marginBottom: 12 }}
        />
        <button className="btn btn-primary" onClick={run} disabled={running || !task.trim()}>
          {running ? 'Recherche läuft…' : '▶ Recherche starten'}
        </button>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 6,
              background: 'rgba(239,68,68,0.1)',
              color: 'var(--accent-red)',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}
        {running && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            Der Agent arbeitet… (echte LLM-Aufrufe + echte Seitenabrufe, das kann etwas dauern)
          </div>
        )}
      </div>

      {result && (
        <>
          <div className="card mb-16">
            <div className="card-title mb-8">Antwort · {stoppedLabel[result.stoppedReason]}</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {result.answer || '(keine Antwort)'}
            </div>
          </div>

          <div className="card">
            <div className="card-title mb-8">Schritte ({result.steps.length})</div>
            {result.steps.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Keine Schritte ausgeführt.</div>
            )}
            {result.steps.map((s, i) => (
              <div key={i} style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {i + 1}. {s.tool}
                  {s.arg ? ` → ${s.arg}` : ''}
                </div>
                {s.thought && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: '2px 0' }}>
                    {s.thought}
                  </div>
                )}
                <details>
                  <summary style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>Beobachtung</summary>
                  <pre
                    style={{
                      marginTop: 6,
                      padding: 8,
                      background: 'var(--bg-surface)',
                      borderRadius: 4,
                      fontSize: 11,
                      whiteSpace: 'pre-wrap',
                      maxHeight: 220,
                      overflow: 'auto',
                    }}
                  >
                    {s.observation}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
