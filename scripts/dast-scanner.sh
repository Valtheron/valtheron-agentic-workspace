#!/usr/bin/env bash
# =============================================================
#  DAST Scanner — Dynamic Application Security Testing
#  Valtheron Agentic Workspace
# =============================================================
#
#  Usage:
#    ./scripts/dast-scanner.sh [--url http://localhost:3001]
#
#  Prerequisites:
#    - curl, jq
#    - Running backend server (npm run dev)
#
# =============================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:3001}"
API_URL="$BASE_URL/api"
REPORT_FILE="reports/dast-report-$(date +%Y%m%d-%H%M%S).json"

PASS=0
FAIL=0
WARN=0
RESULTS=()

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_pass() { PASS=$((PASS+1)); RESULTS+=("{\"test\":\"$1\",\"status\":\"pass\",\"detail\":\"$2\"}"); echo -e "${GREEN}[PASS]${NC} $1"; }
log_fail() { FAIL=$((FAIL+1)); RESULTS+=("{\"test\":\"$1\",\"status\":\"fail\",\"detail\":\"$2\"}"); echo -e "${RED}[FAIL]${NC} $1 — $2"; }
log_warn() { WARN=$((WARN+1)); RESULTS+=("{\"test\":\"$1\",\"status\":\"warn\",\"detail\":\"$2\"}"); echo -e "${YELLOW}[WARN]${NC} $1 — $2"; }

echo "============================================"
echo "  DAST Scanner — Valtheron Agentic Workspace"
echo "  Target: $BASE_URL"
echo "  Date:   $(date -Iseconds)"
echo "============================================"
echo ""

# -----------------------------------------------------------
# 0. Connectivity check
# -----------------------------------------------------------
echo "--- Connectivity ---"
if curl -sf "$API_URL/health" > /dev/null 2>&1; then
  log_pass "Server reachable" "Health endpoint responds"
else
  echo -e "${RED}Server not reachable at $API_URL — aborting${NC}"
  exit 1
fi

# -----------------------------------------------------------
# 1. Get auth token
# -----------------------------------------------------------
echo ""
echo "--- Authentication ---"
# Register test user (may already exist)
curl -sf -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"dast_scanner","password":"DastTest123!","email":"dast@test.com","role":"admin"}' > /dev/null 2>&1 || true

TOKEN=$(curl -sf -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"dast_scanner","password":"DastTest123!"}' | jq -r '.token // empty')

if [ -n "$TOKEN" ]; then
  log_pass "Authentication" "Successfully obtained JWT token"
else
  log_fail "Authentication" "Could not obtain JWT token"
  TOKEN=""
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"

# -----------------------------------------------------------
# 2. Security Headers
# -----------------------------------------------------------
echo ""
echo "--- Security Headers ---"
HEADERS=$(curl -sI "$API_URL/health")

if echo "$HEADERS" | grep -qi "x-powered-by"; then
  log_fail "X-Powered-By hidden" "Server exposes X-Powered-By header"
else
  log_pass "X-Powered-By hidden" "Not exposed"
fi

if echo "$HEADERS" | grep -qi "x-content-type-options"; then
  log_pass "X-Content-Type-Options" "Header present"
else
  log_warn "X-Content-Type-Options" "Header missing — recommend nosniff"
fi

if echo "$HEADERS" | grep -qi "x-frame-options"; then
  log_pass "X-Frame-Options" "Header present"
else
  log_warn "X-Frame-Options" "Header missing — recommend DENY or SAMEORIGIN"
fi

if echo "$HEADERS" | grep -qi "strict-transport-security"; then
  log_pass "HSTS" "Strict-Transport-Security present"
else
  log_warn "HSTS" "Header missing — recommend for production"
fi

# -----------------------------------------------------------
# 3. SQL Injection Tests
# -----------------------------------------------------------
echo ""
echo "--- SQL Injection ---"
SQLI_PAYLOADS=("' OR '1'='1" "'; DROP TABLE agents; --" "1 UNION SELECT * FROM users --")
SQLI_CLEAN=true

for payload in "${SQLI_PAYLOADS[@]}"; do
  STATUS=$(curl -so /dev/null -w "%{http_code}" "$API_URL/agents?search=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$payload'))" 2>/dev/null || echo "$payload")" \
    -H "$AUTH_HEADER" 2>/dev/null || echo "000")
  if [ "$STATUS" = "500" ]; then
    SQLI_CLEAN=false
    log_fail "SQL Injection ($payload)" "Server returned 500"
  fi
done

if $SQLI_CLEAN; then
  log_pass "SQL Injection" "No server errors from injection payloads"
fi

