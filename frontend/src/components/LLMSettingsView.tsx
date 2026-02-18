import { useState, useEffect, useCallback } from 'react';
import type { LLMConfig, LLMProvider, LLMProviderType, OllamaModel } from '../types';
import { fetchOllamaModels, checkOllamaStatus } from '../services/llmProviders';

interface LLMSettingsProps {
  config: LLMConfig;
  onConfigChange: (config: LLMConfig) => void;
}

type SettingsTab = 'providers' | 'ollama' | 'defaults' | 'parameters';

export default function LLMSettingsView({ config, onConfigChange }: LLMSettingsProps) {
  const [tab, setTab] = useState<SettingsTab>('providers');
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [ollamaLoading, setOllamaLoading] = useState(false);
  const [editingProvider, setEditingProvider] = useState<LLMProviderType | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customModelInput, setCustomModelInput] = useState('');

  const ollamaProvider = config.providers.find(p => p.id === 'ollama');

  const checkOllama = useCallback(async () => {
    setOllamaStatus('checking');
    const ok = await checkOllamaStatus(config.ollamaEndpoint);
    setOllamaStatus(ok ? 'connected' : 'disconnected');
    updateProviderStatus('ollama', ok ? 'connected' : 'disconnected');
  }, [config.ollamaEndpoint]);

  useEffect(() => { checkOllama(); }, [checkOllama]);

  const updateProviderStatus = (id: LLMProviderType, status: LLMProvider['status']) => {
    onConfigChange({
      ...config,
      providers: config.providers.map(p => p.id === id ? { ...p, status, lastChecked: new Date().toISOString() } : p),
    });
  };

  const toggleProvider = (id: LLMProviderType) => {
    onConfigChange({
      ...config,
      providers: config.providers.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p),
    });
  };

  const setApiKey = (id: LLMProviderType, key: string) => {
    onConfigChange({
      ...config,
      providers: config.providers.map(p =>
        p.id === id ? { ...p, apiKey: key || undefined, status: key ? 'connected' : 'disconnected' } : p
      ),
    });
  };

  const setProviderUrl = (id: LLMProviderType, url: string) => {
    onConfigChange({
      ...config,
      providers: config.providers.map(p => p.id === id ? { ...p, baseUrl: url } : p),
    });
  };

  const loadOllamaModels = async () => {
    setOllamaLoading(true);
    try {
      const rawModels = await fetchOllamaModels(config.ollamaEndpoint);
      const ollamaModels: OllamaModel[] = rawModels.map(m => ({
        name: m.name,
        size: m.size,
        digest: m.digest,
        modifiedAt: m.modified_at,
        details: {
          format: m.details.format,
          family: m.details.family,
          parameterSize: m.details.parameter_size,
          quantizationLevel: m.details.quantization_level,
        },
      }));
      const llmModels = ollamaModels.map(m => ({
        id: `ollama/${m.name}`,
        name: m.name,
        provider: 'ollama' as const,
        contextWindow: 8192,
        maxOutput: 4096,
        capabilities: ['text' as const, 'code' as const],
        isLocal: true,
      }));
      onConfigChange({
        ...config,
        ollamaModels,
        providers: config.providers.map(p => p.id === 'ollama' ? { ...p, models: llmModels, status: 'connected' } : p),
      });
      setOllamaStatus('connected');
    } catch (e) {
      console.error('Failed to load Ollama models:', e);
      setOllamaStatus('disconnected');
    }
    setOllamaLoading(false);
  };

  const addCustomModel = () => {
    if (!customModelInput.trim()) return;
    const model = {
      id: `custom/${customModelInput}`,
      name: customModelInput,
      provider: 'custom' as const,
      contextWindow: 8192,
      maxOutput: 4096,
      capabilities: ['text' as const, 'code' as const],
      isLocal: false,
    };
    onConfigChange({
      ...config,
      providers: config.providers.map(p => p.id === 'custom' ? { ...p, models: [...p.models, model] } : p),
    });
    setCustomModelInput('');
  };

  const allModels = config.providers.filter(p => p.enabled).flatMap(p => p.models);

  const providerIcons: Record<LLMProviderType, string> = {
    openai: 'O',
    anthropic: 'A',
    google: 'G',
    mistral: 'M',
    groq: 'Q',
    ollama: 'L',
    openrouter: 'R',
    custom: 'C',
  };

  const statusDot = (status: LLMProvider['status']) => {
    const colors = { connected: 'var(--accent-green)', disconnected: 'var(--text-muted)', error: 'var(--accent-red)', checking: 'var(--accent-orange)' };
    return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[status], marginRight: 6 }} />;
  };

  return (
    <div>
      <div className="tabs">
        {([
          { key: 'providers', label: 'LLM Provider' },
          { key: 'ollama', label: 'Ollama (Lokal)' },
          { key: 'defaults', label: 'Standard-Modell' },
          { key: 'parameters', label: 'Globale Parameter' },
        ] as const).map(t => (
          <button key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* PROVIDERS TAB */}
      {tab === 'providers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {config.providers.map(provider => (
            <div key={provider.id} className="card" style={{ borderColor: provider.enabled ? 'var(--border-active)' : 'var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: provider.enabled ? 'var(--accent-cyan)' : 'var(--bg-hover)',
                    color: provider.enabled ? 'var(--bg-primary)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14
                  }}>
                    {providerIcons[provider.id]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{provider.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {statusDot(provider.status)} {provider.status}
                      {provider.isLocal && ' (lokal)'}
                    </div>
                  </div>
                </div>
                <button
                  className={`toggle${provider.enabled ? ' on' : ''}`}
                  onClick={() => toggleProvider(provider.id)}
                />
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                {provider.models.length} Modelle verfügbar
              </div>

              {provider.id !== 'ollama' && provider.id !== 'custom' && (
                <div style={{ marginBottom: 8 }}>
                  {editingProvider === provider.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input
                        type="password"
                        placeholder="API Key eingeben..."
                        value={apiKeyInput}
                        onChange={e => setApiKeyInput(e.target.value)}
                        style={{ flex: 1, fontSize: 11 }}
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => { setApiKey(provider.id, apiKeyInput); setEditingProvider(null); setApiKeyInput(''); }}>
                        OK
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditingProvider(null); setApiKeyInput(''); }}>
                        X
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ width: '100%' }}
                      onClick={() => { setEditingProvider(provider.id); setApiKeyInput(provider.apiKey ?? ''); }}
                    >
                      {provider.apiKey ? '\u2713 API Key gesetzt' : 'API Key konfigurieren'}
                    </button>
                  )}
                </div>
              )}

              {provider.id === 'custom' && (
                <div style={{ marginBottom: 8 }}>
                  <input
                    placeholder="Base URL (z.B. http://localhost:8080/v1)"
                    value={provider.baseUrl || customUrlInput}
                    onChange={e => { setCustomUrlInput(e.target.value); setProviderUrl('custom', e.target.value); }}
                    style={{ width: '100%', fontSize: 11, marginBottom: 4 }}
                  />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input
                      placeholder="Modell-Name hinzufügen"
                      value={customModelInput}
                      onChange={e => setCustomModelInput(e.target.value)}
                      style={{ flex: 1, fontSize: 11 }}
                      onKeyDown={e => e.key === 'Enter' && addCustomModel()}
                    />
                    <button className="btn btn-primary btn-sm" onClick={addCustomModel}>+</button>
                  </div>
                </div>
              )}

              {provider.enabled && provider.models.length > 0 && (
                <div style={{ maxHeight: 120, overflow: 'auto' }}>
                  {provider.models.map(model => (
                    <div key={model.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '3px 0', fontSize: 11, borderBottom: '1px solid var(--border-color)'
                    }}>
                      <span style={{ color: 'var(--text-primary)' }}>{model.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {model.contextWindow >= 1000000 ? `${(model.contextWindow / 1000000).toFixed(0)}M` : `${(model.contextWindow / 1000).toFixed(0)}k`}
                        {model.costPer1kInput !== undefined && ` \u00b7 $${model.costPer1kInput}/1k`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* OLLAMA TAB */}
      {tab === 'ollama' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title mb-8">Ollama Verbindung</div>
            <div className="config-row">
              <span className="config-label">Status</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {statusDot(ollamaStatus === 'checking' ? 'checking' : ollamaStatus === 'connected' ? 'connected' : 'disconnected')}
                <span style={{ fontSize: 12, fontWeight: 600, color: ollamaStatus === 'connected' ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                  {ollamaStatus === 'checking' ? 'Prüfe...' : ollamaStatus === 'connected' ? 'Verbunden' : 'Nicht erreichbar'}
                </span>
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Endpoint URL</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  value={config.ollamaEndpoint}
                  onChange={e => onConfigChange({ ...config, ollamaEndpoint: e.target.value })}
                  style={{ flex: 1, fontSize: 12 }}
                  placeholder="http://localhost:11434"
                />
                <button className="btn btn-ghost btn-sm" onClick={checkOllama}>
                  Test
                </button>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={loadOllamaModels}
                disabled={ollamaLoading || ollamaStatus !== 'connected'}
              >
                {ollamaLoading ? 'Lade Modelle...' : 'Modelle laden'}
              </button>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Stellen Sie sicher, dass Ollama lokal läuft:<br />
              <code style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4 }}>
                ollama serve
              </code><br />
              Modelle installieren:<br />
              <code style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4 }}>
                ollama pull llama3.2
              </code>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Lokale Modelle ({config.ollamaModels.length})</span>
              {ollamaProvider && ollamaProvider.models.length > 0 && (
                <span className="badge active">{ollamaProvider.models.length} geladen</span>
              )}
            </div>
            {config.ollamaModels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                {ollamaStatus === 'connected'
                  ? 'Klicken Sie "Modelle laden" um verfügbare Modelle abzurufen.'
                  : 'Ollama ist nicht verbunden. Starten Sie Ollama und versuchen Sie es erneut.'}
              </div>
            ) : (
              <div>
                {config.ollamaModels.map(model => (
                  <div key={model.name} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{model.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {model.details.family} &middot; {model.details.parameterSize} &middot; {model.details.quantizationLevel}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>
                      {(model.size / 1e9).toFixed(1)} GB
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEFAULTS TAB */}
      {tab === 'defaults' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title mb-8">Standard-Provider</div>
            <select
              value={config.defaultProvider}
              onChange={e => {
                const provider = e.target.value as LLMProviderType;
                const firstModel = config.providers.find(p => p.id === provider)?.models[0];
                onConfigChange({ ...config, defaultProvider: provider, defaultModel: firstModel?.id ?? '' });
              }}
              style={{ width: '100%', padding: '8px 12px', fontSize: 13, marginBottom: 12 }}
            >
              {config.providers.filter(p => p.enabled).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <div className="card-title mb-8">Standard-Modell</div>
            <select
              value={config.defaultModel}
              onChange={e => onConfigChange({ ...config, defaultModel: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
            >
              {config.providers.find(p => p.id === config.defaultProvider)?.models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            {(() => {
              const model = allModels.find(m => m.id === config.defaultModel);
              if (!model) return null;
              return (
                <div style={{ marginTop: 12, padding: 10, background: 'var(--bg-surface)', borderRadius: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{model.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Context: {model.contextWindow >= 1000000 ? `${(model.contextWindow / 1000000).toFixed(0)}M` : `${(model.contextWindow / 1000).toFixed(0)}k`} tokens
                    &middot; Max Output: {(model.maxOutput / 1000).toFixed(0)}k
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {model.capabilities.map(cap => (
                      <span key={cap} className="badge active">{cap}</span>
                    ))}
                  </div>
                  {model.costPer1kInput !== undefined && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      Kosten: ${model.costPer1kInput}/1k input, ${model.costPer1kOutput}/1k output
                    </div>
                  )}
                  {model.isLocal && (
                    <div style={{ fontSize: 11, color: 'var(--accent-green)', marginTop: 6 }}>
                      Lokal - Keine API-Kosten
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="card">
            <div className="card-title mb-8">Alle verfügbaren Modelle ({allModels.length})</div>
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {config.providers.filter(p => p.enabled && p.models.length > 0).map(provider => (
                <div key={provider.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                    {provider.name}
                  </div>
                  {provider.models.map(model => (
                    <div
                      key={model.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12,
                        background: config.defaultModel === model.id ? 'var(--bg-hover)' : 'transparent',
                        borderLeft: config.defaultModel === model.id ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                      }}
                      onClick={() => onConfigChange({ ...config, defaultProvider: provider.id, defaultModel: model.id })}
                    >
                      <span style={{ color: config.defaultModel === model.id ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                        {model.name}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {model.isLocal ? 'lokal' : model.costPer1kInput !== undefined ? `$${model.costPer1kInput}/1k` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PARAMETERS TAB */}
      {tab === 'parameters' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title mb-8">Generierungs-Parameter</div>
            {([
              { key: 'temperature', label: 'Temperature', min: 0, max: 2, step: 0.05 },
              { key: 'topP', label: 'Top P', min: 0, max: 1, step: 0.05 },
              { key: 'maxTokens', label: 'Max Tokens', min: 256, max: 128000, step: 256 },
            ] as const).map(param => (
              <div key={param.key} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{param.label}</span>
                  <span style={{ fontWeight: 700 }}>{config.globalParameters[param.key]}</span>
                </div>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={config.globalParameters[param.key]}
                  onChange={e => onConfigChange({
                    ...config,
                    globalParameters: { ...config.globalParameters, [param.key]: parseFloat(e.target.value) }
                  })}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                  <span>{param.min}</span>
                  <span>{param.max}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title mb-8">Verbindungs-Optionen</div>
            {([
              { key: 'streamResponses', label: 'Stream Responses' },
              { key: 'retryOnFailure', label: 'Retry bei Fehler' },
            ] as const).map(opt => (
              <div key={opt.key} className="config-row">
                <span className="config-label">{opt.label}</span>
                <button
                  className={`toggle${config.globalParameters[opt.key] ? ' on' : ''}`}
                  onClick={() => onConfigChange({
                    ...config,
                    globalParameters: { ...config.globalParameters, [opt.key]: !config.globalParameters[opt.key] }
                  })}
                />
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Max Retries</span>
                <span style={{ fontWeight: 700 }}>{config.globalParameters.maxRetries}</span>
              </div>
              <input
                type="range"
                min={1} max={10} step={1}
                value={config.globalParameters.maxRetries}
                onChange={e => onConfigChange({ ...config, globalParameters: { ...config.globalParameters, maxRetries: parseInt(e.target.value) } })}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Timeout (ms)</span>
                <span style={{ fontWeight: 700 }}>{config.globalParameters.timeoutMs}</span>
              </div>
              <input
                type="range"
                min={5000} max={120000} step={5000}
                value={config.globalParameters.timeoutMs}
                onChange={e => onConfigChange({ ...config, globalParameters: { ...config.globalParameters, timeoutMs: parseInt(e.target.value) } })}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                <span>5s</span><span>120s</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
