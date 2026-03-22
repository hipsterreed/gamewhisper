import { describe, it, expect, beforeAll } from 'bun:test'
import { app } from '../src/app'

const API_KEY = process.env.INTERNAL_API_KEY!

function req(path: string, options?: RequestInit) {
  return app.handle(new Request(`http://localhost${path}`, options))
}

function authedPost(path: string, body: unknown) {
  return req(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await req('/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })
})

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

describe('POST /wiki/search — auth', () => {
  it('returns 401 with no api key', async () => {
    const res = await req('/wiki/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'Elden Ring', query: 'bosses' }),
    })
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 401 with wrong api key', async () => {
    const res = await req('/wiki/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'wrong-key' },
      body: JSON.stringify({ game: 'Elden Ring', query: 'bosses' }),
    })
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: 'Unauthorized' })
  })
})

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe('POST /wiki/search — validation', () => {
  it('returns 422 when game is missing', async () => {
    const res = await req('/wiki/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ query: 'bosses' }),
    })
    expect(res.status).toBe(422)
  })

  it('returns 422 when query is missing', async () => {
    const res = await req('/wiki/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ game: 'Elden Ring' }),
    })
    expect(res.status).toBe(422)
  })

  it('returns 422 when body is empty', async () => {
    const res = await req('/wiki/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(422)
  })
})

// ---------------------------------------------------------------------------
// Wiki search — live Firecrawl (single call to conserve tokens)
// ---------------------------------------------------------------------------

describe('POST /wiki/search — live', () => {
  it('returns a result with correct shape for a known game', async () => {
    const res = await authedPost('/wiki/search', {
      game: 'Elden Ring',
      query: 'grace site',
      sessionId: 'test-session',
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.result).toBe('string')
    expect(typeof body.toolCallDurationMs).toBe('number')
    expect(body.preprocessed).toBe(false)
  }, 20_000)
})
