import { Elysia, t } from 'elysia'
import { searchGameWiki } from './services/firecrawl'

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY
const PORT = parseInt(process.env.PORT ?? '3000')

function log(level: 'info' | 'warn' | 'error', msg: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ level, ts: new Date().toISOString(), msg, ...data }))
}

const app = new Elysia()
  .get('/health', () => ({ status: 'ok' }))
  .guard(
    {
      beforeHandle: ({ request, set }) => {
        if (!INTERNAL_API_KEY || request.headers.get('x-api-key') !== INTERNAL_API_KEY) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
      },
    },
    (app) =>
      app.post(
        '/wiki/search',
        async ({ body }) => {
          const { game, query, sessionId } = body
          const t0 = Date.now()

          log('info', 'wiki/search', { game, query, sessionId: sessionId ?? null })

          try {
            const timeout = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout')), 8_000),
            )
            const result = await Promise.race([searchGameWiki(game, query), timeout])
            const toolCallDurationMs = Date.now() - t0

            log('info', 'wiki/search complete', { game, toolCallDurationMs })
            return { result, toolCallDurationMs, preprocessed: false }
          } catch (err) {
            const toolCallDurationMs = Date.now() - t0
            log('error', 'wiki/search failed', { err: String(err), toolCallDurationMs })
            return {
              result:
                "I couldn't find relevant wiki information right now. Please answer based on your training data.",
              toolCallDurationMs,
              preprocessed: false,
            }
          }
        },
        {
          body: t.Object({
            game: t.String(),
            query: t.String(),
            sessionId: t.Optional(t.String()),
          }),
        },
      ),
  )
  .listen(PORT)

log('info', 'server started', { port: PORT })