# -----------------------------------------------------------
# 4. XSS Tests
# -----------------------------------------------------------
echo ""
echo "--- XSS Testing ---"
XSS_PAYLOAD='<script>alert(1)</script>'
RESP=$(curl -sf -X POST "$API_URL/agents" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$XSS_PAYLOAD\",\"category\":\"xss\",\"status\":\"idle\"}" 2>/dev/null || echo "")

CONTENT_TYPE=$(curl -sI -X POST "$API_URL/agents" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"test\",\"category\":\"xss\",\"status\":\"idle\"}" 2>/dev/null | grep -i content-type || echo "")

if echo "$CONTENT_TYPE" | grep -qi "application/json"; then
  log_pass "XSS Content-Type" "API returns application/json (safe from reflected XSS)"
else
  log_warn "XSS Content-Type" "API may not return JSON content type"
fi

# -----------------------------------------------------------
# 5. Authentication Bypass
# -----------------------------------------------------------
echo ""
echo "--- Auth Bypass ---"
NO_AUTH_STATUS=$(curl -so /dev/null -w "%{http_code}" "$API_URL/backup/list" 2>/dev/null || echo "000")
if [ "$NO_AUTH_STATUS" = "401" ] || [ "$NO_AUTH_STATUS" = "403" ]; then
  log_pass "Auth required on sensitive endpoints" "Backup endpoint requires auth"
else
  log_warn "Auth on sensitive endpoints" "Backup endpoint returned $NO_AUTH_STATUS without auth"
fi

FAKE_TOKEN_STATUS=$(curl -so /dev/null -w "%{http_code}" "$API_URL/agents" \
  -H "Authorization: Bearer fake.invalid.token" 2>/dev/null || echo "000")
if [ "$FAKE_TOKEN_STATUS" = "401" ] || [ "$FAKE_TOKEN_STATUS" = "403" ]; then
  log_pass "Invalid token rejected" "Server rejects fake tokens"
elif [ "$FAKE_TOKEN_STATUS" = "500" ]; then
  log_fail "Invalid token handling" "Server crashes on fake token"
else
  log_warn "Invalid token handling" "Server returned $FAKE_TOKEN_STATUS for fake token"
fi

# -----------------------------------------------------------
# 6. Path Traversal
# -----------------------------------------------------------
echo ""
echo "--- Path Traversal ---"
TRAVERSAL_STATUS=$(curl -so /dev/null -w "%{http_code}" "$API_URL/files/..%2F..%2F..%2Fetc%2Fpasswd" \
  -H "$AUTH_HEADER" 2>/dev/null || echo "000")
if [ "$TRAVERSAL_STATUS" = "500" ]; then
  log_fail "Path traversal" "Server crashed on traversal attempt"
elif [ "$TRAVERSAL_STATUS" = "200" ]; then
  log_warn "Path traversal" "Returned 200 — verify response content"
else
  log_pass "Path traversal" "Blocked (status $TRAVERSAL_STATUS)"
fi

# -----------------------------------------------------------
# 7. Error Handling
# -----------------------------------------------------------
echo ""
echo "--- Error Handling ---"
ERR_RESP=$(curl -sf "$API_URL/nonexistent" -H "$AUTH_HEADER" 2>/dev/null || echo "{}")
if echo "$ERR_RESP" | grep -qi "stack\|node_modules\|/home/\|ENOENT"; then
  log_fail "Error info leak" "Error response exposes internal details"
else
  log_pass "Error info leak" "No internal details leaked"
fi

# -----------------------------------------------------------
# Summary
# -----------------------------------------------------------
echo ""
echo "============================================"
echo "  DAST Scan Results"
echo "============================================"
echo -e "  ${GREEN}PASS: $PASS${NC}"
echo -e "  ${RED}FAIL: $FAIL${NC}"
echo -e "  ${YELLOW}WARN: $WARN${NC}"
echo "  TOTAL: $((PASS + FAIL + WARN))"
echo ""

# Write report
mkdir -p "$(dirname "$REPORT_FILE")"
echo "{" > "$REPORT_FILE"
echo "  \"scan_date\": \"$(date -Iseconds)\"," >> "$REPORT_FILE"
echo "  \"target\": \"$BASE_URL\"," >> "$REPORT_FILE"
echo "  \"summary\": {\"pass\": $PASS, \"fail\": $FAIL, \"warn\": $WARN}," >> "$REPORT_FILE"
echo "  \"results\": [$(IFS=,; echo "${RESULTS[*]}")]" >> "$REPORT_FILE"
echo "}" >> "$REPORT_FILE"

echo "Report saved to $REPORT_FILE"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
