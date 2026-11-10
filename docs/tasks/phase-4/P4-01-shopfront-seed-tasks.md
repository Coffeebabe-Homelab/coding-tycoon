# P4-01 — Rewrite the Seed Tasks onto Shopfront

**Phase:** 4 — Code Editor & VCS Panel  
**Status:** ⬜ Not started  
**Depends on:** none  

---

## Goal

Make every seed task playable in the editor: each one is about the `shopfront` codebase and names the files the player edits.

---

## Context

Phase 4 lets the player edit only the active task's focus files (owner decision, 2026-11-10). Today 3 of the 10 seed tasks have focus files: "list users", "input validation" and "low-stock query". The other 7, such as "CRUD for a Note entity" and "game inventory hierarchy", don't refer to `shopfront`, so they would open an editor with nothing to edit.

---

## Acceptance Criteria

- [ ] The 7 seed tasks without focus files are rewritten as `shopfront` tasks, each with 1–3 focus files that exist in `codebases/shopfront/index.txt`
- [ ] Each rewritten task keeps its learning goal (its tags) and is doable by editing only its focus files. No task needs a new file
- [ ] Any file a rewritten task needs, such as a class to refactor, is added to `shopfront` and listed in `index.txt`. `shopfront` stays a small app that would compile
- [ ] Description and acceptance criteria name the files and what to change, in the style of the 3 existing tasks
- [ ] A test asserts that every seed task has at least one focus file, and that every focus file is in the codebase index
- [ ] Tasks already stored without focus files keep working: the editor shows its empty state (P4-03). No data migration
- [ ] `docs/tasks/phase-2/P2-02-seed-tasks.md` notes the rewrite

---

## Implementation Notes

- Seeds live in `SeedTaskService`, not in Flyway, so only new tasks get the new content.
- Keep the editor's file set small: a task should name only the files the player has to change. Files the player only needs to read stay in the Codebase Explorer.
- Keep the existing difficulties. Matching them to the player's level isn't part of this task.
- Write the content first and review it with the owner before coding the test.

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/task/seed/SeedTaskService.java
backend/src/main/resources/codebases/shopfront/   (new or changed files, index.txt)
backend/src/test/java/dev/codingtycoon/task/seed/
```

---

## Definition of Done

All 10 seed tasks have focus files that exist in the index, the new test passes, and `./mvnw verify` is green.
