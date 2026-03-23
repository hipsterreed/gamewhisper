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
      const { game, query, topic, sessionId } = body
      const t0 = Date.now()

      log('info', 'wiki/search: tool call received from ElevenLabs', { game, query, topic: topic ?? null, sessionId: sessionId ?? null })

      try {
        const { text, sources } = await WikiService.search(game, query)
        const toolCallDurationMs = Date.now() - t0

        log('info', 'wiki/search: returning result to ElevenLabs', {
          game,
          query,
          toolCallDurationMs,
          sourceCount: sources.length,
          sources,
          responsePreview: text.slice(0, 300),
        })

        if (sessionId) {
          log('info', 'wiki/search: saving tool call to DB', { sessionId, query, sourceCount: sources.length })
          SessionService.recordToolCall(sessionId, query, sources, toolCallDurationMs, false, text)
            .then(() => log('info', 'wiki/search: tool call saved to DB', { sessionId, query }))
            .catch((err) => log('warn', 'wiki/search: recordToolCall failed', { err: String(err), sessionId }))
          if (topic) {
            SessionService.setTopic(sessionId, topic).catch((err) =>
              log('warn', 'wiki/search: setTopic failed', { err: String(err), sessionId }),
            )
          }
        } else {
          log('warn', 'wiki/search: no sessionId — tool call not saved to DB', { game, query })
        }

        return { result: text, toolCallDurationMs, preprocessed: false }
      } catch (err) {
        const toolCallDurationMs = Date.now() - t0
        log('error', 'wiki/search: tool call failed', { err: String(err), game, query, toolCallDurationMs })

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
