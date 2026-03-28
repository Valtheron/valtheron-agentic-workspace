import { useState } from 'react';
import { donationsAPI } from '../services/api';

interface SponsorModalProps {
  onClose: () => void;
  donationMessage?: 'success' | 'cancelled' | null;
}

const platforms = [
  {
    id: 'github',
    name: 'GitHub — Star & Sponsor',
    description: 'Projekt unterstützen & auf GitHub folgen.',
    url: 'https://github.com/Valtheron/valtheron-agentic-workspace',
    color: '#e2e8f0',
    bg: 'rgba(226,232,240,0.06)',
    border: 'rgba(226,232,240,0.15)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
  {
    id: 'merch',
    name: 'Merch Shop — Printify',
    description: 'Valtheron Crypto Trading Shirts & mehr.',
    url: 'https://blackice-secure.printify.me',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.2)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
        <path d="M20.9 8.5c0-3.5-2.8-6.3-6.3-6.3H9.4C5.9 2.2 3.1 5 3.1 8.5c0 2.8 1.8 5.2 4.3 6v5.3c0 1.1.9 2 2 2h1.2c1.1 0 2-.9 2-2v-5.3c2.5-.8 4.3-3.2 4.3-6zm-6.3 4.2c-2.3 0-4.2-1.9-4.2-4.2s1.9-4.2 4.2-4.2 4.2 1.9 4.2 4.2-1.9 4.2-4.2 4.2z" />
      </svg>
    ),
  },
  {
    id: 'blackice',
    name: 'BlackIceSecure',
    description: 'Dienstleistungen, Community & Kontakt.',
    url: 'https://blackice-secure.space',
    color: '#00e5ff',
    bg: 'rgba(0,229,255,0.06)',
    border: 'rgba(0,229,255,0.2)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={28} height={28}>
        <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const PRESET_AMOUNTS = [5, 10, 25, 50];
const CURRENCIES = [
  { value: 'eur' as const, label: 'EUR', symbol: '€' },
  { value: 'usd' as const, label: 'USD', symbol: '$' },
];

export default function SponsorModal({ onClose, donationMessage }: SponsorModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [currency, setCurrency] = useState<'eur' | 'usd'>('eur');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencyInfo = CURRENCIES.find((c) => c.value === currency)!;

  const handleDonate = async () => {
    const amount = isCustom ? parseInt(customAmount, 10) : selectedAmount;
    if (!amount || amount < 1 || amount > 999) {
      setError('Bitte einen gültigen Betrag eingeben (1–999)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { url } = await donationsAPI.createCheckoutSession(amount, currency);
      window.location.href = url;
    } catch {
      setError('Checkout konnte nicht gestartet werden. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div
        className="sponsor-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Support Valtheron"
      >
        {/* Header */}
        <div className="sponsor-header">
          <div className="sponsor-heart-ring">
            <svg viewBox="0 0 24 24" fill="currentColor" width={32} height={32} style={{ color: '#ef4444' }}>
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.439 3.024 2 5 2c1.626 0 3.376.8 4.5 2.602C10.624 2.8 12.374 2 14 2c1.976 0 4 1.44 4 5.191 0 4.105-5.37 8.863-11 14.402z" />
            </svg>
          </div>
          <h2 className="sponsor-title">Support Valtheron</h2>
          <p className="sponsor-subtitle">
            Valtheron Agentic Workspace — entwickelt von{' '}
            <a href="https://blackice-secure.space" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
              BlackIceSecure
            </a>
            .<br />
            Gehostet auf{' '}
            <a href="https://agenticworkspacegenius.sbs" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
              agenticworkspacegenius.sbs
            </a>
            {' '}·{' '}
            <a href="https://agentworkspace.online" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
              agentworkspace.online
            </a>
          </p>
          <button className="sponsor-close" onClick={onClose} aria-label="Schließen">✕</button>
        </div>

        {/* Donation Success/Cancel Banner */}
        {donationMessage === 'success' && (
          <div style={{
            padding: '12px 16px',
            margin: '0 20px 12px',
            borderRadius: 8,
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            color: '#22c55e',
            fontSize: 14,
            textAlign: 'center',
          }}>
            Vielen Dank für Ihre Spende! Ihre Unterstützung bedeutet uns sehr viel.
          </div>
        )}
        {donationMessage === 'cancelled' && (
          <div style={{
            padding: '12px 16px',
            margin: '0 20px 12px',
            borderRadius: 8,
            background: 'rgba(234,179,8,0.1)',
            border: '1px solid rgba(234,179,8,0.3)',
            color: '#eab308',
            fontSize: 14,
            textAlign: 'center',
          }}>
            Spende abgebrochen. Sie können es jederzeit erneut versuchen.
          </div>
        )}

        {/* Platform Cards */}
        <div className="sponsor-cards">
          {platforms.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sponsor-card"
              style={{ '--sponsor-color': p.color, '--sponsor-bg': p.bg, '--sponsor-border': p.border } as React.CSSProperties}
            >
              <div className="sponsor-card-icon" style={{ color: p.color }}>
                {p.icon}
              </div>
              <div className="sponsor-card-body">
                <div className="sponsor-card-name">{p.name}</div>
                <div className="sponsor-card-desc">{p.description}</div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ))}
        </div>

        {/* Stripe Donation Section */}
        <div style={{
          margin: '16px 20px 0',
          padding: 16,
          borderRadius: 10,
          background: 'rgba(99,91,255,0.06)',
          border: '1px solid rgba(99,91,255,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ color: '#635bff', display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>Direkt spenden — Stripe</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Einmalige Spende via sicheres Stripe Checkout.</div>
            </div>
          </div>

          {/* Currency Toggle */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {CURRENCIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCurrency(c.value)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: currency === c.value ? '1px solid #635bff' : '1px solid rgba(255,255,255,0.1)',
                  background: currency === c.value ? 'rgba(99,91,255,0.15)' : 'transparent',
                  color: currency === c.value ? '#635bff' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {c.symbol} {c.label}
              </button>
            ))}
          </div>

          {/* Amount Selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => { setSelectedAmount(amt); setIsCustom(false); setError(null); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: !isCustom && selectedAmount === amt ? '1px solid #635bff' : '1px solid rgba(255,255,255,0.1)',
                  background: !isCustom && selectedAmount === amt ? 'rgba(99,91,255,0.15)' : 'transparent',
                  color: !isCustom && selectedAmount === amt ? '#635bff' : 'var(--text-muted)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {currencyInfo.symbol}{amt}
              </button>
            ))}
            <button
              onClick={() => { setIsCustom(true); setError(null); }}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: isCustom ? '1px solid #635bff' : '1px solid rgba(255,255,255,0.1)',
                background: isCustom ? 'rgba(99,91,255,0.15)' : 'transparent',
                color: isCustom ? '#635bff' : 'var(--text-muted)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Eigener Betrag
            </button>
          </div>

          {/* Custom Amount Input */}
          {isCustom && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{currencyInfo.symbol}</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  placeholder="Betrag"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setError(null); }}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{error}</div>
          )}

          {/* Donate Button */}
          <button
            onClick={handleDonate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 8,
              border: 'none',
              background: loading ? 'rgba(99,91,255,0.4)' : '#635bff',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Weiterleitung…' : `${currencyInfo.symbol}${isCustom ? (customAmount || '0') : selectedAmount} spenden`}
          </button>
        </div>

        {/* Footer */}
        <div className="sponsor-footer">
          <a href="mailto:info@blackice-secure.space" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            info@blackice-secure.space
          </a>
          <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>·</span>
          <a
            href="https://blackice-secure.space"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}
          >
            blackice-secure.space ↗
          </a>
        </div>
      </div>
    </div>
  );
}
