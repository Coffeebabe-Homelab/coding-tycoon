# P1-05 — Onboarding Wizard UI

**Phase:** 1 — Auth & Player Profile  
**Status:** 🔲 Not started  
**Depends on:** P1-04 (routing in place), P1-03 (POST /api/profile and GET /api/topics exist)  

---

## Goal

Build the onboarding wizard that a new player sees immediately after their first login. It loads the available topics from the API, collects the player's language, framework, seniority, and topic selections, then calls `POST /api/profile`. After saving, they land on the game room. Returning players skip this entirely.

---

## What we're building — frontend context

> **For the frontend learner:** A "wizard" is a multi-step form — you show one step at a time instead of one long scrolling form. It's a common UX pattern for onboarding because it feels less overwhelming.
>
> This wizard has 3 steps: language/framework selection, seniority selection, and topic selection. The answers are kept in `useState` inside the wizard component — local state that only this component cares about.
>
> **The topics step is different from Phase 0's thinking:** instead of hardcoding `["REST APIs", "CRUD", ...]` in the frontend, we call `GET /api/topics` first and render whatever the backend returns. This means we have a `useTopics` hook — a custom hook whose only job is to fetch and return the topic list.
>
> When the user clicks "Finish", we call `POST /api/profile` using a `useCreateProfile` hook. Hooks are how React components share reusable logic: **components render UI, hooks handle logic**.

---

## Acceptance Criteria

- [ ] `useTopics` hook fetches `GET /api/topics` (public endpoint — no auth needed), returns `{ topics, isLoading, error }`
- [ ] `useCreateProfile` hook calls `POST /api/profile` with `{ language, framework, seniority, topicIds }`, handles loading and error state
- [ ] `OnboardingWizard` renders after first login (when profile does not yet exist)
- [ ] Step 1: Language (`Java`) and Framework (`Spring Boot`) — selection cards (single-select, pre-selected since MVP has one option each, but built to accept more options without code changes)
- [ ] Step 2: Seniority level (`Junior`) — single-select card
- [ ] Step 3: Topics — multi-select chips loaded from `useTopics`; loading spinner while fetching; error message if fetch fails
- [ ] At least one topic must be selected to enable "Finish"
- [ ] "Next" / "Back" navigation between steps; "Finish" on the last step
- [ ] Progress indicator showing current step (e.g. "Step 2 of 3")
- [ ] "Finish" submits the profile; on success navigates to `/room`
- [ ] Loading state on "Finish" button while the API call is in flight ("Saving…")
- [ ] Error message shown if `POST /api/profile` fails
- [ ] `npm run build` and `npm run lint` pass

---

## TypeScript types

```ts
// types/topic.ts
export interface Topic {
  id: number
  name: string
  slug: string
}

// types/profile.ts
export interface PlayerProfile {
  id: number
  language: string
  framework: string
  seniority: string
  topics: Topic[]
}
```

---

## Implementation Notes

### useTopics hook

```ts
// hooks/useTopics.ts
import type { Topic } from '../types/topic'

/**
 * Fetches the list of available topics for the onboarding wizard.
 * No auth required — GET /api/topics is a public endpoint.
 */
export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/topics`)
      .then((res) => res.json() as Promise<Topic[]>)
      .then(setTopics)
      .catch(() => setError('Failed to load topics'))
      .finally(() => setIsLoading(false))
  }, [])

  return { topics, isLoading, error }
}
```

### useCreateProfile hook

```ts
// hooks/useCreateProfile.ts
export interface CreateProfilePayload {
  language: string
  framework: string
  seniority: string
  topicIds: number[]   // IDs, not names — backend resolves to full Topic objects
}

/**
 * Hook for submitting a new player profile.
 * Returns a submit function, a loading flag, and an error string.
 */
export function useCreateProfile() {
  const { getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createProfile = async (payload: CreateProfilePayload) => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getAccessTokenSilently()
      await fetchWithAuth('/api/profile', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      navigate('/room')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return { createProfile, isLoading, error }
}
```

### Wizard state

```ts
// All selection state lives in OnboardingWizard
const [step, setStep] = useState(1)
const [language, setLanguage] = useState('Java')
const [framework, setFramework] = useState('Spring Boot')
const [seniority, setSeniority] = useState('Junior')
const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([])
```

### Multi-select topic chip (uses ID, displays name)

```tsx
const { topics, isLoading: topicsLoading } = useTopics()

{topicsLoading ? (
  <p className="text-text-muted">Loading topics…</p>
) : (
  topics.map((topic) => (
    <button
      key={topic.id}
      onClick={() =>
        setSelectedTopicIds((prev) =>
          prev.includes(topic.id)
            ? prev.filter((id) => id !== topic.id)
            : [...prev, topic.id]
        )
      }
      className={`rounded-full px-3 py-1 text-sm transition-colors ${
        selectedTopicIds.includes(topic.id)
          ? 'bg-accent text-white'
          : 'bg-bg-elevated text-text-muted hover:bg-bg-elevated/80'
      }`}
    >
      {topic.name}
    </button>
  ))
)}
```

---

## Routing

Add to `App.tsx`:
```
/onboarding  → OnboardingPage (protected)
```

The `GameRoomPage` (or a redirect check at login) detects a missing profile and navigates to `/onboarding`.

---

## File Locations

```
frontend/src/
├── hooks/
│   ├── useTopics.ts
│   └── useCreateProfile.ts
├── types/
│   ├── topic.ts
│   └── profile.ts
├── pages/
│   └── OnboardingPage.tsx
└── components/
    └── OnboardingWizard.tsx
```

---

## Definition of Done

- New user completes wizard → profile saved → lands on `/room`. Topics loaded from API, not hardcoded. Returning user skips wizard. `useTopics` and `useCreateProfile` hooks tested.
