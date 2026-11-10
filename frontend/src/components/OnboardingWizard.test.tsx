import { render, screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { useAuth0 } from '@auth0/auth0-react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OnboardingWizard } from './OnboardingWizard'
import { authState, jsonResponse, stubApi } from '../test/helpers'
import { LocationProbe } from '../test/LocationProbe'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const TOPICS = [
  { id: 1, name: 'REST', slug: 'rest' },
  { id: 2, name: 'SQL', slug: 'sql' },
]

const button = (name: string) => screen.getByRole('button', { name })

function renderWizard() {
  render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <LocationProbe />
      <OnboardingWizard />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

async function goToTopics(user: UserEvent) {
  await user.click(button('Next'))
  await user.click(button('Next'))
  await screen.findByText('Pick your topics')
}

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  describe('step navigation', () => {
    beforeEach(() => {
      stubApi({ 'GET /api/topics': TOPICS })
    })

    it('starts on step 1 with Back disabled and no Finish', () => {
      renderWizard()

      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
      expect(button('Back')).toBeDisabled()
      expect(screen.queryByRole('button', { name: 'Finish' })).not.toBeInTheDocument()
    })

    it('moves forward and back through the steps', async () => {
      const user = renderWizard()

      await user.click(button('Next'))
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'What’s your experience level?' })).toBeVisible()

      await user.click(button('Next'))
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()

      await user.click(button('Back'))
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    })

    it('keeps choices when moving between steps', async () => {
      const fetchMock = stubApi({ 'GET /api/topics': TOPICS, 'POST /api/profile': { id: 1 } })
      const user = renderWizard()

      await user.click(button('Next'))
      await user.click(button('Next'))
      await user.click(await screen.findByRole('button', { name: 'SQL' }))
      await user.click(button('Back'))
      await user.click(button('Next'))
      await user.click(button('Finish'))

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
      expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toMatchObject({
        topicIds: [2],
      })
    })

    it('moves focus to each new step, since its Next or Back may become disabled', async () => {
      const user = renderWizard()

      await user.click(button('Next'))
      expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('experience level')

      await user.click(button('Back'))
      expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('language')
    })

    it('marks the current step and the ones already done', async () => {
      const user = renderWizard()
      const step = (name: RegExp) => screen.getByText(name).closest('li')

      expect(step(/Stack/)).toHaveAttribute('aria-current', 'step')

      await user.click(button('Next'))

      expect(step(/Level/)).toHaveAttribute('aria-current', 'step')
      expect(step(/Stack/)).not.toHaveAttribute('aria-current')
      expect(step(/Stack/)).toHaveTextContent('Done: Stack')
    })
  })

  describe('MVP choices', () => {
    beforeEach(() => {
      stubApi({ 'GET /api/topics': TOPICS })
    })

    const card = (name: RegExp) => screen.getByRole('button', { name })

    it('locks the only language and framework', () => {
      renderWizard()

      for (const name of [/^Java/, /^Spring Boot/]) {
        expect(card(name)).toBeDisabled()
        expect(card(name)).toHaveAttribute('aria-pressed', 'true')
      }
    })

    it('locks Junior and marks the other levels as coming soon', async () => {
      const user = renderWizard()

      await user.click(button('Next'))

      expect(card(/^Junior/)).toHaveAttribute('aria-pressed', 'true')
      for (const name of [/^Mid\s*Coming soon/, /^Senior\s*Coming soon/]) {
        expect(card(name)).toBeDisabled()
        expect(card(name)).toHaveAttribute('aria-pressed', 'false')
      }
    })
  })

  describe('topics step', () => {
    it('keeps Finish disabled until at least one topic is selected', async () => {
      stubApi({ 'GET /api/topics': TOPICS })
      const user = renderWizard()
      await goToTopics(user)
      const rest = await screen.findByRole('button', { name: 'REST' })

      expect(button('Finish')).toBeDisabled()

      await user.click(rest)
      expect(button('Finish')).toBeEnabled()

      await user.click(rest)
      expect(button('Finish')).toBeDisabled()
    })

    it('counts the selected topics', async () => {
      stubApi({ 'GET /api/topics': TOPICS })
      const user = renderWizard()
      await goToTopics(user)

      await user.click(await screen.findByRole('button', { name: 'REST' }))
      expect(screen.getByText('1 selected')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'SQL' }))
      expect(screen.getByText('2 selected')).toBeInTheDocument()
    })

    it('keeps Finish disabled when no topics exist', async () => {
      stubApi({ 'GET /api/topics': [] })
      const user = renderWizard()

      await goToTopics(user)

      expect(button('Finish')).toBeDisabled()
    })

    it('shows the loading message until topics arrive', async () => {
      let release: (response: Response) => void = () => {}
      stubApi({
        'GET /api/topics': () =>
          new Promise<Response>((resolve) => {
            release = resolve
          }),
      })
      const user = renderWizard()
      await goToTopics(user)

      expect(screen.getByText('Loading topics…')).toBeInTheDocument()

      release(jsonResponse(TOPICS))
      expect(await screen.findByRole('button', { name: 'REST' })).toBeInTheDocument()
      expect(screen.queryByText('Loading topics…')).not.toBeInTheDocument()
    })

    it('shows an error when topics cannot be loaded', async () => {
      stubApi({ 'GET /api/topics': () => Promise.reject(new TypeError('Failed to fetch')) })
      const user = renderWizard()

      await goToTopics(user)

      expect(await screen.findByText('Failed to load topics')).toBeInTheDocument()
      expect(button('Finish')).toBeDisabled()
    })

    // Known bug: a 500 puts the error JSON in `topics`, so topics.map crashes the wizard.
    // https://trello.com/c/d6v9NYfk. When fixed this test starts passing: drop `.fails`.
    it.fails('shows an error instead of crashing when topics answer 500', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      stubApi({ 'GET /api/topics': jsonResponse({ error: 'Internal' }, 500) })
      const user = renderWizard()

      await goToTopics(user)

      expect(button('Finish')).toBeDisabled()
    })
  })

  describe('finishing', () => {
    it('saves the choices and goes to the room', async () => {
      const fetchMock = stubApi({ 'GET /api/topics': TOPICS, 'POST /api/profile': { id: 1 } })
      const user = renderWizard()
      await goToTopics(user)
      await user.click(await screen.findByRole('button', { name: 'REST' }))
      await user.click(screen.getByRole('button', { name: 'SQL' }))

      await user.click(button('Finish'))

      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/room'))
      expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toEqual({
        language: 'Java',
        framework: 'Spring Boot',
        seniority: 'Junior',
        topicIds: [1, 2],
      })
    })

    it('shows the error and stays on the wizard when saving fails', async () => {
      stubApi({ 'GET /api/topics': TOPICS, 'POST /api/profile': jsonResponse({}, 500) })
      const user = renderWizard()
      await goToTopics(user)
      await user.click(await screen.findByRole('button', { name: 'REST' }))

      await user.click(button('Finish'))

      expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
      expect(screen.getByTestId('location')).toHaveTextContent('/onboarding')
      expect(button('Finish')).toBeEnabled()
    })

    it('blocks a second submit while saving', async () => {
      let release: (response: Response) => void = () => {}
      stubApi({
        'GET /api/topics': TOPICS,
        'POST /api/profile': () =>
          new Promise<Response>((resolve) => {
            release = resolve
          }),
      })
      const user = renderWizard()
      await goToTopics(user)
      await user.click(await screen.findByRole('button', { name: 'REST' }))

      await user.click(button('Finish'))
      expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()

      release(jsonResponse({ id: 1 }))
      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/room'))
    })
  })
})
