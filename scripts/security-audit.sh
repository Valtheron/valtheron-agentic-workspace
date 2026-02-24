#!/usr/bin/env bash
# Security Audit Script — Phase 4
# Runs dependency vulnerability scanning for both backend and frontend.

set -euo pipefail

echo "╔══════════════════════════════════════════════════╗"
echo "║   VALTHERON - Security Audit                     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

EXIT_CODE=0

echo "=== Backend dependency audit ==="
cd "$(dirname "$0")/../backend"
npm audit --omit=dev 2>&1 || EXIT_CODE=$?
echo ""

echo "=== Frontend dependency audit ==="
cd "$(dirname "$0")/../frontend"
npm audit --omit=dev 2>&1 || EXIT_CODE=$?
echo ""

echo "=== Checking for known vulnerable patterns ==="
# Basic SAST: check for common insecure patterns
ISSUES=0

# Check for eval() usage
if grep -rn 'eval(' --include='*.ts' --include='*.tsx' ../backend/src ../frontend/src 2>/dev/null; then
  echo "WARNING: eval() usage detected"
  ISSUES=$((ISSUES + 1))
fi

# Check for hardcoded secrets (simple heuristic)
if grep -rn 'password\s*=\s*["\x27][^"\x27]\+["\x27]' --include='*.ts' --include='*.tsx' ../backend/src ../frontend/src 2>/dev/null | grep -v 'test\|spec\|example\|placeholder\|mock\|seed'; then
  echo "WARNING: Possible hardcoded passwords detected"
  ISSUES=$((ISSUES + 1))
fi

# Check for SQL injection patterns (string concatenation in queries)
if grep -rn "prepare(\`" --include='*.ts' ../backend/src 2>/dev/null | grep '\${'; then
  echo "WARNING: Possible SQL injection (template literal in prepare())"
  ISSUES=$((ISSUES + 1))
fi

echo ""
if [ $ISSUES -eq 0 ]; then
  echo "✓ No common vulnerability patterns detected in source code"
else
  echo "⚠ $ISSUES potential issue(s) found — review above"
fi

echo ""
echo "=== Audit complete ==="
exit $EXIT_CODE
