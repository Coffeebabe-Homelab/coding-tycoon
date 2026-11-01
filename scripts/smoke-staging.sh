#!/usr/bin/env sh
# Post-deploy smoke test. Run from the compose project directory on the staging host.
# Verifies the browser-facing path: frontend -> nginx /api proxy -> backend.
set -eu

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:${FRONTEND_PORT:-5173}}"
RETRIES="${RETRIES:-12}"

fail() { echo "SMOKE FAIL: $1" >&2; exit 1; }

# Prints the HTTP status, retrying while the stack is still starting (000/502/503).
# Extra arguments are passed to curl (method, headers, body).
statusOf() {
  url="$1"; shift
  i=0
  while :; do
    code=$(curl -s -o /dev/null -w '%{http_code}' -m 5 "$@" "$url" || true)
    case "$code" in 000|502|503) ;; *) echo "$code"; return ;; esac
    i=$((i + 1))
    [ "$i" -ge "$RETRIES" ] && { echo "$code"; return; }
    sleep 5
  done
}

expect() {
  path="$1"; want="$2"; shift 2
  actual=$(statusOf "$FRONTEND_URL$path" "$@")
  [ "$actual" = "$want" ] || fail "$path expected $want, got $actual"
  echo "ok   $path -> $actual"
}

docker compose -f "$COMPOSE_FILE" exec -T backend wget -qO- http://localhost:8080/q/health/ready >/dev/null \
  || fail "backend readiness check"
echo "ok   backend /q/health/ready"

expect / 200
# Public endpoint: proves the proxy reaches the backend and forwards the /api path intact.
expect /api/topics 200
# Protected endpoint without a token: proves the backend (not nginx) answered and auth is enforced.
expect /api/tasks/today 401

# Browsers send Origin on POST; 403 here means CORS_ORIGINS lacks the public URL.
if [ -n "${PUBLIC_ORIGIN:-}" ]; then
  expect /api/profile 401 -X POST -H "Origin: $PUBLIC_ORIGIN" -H 'Content-Type: application/json' -d '{}'
else
  echo "skip CORS check (PUBLIC_ORIGIN not set)"
fi

echo "SMOKE PASS"
