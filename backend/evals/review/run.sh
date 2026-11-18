#!/usr/bin/env bash
# Runs the review eval cases through the configured reviewer and prints a table.
# Usage, from backend/:  AI_PROVIDER=ollama evals/review/run.sh
# Needs Docker (tests boot PostgreSQL) and, for ollama, a model at OLLAMA_BASE_URL.
set -euo pipefail
cd "$(dirname "$0")/../.."
./mvnw -q test -Dtest=ReviewEvals -Devals=true -Djacoco.skip=true -Dsurefire.failIfNoSpecifiedTests=false 2>&1 \
  | sed -n '/^| Case/,/as expected/p'
