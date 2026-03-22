import { Elysia } from 'elysia'
import { firebaseAuthPlugin } from '../middleware/firebaseAuth'
import { SessionService } from './service'
import { SessionModel } from './model'
import { log } from '../lib/logger'
import { AppError } from '../lib/errors'

export const sessionRoutes = new Elysia({ prefix: '/session' })
  .use(firebaseAuthPlugin)
  .post(
    '/start',
    async ({ uid, body, set }) => {
      const { sessionId, gameName } = body
      log('info', 'session/start', { uid, sessionId, gameName })
      try {
        await SessionService.createSession(uid, sessionId, gameName)
        return { ok: true }
      } catch (err) {
        log('error', 'session/start failed', { err: String(err), sessionId })
        if (err instanceof AppError && err.statusCode < 500) {
          set.status = err.statusCode
          return { error: err.message }
        }
        set.status = 500
        return { error: 'Failed to create session' }
      }
    },
    { body: SessionModel.startBody },
  )
  .post(
    '/end',
    async ({ uid, body, set }) => {
      const { sessionId, messages } = body
      log('info', 'session/end', { uid, sessionId, messageCount: messages.length })
      try {
        await SessionService.endSession(uid, sessionId, messages)
        return { ok: true }
      } catch (err) {
        log('error', 'session/end failed', { err: String(err), sessionId })
        if (err instanceof AppError && err.statusCode < 500) {
          set.status = err.statusCode
          return { error: err.message }
        }
        set.status = 500
        return { error: 'Failed to finalize session' }
      }
    },
    { body: SessionModel.endBody },
  )
