# P1-06 — Profile Page UI

**Phase:** 1 — Auth & Player Profile  
**Status:** ✅ Complete  
**Depends on:** P1-04 (routing), P1-05 (types defined), P1-03 (GET /api/profile and PUT /api/profile exist)  

---

## Goal

Build the player's profile page. It fetches and displays their onboarding settings (language, framework, seniority, topics) and provides inline editing. Topics are displayed as badges with their names and edited using the same multi-select chip pattern from the onboarding wizard — but populated from `GET /api/topics`, which means adding a new topic to the system automatically appears here too.

---

## What we're building — frontend context

> **For the frontend learner:** This is a classic "fetch, display, and edit" page — one of the most common patterns in frontend development.
>
> The flow: mount the component → fetch the profile → show it → user clicks Edit → show an edit form pre-filled with current values → user saves → call the API → update the view.
>
> There are two states: **view mode** and **edit mode**. We use a `useState(false)` boolean called `isEditing` to toggle between them. This is a common React pattern — one boolean drives which UI branch to render.
>
> The edit form needs the available topics (to show the multi-select chips), so it re-uses the `useTopics` hook from the onboarding wizard — this is exactly why we extracted it into a hook. Write once, use everywhere.

---

## Acceptance Criteria

- [ ] `useProfile` hook fetches `GET /api/profile`, returns `{ profile, isLoading, error, refetch }`
- [ ] `ProfilePage` shows a loading spinner while fetching
- [ ] `ProfilePage` shows an error message if the fetch fails
- [ ] Profile displayed: language, framework, seniority, and topics as badge chips (showing `topic.name`)
- [ ] "Edit" button switches to edit mode
- [ ] In edit mode, seniority shown as single-select cards; topics shown as multi-select chips (same visual as onboarding, loaded via `useTopics`)
- [ ] Edit form pre-populated with the player's current selections
- [ ] "Save" calls `PUT /api/profile` with `{ language, framework, seniority, topicIds }`
- [ ] On save success, view mode updates immediately with new values (call `refetch` or update state directly)
- [ ] "Cancel" exits edit mode without saving, restores original values
- [ ] Loading state on "Save" button while in-flight
- [ ] Error message if save fails
- [ ] Navigation link to `/profile` accessible from `GameRoomPage`
- [ ] `npm run build` and `npm run lint` pass

---

## Implementation Notes

### useProfile hook

```ts
// hooks/useProfile.ts
import type { PlayerProfile } from '../types/profile'

/**
 * Fetches the authenticated player's profile.
 * Returns refetch() so the page can re-load after a successful update.
 */
export function useProfile() {
  const { getAccessTokenSilently } = useAuth0()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = () => {
    setIsLoading(true)
    setError(null)
    getAccessTokenSilently()
      .then((token) => fetchWithAuth<PlayerProfile>('/api/profile', token))
      .then(setProfile)
      .catch(() => setError('Failed to load profile'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { fetchProfile() }, [])

  return { profile, isLoading, error, refetch: fetchProfile }
}
```

### useUpdateProfile hook

```ts
// hooks/useUpdateProfile.ts
export interface UpdateProfilePayload {
  language: string
  framework: string
  seniority: string
  topicIds: number[]
}

/**
 * Hook for saving profile changes.
 */
export function useUpdateProfile() {
  const { getAccessTokenSilently } = useAuth0()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProfile = async (payload: UpdateProfilePayload): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getAccessTokenSilently()
      await fetchWithAuth('/api/profile', token, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      return true
    } catch {
      setError('Failed to save changes. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { updateProfile, isLoading, error }
}
```

### Page layout (view mode)

```
┌─────────────────────────────────────────┐
│  ← Back to room                          │
│                                          │
│  Player Profile                          │
│  ─────────────────────────────────────  │
│  Language     Java                       │
│  Framework    Spring Boot                │
│  Seniority    Junior                     │
│  Topics       [REST APIs] [CRUD] [OOP]   │
│                                          │
│                           [ Edit ]       │
└─────────────────────────────────────────┘
```

Topics displayed as `rounded-full bg-accent-subtle px-2 py-0.5 text-xs text-accent-hover` badges.

### Edit mode pattern

```tsx
const [isEditing, setIsEditing] = useState(false)
// Pre-fill edit state from current profile when entering edit mode
const [editSeniority, setEditSeniority] = useState(profile.seniority)
const [editTopicIds, setEditTopicIds] = useState(profile.topics.map(t => t.id))
```

When "Cancel" is clicked: `setIsEditing(false)` and reset edit state back to `profile` values.  
When "Save" succeeds: `setIsEditing(false)` and call `refetch()` to reload the profile from the API.

---

## File Locations

```
frontend/src/
├── hooks/
│   ├── useProfile.ts
│   └── useUpdateProfile.ts
└── pages/
    └── ProfilePage.tsx
```

(Types `Topic` and `PlayerProfile` already defined in P1-05.)

---

## Definition of Done

- Profile page loads and displays correctly. Edit → save updates the profile. Edit → cancel discards changes. `useProfile` and `useUpdateProfile` hooks tested for loading, success, and error states.
