import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth0 } from '@auth0/auth0-react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfilePage from './ProfilePage'
import { authState, jsonResponse, stubApi } from '../test/helpers'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const REST = { id: 1, name: 'REST', slug: 'rest' }
const SQL = { id: 2, name: 'SQL', slug: 'sql' }
const PROFILE = {
  id: 1,
  language: 'Java',
  framework: 'Spring Boot',
  seniority: 'Mid',
  topics: [REST],
}
const ROUTES = { 'GET /api/profile': PROFILE, 'GET /api/topics': [REST, SQL] }

const button = (name: string) => screen.getByRole('button', { name })

function renderProfile() {
  render(
    <MemoryRouter initialEntries={['/room/profile']}>
      <ProfilePage />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

async function enterEditMode() {
  const user = renderProfile()
  await user.click(await screen.findByRole('button', { name: 'Edit' }))
  await screen.findByRole('button', { name: 'SQL' })
  return user
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  it('shows loading, then the profile', async () => {
    stubApi(ROUTES)

    renderProfile()
    expect(screen.getByText('Loading profile…')).toBeInTheDocument()

    expect(await screen.findByText('Spring Boot')).toBeInTheDocument()
    expect(screen.getByText('Mid')).toBeInTheDocument()
    expect(screen.getByText('REST')).toBeInTheDocument()
  })

  it('shows the error when the profile cannot load', async () => {
    stubApi({ ...ROUTES, 'GET /api/profile': jsonResponse({}, 500) })

    renderProfile()

    expect(await screen.findByText('Failed to load profile')).toBeInTheDocument()
  })

  it('cancelling discards edits and returns to the view', async () => {
    stubApi(ROUTES)
    const user = await enterEditMode()

    await user.click(button('Senior'))
    await user.click(button('Cancel'))

    expect(button('Edit')).toBeInTheDocument()
    expect(screen.getByText('Mid')).toBeInTheDocument()
    expect(screen.queryByText('Senior')).not.toBeInTheDocument()
  })

  it('saves the edits and shows the refreshed profile', async () => {
    const saved = { ...PROFILE, seniority: 'Senior' }
    let hasSaved = false
    const fetchMock = stubApi({
      ...ROUTES,
      'GET /api/profile': () => jsonResponse(hasSaved ? saved : PROFILE),
      'PUT /api/profile': () => {
        hasSaved = true
        return jsonResponse(saved)
      },
    })
    const user = await enterEditMode()
    await user.click(button('Senior'))
    await user.click(button('SQL'))

    await user.click(button('Save'))

    expect(await screen.findByText('Senior')).toBeInTheDocument()
    expect(button('Edit')).toBeInTheDocument()
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(JSON.parse(put?.[1]?.body as string)).toEqual({
      language: 'Java',
      framework: 'Spring Boot',
      seniority: 'Senior',
      topicIds: [1, 2],
    })
  })

  it('stays in edit mode and shows the error when saving fails', async () => {
    stubApi({ ...ROUTES, 'PUT /api/profile': jsonResponse({}, 500) })
    const user = await enterEditMode()

    await user.click(button('Save'))

    expect(await screen.findByText('Failed to save changes. Please try again.')).toBeInTheDocument()
    expect(button('Save')).toBeEnabled()
  })

  it('does not allow saving with no topics', async () => {
    stubApi(ROUTES)
    const user = await enterEditMode()

    await user.click(button('REST'))

    expect(button('Save')).toBeDisabled()
  })
})
