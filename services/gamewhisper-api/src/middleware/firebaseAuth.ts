import { Elysia } from 'elysia'
import { auth } from '../lib/firebase'
import { log } from '../lib/logger'

export const firebaseAuthPlugin = new Elysia({ name: 'FirebaseAuth.Plugin' })
  .derive({ as: 'scoped' }, async ({ request }) => {
    const header = request.headers.get('authorization') ?? ''
    if (!auth || !header.startsWith('Bearer ')) return { uid: '' }
    const token = header.slice(7)
    try {
      const decoded = await auth.verifyIdToken(token)
      return { uid: decoded.uid }
    } catch (err) {
      log('warn', 'firebaseAuth: token verification failed', { err: String(err) })
      return { uid: '' }
    }
  })
  .onBeforeHandle({ as: 'scoped' }, ({ uid, set }) => {
    if (!uid) {
      set.status = 401
      return { error: 'Unauthorized' }
    }
  })
