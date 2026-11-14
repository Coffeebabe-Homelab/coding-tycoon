# P4-01 — Rewrite the Seed Tasks onto Shopfront

**Phase:** 4 — Code Editor & VCS Panel  
**Status:** ✅ Complete (2026-11-14)  
**Depends on:** none  

---

## Goal

Make every seed task playable in the editor: each one is about the `shopfront` codebase and names the files the player edits.

---

## Context

Phase 4 lets the player edit only the active task's focus files (owner decision, 2026-11-10). Today 3 of the 10 seed tasks have focus files: "list users", "input validation" and "low-stock query". The other 7, such as "CRUD for a Note entity" and "game inventory hierarchy", don't refer to `shopfront`, so they would open an editor with nothing to edit.

---

## Acceptance Criteria

- [x] The 7 seed tasks without focus files are rewritten as `shopfront` tasks, each with 1–3 focus files that exist in `codebases/shopfront/index.txt`
- [x] Each rewritten task keeps its learning goal (its tags) and is doable by editing only its focus files. No task needs a new file
- [x] Any file a rewritten task needs, such as a class to refactor, is added to `shopfront` and listed in `index.txt`. `shopfront` stays a small app that would compile
- [x] Description and acceptance criteria name the files and what to change, in the style of the 3 existing tasks
- [x] A test asserts that every seed task has at least one focus file, and that every focus file is in the codebase index
- [x] Tasks already stored without focus files keep working: the editor shows its empty state (P4-03). No data migration
- [x] `docs/tasks/phase-2/P2-02-seed-tasks.md` notes the rewrite

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

---

## Task Content — approved by the owner (2026-11-14)

Each task is played against the original `shopfront`, not against the player's earlier work, so tasks may touch the same files.

### Problems found in the current seeds

1. **Tests need a file the player can edit.** The player edits only focus files and can't create files. Every task that asks for tests therefore needs an existing test file among its focus files. Today only `UserServiceTest.java` exists.
2. **Two "returns 400" criteria can't be met.** `GlobalExceptionHandler` maps only `NotFoundException` and validation errors. An `IllegalArgumentException`, which is what "size > 100" and "negative threshold" would throw, becomes a 500, and so does registering a duplicate email today.
3. **Some focus files don't need changing.** For example, `UserRepository` already has paging through `JpaRepository`. Focus files should be the files the player changes; files they only read stay in the explorer.

### Changes to `shopfront`

| Change | Why |
|---|---|
| `GlobalExceptionHandler`: map `IllegalArgumentException` to 400 | Fixes problem 2, and the duplicate email returns 400 |
| New `order/` domain: `Order`, `OrderRepository`, `OrderService` (thin: only `listForUser`) and `OrderController`, whose `POST /api/orders` holds the whole checkout (find product, check stock, bulk discount with magic numbers, decrement stock, save) | Gives the shop a realistic fat controller for task 3 and a race for task 8 |
| New `order/ShippingCalculator` with a `switch` on the category string | Material for the OOP task |
| New `report/SalesReportService` with one cryptic, 45-line `process(List<Object[]> rows)` method | Material for the Clean Code task |
| New tests: `ProductServiceTest`, `OrderServiceTest`, `ShippingCalculatorTest`, `SalesReportServiceTest`, each with 2–4 passing tests | Fixes problem 1. The last two pin today's behaviour, so a refactor can prove it changed nothing |
| `README.md`: add orders and reports to the overview and update "Known gaps" | Keeps the codebase's own docs true |

That adds 10 files to `shopfront`, making 25, all listed in `index.txt`. A scratch Maven build of `shopfront` compiles, and its 18 tests pass.

### The 10 tasks

Legend: **(kept)** is one of the 3 existing tasks, adjusted; **(new)** replaces a task that had no focus files. Difficulty labels stay as they are today.

**1. Build a REST endpoint to list all users** (kept) · Junior · rest-apis, crud, java
- Focus: `UserController`, `UserService`, `UserServiceTest` (replaces `UserRepository`)
- Change: the "size > 100 returns 400" criterion works through the new handler mapping. The rest is unchanged.

**2. Add update and delete to the user API** (new; replaces "CRUD service for a Note entity") · Junior · crud, java, oop
- Focus: `UserController`, `UserService`, `UserServiceTest`
- Description: customers can register and be looked up, but can't change their name or close their account. Add both.
- Criteria:
  - `PATCH /api/users/{id}` with `{ "name": "..." }` updates the name and returns 200 with the user
  - A blank name returns 400 (`@NotBlank` on a request record, `@Valid`)
  - `DELETE /api/users/{id}` returns 204
  - An unknown id returns 404 for both, through `NotFoundException`
  - `UserServiceTest` covers rename, delete, and the unknown id

