import { useState, type ReactNode } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useUpdateProfile } from '../hooks/useUpdateProfile'
import { useTopics } from '../hooks/useTopics'
import { SelectionCard } from '../components/SelectionCard'
import { Chip } from '../components/Chip'
import { Button } from '../components/Button'

const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior']

/** Displays and allows inline editing of the player's profile. */
export default function ProfilePage() {
  const { profile, isLoading, error, refetch } = useProfile()
  const { updateProfile, isLoading: saving, error: saveError } = useUpdateProfile()
  const { topics: allTopics, isLoading: topicsLoading } = useTopics()

  const [isEditing, setIsEditing] = useState(false)
  const [editSeniority, setEditSeniority] = useState('')
  const [editTopicIds, setEditTopicIds] = useState<number[]>([])

  const enterEditMode = () => {
    if (!profile) return
    setEditSeniority(profile.seniority)
    setEditTopicIds(profile.topics.map((t) => t.id))
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
  }

  const toggleEditTopic = (id: number) => {
    setEditTopicIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const handleSave = async () => {
    if (!profile) return
    const success = await updateProfile({
      language: profile.language,
      framework: profile.framework,
      seniority: editSeniority,
      topicIds: editTopicIds,
    })
    if (success) {
      setIsEditing(false)
      refetch()
    }
  }

  if (isLoading || error || !profile) {
    return (
      <ProfileLayout>
        {isLoading && <p className="text-text-muted">Loading profile…</p>}
        {!isLoading && error && <p className="text-danger">{error}</p>}
      </ProfileLayout>
    )
  }

  return (
    <ProfileLayout>
      <div>
        {/* View mode */}
        {!isEditing && (
          <>
            <dl className="flex flex-col gap-4">
              <ProfileRow label="Language" value={profile.language} />
              <ProfileRow label="Framework" value={profile.framework} />
              <ProfileRow label="Seniority" value={profile.seniority} />
              <div className="flex flex-col gap-1">
                <dt className="text-sm text-text-muted">Topics</dt>
                <dd className="flex flex-wrap gap-2">
                  {profile.topics.map((topic) => (
                    <Chip key={topic.id} label={topic.name} />
                  ))}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex justify-end">
              <Button onClick={enterEditMode}>Edit</Button>
            </div>
          </>
        )}

        {/* Edit mode */}
        {isEditing && (
          <div className="flex flex-col gap-6">
            {/* Language & Framework are read-only in edit mode — controlled via onboarding */}
            <ProfileRow label="Language" value={profile.language} />
            <ProfileRow label="Framework" value={profile.framework} />

            <div className="flex flex-col gap-2">
              <p className="text-sm text-text-muted">Seniority</p>
              <div className="flex flex-wrap gap-3">
                {SENIORITY_LEVELS.map((level) => (
                  <SelectionCard
                    key={level}
                    label={level}
                    selected={editSeniority === level}
                    onClick={() => setEditSeniority(level)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-text-muted">Topics</p>
              {topicsLoading && <p className="text-text-muted">Loading topics…</p>}
              {!topicsLoading && (
                <div className="flex flex-wrap gap-2">
                  {allTopics.map((topic) => (
                    <Chip
                      key={topic.id}
                      label={topic.name}
                      selected={editTopicIds.includes(topic.id)}
                      onClick={() => toggleEditTopic(topic.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {saveError && <p className="text-sm text-danger">{saveError}</p>}

            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || editTopicIds.length === 0}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </ProfileLayout>
  )
}

/** Standalone page frame. Screen 8's full layout arrives with Phase 6. */
function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-bg-surface p-6">
        <h1 className="mb-6 text-lg font-semibold text-text-primary">Player Profile</h1>
        {children}
      </div>
    </main>
  )
}

/** Renders a single label/value row in the profile view. */
function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="text-text-primary">{value}</dd>
    </div>
  )
}
