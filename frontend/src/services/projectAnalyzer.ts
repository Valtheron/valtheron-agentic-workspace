import type { Project, ProjectRequirement, ProjectFile, Workflow, WorkflowStep, Agent } from '../types';

// Fetch and analyze a URL to extract project requirements
export async function fetchAndAnalyzeUrl(url: string): Promise<{
  title: string;
  technologies: string[];
  features: string[];
  pages: string[];
  apiEndpoints: string[];
  components: string[];
  rawContent: string;
}> {
  // Try fetching via CORS proxy or directly
  let html = '';
  const proxies = [
    url, // direct attempt first
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        html = await res.text();
        if (html.length > 100) break;
      }
    } catch { /* try next proxy */ }
  }

  if (!html || html.length < 50) {
    // Return a structure based on URL analysis alone
    return analyzeFromUrl(url);
  }

  return analyzeHtml(html, url);
}

function analyzeFromUrl(url: string): {
  title: string; technologies: string[]; features: string[];
  pages: string[]; apiEndpoints: string[]; components: string[]; rawContent: string;
} {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  const projectName = pathParts[pathParts.length - 1]?.replace(/\.\w+$/, '') || pathParts[0] || urlObj.hostname;

  // Infer from URL path
  const isTradingBot = /trading|bot|crypto|forex|market/i.test(url);
  const isDashboard = /dashboard|admin|panel/i.test(url);

  const technologies: string[] = ['HTML5', 'CSS3', 'JavaScript'];
  const features: string[] = [];
  const components: string[] = [];

  if (isTradingBot) {
    technologies.push('WebSocket', 'REST API', 'Chart.js/D3.js');
    features.push(
      'Trading Bot Dashboard', 'Echtzeit-Kursanzeige', 'Bot-Konfiguration',
      'Portfolio-Übersicht', 'Trade-History', 'Gewinn/Verlust-Tracking',
      'API-Integration (Exchanges)', 'Risiko-Management', 'Alarm-System',
      'Multi-Bot-Verwaltung', 'Backtesting-Modul', 'Performance-Charts'
    );
    components.push(
      'Header/Navigation', 'TradingChart', 'BotManager', 'PortfolioView',
      'TradeHistory', 'PnLChart', 'ConfigPanel', 'AlertsPanel',
      'ExchangeConnector', 'RiskDashboard', 'BacktestRunner'
    );
  } else if (isDashboard) {
    technologies.push('React/Vue', 'REST API');
    features.push('Dashboard', 'Datenvisualisierung', 'Benutzerverwaltung', 'Settings');
    components.push('Sidebar', 'Header', 'Charts', 'DataTable', 'Settings');
  } else {
    features.push('Landing Page', 'Navigation', 'Content Sections', 'Footer');
    components.push('Header', 'Hero', 'Features', 'Footer');
  }

  return {
    title: projectName.charAt(0).toUpperCase() + projectName.slice(1),
    technologies,
    features,
    pages: [urlObj.pathname || '/index.html'],
    apiEndpoints: isTradingBot ? ['/api/bots', '/api/trades', '/api/portfolio', '/api/market-data'] : [],
    components,
    rawContent: `URL: ${url}\nAnalyzed from URL structure.`,
  };
}

