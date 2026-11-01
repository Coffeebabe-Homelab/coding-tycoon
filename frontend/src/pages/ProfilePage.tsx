import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useUpdateProfile } from '../hooks/useUpdateProfile'
import { useTopics } from '../hooks/useTopics'
import { SelectionCard } from '../components/SelectionCard'
import { TopicChip } from '../components/TopicChip'
import { Overlay } from '../components/Overlay'

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
      <Overlay title="Player Profile">
        {isLoading && <p className="text-text-muted">Loading profile…</p>}
        {!isLoading && error && <p className="text-danger">{error}</p>}
      </Overlay>
    )
  }

  return (
    <Overlay title="Player Profile">
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
                    <span
                      key={topic.id}
                      className="rounded-full bg-accent-subtle px-2 py-0.5 text-xs text-accent-hover"
                    >
                      {topic.name}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={enterEditMode}
                className="rounded-lg bg-accent px-4 py-2 text-sm text-text-primary transition-colors hover:bg-accent-hover focus:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent"
              >
                Edit
              </button>
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
                    <TopicChip
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
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-accent hover:text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || editTopicIds.length === 0}
                className="rounded-lg bg-accent px-4 py-2 text-sm text-text-primary transition-colors hover:bg-accent-hover focus:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Overlay>
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
