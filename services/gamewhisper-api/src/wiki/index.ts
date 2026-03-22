import { Elysia } from 'elysia'
import { authPlugin } from '../middleware/auth'
import { log } from '../lib/logger'
import { AppError } from '../lib/errors'
import { WikiService } from './service'
import { WikiModel } from './model'
import { SessionService } from '../session/service'

export const wikiRoutes = new Elysia({ prefix: '/wiki' })
  .use(authPlugin)
  .post(
    '/search',
    async ({ body }) => {
      const { game, query, sessionId } = body
      const t0 = Date.now()

      log('info', 'wiki/search', { game, query, sessionId: sessionId ?? null })

      try {
        const { text, sources } = await WikiService.search(game, query)
        const toolCallDurationMs = Date.now() - t0
        log('info', 'wiki/search complete', { game, toolCallDurationMs, sourceCount: sources.length })

        if (sessionId) {
          SessionService.recordToolCall(sessionId, query, sources, toolCallDurationMs, false).catch((err) =>
            log('warn', 'wiki/search: recordToolCall failed', { err: String(err), sessionId }),
          )
        }

        return { result: text, toolCallDurationMs, preprocessed: false }
      } catch (err) {
        const toolCallDurationMs = Date.now() - t0
        log('error', 'wiki/search failed', { err: String(err), toolCallDurationMs })

        if (err instanceof AppError && err.statusCode < 500) {
          return { result: err.message, toolCallDurationMs, preprocessed: false }
        }

        return {
          result: "I couldn't find relevant wiki information right now. Please answer based on your training data.",
          toolCallDurationMs,
          preprocessed: false,
        }
      }
    },
    { body: WikiModel.searchBody },
  )
