export default function Footer() {
  return (
    <footer
      className="flex items-center justify-between px-8 py-4 border-t"
      style={{
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-primary)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        Valtheron Agentic Workspace v1.0.0
      </span>
      <div className="flex items-center gap-4">
        <a
          href="#"
          className="transition-colors hover:opacity-80"
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          Documentation
        </a>
        <a
          href="#"
          className="transition-colors hover:opacity-80"
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          Support
        </a>
        <a
          href="#"
          className="transition-colors hover:opacity-80"
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          Privacy
        </a>
      </div>
    </footer>
  );
}
