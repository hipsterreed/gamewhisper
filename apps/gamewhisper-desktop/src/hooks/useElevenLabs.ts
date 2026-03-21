import { useState, useRef, useCallback, useEffect } from 'react'
import { Conversation } from '@elevenlabs/client'

export type SessionStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error'

interface UseElevenLabsReturn {
  status: SessionStatus
  userTranscript: string
  agentTranscript: string
  amplitude: number
  errorMessage: string | null
  sessionProgress: number
  startSession: (gameName: string, agentId: string, micDeviceId?: string, outputDeviceId?: string) => Promise<void>
  endSession: () => Promise<void>
}

export function useElevenLabs(): UseElevenLabsReturn {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [userTranscript, setUserTranscript] = useState('')
  const [agentTranscript, setAgentTranscript] = useState('')
  const [amplitude, setAmplitude] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionProgress, setSessionProgress] = useState(0)

  const conversationRef = useRef<Awaited<ReturnType<typeof Conversation.startSession>> | null>(null)
  const animFrameRef = useRef<number>(0)
  const vizStreamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

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
  }, [stopAmplitudeMonitor, stopTimers])

  const startSession = useCallback(
    async (gameName: string, agentId: string, micDeviceId?: string, outputDeviceId?: string) => {
      if (conversationRef.current) await endSession()

      setStatus('connecting')
      setErrorMessage(null)
      setUserTranscript('')
      setAgentTranscript('')

      try {
        // Separate mic stream for amplitude visualization
        const audioConstraint = micDeviceId
          ? { deviceId: { exact: micDeviceId } }
          : true
        const vizStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint, video: false })
        vizStreamRef.current = vizStream
        startAmplitudeMonitor(vizStream)

        const conversation = await Conversation.startSession({
          agentId,
          connectionType: 'websocket',
          dynamicVariables: { game_name: gameName || 'Unknown Game' },
          ...(micDeviceId ? { inputDeviceId: micDeviceId } : {}),
          ...(outputDeviceId ? { outputDeviceId } : {}),

          onConnect: () => {
            setStatus('listening')
            startTimeRef.current = Date.now()

            // 60-second session timeout
            timeoutRef.current = setTimeout(() => {
              endSession()
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
            if (message.source === 'ai') {
              setAgentTranscript(message.message)
            } else if (message.source === 'user') {
              setUserTranscript(message.message)
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
            setErrorMessage(msg)
            setStatus('error')
            stopAmplitudeMonitor()
            stopTimers()
          },
        })

        conversationRef.current = conversation
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to start session'
        const friendly =
          msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')
            ? 'Microphone permission denied'
            : msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')
              ? 'Could not connect to ElevenLabs'
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
    startSession,
    endSession,
  }
}
