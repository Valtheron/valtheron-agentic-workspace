interface SponsorModalProps {
  onClose: () => void;
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

export default function SponsorModal({ onClose }: SponsorModalProps) {
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
