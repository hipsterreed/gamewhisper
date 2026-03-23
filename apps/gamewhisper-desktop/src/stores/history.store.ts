import { create } from 'zustand'
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface SessionMessage {
  role: 'user' | 'agent'
  content: string
  timestamp: number
}

export interface ToolCall {
  query: string
  sources: string[]
  durationMs: number
  preprocessed: boolean
  recordedAt: number
  content?: string
}

export interface FirestoreSession {
  sessionId: string
  uid: string
  gameName: string | null
  topic?: string | null
  startedAt: number
  endedAt: number | null
  messages: SessionMessage[]
  toolCalls: ToolCall[]
}

const PAGE_SIZE = 20

interface HistoryState {
  sessions: FirestoreSession[]
  isLoading: boolean
  hasMore: boolean
  fetchError: string | null
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  _unsub: Unsubscribe | null
  subscribeRealtime: (uid: string) => void
  unsubscribe: () => void
  fetchMore: (uid: string) => Promise<void>
  prependSession: (session: FirestoreSession) => void
  removeSession: (sessionId: string) => void
  reset: () => void
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  sessions: [],
  isLoading: false,
  hasMore: true,
  fetchError: null,
  lastDoc: null,
  _unsub: null,

  subscribeRealtime(uid: string) {
    // Tear down any existing listener first
    const prev = get()._unsub
    if (prev) prev()

    set({ isLoading: true, sessions: [], lastDoc: null, hasMore: true, fetchError: null })

    const q = query(
      collection(db, 'users', uid, 'sessions'),
      orderBy('startedAt', 'desc'),
      limit(PAGE_SIZE),
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const sessions = snap.docs.map((d) => ({ toolCalls: [] as ToolCall[], ...d.data() } as unknown) as FirestoreSession)
        const lastDoc = snap.docs[snap.docs.length - 1] ?? null
        set({ sessions, lastDoc, hasMore: snap.docs.length === PAGE_SIZE, isLoading: false })
      },
      (err) => {
        console.error('history/subscribe failed:', err)
        set({ fetchError: String(err), isLoading: false })
      },
    )

    set({ _unsub: unsub })
  },

  unsubscribe() {
    const fn = get()._unsub
    if (fn) fn()
    set({ _unsub: null })
  },

  async fetchMore(uid: string) {
    const { isLoading, hasMore, lastDoc } = get()
    if (isLoading || !hasMore || !lastDoc) return

    set({ isLoading: true })
    try {
      const q = query(
        collection(db, 'users', uid, 'sessions'),
        orderBy('startedAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE),
      )
      const snap = await getDocs(q)
      const more = snap.docs.map((d) => ({ toolCalls: [] as ToolCall[], ...d.data() } as unknown) as FirestoreSession)
      const newLastDoc = snap.docs[snap.docs.length - 1] ?? lastDoc
      set((state) => ({
        sessions: [...state.sessions, ...more],
        lastDoc: newLastDoc,
        hasMore: snap.docs.length === PAGE_SIZE,
      }))
    } catch (err) {
      console.error('history/fetchMore failed:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  prependSession(session: FirestoreSession) {
    set((state) => ({
      sessions: [session, ...state.sessions.filter((s) => s.sessionId !== session.sessionId)],
    }))
  },

  removeSession(sessionId: string) {
    set((state) => ({ sessions: state.sessions.filter((s) => s.sessionId !== sessionId) }))
  },

  reset() {
    const fn = get()._unsub
    if (fn) fn()
    set({ sessions: [], isLoading: false, hasMore: true, lastDoc: null, fetchError: null, _unsub: null })
  },
}))
