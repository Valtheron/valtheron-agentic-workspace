#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
BACKEND_LOG=/tmp/valtheron-backend.log
FRONTEND_LOG=/tmp/valtheron-frontend.log
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "=== Installing dependencies ==="
cd "$ROOT"
npm run install:all --silent 2>&1 | tail -5

echo "=== Setting up backend env ==="
[ -f backend/.env ] || cp backend/.env.example backend/.env

echo "=== Starting backend (port 3001) ==="
cd "$ROOT/backend"
npx tsx watch src/server.ts > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

echo "Waiting for backend..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "Backend up after ${i}s"
    break
  fi
  [ "$i" -eq 30 ] && { echo "FAIL: backend did not start"; cat "$BACKEND_LOG"; exit 1; }
  sleep 1
done

echo "=== Starting frontend (port 5173) ==="
cd "$ROOT/frontend"
npx vite --host 0.0.0.0 --port 5173 > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

echo "Waiting for frontend..."
for i in $(seq 1 15); do
  if curl -sf http://localhost:5173/ > /dev/null 2>&1; then
    echo "Frontend up after ${i}s"
    break
  fi
  [ "$i" -eq 15 ] && { echo "FAIL: frontend did not start"; cat "$FRONTEND_LOG"; exit 1; }
  sleep 1
done

echo ""
echo "=== Smoke tests ==="

echo -n "Health check ... "
HEALTH=$(curl -sf http://localhost:3001/api/health)
echo "$HEALTH" | grep -q '"healthy"' && echo "OK" || { echo "FAIL: $HEALTH"; exit 1; }

echo -n "Agents endpoint ... "
AGENTS=$(curl -sf http://localhost:3001/api/agents)
COUNT=$(echo "$AGENTS" | grep -o '"id"' | wc -l)
echo "OK ($COUNT agents)"

echo -n "Analytics dashboard ... "
ANALYTICS=$(curl -sf http://localhost:3001/api/analytics/dashboard)
echo "$ANALYTICS" | grep -q '"totalAgents"' && echo "OK" || { echo "FAIL"; exit 1; }

echo -n "Security events ... "
SEC=$(curl -sf http://localhost:3001/api/security/events)
echo "$SEC" | grep -q '"events"' && echo "OK" || { echo "FAIL"; exit 1; }

echo -n "Kill switch status ... "
KS=$(curl -sf http://localhost:3001/api/security/kill-switch)
echo "$KS" | grep -qE '"aktiv"|"active"' && echo "OK" || { echo "FAIL"; exit 1; }

echo -n "Frontend serves HTML ... "
HTML=$(curl -sf http://localhost:5173/)
echo "$HTML" | grep -q '</html>' && echo "OK" || { echo "FAIL"; exit 1; }

echo -n "Frontend proxy to backend ... "
PROXIED=$(curl -sf http://localhost:5173/api/health)
echo "$PROXIED" | grep -q '"healthy"' && echo "OK" || { echo "FAIL"; exit 1; }

echo ""
echo "=== All smoke tests passed ==="
echo "Backend log:  $BACKEND_LOG"
echo "Frontend log: $FRONTEND_LOG"
echo ""
echo "Servers still running. PID backend=$BACKEND_PID frontend=$FRONTEND_PID"
echo "Press Ctrl-C to stop, or run:  kill $BACKEND_PID $FRONTEND_PID"

wait
