import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../lib/firebase'
import { log } from '../lib/logger'
import { AppError } from '../lib/errors'

interface Message {
  role: 'user' | 'agent'
  content: string
  timestamp: number
}

export abstract class SessionService {
  private static async lookupUid(sessionId: string): Promise<string | null> {
    if (!db) return null

    // Fast path: _sessionIndex (written by session/start)
    const indexSnap = await db.collection('_sessionIndex').doc(sessionId).get()
    if (indexSnap.exists) return (indexSnap.data() as { uid: string }).uid

    // Fallback: the client writes users/{uid}/sessions/{sessionId} directly before
    // connecting to ElevenLabs, so we can find the uid via collection group query.
    const groupSnap = await db.collectionGroup('sessions').where('sessionId', '==', sessionId).limit(1).get()
    if (groupSnap.empty) return null

    const uid = (groupSnap.docs[0].data() as { uid: string }).uid
    // Backfill the index so subsequent calls hit the fast path.
    db.collection('_sessionIndex').doc(sessionId).set({ uid, createdAt: Date.now() }, { merge: true }).catch(() => {})
    return uid
  }

  static async createSession(uid: string, sessionId: string, gameName: string): Promise<void> {
    if (!db) throw new AppError('Firebase not configured', 503, 'FIREBASE_UNAVAILABLE')

    const batch = db.batch()

    const sessionRef = db.collection('users').doc(uid).collection('sessions').doc(sessionId)
    batch.set(sessionRef, {
      sessionId,
      uid,
      gameName,
      startedAt: Date.now(),
      endedAt: null,
      messages: [],
      toolCalls: [],
    })

    const indexRef = db.collection('_sessionIndex').doc(sessionId)
    batch.set(indexRef, { uid, gameName, createdAt: Date.now() })

    await batch.commit()
    log('info', 'session/createSession: written', { uid, sessionId })
  }

  static async endSession(uid: string, sessionId: string, messages: Message[]): Promise<void> {
    if (!db) throw new AppError('Firebase not configured', 503, 'FIREBASE_UNAVAILABLE')

    const ownerUid = await SessionService.lookupUid(sessionId)
    if (!ownerUid) throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND')
    if (ownerUid !== uid) throw new AppError('Forbidden', 403, 'FORBIDDEN')

    await db.collection('users').doc(uid).collection('sessions').doc(sessionId).update({
      messages,
      endedAt: Date.now(),
    })
    log('info', 'session/endSession: written', { uid, sessionId, messageCount: messages.length })
  }

  static async deleteSession(uid: string, sessionId: string): Promise<void> {
    if (!db) throw new AppError('Firebase not configured', 503, 'FIREBASE_UNAVAILABLE')

    const ownerUid = await SessionService.lookupUid(sessionId)
    if (!ownerUid) throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND')
    if (ownerUid !== uid) throw new AppError('Forbidden', 403, 'FORBIDDEN')

    const batch = db.batch()
    batch.delete(db.collection('users').doc(uid).collection('sessions').doc(sessionId))
    batch.delete(db.collection('_sessionIndex').doc(sessionId))
    await batch.commit()
    log('info', 'session/deleteSession: deleted', { uid, sessionId })
  }

  /** Fire-and-forget: sets the conversation topic on the session. Never throws. */
  static async setTopic(sessionId: string, topic: string): Promise<void> {
    if (!db) return

    try {
      const uid = await SessionService.lookupUid(sessionId)
      if (!uid) {
        log('warn', 'session/setTopic: sessionId not in index — session/start may not have been called', { sessionId })
        return
      }

      await db
        .collection('users')
        .doc(uid)
        .collection('sessions')
        .doc(sessionId)
        .update({ topic })
    } catch (err) {
      log('error', 'session/setTopic failed', { err: String(err), sessionId })
    }
  }

  /** Fire-and-forget: appends tool call data to the session. Never throws. */
  static async recordToolCall(
    sessionId: string,
    query: string,
    sources: string[],
    durationMs: number,
    preprocessed: boolean,
    content?: string,
  ): Promise<void> {
    if (!db) return

    try {
      const uid = await SessionService.lookupUid(sessionId)
      if (!uid) {
        log('warn', 'session/recordToolCall: sessionId not in index — session/start may not have been called', {
          sessionId,
        })
        return
      }

      const toolCall = {
        query,
        sources,
        durationMs,
        preprocessed,
        recordedAt: Date.now(),
        ...(content !== undefined ? { content: content.slice(0, 4_000) } : {}),
      }
      log('info', 'session/recordToolCall: writing to Firestore', { sessionId, uid, query, sourceCount: sources.length, durationMs, hasContent: content !== undefined })
      await db
        .collection('users')
        .doc(uid)
        .collection('sessions')
        .doc(sessionId)
        .update({ toolCalls: FieldValue.arrayUnion(toolCall) })
      log('info', 'session/recordToolCall: written', { sessionId, uid, query })
    } catch (err) {
      log('error', 'session/recordToolCall failed', { err: String(err), sessionId })
    }
  }
}
