import { useState } from 'react'
import { SelectionCard } from './SelectionCard'
import { TopicChip } from './TopicChip'
import { useTopics } from '../hooks/useTopics'
import { useCreateProfile } from '../hooks/useCreateProfile'

const TOTAL_STEPS = 3

const LANGUAGES = ['Java']
const FRAMEWORKS = ['Spring Boot']
const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior']

/** Three-step wizard that collects language, framework, seniority, and topics for a new player profile. */
export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [language, setLanguage] = useState('Java')
  const [framework, setFramework] = useState('Spring Boot')
  const [seniority, setSeniority] = useState('Junior')
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([])

  const { topics, isLoading: topicsLoading, error: topicsError } = useTopics()
  const { createProfile, isLoading: saving, error: saveError } = useCreateProfile()

  const toggleTopic = (id: number) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  const handleFinish = () => {
    createProfile({ language, framework, seniority, topicIds: selectedTopicIds })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base">
      <div className="flex w-full max-w-lg flex-col gap-6 rounded-xl border border-border bg-bg-surface p-10">
        {/* Progress */}
        <p className="text-sm text-text-muted">
          Step {step} of {TOTAL_STEPS}
        </p>

        {/* Step 1 — Language & Framework */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-text-primary">
              Choose your language &amp; framework
            </h2>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-text-muted">Language</p>
              <div className="flex flex-wrap gap-3">
                {LANGUAGES.map((lang) => (
                  <SelectionCard
                    key={lang}
                    label={lang}
                    selected={language === lang}
                    onClick={() => setLanguage(lang)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-text-muted">Framework</p>
              <div className="flex flex-wrap gap-3">
                {FRAMEWORKS.map((fw) => (
                  <SelectionCard
                    key={fw}
                    label={fw}
                    selected={framework === fw}
                    onClick={() => setFramework(fw)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Seniority */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-text-primary">
              What's your experience level?
            </h2>
            <div className="flex flex-wrap gap-3">
              {SENIORITY_LEVELS.map((level) => (
                <SelectionCard
                  key={level}
                  label={level}
                  selected={seniority === level}
                  onClick={() => setSeniority(level)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Topics */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-text-primary">
              Pick your topics
            </h2>
            <p className="text-sm text-text-muted">Select at least one topic to continue.</p>

            {topicsLoading && <p className="text-text-muted">Loading topics…</p>}
            {topicsError && <p className="text-danger">{topicsError}</p>}

            {!topicsLoading && !topicsError && (
              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <TopicChip
                    key={topic.id}
                    label={topic.name}
                    selected={selectedTopicIds.includes(topic.id)}
                    onClick={() => toggleTopic(topic.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-accent hover:text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>

          {step < TOTAL_STEPS && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="rounded-lg bg-accent px-6 py-2 text-sm text-text-primary transition-colors hover:bg-accent-hover focus:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent"
            >
              Next
            </button>
          )}

          {step === TOTAL_STEPS && (
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving || selectedTopicIds.length === 0}
              className="rounded-lg bg-accent px-6 py-2 text-sm text-text-primary transition-colors hover:bg-accent-hover focus:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Finish'}
            </button>
          )}
        </div>

        {saveError && <p className="text-sm text-danger">{saveError}</p>}
      </div>
    </div>
  )
}
