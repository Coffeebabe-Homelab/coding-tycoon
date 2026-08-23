# P0-10 — Development Guidelines

**Phase:** 0 — Foundation  
**Status:** 🔲 Not started  
**Depends on:** P0-01, P0-02  

---

## Goal

Write `docs/DEVELOPMENT_GUIDELINES.md` — the team's shared agreement on how to build this project. Covers architecture decisions, coding patterns, test coverage, documentation standards, and Git workflow.

---

## Acceptance Criteria

- [ ] `docs/DEVELOPMENT_GUIDELINES.md` exists
- [ ] Architecture section: high-level diagram of frontend ↔ backend ↔ AI ↔ Auth0
- [ ] Backend patterns: layering (Resource → Service → Repository), naming conventions, error handling strategy, REST response standards
- [ ] Frontend patterns: component structure, naming conventions, state management rules, how to call the backend API
- [ ] Test coverage minimums defined and documented:
  - Backend: ≥ 80% line coverage on service layer
  - Frontend: ≥ 70% for business logic (hooks, utils); UI components tested with React Testing Library
- [ ] AI service testing strategy: mock the AI interface in unit/integration tests; AI quality tested via separate eval scripts
- [ ] Documentation standards: Javadoc on all public methods in service/resource layer; JSDoc on exported TypeScript functions
- [ ] Git branching strategy: `main` is always deployable; feature branches named `feat/<short-description>`; one PR per feature
- [ ] PR checklist defined (tests pass, lint clean, self-review done, SPEC updated if API changed)
- [ ] Commit message convention: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)

---

## Content Outline

```
# Development Guidelines

## Architecture Overview
[Diagram: Browser → React App → Quarkus REST API → PostgreSQL]
                                               ↓
                                         Ollama (AI)
                                               ↑
                                          Auth0 (OIDC)

## Backend Guidelines
### Layering
### Naming Conventions
### REST API Standards
### Error Handling
### Logging

## Frontend Guidelines
### Component Structure
### State Management Rules
### API Integration
### Naming Conventions

## Testing Strategy
### Backend Test Coverage
### Frontend Test Coverage
### AI Service Mocking
### Integration Tests

## Documentation Standards

## Git Workflow
### Branching
### Commit Messages (Conventional Commits)
### PR Process & Checklist
```

---

## Definition of Done

- Document exists, covers all sections above, reviewed and agreed by the team before Phase 1 begins.
