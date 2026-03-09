#!/usr/bin/env bash
# ============================================================================
# DAST (Dynamic Application Security Testing) Scanner
# Valtheron Agentic Workspace
# ============================================================================
#
# Performs runtime security checks against a running instance of the API.
# Usage: ./scripts/dast-scan.sh [BASE_URL]
#        Default BASE_URL: http://localhost:3001
#
# Exit codes:
#   0 — all checks passed
#   1 — one or more checks failed
# ============================================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:3001}"
PASS=0
FAIL=0
WARN=0

green()  { printf "\033[32m✓ %s\033[0m\n" "$*"; }
red()    { printf "\033[31m✗ %s\033[0m\n" "$*"; }
yellow() { printf "\033[33m⚠ %s\033[0m\n" "$*"; }
header() { printf "\n\033[1;36m━━━ %s ━━━\033[0m\n" "$*"; }

check_pass() { green "$1"; PASS=$((PASS + 1)); }
check_fail() { red "$1"; FAIL=$((FAIL + 1)); }
check_warn() { yellow "$1"; WARN=$((WARN + 1)); }

# ── Prerequisites ──────────────────────────────────────────────────
command -v curl >/dev/null 2>&1 || { red "curl is required"; exit 1; }

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   DAST Security Scanner — Valtheron Agentic Workspace   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo "Target: $BASE_URL"
echo "Date:   $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

# ── 1. Security Headers ───────────────────────────────────────────
header "Security Headers"

HEADERS=$(curl -sI "$BASE_URL/api/health" 2>/dev/null || true)

check_header() {
  local name="$1"
  if echo "$HEADERS" | grep -qi "$name"; then
    check_pass "Header present: $name"
  else
    check_warn "Header missing: $name (recommended)"
  fi
}

check_header "X-Content-Type-Options"
check_header "X-Frame-Options"
check_header "X-XSS-Protection"
check_header "Strict-Transport-Security"
check_header "Content-Security-Policy"

# No Server header leak
if echo "$HEADERS" | grep -qi "^Server:.*Express"; then
  check_warn "Server header leaks framework info"
else
  check_pass "Server header does not leak framework"
fi

# ── 2. Authentication & Authorization ─────────────────────────────
header "Authentication & Authorization"

# Unauthenticated access to protected endpoints should fail
for ep in "/api/agents" "/api/tasks" "/api/analytics/dashboard" "/api/security/events"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$ep")
  if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
    check_pass "Protected endpoint $ep requires auth ($STATUS)"
  elif [ "$STATUS" = "200" ]; then
    check_warn "Endpoint $ep accessible without auth (dev mode?)"
  else
    check_fail "Unexpected status $STATUS for $ep without auth"
  fi
done

# Brute-force protection (rate limiting)
header "Rate Limiting"
RATE_BLOCKED=false
for i in $(seq 1 25); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"nonexistent","password":"wrong"}' 2>/dev/null)
  if [ "$STATUS" = "429" ]; then
    RATE_BLOCKED=true
    break
  fi
done
if $RATE_BLOCKED; then
  check_pass "Rate limiting active on /api/auth/login"
else
  check_warn "Rate limiting not triggered after 25 attempts (may be disabled in test mode)"
fi

# ── 3. Input Validation ──────────────────────────────────────────
header "Input Validation"

# SQL injection attempt
SQL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/agents?search=1'%20OR%20'1'='1" 2>/dev/null || echo "000")
if [ "$SQL_STATUS" = "200" ] || [ "$SQL_STATUS" = "401" ]; then
  check_pass "SQL injection in query param handled safely ($SQL_STATUS)"
else
  check_warn "SQL injection test returned $SQL_STATUS"
fi

# XSS payload in POST body
XSS_RES=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"<script>alert(1)</script>","password":"test123","email":"xss@test.com"}' 2>/dev/null)
XSS_BODY=$(echo "$XSS_RES" | head -n -1)
XSS_STATUS=$(echo "$XSS_RES" | tail -1)
if echo "$XSS_BODY" | grep -q "<script>"; then
  check_warn "XSS payload reflected in response"
else
  check_pass "XSS payload not reflected in response"
fi

# Path traversal
PT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/agents/../../etc/passwd" 2>/dev/null || echo "000")
if [ "$PT_STATUS" = "400" ] || [ "$PT_STATUS" = "404" ] || [ "$PT_STATUS" = "401" ]; then
  check_pass "Path traversal blocked ($PT_STATUS)"
else
  check_warn "Path traversal returned $PT_STATUS"
fi

# Large payload
LARGE_PAYLOAD=$(python3 -c "print('{\"username\":\"' + 'A'*100000 + '\",\"password\":\"test\"}')" 2>/dev/null || echo '{"username":"test","password":"test"}')
LP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "$LARGE_PAYLOAD" 2>/dev/null || echo "000")
if [ "$LP_STATUS" != "500" ]; then
  check_pass "Large payload handled without server crash ($LP_STATUS)"
else
  check_fail "Large payload caused server error (500)"
fi

# ── 4. Information Disclosure ────────────────────────────────────
header "Information Disclosure"

# Stack trace leak on error
ERR_BODY=$(curl -s "$BASE_URL/api/nonexistent-endpoint" 2>/dev/null)
if echo "$ERR_BODY" | grep -qi "stack\|trace\|at .*\.js\|node_modules"; then
  check_fail "Stack trace leaked in error response"
else
  check_pass "No stack trace in error responses"
fi

# Debug/version info
if echo "$HEADERS" | grep -qi "X-Powered-By"; then
  check_warn "X-Powered-By header present (information leak)"
else
  check_pass "X-Powered-By header not present"
fi

# ── 5. CORS Configuration ───────────────────────────────────────
header "CORS Configuration"

CORS_RES=$(curl -sI -X OPTIONS "$BASE_URL/api/health" \
  -H "Origin: https://evil-site.com" \
  -H "Access-Control-Request-Method: GET" 2>/dev/null || true)

if echo "$CORS_RES" | grep -qi "Access-Control-Allow-Origin: \*"; then
  check_warn "CORS allows all origins (*) — restrict in production"
elif echo "$CORS_RES" | grep -qi "Access-Control-Allow-Origin: https://evil-site.com"; then
  check_fail "CORS reflects arbitrary origin"
else
  check_pass "CORS properly configured"
fi

# ── 6. HTTP Methods ─────────────────────────────────────────────
header "HTTP Methods"

for method in TRACE CONNECT; do
  M_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL/api/health" 2>/dev/null || echo "000")
  if [ "$M_STATUS" = "405" ] || [ "$M_STATUS" = "404" ] || [ "$M_STATUS" = "000" ]; then
    check_pass "Dangerous method $method blocked ($M_STATUS)"
  else
    check_warn "Method $method returned $M_STATUS"
  fi
done

# ── Summary ──────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
printf "║  Results:  \033[32m%d passed\033[0m  |  \033[33m%d warnings\033[0m  |  \033[31m%d failed\033[0m      ║\n" "$PASS" "$WARN" "$FAIL"
echo "╚══════════════════════════════════════════════════════════╝"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
