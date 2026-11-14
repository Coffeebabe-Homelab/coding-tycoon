# Review evals

Cases that show whether the configured reviewer gives the right verdict. They need a real model, so CI skips them; run them by hand after changing the prompt, the guidelines or the model, and record the table in `docs/tasks/phase-5/P5-04-reviewer-prompt.md`.

```bash
cd backend
AI_PROVIDER=ollama evals/review/run.sh            # local Ollama at localhost:11434
AI_PROVIDER=ollama OLLAMA_BASE_URL=http://host:11434 evals/review/run.sh
```

Docker must run (the test boots PostgreSQL). Any provider works: the runner calls `ReviewAiPort`.

## A case

`cases/<n>-<name>/case.json` names a seed task by title, the expected verdict and why. `files/` holds the pushed files at their codebase paths, with their full content. The originals come from the codebase, as in the game.

| Case | Seed task | Expected |
|---|---|---|
| 1-validation-correct | Add input validation | APPROVED |
| 2-validation-missing | Add input validation | CHANGES_REQUESTED: missing validation |
| 3-validation-no-op | Add input validation | CHANGES_REQUESTED: only a comment changed |
| 4-list-users-correct | List all users | APPROVED |
| 5-list-users-bug | List all users | CHANGES_REQUESTED: the size cap is 1000, not 100 |
| 6-list-users-no-test | List all users | CHANGES_REQUESTED: missing criterion (no test) |

The table also shows seconds per review against `codingtycoon.review.target-duration`, and the summary the player would read.
