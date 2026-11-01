# P3-02 — Codebase Domain & Read-only API

**Phase:** 3 — Codebase Explorer  
**Status:** 🔲 Not started  
**Depends on:** P3-01, P3-03 (task → codebase link)  

---

## Goal

Expose the codebase attached to the player's active task through two authenticated, read-only endpoints.

---

## Acceptance Criteria

- [ ] New `codebase` package following the SPEC layering: `CodebaseRepository` (port), `ClasspathCodebaseRepository` (adapter), `CodebaseService`, `CodebaseResource`
- [ ] `GET /api/codebase/files` returns `{ "codebase": "shopfront", "focusFiles": [...], "files": [...] }`, where `files` is a flat, sorted list of relative paths from `index.txt`
- [ ] `GET /api/codebase/files/{path: .+}` returns `{ "path": "...", "content": "..." }` (UTF-8 text)
- [ ] The codebase is resolved from the player's active task (`codebaseKey`); no active task → `404` with a clear message
- [ ] Only paths listed in `index.txt` are served; anything else (including `../`, absolute paths, encoded traversal) → `404`
- [ ] No write endpoints (read-only enforced server-side)
- [ ] Both endpoints require authentication → `401` without a token
- [ ] Tests: service unit tests with a mocked repository; resource integration tests covering 200, 401, 404 (unknown path), 404 (traversal attempt), 404 (no active task)
- [ ] ≥ 80% line and branch coverage on the `codebase` package
- [ ] `backend/SPEC.md` API table updated

---

## Implementation Notes

- The allow-list check (path must be in the index) is the security boundary. Don't rely on path normalisation alone.
- Load each codebase's index once and cache it (it's immutable at runtime); read file content on demand.
- Return a flat list; the frontend builds the tree (P3-05). That keeps the backend trivial.
- The frontend picks the syntax language from the file extension, so the backend doesn't return it.

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/codebase/
├── CodebaseRepository.java
├── ClasspathCodebaseRepository.java
├── CodebaseService.java
├── CodebaseResource.java
├── CodebaseFilesResponse.java
└── CodebaseFileResponse.java
```

---

## Definition of Done

`./mvnw verify` passes with coverage thresholds met; traversal and auth tests are green.
