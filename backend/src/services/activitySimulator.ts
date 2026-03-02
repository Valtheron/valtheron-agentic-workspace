/**
 * @deprecated Activity Simulator removed.
 * Agent statuses, task progress, and metrics are now driven by real
 * execution (executionEngine.ts, workflowEngine.ts, metricsRecorder.ts).
 *
 * This file is kept as a no-op stub so existing imports don't break.
 */
export function startActivitySimulator() {
  console.log('[ActivitySimulator] Disabled — real execution engine active.');
}
