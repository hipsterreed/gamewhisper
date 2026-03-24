import { useState, useRef, useCallback, useEffect } from 'react'
import { Conversation } from '@elevenlabs/client'
import { setDoc, updateDoc, arrayUnion, doc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { auth } from '../lib/firebase'
import { db } from '../lib/firebase'
import { useSessionsStore } from '../stores/sessions.store'
import { useHistoryStore } from '../stores/history.store'

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
  startSession: (gameName: string, agentId: string, micDeviceId?: string, outputDeviceId?: string) => Promise<void>
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
  const searchingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
    if (searchingTimerRef.current) {
      clearTimeout(searchingTimerRef.current)
      searchingTimerRef.current = null
    }
    if (toolCallWatchRef.current) {
      toolCallWatchRef.current()
      toolCallWatchRef.current = null
    }
    setSourceCount(null)

    // Save to local session history and fire-and-forget session/end
    const sessionId = sessionIdRef.current
    const messages = messagesRef.current
    if (sessionId && messages.length > 0) {
      useSessionsStore.getState().addSession({
        id: sessionId,
        game: gameNameRef.current || null,
        startedAt: startTimeRef.current,
        messages: [...messages],
      })
      const uid = auth.currentUser?.uid ?? ''
      const endedAt = Date.now()
      useHistoryStore.getState().prependSession({
        sessionId,
        uid,
        gameName: gameNameRef.current || null,
        startedAt: startTimeRef.current,
        endedAt,
        messages: [...messages],
        toolCalls: [],
      })
      // Write full session to Firestore — onSnapshot listener will propagate the
      // update (including any server-written fields like toolCalls/topic) to the UI.
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
        ).catch(() => { })
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
    async (gameName: string, agentId: string, micDeviceId?: string, outputDeviceId?: string) => {
      if (conversationRef.current) await endSession()

      setStatus('connecting')
      setErrorMessage(null)
      setUserTranscript('')
      setAgentTranscript('')

      const sessionId = crypto.randomUUID()
      sessionIdRef.current = sessionId
      messagesRef.current = []
      gameNameRef.current = gameName

      // Create the session doc immediately so incremental message writes work
      // without waiting for the /session/start API response.
      const uid = auth.currentUser?.uid
      if (uid) {
        setDoc(
          doc(db, 'users', uid, 'sessions', sessionId),
          { sessionId, uid, gameName: gameName || null, startedAt: Date.now(), endedAt: null, messages: [], toolCalls: [] },
          { merge: true },
        ).catch(() => {})
      }

      try {
        // Separate mic stream for amplitude visualization
        // Use `ideal` instead of `exact` so we fall back to the default mic if the saved device is unavailable
        const audioConstraint = micDeviceId
          ? { deviceId: { ideal: micDeviceId } }
          : true
        const vizStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint, video: false })
        vizStreamRef.current = vizStream
        startAmplitudeMonitor(vizStream)

        const connectTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timed out')), 10_000),
        )

        const conversation = await Promise.race([Conversation.startSession({
          agentId,
          connectionType: 'websocket',
          dynamicVariables: { game_name: gameName || 'Unknown Game', session_id: sessionId, first_message: pickGreeting(gameName) },
          ...(micDeviceId ? { inputDeviceId: micDeviceId } : {}),
          ...(outputDeviceId ? { outputDeviceId } : {}),

          onConnect: () => {
            setStatus('listening')
            startTimeRef.current = Date.now()
            toolCallsSeenRef.current = 0

            // Watch session doc for tool call results so we can show source count
            const watchUid = auth.currentUser?.uid
            if (watchUid && sessionId) {
              toolCallWatchRef.current = onSnapshot(
                doc(db, 'users', watchUid, 'sessions', sessionId),
                (snap) => {
                  if (!snap.exists()) return
                  const toolCalls = (snap.data()?.toolCalls ?? []) as Array<{ sources: string[] }>
                  if (toolCalls.length > toolCallsSeenRef.current) {
                    const latest = toolCalls[toolCalls.length - 1]
                    setSourceCount(latest.sources?.length ?? 0)
                    toolCallsSeenRef.current = toolCalls.length
                  }
                },
              )
            }

            // Fire-and-forget session/start
            getIdToken().then((token) => {
              if (token) {
                apiPost('/session/start', { sessionId, gameName: gameName || 'Unknown Game' }, token)
              }
            })

            // 60-second session timeout — show message, Overlay handles auto-hide
            timeoutRef.current = setTimeout(() => {
              setErrorMessage('Session timed out')
              setStatus('error')
              setSessionTimedOut(true)
              stopAmplitudeMonitor()
              stopTimers()
              if (conversationRef.current) {
                conversationRef.current.endSession().catch(() => { })
                conversationRef.current = null
              }
            }, 60_000)

            // Progress ring updates every 500ms
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
              // Persist incrementally so the dashboard shows messages in real-time
              const currentUid = auth.currentUser?.uid
              const sid = sessionIdRef.current
              if (currentUid && sid) {
                updateDoc(doc(db, 'users', currentUid, 'sessions', sid), { messages: arrayUnion(msg) }).catch(() => {})
              }
            } else if (message.source === 'user') {
              const msg: Message = { role: 'user', content: message.message, timestamp: msgTimestamp }
              setUserTranscript(message.message)
              messagesRef.current.push(msg)
              // Persist incrementally
              const currentUid = auth.currentUser?.uid
              const sid = sessionIdRef.current
              if (currentUid && sid) {
                updateDoc(doc(db, 'users', currentUid, 'sessions', sid), { messages: arrayUnion(msg) }).catch(() => {})
              }
              // Start a timer: if agent doesn't speak within 1.5s, assume tool call in flight
              if (searchingTimerRef.current) clearTimeout(searchingTimerRef.current)
              searchingTimerRef.current = setTimeout(() => {
                setStatus((prev) => (prev === 'listening' ? 'searching' : prev))
              }, 1500)
            }
          },

          onModeChange: (mode) => {
            if (searchingTimerRef.current) {
              clearTimeout(searchingTimerRef.current)
              searchingTimerRef.current = null
            }
            if (mode.mode === 'speaking') {
              setStatus('speaking')
              setSourceCount(null) // response is coming in, clear the source count
            } else if (mode.mode === 'listening') {
              setStatus('listening')
            }
          },

          onError: (error) => {
            const msg = typeof error === 'string' ? error : 'Connection error'
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
                : msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('requested device')
                  ? 'Microphone not found — check Settings and make sure your selected mic is connected'
                  : msg
        setErrorMessage(friendly)
        setStatus('error')
        stopAmplitudeMonitor()
        stopTimers()
      }
    },
    [endSession, startAmplitudeMonitor, stopAmplitudeMonitor, stopTimers], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Cleanup on unmount
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