function analyzeHtml(html: string, url: string): {
  title: string; technologies: string[]; features: string[];
  pages: string[]; apiEndpoints: string[]; components: string[]; rawContent: string;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const title = doc.querySelector('title')?.textContent?.trim() || 'Unnamed Project';
  const technologies: string[] = ['HTML5', 'CSS3'];
  const features: string[] = [];
  const pages: string[] = [new URL(url).pathname];
  const components: string[] = [];
  const apiEndpoints: string[] = [];

  // Detect technologies from scripts/links
  const scripts = Array.from(doc.querySelectorAll('script[src]')).map(s => s.getAttribute('src') || '');
  const links = Array.from(doc.querySelectorAll('link[href]')).map(l => l.getAttribute('href') || '');
  const allSrc = [...scripts, ...links].join(' ').toLowerCase();
  const bodyText = doc.body?.textContent?.toLowerCase() || '';
  const allHtml = html.toLowerCase();

  if (allSrc.includes('react') || allHtml.includes('react')) technologies.push('React');
  if (allSrc.includes('vue') || allHtml.includes('vue')) technologies.push('Vue.js');
  if (allSrc.includes('angular') || allHtml.includes('angular')) technologies.push('Angular');
  if (allSrc.includes('chart') || allHtml.includes('chart.js')) technologies.push('Chart.js');
  if (allSrc.includes('d3') || allHtml.includes('d3.js')) technologies.push('D3.js');
  if (allSrc.includes('bootstrap') || allHtml.includes('bootstrap')) technologies.push('Bootstrap');
  if (allSrc.includes('tailwind') || allHtml.includes('tailwind')) technologies.push('Tailwind CSS');
  if (allSrc.includes('websocket') || allHtml.includes('websocket') || allHtml.includes('ws://') || allHtml.includes('wss://')) technologies.push('WebSocket');
  if (allHtml.includes('typescript') || allSrc.includes('.ts')) technologies.push('TypeScript');
  technologies.push('JavaScript');

  // Detect features from content
  const featureKeywords: Record<string, string> = {
    'trading': 'Trading-Funktionalität', 'bot': 'Bot-Management', 'chart': 'Chart-Visualisierung',
    'portfolio': 'Portfolio-Übersicht', 'dashboard': 'Dashboard', 'login': 'Authentifizierung',
    'api': 'API-Integration', 'websocket': 'Echtzeit-Daten', 'table': 'Datentabellen',
    'form': 'Formulare', 'modal': 'Modal-Dialoge', 'notification': 'Benachrichtigungen',
    'search': 'Suchfunktion', 'filter': 'Filter-System', 'settings': 'Einstellungen',
    'crypto': 'Kryptowährung', 'exchange': 'Exchange-Anbindung', 'wallet': 'Wallet-Integration',
    'order': 'Order-Management', 'backtest': 'Backtesting', 'strategy': 'Strategie-Editor',
    'risk': 'Risiko-Management', 'alert': 'Alert-System', 'history': 'Transaktions-Historie',
  };

  for (const [keyword, feature] of Object.entries(featureKeywords)) {
    if (bodyText.includes(keyword) || allHtml.includes(keyword)) {
      features.push(feature);
    }
  }
  if (features.length === 0) features.push('Web-Applikation');

  // Detect components from HTML structure
  const sections = doc.querySelectorAll('section, [class*="section"], [id*="section"]');
  sections.forEach(sec => {
    const name = sec.getAttribute('id') || sec.getAttribute('class')?.split(' ')[0] || '';
    if (name) components.push(name);
  });

  const navs = doc.querySelectorAll('nav, [class*="nav"], header');
  if (navs.length > 0) components.push('Navigation');
  if (doc.querySelector('footer, [class*="footer"]')) components.push('Footer');

  // Detect links as pages
  const internalLinks = Array.from(doc.querySelectorAll('a[href]'))
    .map(a => a.getAttribute('href') || '')
    .filter(h => h.startsWith('/') || h.startsWith('./') || (!h.includes('://') && h.endsWith('.html')));
  pages.push(...[...new Set(internalLinks)].slice(0, 10));

  // Detect API endpoints from JavaScript
  const scriptContents = Array.from(doc.querySelectorAll('script:not([src])')).map(s => s.textContent || '');
  const allJs = scriptContents.join('\n');
  const apiMatches = allJs.match(/['"`](\/api\/[^'"`\s]+)['"`]/g) || [];
  apiEndpoints.push(...apiMatches.map(m => m.replace(/['"`]/g, '')));
  const fetchMatches = allJs.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/g) || [];
  fetchMatches.forEach(m => {
    const urlMatch = m.match(/['"`]([^'"`]+)['"`]/);
    if (urlMatch) apiEndpoints.push(urlMatch[1]);
  });

  return {
    title, technologies: [...new Set(technologies)], features: [...new Set(features)],
    pages: [...new Set(pages)], apiEndpoints: [...new Set(apiEndpoints)],
    components: [...new Set(components)],
    rawContent: html.slice(0, 5000),
  };
}

// Generate requirements from analysis
export function generateRequirements(analysis: NonNullable<Project['analyzedStructure']>): ProjectRequirement[] {
  const reqs: ProjectRequirement[] = [];
  let idx = 0;

  // UI requirements from features
  for (const feature of analysis.features) {
    reqs.push({
      id: `req_${++idx}`,
      category: 'ui',
      title: feature,
      description: `Implementierung: ${feature}`,
      priority: idx <= 3 ? 'high' : 'medium',
      accepted: true,
    });
  }

  // Component requirements
  for (const comp of analysis.components.slice(0, 8)) {
    reqs.push({
      id: `req_${++idx}`,
      category: 'ui',
      title: `Komponente: ${comp}`,
      description: `UI-Komponente "${comp}" erstellen und integrieren`,
      priority: 'medium',
      accepted: true,
    });
  }

  // API requirements
  for (const endpoint of analysis.apiEndpoints) {
    reqs.push({
      id: `req_${++idx}`,
      category: 'api',
      title: `API: ${endpoint}`,
      description: `API-Endpoint ${endpoint} implementieren`,
      priority: 'high',
      accepted: true,
    });
  }

  // Tech-specific requirements
  if (analysis.technologies.some(t => t.includes('WebSocket'))) {
    reqs.push({ id: `req_${++idx}`, category: 'infra', title: 'WebSocket-Verbindung', description: 'Echtzeit-Datenverbindung via WebSocket implementieren', priority: 'high', accepted: true });
  }

  // Standard requirements
  reqs.push(
    { id: `req_${++idx}`, category: 'design', title: 'Responsives Design', description: 'Mobile-first responsive Layout', priority: 'medium', accepted: true },
    { id: `req_${++idx}`, category: 'security', title: 'Input-Validierung', description: 'Alle Eingaben serverseitig und clientseitig validieren', priority: 'high', accepted: true },
    { id: `req_${++idx}`, category: 'testing', title: 'Unit Tests', description: 'Kernfunktionalitäten mit Unit Tests abdecken', priority: 'medium', accepted: true },
    { id: `req_${++idx}`, category: 'infra', title: 'Build & Deploy Setup', description: 'Build-Pipeline und Deployment-Konfiguration', priority: 'low', accepted: true },
  );

  return reqs;
}

// Generate a workflow from project requirements
export function generateWorkflowFromProject(project: Project, agents: Agent[]): Workflow {
  const steps: WorkflowStep[] = [];
  let stepIdx = 0;

  const findAgent = (category: string) => {
    const matches = agents.filter(a => a.category === category && a.status !== 'suspended' && a.status !== 'error');
    return matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)].id : null;
  };

  // Step 1: Project Setup
  const setupId = `step_${++stepIdx}`;
  steps.push({
    id: setupId, name: 'Projekt-Setup',
    description: `Projektstruktur erstellen für "${project.name}". Tech-Stack: ${project.techStack.join(', ')}. Verzeichnisstruktur, package.json, Konfigurationsdateien.`,
    assignedAgentId: findAgent('development'),
    status: 'pending', dependsOn: [], output: null, progress: 0, estimatedDuration: 20, retries: 0,
  });

  // Step 2: Design/Architecture
  const archId = `step_${++stepIdx}`;
  steps.push({
    id: archId, name: 'Architektur & Design',
    description: `Architektur-Design für ${project.requirements.filter(r => r.accepted).length} Requirements. Komponentenstruktur, Datenfluss, API-Design definieren.`,
    assignedAgentId: findAgent('analyst'),
    status: 'pending', dependsOn: [setupId], output: null, progress: 0, estimatedDuration: 25, retries: 0,
  });

  // Step 3-N: Implementation per requirement category
  const catSteps: Record<string, string> = {};
  const categories = [...new Set(project.requirements.filter(r => r.accepted).map(r => r.category))];

  for (const cat of categories) {
    const catReqs = project.requirements.filter(r => r.category === cat && r.accepted);
    const agentCat = cat === 'ui' || cat === 'design' ? 'development' : cat === 'api' ? 'development' : cat === 'security' ? 'security' : cat === 'testing' ? 'qa' : cat === 'infra' ? 'deployment' : 'development';
    const catLabels: Record<string, string> = { ui: 'UI-Komponenten', logic: 'Business-Logik', api: 'API-Layer', data: 'Daten-Layer', security: 'Security', infra: 'Infrastruktur', testing: 'Tests', design: 'Design-System' };

    const stepId = `step_${++stepIdx}`;
    catSteps[cat] = stepId;
    steps.push({
      id: stepId, name: `${catLabels[cat] ?? cat} implementieren`,
      description: `${catReqs.length} Requirements umsetzen:\n${catReqs.map(r => `- ${r.title}: ${r.description}`).join('\n')}`,
      assignedAgentId: findAgent(agentCat),
      status: 'pending', dependsOn: [archId], output: null, progress: 0,
      estimatedDuration: 15 + catReqs.length * 8, retries: 0,
    });
  }

  // Integration step
  const integId = `step_${++stepIdx}`;
  steps.push({
    id: integId, name: 'Integration & Zusammenführung',
    description: 'Alle Komponenten zusammenführen, Routing einrichten, End-to-End-Integration.',
    assignedAgentId: findAgent('integration'),
    status: 'pending', dependsOn: Object.values(catSteps), output: null, progress: 0, estimatedDuration: 20, retries: 0,
  });

  // QA step
  const qaId = `step_${++stepIdx}`;
  steps.push({
    id: qaId, name: 'Qualitätssicherung & Tests',
    description: 'Code-Review, Unit Tests, Integration Tests, UI Tests durchführen.',
    assignedAgentId: findAgent('qa'),
    status: 'pending', dependsOn: [integId], output: null, progress: 0, estimatedDuration: 18, retries: 0,
  });

  // Security review
  const secId = `step_${++stepIdx}`;
  steps.push({
    id: secId, name: 'Security Review',
    description: 'Sicherheitsüberprüfung: Input-Validierung, XSS, CSRF, Dependency Audit.',
    assignedAgentId: findAgent('security'),
    status: 'pending', dependsOn: [integId], output: null, progress: 0, estimatedDuration: 15, retries: 0,
  });

  // Final deployment
  steps.push({
    id: `step_${++stepIdx}`, name: 'Build & Deployment',
    description: 'Finaler Build, Optimierung, Deployment-Package erstellen.',
    assignedAgentId: findAgent('deployment'),
    status: 'pending', dependsOn: [qaId, secId], output: null, progress: 0, estimatedDuration: 12, retries: 0,
  });

  return {
    id: `wf_proj_${project.id}`,
    name: `Projekt: ${project.name}`,
    description: `Auto-generierter Workflow für "${project.name}" (${project.sourceUrl ?? 'manuell'})`,
    status: 'draft',
    steps,
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    tags: ['auto-generated', 'projekt', ...project.techStack.slice(0, 3)],
  };
}

// Generate project files based on project structure (simulated code generation)
export function generateProjectFiles(project: Project): ProjectFile[] {
  const files: ProjectFile[] = [];
  const ts = new Date().toISOString();
  const techStack = project.techStack;
  const isReact = techStack.some(t => /react|typescript/i.test(t));
  const hasApi = project.requirements.some(r => r.category === 'api' && r.accepted);
  const isTradingBot = project.requirements.some(r => /trading|bot|crypto/i.test(r.title));
  let fileIdx = 0;

  // package.json
  files.push({
    id: `file_${++fileIdx}`, path: 'package.json', language: 'json',
    content: JSON.stringify({
      name: project.name.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0', private: true, type: 'module',
      scripts: { dev: 'vite', build: 'tsc -b && vite build', preview: 'vite preview' },
      dependencies: {
        ...(isReact ? { react: '^19.0.0', 'react-dom': '^19.0.0' } : {}),
        ...(isTradingBot ? { 'lightweight-charts': '^4.0.0', 'date-fns': '^3.0.0' } : {}),
      },
      devDependencies: {
        ...(isReact ? { '@vitejs/plugin-react': '^5.0.0', typescript: '~5.9.0', vite: '^7.0.0' } : {}),
      },
    }, null, 2),
    generatedBy: 'agent_041', generatedAt: ts, status: 'generated', size: 0,
  });

  // index.html
  files.push({
    id: `file_${++fileIdx}`, path: 'index.html', language: 'html',
    content: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.analyzedStructure?.title ?? project.name}</title>
  <link rel="stylesheet" href="/src/styles/main.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.${isReact ? 'tsx' : 'ts'}"></script>
</body>
</html>`,
    generatedBy: 'agent_041', generatedAt: ts, status: 'generated', size: 0,
  });

  // Main entry
  if (isReact) {
    files.push({
      id: `file_${++fileIdx}`, path: 'src/main.tsx', language: 'typescript',
      content: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/main.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
);`,
      generatedBy: 'agent_041', generatedAt: ts, status: 'generated', size: 0,
    });
  }

  // Main CSS
  files.push({
    id: `file_${++fileIdx}`, path: 'src/styles/main.css', language: 'css',
    content: `/* ${project.name} - Hauptstyles */
:root {
  --bg-primary: #0a0e1a;
  --bg-secondary: #111827;
  --text-primary: #e2e8f0;
  --text-muted: #64748b;
  --accent: #00e5ff;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, sans-serif; background: var(--bg-primary); color: var(--text-primary); }
`,
    generatedBy: 'agent_081', generatedAt: ts, status: 'generated', size: 0,
  });

  // App component
  if (isReact) {
    const componentImports = (project.analyzedStructure?.components ?? []).slice(0, 6);
    files.push({
      id: `file_${++fileIdx}`, path: 'src/App.tsx', language: 'typescript',
      content: `import { useState } from 'react';
${componentImports.map(c => `import ${c.replace(/[^a-zA-Z]/g, '')} from './components/${c.replace(/[^a-zA-Z]/g, '')}';`).join('\n')}

export default function App() {
  const [view, setView] = useState('dashboard');

  return (
    <div className="app">
      <nav className="sidebar">
        <h2>${project.name}</h2>
        {/* Navigation */}
      </nav>
      <main className="content">
        {/* TODO: Implement view routing */}
        <h1>Willkommen bei ${project.name}</h1>
      </main>
    </div>
  );
}`,
      generatedBy: 'agent_041', generatedAt: ts, status: 'generated', size: 0,
    });
  }

  // Trading-specific files
  if (isTradingBot) {
    files.push({
      id: `file_${++fileIdx}`, path: 'src/types/index.ts', language: 'typescript',
      content: `// Trading Bot Type Definitions

export interface Bot {
  id: string;
  name: string;
  strategy: string;
  status: 'active' | 'paused' | 'stopped' | 'error';
  exchange: string;
  tradingPair: string;
  pnl: number;
  totalTrades: number;
  winRate: number;
  createdAt: string;
}

export interface Trade {
  id: string;
  botId: string;
  type: 'buy' | 'sell';
  pair: string;
  price: number;
  amount: number;
  total: number;
  pnl: number;
  timestamp: string;
  status: 'executed' | 'pending' | 'cancelled';
}

export interface MarketData {
  pair: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: string;
}

export interface Portfolio {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  assets: { symbol: string; amount: number; value: number; change: number }[];
}
`,
      generatedBy: 'agent_041', generatedAt: ts, status: 'generated', size: 0,
    });

    files.push({
      id: `file_${++fileIdx}`, path: 'src/services/exchangeApi.ts', language: 'typescript',
      content: `// Exchange API Service
// Handles connection to crypto exchanges

export interface ExchangeConfig {
  name: string;
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  wsUrl: string;
}

export async function fetchMarketData(config: ExchangeConfig, pair: string) {
  const res = await fetch(\`\${config.baseUrl}/api/v1/ticker/\${pair}\`);
  return res.json();
}

export function connectWebSocket(config: ExchangeConfig, pair: string, onMessage: (data: unknown) => void) {
  const ws = new WebSocket(\`\${config.wsUrl}/ws/\${pair.toLowerCase()}@ticker\`);
  ws.onmessage = (e) => onMessage(JSON.parse(e.data));
  ws.onerror = (e) => console.error('WebSocket error:', e);
  return ws;
}

export async function placeBotOrder(config: ExchangeConfig, side: 'buy' | 'sell', pair: string, amount: number) {
  // TODO: Implement actual order placement
  return { orderId: crypto.randomUUID(), status: 'pending', side, pair, amount };
}
`,
      generatedBy: 'agent_041', generatedAt: ts, status: 'generated', size: 0,
    });

    files.push({
      id: `file_${++fileIdx}`, path: 'src/components/TradingChart.tsx', language: 'typescript',
      content: `import { useEffect, useRef } from 'react';

interface TradingChartProps {
  pair: string;
  data: { time: number; open: number; high: number; low: number; close: number }[];
}

export default function TradingChart({ pair, data }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    // TODO: Initialize lightweight-charts here
    // const chart = createChart(containerRef.current, { ... });
  }, [data]);

  return (
    <div className="trading-chart">
      <div className="chart-header">
        <h3>{pair}</h3>
        <span className="chart-timeframe">1H | 4H | 1D | 1W</span>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: 400 }} />
    </div>
  );
}
`,
      generatedBy: 'agent_042', generatedAt: ts, status: 'generated', size: 0,
    });

    files.push({
      id: `file_${++fileIdx}`, path: 'src/components/BotManager.tsx', language: 'typescript',
      content: `import { useState } from 'react';
import type { Bot } from '../types';

interface BotManagerProps {
  bots: Bot[];
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onCreate: (bot: Partial<Bot>) => void;
}

export default function BotManager({ bots, onStart, onStop, onCreate }: BotManagerProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [strategy, setStrategy] = useState('');
  const [pair, setPair] = useState('BTC/USDT');

  const handleCreate = () => {
    onCreate({ name, strategy, tradingPair: pair, status: 'paused', exchange: 'binance' });
    setCreating(false);
    setName(''); setStrategy('');
  };

  return (
    <div className="bot-manager">
      <div className="bot-header">
        <h3>Trading Bots ({bots.length})</h3>
        <button onClick={() => setCreating(true)}>+ Neuer Bot</button>
      </div>
      {creating && (
        <div className="bot-form">
          <input placeholder="Bot-Name" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Strategie" value={strategy} onChange={e => setStrategy(e.target.value)} />
          <select value={pair} onChange={e => setPair(e.target.value)}>
            <option>BTC/USDT</option><option>ETH/USDT</option><option>SOL/USDT</option>
          </select>
          <button onClick={handleCreate}>Erstellen</button>
        </div>
      )}
      {bots.map(bot => (
        <div key={bot.id} className="bot-card">
          <div className="bot-info">
            <strong>{bot.name}</strong>
            <span>{bot.tradingPair} | {bot.strategy}</span>
            <span className={\`status \${bot.status}\`}>{bot.status}</span>
          </div>
          <div className="bot-stats">
            <span>PnL: {bot.pnl >= 0 ? '+' : ''}{bot.pnl.toFixed(2)}%</span>
            <span>Trades: {bot.totalTrades}</span>
            <span>Win: {bot.winRate}%</span>
          </div>
          <div className="bot-actions">
            {bot.status === 'paused' && <button onClick={() => onStart(bot.id)}>Start</button>}
            {bot.status === 'active' && <button onClick={() => onStop(bot.id)}>Stop</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
`,
      generatedBy: 'agent_042', generatedAt: ts, status: 'generated', size: 0,
    });
  }

  // Calculate file sizes
  files.forEach(f => { f.size = new Blob([f.content]).size; });

  return files;
}
