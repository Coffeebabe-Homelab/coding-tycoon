import { describe, expect, it } from 'vitest'
import { ApiError, fetchWithAuth } from './api'
import { jsonResponse, stubApi } from '../test/helpers'

describe('fetchWithAuth', () => {
  it('sends the bearer token to the configured API and returns the parsed body', async () => {
    const fetchMock = stubApi({ 'GET /api/things': { name: 'thing' } })

    await expect(fetchWithAuth('/api/things', 'abc')).resolves.toEqual({ name: 'thing' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://api.test/api/things')
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer abc' })
  })

  it('resolves to undefined on 204 No Content', async () => {
    stubApi({ 'GET /api/things': new Response(null, { status: 204 }) })

    await expect(fetchWithAuth('/api/things', 'abc')).resolves.toBeUndefined()
  })

  it('passes request options through and keeps custom headers', async () => {
    const fetchMock = stubApi({ 'POST /api/things': {} })

    await fetchWithAuth('/api/things', 'abc', {
      method: 'POST',
      body: '{"a":1}',
      headers: { 'X-Custom': 'yes' },
    })

    const [, init] = fetchMock.mock.calls[0]
    expect(init?.body).toBe('{"a":1}')
    expect(init?.headers).toMatchObject({ 'X-Custom': 'yes', Authorization: 'Bearer abc' })
  })

  it('does not let a caller override the auth header', async () => {
    const fetchMock = stubApi({ 'GET /api/things': {} })

    await fetchWithAuth('/api/things', 'abc', { headers: { Authorization: 'Bearer other' } })

    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer abc' })
  })

  it.each([401, 404, 500])('throws an ApiError carrying the status on %i', async (status) => {
    stubApi({ 'GET /api/things': jsonResponse({ message: 'nope' }, status) })

    const error = await fetchWithAuth('/api/things', 'abc').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(status)
    expect((error as ApiError).message).toContain('nope')
  })

  it('rejects when the network fails', async () => {
    stubApi({
      'GET /api/things': () => Promise.reject(new TypeError('Failed to fetch')),
    })

    await expect(fetchWithAuth('/api/things', 'abc')).rejects.toThrow('Failed to fetch')
  })

  it('throws a 401 ApiError without calling the API when there is no token', async () => {
    const fetchMock = stubApi({ 'GET /api/things': {} })

    const error = await fetchWithAuth('/api/things', undefined).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('ApiError.serverMessage', () => {
  it("reads the backend's message from its error body", () => {
    const body =
      '{"error":"UnprocessableException","message":"Commit message is required","status":422}'

    expect(new ApiError(422, body).serverMessage).toBe('Commit message is required')
  })

  it.each(['<html>Bad gateway</html>', '{"error":"x"}', '"text"', 'null'])(
    'is null when the body has no message: %s',
    (body) => {
      expect(new ApiError(502, body).serverMessage).toBeNull()
    },
  )
})
