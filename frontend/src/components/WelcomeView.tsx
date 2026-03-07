import { useState } from 'react';

interface WelcomeViewProps {
  username: string;
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Willkommen bei Valtheron',
    description:
      'Dein Workspace zur Steuerung von KI-Agenten. Hier erstellst du Agenten, vergibst Aufgaben, baust Workflows und behältst alles im Blick.',
    icon: 'V',
  },
  {
    title: 'Agenten erstellen',
    description:
      'Erstelle spezialisierte KI-Agenten für verschiedene Aufgaben: Entwicklung, Sicherheit, Analyse, Trading und mehr. Jeder Agent hat eigene Persönlichkeit, Parameter und LLM-Konfiguration.',
    icon: 'A',
  },
  {
    title: 'Aufgaben & Workflows',
    description:
      'Weise Agenten Aufgaben zu und verfolge den Fortschritt im Kanban-Board. Baue mehrstufige Workflows mit Abhängigkeiten — Schritte ohne Abhängigkeiten laufen automatisch parallel.',
    icon: 'W',
  },
  {
    title: 'Sicherheit & Monitoring',
    description:
      'Behalte die Kontrolle: Kill-Switch zum sofortigen Stoppen aller Agenten, Security-Events, Audit-Trail und Echtzeit-Analytics. Dein Workspace — deine Regeln.',
    icon: 'S',
  },
];

export default function WelcomeView({ username, onComplete }: WelcomeViewProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          padding: '3rem 2.5rem',
          width: '100%',
          maxWidth: 520,
          textAlign: 'center',
        }}
      >
        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: '2rem' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i === step ? 'var(--accent-cyan)' : 'var(--border-color)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>

        {/* Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: 'var(--accent-cyan)',
            color: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 700,
            margin: '0 auto 1.5rem',
          }}
        >
          {current.icon}
        </div>

        {/* Content */}
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
          {step === 0 ? `Hallo ${username}!` : current.title}
        </h1>
        <p
          style={{
            margin: '0 0 2rem',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          {current.description}
        </p>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)} style={{ minWidth: 100 }}>
              Zurück
            </button>
          )}
          {isLast ? (
            <button className="btn btn-primary" onClick={onComplete} style={{ minWidth: 160 }}>
              Los geht&apos;s
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)} style={{ minWidth: 100 }}>
              Weiter
            </button>
          )}
        </div>

        {/* Skip link */}
        {!isLast && (
          <button
            onClick={onComplete}
            style={{
              marginTop: '1.25rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Überspringen
          </button>
        )}
      </div>
    </div>
  );
}
