// Certification scoring — deterministic derivation of an agent's
// certification from REAL signals only. No Math.random, no fabricated
// numbers: identical inputs always yield an identical certification.
//
// This replaces the former frontend mock (generateCertifications in
// mockData.ts), which invented levels, scores, expiry dates and test
// results with Math.random(). Here every field is traceable to:
//   - the agent's stored systemPrompt (technical config integrity),
//   - its computed capability profile,
//   - its computed Forseti profile,
//   - its real testResults,
//   - its real successRate / task counts.
//
// Mapping to the handbook's certification gates (Kapitel 9):
//   Technical Validation  → config + prompt present, capability computed
//   Forseti Verification  → Forseti profile computed
// Higher handbook levels (Expert Review, Field Testing) require human
// assessment and 30+ days of production data we do not have, so they are
// intentionally NOT auto-granted. The bronze→platinum tiers below describe
// the automated certification reachable from real signals alone.

export type CertLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
export type CertStatus = 'valid' | 'expiring' | 'expired' | 'suspended' | 'revoked';

export interface CertificationTest {
  name: string;
  passed: boolean;
  score: number;
}

export interface Certification {
  id: string;
  agentId: string;
  agentName: string;
  level: CertLevel;
  status: CertStatus;
  score: number;
  issuedAt: string;
  expiresAt: string;
  tests: CertificationTest[];
  monitoringAlerts: Array<{
    id: string;
    type: 'performance' | 'compliance' | 'security' | 'availability';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

export interface CertificationInput {
  id: string;
  name: string;
  agentStatus: string;
  successRate: number;
  tasksCompleted: number;
  failedTasks: number;
  systemPrompt: string;
  createdAt: string | null;
  lastActivity: string | null;
  testResults: Array<{ category: string; name: string; passed: boolean }>;
  capabilityComputed: boolean;
  capabilityAvg: number | null; // 0–100, average across capability layers
  forsetiComputed: boolean;
  forsetiUnifiedLevel: number | null; // 0–9
}

const CERT_VALIDITY_DAYS = 365;
const EXPIRING_WINDOW_DAYS = 30;

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/**
 * Deterministically compute an agent's certification. Pure function:
 * no clock-dependent randomness — only `now` (for status/expiry math) and
 * the agent's stored signals.
 */
export function computeCertification(input: CertificationInput, now: Date = new Date()): Certification {
  const gateTechnical = input.systemPrompt.trim().length > 0;
  const gateCapability = input.capabilityComputed;
  const gateForseti = input.forsetiComputed;

  const total = input.testResults.length;
  const passedCount = input.testResults.filter((t) => t.passed).length;
  const testPassRate = total > 0 ? passedCount / total : 0;
  const allTestsPassed = total > 0 && passedCount === total;

  const capAvg = gateCapability && input.capabilityAvg !== null ? input.capabilityAvg : 0;
  const forsetiScore = gateForseti && input.forsetiUnifiedLevel !== null ? (input.forsetiUnifiedLevel / 9) * 100 : 0;

  // Score reflects certification STRENGTH (validation quality), not raw
  // success rate alone — most catalog agents have no production track record
  // yet (successRate 0), so weighting only that would render the score
  // meaningless. Weights: test pass rate 35 %, capability profile 35 %,
  // Forseti 15 %, real success rate 15 %.
  const score = Math.round(
    clamp(0.35 * testPassRate * 100 + 0.35 * capAvg + 0.15 * forsetiScore + 0.15 * input.successRate, 0, 100),
  );

  // Level: validation gates first (reachable without production data, per the
  // handbook's TECHNICAL_VALID / FORSETI_VERIFIED stages); platinum is gated
  // on real production performance (successRate ≥ 90), mirroring FIELD_TESTED.
  let level: CertLevel;
  if (gateTechnical && gateCapability && gateForseti && allTestsPassed && input.successRate >= 90) {
    level = 'platinum';
  } else if (gateTechnical && gateCapability && gateForseti && testPassRate >= 0.8) {
    level = 'gold';
  } else if (gateTechnical && gateCapability && testPassRate >= 0.6) {
    level = 'silver';
  } else {
    level = 'bronze';
  }

  // Tests: the three automated gates + the agent's real testResults.
  const tests: CertificationTest[] = [
    {
      name: 'Technical Validation (Config & System Prompt)',
      passed: gateTechnical,
      score: gateTechnical ? 100 : 0,
    },
    {
      name: 'Capability Profile (30 Metriken)',
      passed: gateCapability,
      score: gateCapability && input.capabilityAvg !== null ? Math.round(input.capabilityAvg) : 0,
    },
    {
      name: 'Forseti Verification (Power Level)',
      passed: gateForseti,
      score: gateForseti && input.forsetiUnifiedLevel !== null ? Math.round((input.forsetiUnifiedLevel / 9) * 100) : 0,
    },
    ...input.testResults.map((t) => ({
      name: `${t.category}: ${t.name}`,
      passed: t.passed,
      score: t.passed ? 100 : 0,
    })),
  ];

  // Issued at the agent's creation; valid for one year.
  const issued = input.createdAt ?? input.lastActivity ?? now.toISOString();
  const issuedDate = new Date(issued);
  const expiresDate = new Date(issuedDate.getTime() + CERT_VALIDITY_DAYS * 86_400_000);

  let status: CertStatus;
  if (input.agentStatus === 'suspended') {
    status = 'suspended';
  } else if (expiresDate.getTime() < now.getTime()) {
    status = 'expired';
  } else if (expiresDate.getTime() < now.getTime() + EXPIRING_WINDOW_DAYS * 86_400_000) {
    status = 'expiring';
  } else {
    status = 'valid';
  }

  // Monitoring alert derived from a real signal: a sub-target success rate.
  const monitoringAlerts: Certification['monitoringAlerts'] = [];
  if (input.successRate < 90) {
    monitoringAlerts.push({
      id: `ma-${input.id}-perf`,
      type: 'performance',
      severity: input.successRate < 80 ? 'high' : 'medium',
      message: `Erfolgsrate ${input.successRate}% unter Zielwert 90% — Beobachtung empfohlen.`,
      timestamp: input.lastActivity ?? now.toISOString(),
      resolved: false,
    });
  }

  return {
    id: `cert-${input.id}`,
    agentId: input.id,
    agentName: input.name,
    level,
    status,
    score,
    issuedAt: issuedDate.toISOString(),
    expiresAt: expiresDate.toISOString(),
    tests,
    monitoringAlerts,
  };
}
