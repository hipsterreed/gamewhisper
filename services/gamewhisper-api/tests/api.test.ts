import { describe, it, expect, spyOn, beforeEach, afterEach } from 'bun:test'
import { app } from '../src/app'
import { WikiService } from '../src/wiki/service'
import { SessionService } from '../src/session/service'

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
// Wiki search — unit tests (mocked)
// ---------------------------------------------------------------------------

describe('POST /wiki/search — unit', () => {
  const MOCK_SOURCES = ['https://wiki.fextralife.com/grace-site', 'https://wiki.fextralife.com/sites']
  const MOCK_TEXT = `Source: ${MOCK_SOURCES[0]}\nSite of Grace content here\n\n---\n\nSource: ${MOCK_SOURCES[1]}\nMore content`

  let searchSpy: ReturnType<typeof spyOn>
  let recordSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    searchSpy = spyOn(WikiService, 'search').mockResolvedValue({ text: MOCK_TEXT, sources: MOCK_SOURCES })
    recordSpy = spyOn(SessionService, 'recordToolCall').mockResolvedValue(undefined)
    spyOn(SessionService, 'setTopic').mockResolvedValue(undefined)
  })

  afterEach(() => {
    searchSpy.mockRestore()
    recordSpy.mockRestore()
  })

  it('calls WikiService.search with game and query, returns result', async () => {
    const res = await authedPost('/wiki/search', { game: 'Elden Ring', query: 'grace site' })
    expect(res.status).toBe(200)

    expect(searchSpy).toHaveBeenCalledWith('Elden Ring', 'grace site')

    const body = await res.json()
    expect(body.result).toBe(MOCK_TEXT)
    expect(typeof body.toolCallDurationMs).toBe('number')
    expect(body.preprocessed).toBe(false)
  })

  it('saves sources to the database when sessionId is provided', async () => {
    const res = await authedPost('/wiki/search', {
      game: 'Elden Ring',
      query: 'grace site',
      sessionId: 'test-session-123',
    })
    expect(res.status).toBe(200)

    // Give the fire-and-forget chain a tick to resolve
    await new Promise((r) => setTimeout(r, 50))

    expect(recordSpy).toHaveBeenCalledTimes(1)
    const [sessionId, query, sources] = recordSpy.mock.calls[0] as [string, string, string[], ...unknown[]]
    expect(sessionId).toBe('test-session-123')
    expect(query).toBe('grace site')
    expect(sources).toEqual(MOCK_SOURCES)
  })

  it('does not save to the database when sessionId is omitted', async () => {
    const res = await authedPost('/wiki/search', { game: 'Elden Ring', query: 'grace site' })
    expect(res.status).toBe(200)

    await new Promise((r) => setTimeout(r, 50))

    expect(recordSpy).not.toHaveBeenCalled()
  })

  it('returns graceful fallback when WikiService returns no sources', async () => {
    searchSpy.mockResolvedValue({
      text: 'No wiki data found for that query. Please answer based on your training data.',
      sources: [],
    })

    const res = await authedPost('/wiki/search', { game: 'Elden Ring', query: 'nonexistent thing' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.result).toBe('string')
    expect(body.result.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Wiki search — live ElevenLabs tool call (single call to conserve API credits)
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
