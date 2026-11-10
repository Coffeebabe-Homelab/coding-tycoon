import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { Chip } from './Chip'
import { SelectionCard } from './SelectionCard'
import { StepperStep, type StepperStepState } from './StepperStep'
import { useCreateProfile } from '../hooks/useCreateProfile'
import { useTopics } from '../hooks/useTopics'

const STEPS = [
  {
    name: 'Stack',
    title: 'Choose your language & framework',
    description: 'The MVP focuses on one stack so every task and review is deep, not wide.',
  },
  {
    name: 'Level',
    title: 'What’s your experience level?',
    description:
      'Tasks and review depth are calibrated to this. You can change it later in your profile.',
  },
  {
    name: 'Topics',
    title: 'Pick your topics',
    description:
      'Select at least one topic to continue. Your daily tasks will rotate through these.',
  },
]

// The MVP offers one stack and one level (north_star.md), so these aren't choices yet.
const MVP_STACK = { language: 'Java', framework: 'Spring Boot', seniority: 'Junior' }
const ONLY_OPTION = 'Only option in MVP'
const COMING_SOON_LEVELS = ['Mid', 'Senior']

function stateOf(stepNumber: number, currentStep: number): StepperStepState {
  if (stepNumber < currentStep) return 'done'
  return stepNumber === currentStep ? 'current' : 'upcoming'
}

function OptionGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-overline text-text-muted uppercase">{title}</h2>
      <div className="flex gap-3">{children}</div>
    </section>
  )
}

/** Three-step wizard (Figma 11:25, 11:78, 11:139) that creates the new player's profile. */
export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([])

  const { topics, isLoading: topicsLoading, error: topicsError } = useTopics()
  const { createProfile, isLoading: saving, error: saveError } = useCreateProfile()

  const toggleTopic = (id: number) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  const handleFinish = () => {
    createProfile({ ...MVP_STACK, topicIds: selectedTopicIds })
  }

  // The button just pressed can become disabled on the new step, which would drop focus to <body>.
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [step])

  const { title, description } = STEPS[step - 1]

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base bg-(image:--gradient-wizard-glow) p-4">
      <main className="flex w-full max-w-160 flex-col gap-8 rounded-xl border border-border bg-bg-surface p-8 shadow-overlay">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ol className="flex items-center gap-4">
            {STEPS.map(({ name }, index) => (
              <Fragment key={name}>
                {index > 0 && (
                  <li
                    aria-hidden="true"
                    className={`h-0.5 w-6 ${index < step ? 'bg-accent' : 'bg-border-strong'}`}
                  />
                )}
                <StepperStep state={stateOf(index + 1, step)} number={index + 1} label={name} />
              </Fragment>
            ))}
          </ol>
          <p className="text-label-s text-text-muted">
            Step {step} of {STEPS.length}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-h1 text-text-primary outline-none">
            {title}
          </h1>
          <p className="text-body-m text-text-muted">{description}</p>

          {step === 1 && (
            <>
              <div className="flex flex-col gap-3">
                <OptionGroup title="Language">
                  <SelectionCard
                    type="selected-locked"
                    label={MVP_STACK.language}
                    caption={ONLY_OPTION}
                  />
                </OptionGroup>
                <p className="text-label-s text-text-muted">More languages coming after launch.</p>
              </div>
              <OptionGroup title="Framework">
                <SelectionCard
                  type="selected-locked"
                  label={MVP_STACK.framework}
                  caption={ONLY_OPTION}
                />
              </OptionGroup>
            </>
          )}

          {step === 2 && (
            <OptionGroup title="Seniority">
              <SelectionCard
                type="selected-locked"
                label={MVP_STACK.seniority}
                caption={ONLY_OPTION}
              />
              {COMING_SOON_LEVELS.map((level) => (
                <SelectionCard key={level} type="coming-soon" label={level} caption="Coming soon" />
              ))}
            </OptionGroup>
          )}

          {step === 3 && (
            <>
              {topicsLoading && <p className="text-body-m text-text-muted">Loading topics…</p>}
              {topicsError && <p className="text-body-m text-danger">{topicsError}</p>}
              {!topicsLoading && !topicsError && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => (
                      <Chip
                        key={topic.id}
                        label={topic.name}
                        selected={selectedTopicIds.includes(topic.id)}
                        onClick={() => toggleTopic(topic.id)}
                      />
                    ))}
                  </div>
                  <p className="text-label-s text-text-muted">{selectedTopicIds.length} selected</p>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
            Back
          </Button>

          {step < STEPS.length ? (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving || selectedTopicIds.length === 0}>
              {saving ? 'Saving…' : 'Finish'}
            </Button>
          )}
        </div>

        {saveError && <p className="text-body-m text-danger">{saveError}</p>}
      </main>
    </div>
  )
}
