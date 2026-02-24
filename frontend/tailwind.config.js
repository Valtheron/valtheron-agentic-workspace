/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Map to existing CSS variables for consistency
        primary: {
          DEFAULT: '#00e5ff',
          foreground: '#060a14',
        },
        background: {
          DEFAULT: '#060a14',
          secondary: '#0c1120',
          surface: '#111827',
          card: '#151d2e',
          hover: '#1a2338',
          input: '#0f172a',
        },
        border: {
          DEFAULT: '#1e293b',
          active: '#334155',
        },
        text: {
          primary: '#e2e8f0',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
        accent: {
          cyan: '#00e5ff',
          teal: '#14b8a6',
          orange: '#f59e0b',
          red: '#ef4444',
          green: '#10b981',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          pink: '#ec4899',
        },
      },
      fontFamily: {
        mono: ["'SF Mono'", "'Fira Code'", "'JetBrains Mono'", "'Cascadia Code'", 'monospace'],
      },
    },
  },
  plugins: [],
  // Disable preflight to avoid conflicts with existing CSS
  corePlugins: {
    preflight: false,
  },
};
