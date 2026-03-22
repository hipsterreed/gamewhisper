import { create } from 'zustand'

const STORAGE_KEY = 'gamewhisper-sessions'

export interface SessionMessage {
  role: 'user' | 'agent'
  content: string
  timestamp: number
}

export interface Session {
  id: string
  game: string | null
  startedAt: number
  messages: SessionMessage[]
}

interface SessionsState {
  sessions: Session[]
  addSession: (session: Session) => void
}

function loadSessions(): Session[] {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    return json ? (JSON.parse(json) as Session[]) : []
  } catch {
    return []
  }
}

function persistSessions(sessions: Session[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {}
}

export const useSessionsStore = create<SessionsState>((set) => ({
  sessions: loadSessions(),

  addSession(session) {
    set((state) => {
      const next = [session, ...state.sessions].slice(0, 100)
      persistSessions(next)
      return { sessions: next }
    })
  },
}))
