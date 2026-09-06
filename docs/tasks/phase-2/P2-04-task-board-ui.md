# P2-04 — Task Board UI

**Phase:** 2 — Task Engine  
**Status:** 🔲 Not started  
**Depends on:** P1-04 (routing in place), P2-03 (GET /api/tasks/today exists)

---

## What we're building — frontend context

> **For the frontend learner:** The Task Board is the player's daily starting point — it shows today's coding ticket, like a JIRA card. The flow is:
>
> 1. Player lands on `/room` (GameRoomPage)
> 2. We fetch `GET /api/tasks/today`
> 3. We display the task: title, description, acceptance criteria, difficulty, tags
> 4. A "Start task" button transitions the status to `IN_PROGRESS` via `PATCH /api/tasks/{id}/status`
>
> This introduces the concept of **derived UI state from server state**: the button label and availability change based on the `status` field in the API response. The component doesn't decide what's allowed — it reads the status and renders accordingly.
>
> We'll introduce a new hook pattern here: `useTask` handles both the fetch and the status mutation. One hook, one concern (the task lifecycle).

---

## Acceptance Criteria

- [ ] `useTask` hook fetches `GET /api/tasks/today`, returns `{ task, isLoading, error, startTask }`
- [ ] `startTask()` calls `PATCH /api/tasks/{id}/status` with `{ status: "IN_PROGRESS" }` and updates local state on success
- [ ] `TaskBoardPage` at `/room/task` displays: title, description, acceptance criteria, difficulty badge, tags
- [ ] "Start task" button visible when status is `ASSIGNED`; calls `startTask()` on click
- [ ] When status is `IN_PROGRESS`, button changes to "Continue" (no action — links to editor in Phase 4)
- [ ] Loading spinner while fetching task
- [ ] Error message if fetch fails
- [ ] `GameRoomPage` has a visible "View today's task" button/link navigating to `/room/task`
- [ ] `App.tsx` routing includes `/room/task` → `TaskBoardPage` (protected)
- [ ] `Task` type added to `src/types/task.ts`
- [ ] `npm run build` and `npm run lint` pass

---

## TypeScript type

```ts
// types/task.ts
export type TaskStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED'

export interface Task {
  id: number
  title: string
  description: string
  acceptanceCriteria: string
  difficulty: string
  tags: string[]
  status: TaskStatus
  createdAt: string
}
```

---

## Implementation Notes

### useTask hook

```ts
// hooks/useTask.ts

/**
 * Fetches today's task and provides a function to start it.
 */
export function useTask() {
  const { getAccessTokenSilently } = useAuth0()
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAccessTokenSilently()
      .then((token) => fetchWithAuth<Task>('/api/tasks/today', token))
      .then(setTask)
      .catch(() => setError('Failed to load today\'s task'))
      .finally(() => setIsLoading(false))
  }, [getAccessTokenSilently])

  const startTask = async () => {
    if (!task) return
    try {
      const token = await getAccessTokenSilently()
      const updated = await fetchWithAuth<Task>(`/api/tasks/${task.id}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      })
      setTask(updated)
    } catch {
      setError('Failed to start task')
    }
  }

  return { task, isLoading, error, startTask }
}
```

### TaskBoardPage layout

```
┌─────────────────────────────────────────────────┐
│  ← Back to room                                  │
│                                                  │
│  Today's Task                                    │
│  ──────────────────────────────────────────────  │
│  Implement GET /users endpoint        [Easy] 🏷  │
│                                                  │
│  The UserController class exists but the         │
│  GET /users endpoint is missing…                 │
│                                                  │
│  Acceptance Criteria                             │
│  • GET /users returns 200 with all users         │
│  • Empty list returns [] not null                │
│  • Endpoint is mapped with @GetMapping           │
│                                                  │
│  Tags:  [REST APIs]                              │
│                                                  │
│                         [ Start task ]           │
└─────────────────────────────────────────────────┘
```

### Difficulty badge colours (using design tokens)

```tsx
const difficultyClass = {
  Easy:   'bg-success/20 text-success',
  Medium: 'bg-warning/20 text-warning',
  Hard:   'bg-danger/20 text-danger',
}[task.difficulty] ?? 'bg-bg-elevated text-text-muted'
```

### Acceptance criteria rendering

The `acceptanceCriteria` field is a plain text string. Split on newline or `;` and render as a `<ul>`:

```tsx
{task.acceptanceCriteria.split('\n').filter(Boolean).map((line, i) => (
  <li key={i} className="text-text-muted">• {line.trim()}</li>
))}
```

---

## File Locations

```
frontend/src/
├── hooks/
│   └── useTask.ts
├── types/
│   └── task.ts
└── pages/
    └── TaskBoardPage.tsx
```

---

## Definition of Done

- Task Board loads and displays correctly. "Start task" transitions status and updates the UI. Loading and error states handled. `npm run build` and `npm run lint` pass.
