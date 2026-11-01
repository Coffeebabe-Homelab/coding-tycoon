#!/usr/bin/env sh
# Post-deploy smoke test. Run from the compose project directory on the staging host.
# Verifies the browser-facing path: frontend -> nginx /api proxy -> backend.
set -eu

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:${FRONTEND_PORT:-5173}}"
RETRIES="${RETRIES:-12}"

fail() { echo "SMOKE FAIL: $1" >&2; exit 1; }

# Prints the HTTP status, retrying while the stack is still starting (000/502/503).
statusOf() {
  i=0
  while :; do
    code=$(curl -s -o /dev/null -w '%{http_code}' -m 5 "$1" || true)
    case "$code" in 000|502|503) ;; *) echo "$code"; return ;; esac
    i=$((i + 1))
    [ "$i" -ge "$RETRIES" ] && { echo "$code"; return; }
    sleep 5
  done
}

expect() {
  actual=$(statusOf "$FRONTEND_URL$1")
  [ "$actual" = "$2" ] || fail "GET $1 expected $2, got $actual"
  echo "ok   GET $1 -> $actual"
}

docker compose -f "$COMPOSE_FILE" exec -T backend wget -qO- http://localhost:8080/q/health/ready >/dev/null \
  || fail "backend readiness check"
echo "ok   backend /q/health/ready"

expect / 200
# Public endpoint: proves the proxy reaches the backend and forwards the /api path intact.
expect /api/topics 200
# Protected endpoint without a token: proves the backend (not nginx) answered and auth is enforced.
expect /api/tasks/today 401

echo "SMOKE PASS"
