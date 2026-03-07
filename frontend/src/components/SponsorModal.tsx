interface SponsorModalProps {
  onClose: () => void;
}

const platforms = [
  {
    id: 'github',
    name: 'GitHub Sponsors',
    description: 'Support directly on GitHub — one-time or recurring.',
    url: 'https://github.com/sponsors/Valtheron',
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
    id: 'kofi',
    name: 'Ko-fi',
    description: 'Buy us a coffee — quick, no account needed.',
    url: 'https://ko-fi.com/valtheron',
    color: '#29abe0',
    bg: 'rgba(41,171,224,0.06)',
    border: 'rgba(41,171,224,0.2)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
        <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 2.interior 1.832 2.interior.14.848-.274 1.782-.109 2.311zm5.078.1c-.2.008-.42-.044-.638-.05a1.2 1.2 0 0 1-.026-.244V9.543c0-.787.643-1.43 1.435-1.43.793 0 1.436.643 1.436 1.43 0 1.566-1.215 2.516-2.207 2.516z" />
      </svg>
    ),
  },
  {
    id: 'patreon',
    name: 'Patreon',
    description: 'Become a monthly patron and get exclusive updates.',
    url: 'https://www.patreon.com/valtheron',
    color: '#ff424d',
    bg: 'rgba(255,66,77,0.06)',
    border: 'rgba(255,66,77,0.2)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
        <path d="M15.386.524a8.27 8.27 0 0 0-8.297 8.297c0 4.564 3.733 8.297 8.297 8.297 4.565 0 8.298-3.733 8.298-8.297C23.684 4.257 19.95.524 15.386.524zM.316 23.476h4.002V.524H.316v22.952z" />
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
        aria-label="Sponsor Valtheron"
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
            Valtheron Agentic Workspace is open-source and free.<br />
            If it saves you time or sparks ideas, consider supporting the project.
          </p>
          <button className="sponsor-close" onClick={onClose} aria-label="Close">✕</button>
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
          <span>Every contribution keeps the agents running.</span>
          <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>·</span>
          <a
            href="https://github.com/Valtheron/valtheron-agentic-workspace"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}
          >
            Star on GitHub ↗
          </a>
        </div>
      </div>
    </div>
  );
}
