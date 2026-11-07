import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useTopics } from './useTopics'
import { jsonResponse, stubApi } from '../test/helpers'

const TOPICS = [{ id: 1, name: 'REST', slug: 'rest' }]

async function loadedTopics() {
  const { result } = renderHook(() => useTopics())
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  return result.current
}

describe('useTopics', () => {
  it('returns the topics from the public endpoint, without a token', async () => {
    const fetchMock = stubApi({ 'GET /api/topics': TOPICS })

    const { topics, error } = await loadedTopics()

    expect(topics).toEqual(TOPICS)
    expect(error).toBeNull()
    expect(fetchMock.mock.calls[0][1]).toBeUndefined()
  })

  it('reports an error when the network fails', async () => {
    stubApi({ 'GET /api/topics': () => Promise.reject(new TypeError('Failed to fetch')) })

    const { topics, error } = await loadedTopics()

    expect(topics).toEqual([])
    expect(error).toBe('Failed to load topics')
  })

  // Known bug: res.ok is never checked, so the error JSON lands in `topics` and topics.map crashes.
  // https://trello.com/c/d6v9NYfk. When fixed this test starts passing: drop `.fails`.
  it.fails('reports an error on a non-OK response and keeps topics a list', async () => {
    stubApi({ 'GET /api/topics': jsonResponse({ error: 'Internal' }, 500) })

    const { topics, error } = await loadedTopics()

    expect(topics).toEqual([])
    expect(error).not.toBeNull()
  })
})
