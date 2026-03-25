import { useState, useRef, useCallback, useEffect } from 'react'
import { Conversation } from '@elevenlabs/client'
import { setDoc, updateDoc, arrayUnion, doc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { auth } from '../lib/firebase'
import { db } from '../lib/firebase'
import { analytics } from '../lib/analytics'

export type SessionStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'searching' | 'error'

interface Message {
  role: 'user' | 'agent'
  content: string
  timestamp: number
}

interface UseElevenLabsReturn {
  status: SessionStatus
  userTranscript: string
  agentTranscript: string
  amplitude: number
  errorMessage: string | null
  sessionProgress: number
  sessionTimedOut: boolean
  sourceCount: number | null
  startSession: (gameName: string, agentId: string) => Promise<void>
  endSession: () => Promise<void>
}

const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.gamewhisper.io'

async function getIdToken(): Promise<string | null> {
  try {
    await auth.authStateReady()
    return (await auth.currentUser?.getIdToken()) ?? null
  } catch {
    return null
  }
}

async function apiPost(path: string, body: unknown, token: string): Promise<void> {
  try {
    await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
  } catch {
    // fire-and-forget — don't surface network errors to the user
  }
}

function pickGreeting(gameName: string): string {
  return `I see you're playing ${gameName || 'a game'}, how can I help?`
}

export function useElevenLabs(): UseElevenLabsReturn {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [userTranscript, setUserTranscript] = useState('')
  const [agentTranscript, setAgentTranscript] = useState('')
  const [amplitude, setAmplitude] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionProgress, setSessionProgress] = useState(0)
  const [sessionTimedOut, setSessionTimedOut] = useState(false)
  const [sourceCount, setSourceCount] = useState<number | null>(null)

  const conversationRef = useRef<Awaited<ReturnType<typeof Conversation.startSession>> | null>(null)
  const animFrameRef = useRef<number>(0)
  const vizStreamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const sessionIdRef = useRef<string | null>(null)
  const messagesRef = useRef<Message[]>([])
  const gameNameRef = useRef<string>('')
  const toolCallWatchRef = useRef<Unsubscribe | null>(null)
  const toolCallsSeenRef = useRef<number>(0)

  const stopAmplitudeMonitor = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = 0
    }
    if (vizStreamRef.current) {
      vizStreamRef.current.getTracks().forEach((t) => t.stop())
      vizStreamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    setAmplitude(0)
  }, [])

  const stopTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    setSessionProgress(0)
  }, [])

  const startAmplitudeMonitor = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext()
    audioCtxRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      analyser.getByteFrequencyData(data)
      const avg = data.reduce((s, v) => s + v, 0) / data.length
      setAmplitude(avg / 128)
      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }, [])

  const endSession = useCallback(async () => {
    if (toolCallWatchRef.current) {
      toolCallWatchRef.current()
      toolCallWatchRef.current = null
    }
    setSourceCount(null)

    const sessionId = sessionIdRef.current
    const messages = messagesRef.current
    if (sessionId && messages.length > 0) {
      const uid = auth.currentUser?.uid ?? ''
      const endedAt = Date.now()
      analytics.sessionEnded(gameNameRef.current, endedAt - startTimeRef.current, messages.length)
      if (uid) {
        setDoc(
          doc(db, 'users', uid, 'sessions', sessionId),
          {
            sessionId,
            uid,
            gameName: gameNameRef.current || null,
            startedAt: startTimeRef.current,
            endedAt,
            messages: [...messages],
          },
          { merge: true },
        ).catch(() => {})
      }
      const token = await getIdToken()
      if (token) {
        apiPost('/session/end', { sessionId, messages }, token)
      }
    }
    sessionIdRef.current = null
    messagesRef.current = []
    gameNameRef.current = ''

    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession()
      } catch {
        // ignore errors on cleanup
      }
      conversationRef.current = null
    }
    stopAmplitudeMonitor()
    stopTimers()
    setStatus('idle')
    setUserTranscript('')
    setAgentTranscript('')
    setErrorMessage(null)
    setSessionTimedOut(false)
  }, [stopAmplitudeMonitor, stopTimers])

  const startSession = useCallback(
    async (gameName: string, agentId: string) => {
      if (conversationRef.current) await endSession()

      setStatus('connecting')
      setErrorMessage(null)
      setUserTranscript('')
      setAgentTranscript('')

      const sessionId = crypto.randomUUID()
      sessionIdRef.current = sessionId
      messagesRef.current = []
      gameNameRef.current = gameName

      const uid = auth.currentUser?.uid
      if (uid) {
        await setDoc(
          doc(db, 'users', uid, 'sessions', sessionId),
          { sessionId, uid, gameName: gameName || null, startedAt: Date.now(), endedAt: null, messages: [], toolCalls: [] },
          { merge: true },
        )
      }

      getIdToken().then((token) => {
        if (token) apiPost('/session/start', { sessionId, gameName: gameName || 'Unknown Game' }, token)
      })

      try {
        const vizStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        vizStreamRef.current = vizStream
        startAmplitudeMonitor(vizStream)

        const connectTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timed out')), 10_000),
        )

        const conversation = await Promise.race([Conversation.startSession({
          agentId,
          connectionType: 'websocket',
          dynamicVariables: { game_name: gameName || 'Unknown Game', session_id: sessionId, first_message: pickGreeting(gameName) },

          onConnect: () => {
            setStatus('listening')
            startTimeRef.current = Date.now()
            toolCallsSeenRef.current = 0
            analytics.sessionStarted(gameName)

            const watchUid = auth.currentUser?.uid
            if (watchUid && sessionId) {
              toolCallWatchRef.current = onSnapshot(
                doc(db, 'users', watchUid, 'sessions', sessionId),
                (snap) => {
                  if (!snap.exists()) return
                  const toolCalls = (snap.data()?.toolCalls ?? []) as Array<{ sources: string[] }>
                  if (toolCalls.length > toolCallsSeenRef.current) {
                    const latest = toolCalls[toolCalls.length - 1]
                    const count = latest.sources?.length ?? 0
                    setSourceCount(count)
                    analytics.searchCompleted(gameName, count)
                    toolCallsSeenRef.current = toolCalls.length
                  }
                },
              )
            }

            timeoutRef.current = setTimeout(() => {
              analytics.sessionTimedOut(gameName)
              setErrorMessage('Session timed out')
              setStatus('error')
              setSessionTimedOut(true)
              stopAmplitudeMonitor()
              stopTimers()
              if (conversationRef.current) {
                conversationRef.current.endSession().catch(() => {})
                conversationRef.current = null
              }
            }, 60_000)

            progressIntervalRef.current = setInterval(() => {
              const elapsed = (Date.now() - startTimeRef.current) / 60_000
              setSessionProgress(Math.min(elapsed, 1))
            }, 500)
          },

          onDisconnect: () => {
            stopAmplitudeMonitor()
            stopTimers()
            setStatus('idle')
          },

          onMessage: (message) => {
            const msgTimestamp = Date.now()
            if (message.source === 'ai') {
              const msg: Message = { role: 'agent', content: message.message, timestamp: msgTimestamp }
              setAgentTranscript(message.message)
              messagesRef.current.push(msg)
              const currentUid = auth.currentUser?.uid
              const sid = sessionIdRef.current
              if (currentUid && sid) {
                updateDoc(doc(db, 'users', currentUid, 'sessions', sid), { messages: arrayUnion(msg) }).catch(() => {})
              }
            } else if (message.source === 'user') {
              const msg: Message = { role: 'user', content: message.message, timestamp: msgTimestamp }
              setUserTranscript(message.message)
              messagesRef.current.push(msg)
              analytics.queryMade(gameName, messagesRef.current.filter(m => m.role === 'user').length)
              const currentUid = auth.currentUser?.uid
              const sid = sessionIdRef.current
              if (currentUid && sid) {
                updateDoc(doc(db, 'users', currentUid, 'sessions', sid), { messages: arrayUnion(msg) }).catch(() => {})
              }
              setSourceCount(null)
              setStatus('searching')
            }
          },

          onModeChange: (mode) => {
            if (mode.mode === 'speaking') {
              setStatus('speaking')
            } else if (mode.mode === 'listening') {
              setStatus('listening')
            }
          },

          onError: (error) => {
            const msg = typeof error === 'string' ? error : 'Connection error'
            analytics.sessionError(gameName, msg)
            setErrorMessage(msg)
            setStatus('error')
            stopAmplitudeMonitor()
            stopTimers()
          },
        }), connectTimeout])

        conversationRef.current = conversation
      } catch (err) {
        sessionIdRef.current = null
        messagesRef.current = []
        const msg = err instanceof Error ? err.message : 'Failed to start session'
        const friendly =
          msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')
            ? 'Microphone permission denied'
            : msg.toLowerCase().includes('timed out') || msg.toLowerCase().includes('timeout')
              ? 'Connection timed out'
              : msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')
                ? 'Could not connect to ElevenLabs'
                : msg
        setErrorMessage(friendly)
        setStatus('error')
        stopAmplitudeMonitor()
        stopTimers()
      }
    },
    [endSession, startAmplitudeMonitor, stopAmplitudeMonitor, stopTimers],
  )

  useEffect(() => {
    return () => {
      endSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    status,
    userTranscript,
    agentTranscript,
    amplitude,
    errorMessage,
    sessionProgress,
    sessionTimedOut,
    sourceCount,
    startSession,
    endSession,
  }
}
