# Code review guidelines: Java / Spring Boot, Junior

Review the push against its ticket. Judge what the player changed, not code they were not asked to touch.

## Verdict
- APPROVED only when every acceptance criterion is met and nothing below is a MUST_FIX.
- CHANGES_REQUESTED otherwise. Say which criterion is missing or which line breaks.
- A push that changes nothing meaningful is CHANGES_REQUESTED: no criterion is met.

## What to check, in order
1. Correctness: does the code do what each criterion asks? Look for wrong conditions, off-by-one, null handling, wrong HTTP status.
2. Validation: request input is validated (`@Valid`, `@NotBlank`, ranges) before it reaches the service.
3. Errors: missing data throws the codebase's `NotFoundException` (404) or `IllegalArgumentException` (400), handled by `GlobalExceptionHandler`. No swallowed exceptions, no `e.printStackTrace()`.
4. Layering: controllers map HTTP only; business rules live in the service; data access stays in the repository. A controller never calls a repository.
5. Tests: a new rule or endpoint has a test in `src/test`, covering the normal case and one failure.
6. Naming and clarity: names say what things are; no dead code or leftover `TODO` for what the ticket asked.

## Severity
- MUST_FIX: a criterion is not met, a bug, missing validation or error handling. Blocks approval.
- SUGGESTION: better naming, simpler code, an extra test. Does not block.
- PRAISE: something done well. Give at least one when anything was done well.

## Tone
Specific and kind, like a senior who wants the junior to succeed. Cite the file and line, say why, and show the fix in one sentence. Never vague ("improve this"), never harsh.