**3. Move the checkout rules out of OrderController** (new; replaces "Refactor a God Class") · Mid · oop, clean-code, java
- Focus: `OrderController`, `OrderService`, `OrderServiceTest`
- Description: `POST /api/orders` does everything inside the controller. Move the business rules into `OrderService`, so the controller only maps HTTP.
- Criteria:
  - `OrderController` only maps the request and response, and calls `OrderService.placeOrder(...)`
  - `OrderService` owns the stock check, the discount, the stock decrement and saving the order
  - Not enough stock throws `IllegalArgumentException`, which returns 400
  - The behaviour of `POST /api/orders` is unchanged for valid orders
  - `OrderServiceTest` covers a normal order, not enough stock, and the bulk discount

**4. Add input validation to an existing REST API** (kept) · Junior · rest-apis, java, clean-code
- Focus: `ProductController` only, dropping `GlobalExceptionHandler`, which already does what the task needs
- Change: drop "Tests cover: missing name, negative price, blank category", since there's no controller test file and a web test is heavy for this task. Add `@PositiveOrZero` on `stock`.

**5. Add a low-stock query to the product catalogue** (kept) · Mid · oop, crud, java
- Focus: `ProductRepository`, `ProductService`, `ProductController`, `ProductServiceTest`
- Change: "negative threshold returns 400" now works through the new handler mapping, and the unit tests go in the new `ProductServiceTest`.

**6. Fix case-sensitive category search, in one clean commit** (new; replaces "Git commit message linter") · Junior · git-workflow, clean-code, java
- Focus: `ProductRepository`, `ProductService`, `ProductServiceTest`
- Description: `GET /api/products?category=books` misses products stored as "Books". Fix it, and practise a focused commit.
- Criteria:
  - Category search ignores case (`findByCategoryIgnoreCase`)
  - `ProductServiceTest` covers a mixed-case category
  - The commit message follows Conventional Commits, `fix(product): <subject>`, with a subject of at most 72 characters
  - The commit changes only what the fix needs
- Note: the commit message criterion is checked by the Phase 5 reviewer. This is how the git-workflow topic is practised in game: through the VCS panel, not by writing a linter.

**7. Design the shipping rules with polymorphism** (new; replaces "game inventory hierarchy") · Junior · oop, java, clean-code
- Focus: `ShippingCalculator`, `ShippingCalculatorTest`
- Description: `ShippingCalculator.costFor(category, orderTotal)` is a growing `switch` on category strings. Replace it with an enum `ShippingCategory`, nested in the same file, where each constant implements its own rule.
- Criteria:
  - No `switch` or `if` chain on the category string remains
  - Each category's rule lives in its own enum constant, such as `BOOKS`, `ELECTRONICS` and `FOOD`
  - An unknown category throws `IllegalArgumentException`
  - The existing `ShippingCalculatorTest` cases still pass, and a test for the unknown category is added
- Note: the enum is nested because the player can't create files. This still teaches the "replace conditional with polymorphism" idea.

**8. Stop two orders from overselling the last item** (new; replaces "optimistic locking for a shared counter") · Senior · java, crud, oop
- Focus: `Product`, `OrderController`, `GlobalExceptionHandler`
- Description: two customers ordering the last item at the same moment can both succeed, leaving stock at -1. Add optimistic locking so one of them gets a clear conflict.
- Criteria:
  - `Product` has a `@Version` field
  - A concurrent update fails with `ObjectOptimisticLockingFailureException`, which `GlobalExceptionHandler` maps to 409 with a clear message
  - Stock never goes below zero
  - The commit message or a code comment explains why optimistic locking was chosen over a database lock
- Note: the old task's "two-thread test" is dropped, because a concurrency test needs a full Spring test setup that `shopfront` doesn't have.

**9. Apply Clean Code naming and extraction to a legacy method** (new content, same title) · Mid · clean-code, java, oop
- Focus: `SalesReportService`, `SalesReportServiceTest`
- Description: `SalesReportService.process(List<Object[]> rows)` has cryptic names, magic numbers and nested conditionals. Refactor it without changing what it returns.
- Criteria: the 5 existing criteria, with "≤ 30 lines" kept and "200-line method" corrected to its real size. "All existing unit tests still pass" now refers to `SalesReportServiceTest`.

**10. Document the team's Git workflow** (new; replaces "feature branch workflow with a shell script") · Junior · git-workflow, clean-code
- Focus: `README.md`
- Description: new developers keep asking how to contribute. Add a "Contributing" section to the README.
- Criteria:
  - It explains branch naming (`feat/<ticket>-<short-description>`), Conventional Commits with examples, the pull request steps, and squash merging into `main`
  - It explains why squash merging is used
  - "Known gaps" no longer lists anything the README itself now answers
- Note: the shell script is dropped, because the editor can't create files and `shopfront` has no `scripts/` folder.

### Owner answers (2026-11-14)

1. Add the `order/` and `report/` code to `shopfront`.
2. Practise the git-workflow topic through the commit message (task 6) and the README (task 10).
3. Keep task 8 (Senior) in the pool.
