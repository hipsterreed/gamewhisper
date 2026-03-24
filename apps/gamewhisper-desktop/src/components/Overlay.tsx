import { useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { useSettingsStore } from '../stores/settings.store'
import { useAuthStore } from '../stores/auth.store'
import { useElevenLabs, type SessionStatus } from '../hooks/useElevenLabs'
import icon from '../assets/gamewhisper_icon_circle.png'

const FALLBACK_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID ?? ''

export function Overlay() {
  const [game, setGame] = useState<string | null>(null)
  const { elevenLabsAgentId, micDeviceId, outputDeviceId, initialized } = useSettingsStore()
  const { user, isLoading: authLoading } = useAuthStore()
  const el = useElevenLabs()
  const sessionActiveRef = useRef(false)

  const agentId = elevenLabsAgentId || FALLBACK_AGENT_ID
  const isSignedIn = !authLoading && user !== null

  // Keep a ref so the game-detected callback always reads the current auth state
  // without needing to re-register the listener on every auth change
  const isSignedInRef = useRef(isSignedIn)
  isSignedInRef.current = isSignedIn


  // Start session when overlay becomes visible (game-detected event)
  useEffect(() => {
    const unlisten = listen<string>('game-detected', async (event) => {
      const gameName = event.payload || ''
      setGame(gameName || null)
      if (!isSignedInRef.current) {
        invoke('open_settings_window')
        return
      }
      if (initialized && agentId) {
        sessionActiveRef.current = true
        await el.startSession(gameName, agentId, micDeviceId || undefined, outputDeviceId || undefined)
      }
    })
    return () => {
      unlisten.then((fn) => fn())
    }
  }, [initialized, agentId, micDeviceId, outputDeviceId, el.startSession])

  // End session when Rust hides the overlay (hotkey toggle off)
  useEffect(() => {
    const unlisten = listen('overlay-hide', async () => {
      sessionActiveRef.current = false
      await el.endSession()
    })
    return () => {
      unlisten.then((fn) => fn())
    }
  }, [el.endSession])

  // Auto-hide 3s after session timeout
  useEffect(() => {
    if (!el.sessionTimedOut) return
    const t = setTimeout(async () => {
      await el.endSession()
      getCurrentWindow().hide()
    }, 3_000)
    return () => clearTimeout(t)
  }, [el.sessionTimedOut, el.endSession])

  // Escape key: end session + hide
  useEffect(() => {
    const handleKey = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sessionActiveRef.current = false
        await el.endSession()
        getCurrentWindow().hide()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [el.endSession])

  const statusLabel = getStatusLabel(el.status, el.errorMessage, agentId, el.sourceCount)

  const overlayShell = (children: React.ReactNode) => (
    <div
      className="flex flex-col h-full w-full rounded-2xl border border-white/[0.08] select-none overflow-hidden"
      style={{
        background: 'rgba(8, 8, 18, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          <img src={icon} alt="GameWhisper" className="w-5 h-5 rounded-md opacity-80" />
          <span className="text-white/70 text-sm font-semibold tracking-tight">GameWhisper</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => invoke('open_settings_window')}
            title="Session history"
            className="w-6 h-6 flex items-center justify-center rounded-md text-white/25 hover:text-white/60 hover:bg-white/10 transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          <GameBadge game={game} />
        </div>
      </div>
      {children}
    </div>
  )

  if (!isSignedIn) {
    return overlayShell(
      <div className="flex-1 flex flex-col items-center justify-center gap-3 pb-4">
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            background: 'radial-gradient(circle at 35% 35%, rgba(99,155,255,0.25), rgba(37,99,235,0.15))',
            border: '1px solid rgba(99,155,255,0.2)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="opacity-60">
            <path d="M12 1a3 3 0 0 0-3 3v4H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V4a3 3 0 0 0-3-3z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="15" r="1.5" fill="white" opacity="0.8"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-white/70 text-sm font-medium">Sign in to use GameWhisper</p>
          <p className="text-white/30 text-xs mt-1">Opening settings…</p>
        </div>
      </div>
    )
  }

  return overlayShell(
    <>
      {/* Center: voice orb with progress ring */}
      <div className="flex-1 flex items-center justify-center">
        <VoiceOrb
          status={el.status}
          amplitude={el.amplitude}
          sessionProgress={el.sessionProgress}
        />
      </div>

      {/* Transcripts */}
      <TranscriptArea
        userTranscript={el.userTranscript}
        agentTranscript={el.agentTranscript}
        status={el.status}
        sourceCount={el.sourceCount}
      />

      {/* Bottom: status text */}
      <div className="pb-4 pt-1 text-center">
        <p
          className={`text-xs tracking-[0.15em] uppercase transition-colors duration-300 ${
            el.status === 'error' ? 'text-red-400/80' : el.status === 'searching' ? 'text-amber-400/70' : 'text-white/40'
          }`}
        >
          {statusLabel}
        </p>
      </div>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GameBadge({ game }: { game: string | null }) {
  if (game) {
    return (
      <span className="rounded-full bg-blue-500/20 text-blue-300 text-xs px-3 py-1 border border-blue-500/30">
        {game}
      </span>
    )
  }
  return (
    <span className="rounded-full bg-white/5 text-white/30 text-xs px-3 py-1 border border-white/10">
      No game detected
    </span>
  )
}

interface VoiceOrbProps {
  status: SessionStatus
  amplitude: number
  sessionProgress: number
}

function VoiceOrb({ status, amplitude, sessionProgress }: VoiceOrbProps) {
  const isError = status === 'error'
  const isConnecting = status === 'connecting'
  const isListening = status === 'listening'
  const isSpeaking = status === 'speaking'
  const isSearching = status === 'searching'

  // Orb color
  const orbColor = isError
    ? 'radial-gradient(circle at 35% 35%, rgba(239,68,68,0.9), rgba(185,28,28,0.8))'
    : isSpeaking
      ? 'radial-gradient(circle at 35% 35%, rgba(168,85,247,0.9), rgba(109,40,217,0.8))'
      : isSearching
        ? 'radial-gradient(circle at 35% 35%, rgba(251,191,36,0.9), rgba(217,119,6,0.8))'
        : 'radial-gradient(circle at 35% 35%, rgba(99,155,255,0.9), rgba(37,99,235,0.8))'

  const glowColor = isError
    ? 'rgba(239,68,68,0.35)'
    : isSpeaking
      ? 'rgba(168,85,247,0.35)'
      : isSearching
        ? 'rgba(251,191,36,0.35)'
        : 'rgba(59,130,246,0.35)'

  // Listening: scale orb by amplitude. Speaking: steady pulse. Searching: slow pulse.
  const orbScale = isListening ? 1 + amplitude * 0.25 : isSpeaking || isSearching ? undefined : 1
  const orbAnimation = isConnecting
    ? 'orbPulse 2s ease-in-out infinite'
    : isSpeaking
      ? 'orbSpeak 1.2s ease-in-out infinite'
      : isSearching
        ? 'orbPulse 1.8s ease-in-out infinite'
        : undefined

  // Progress ring circumference for r=44
  const R = 44
  const C = 2 * Math.PI * R
  const dash = sessionProgress * C
  const gap = C - dash

  return (
    <div className="relative flex items-center justify-center" style={{ width: 112, height: 112 }}>
      {/* SVG progress ring */}
      {sessionProgress > 0 && (
        <svg
          width={112}
          height={112}
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle cx={56} cy={56} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
          <circle
            cx={56}
            cy={56}
            r={R}
            fill="none"
            stroke={sessionProgress > 0.8 ? 'rgba(239,68,68,0.7)' : 'rgba(99,155,255,0.5)'}
            strokeWidth={3}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s linear' }}
          />
        </svg>
      )}

      {/* Outer glow ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 96,
          height: 96,
          background: `radial-gradient(circle, ${glowColor.replace('0.35', '0.15')} 0%, transparent 70%)`,
          boxShadow: `0 0 32px 8px ${glowColor.replace('0.35', '0.12')}`,
          transition: 'box-shadow 0.3s ease',
        }}
      />

      {/* Inner orb */}
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: 64,
          height: 64,
          background: orbColor,
          boxShadow: `0 0 20px 4px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
          transform: orbScale !== undefined ? `scale(${orbScale})` : undefined,
          animation: orbAnimation,
          transition: 'transform 0.05s ease, background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <OrbIcon status={status} />
      </div>

      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes orbSpeak {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.08); }
          75% { transform: scale(1.04); }
        }
      `}</style>
    </div>
  )
}

function OrbIcon({ status }: { status: SessionStatus }) {
  if (status === 'searching') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-90">
        <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" />
        <path d="M16.5 16.5L21 21" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M11 8v3l2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (status === 'error') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-90">
        <path d="M12 8v5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1" fill="white" />
        <path
          d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (status === 'speaking') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-90">
        <rect x="2" y="9" width="3" height="6" rx="1" fill="white" opacity="0.6" />
        <rect x="7" y="6" width="3" height="12" rx="1" fill="white" opacity="0.8" />
        <rect x="12" y="3" width="3" height="18" rx="1" fill="white" />
        <rect x="17" y="7" width="3" height="10" rx="1" fill="white" opacity="0.7" />
      </svg>
    )
  }

  // Mic icon for idle / connecting / listening
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-80">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="white" />
      <path
        d="M19 10v2a7 7 0 0 1-14 0v-2"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="23" x2="16" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

interface TranscriptAreaProps {
  userTranscript: string
  agentTranscript: string
  status: SessionStatus
  sourceCount: number | null
}

function TranscriptArea({ userTranscript, agentTranscript, status, sourceCount }: TranscriptAreaProps) {
  if (status === 'idle' || status === 'connecting') return null

  const showSearchLine = status === 'searching' || sourceCount !== null
  const searchLabel = sourceCount !== null
    ? sourceCount === 0 ? 'No sources found' : `Found ${sourceCount} source${sourceCount === 1 ? '' : 's'}`
    : 'Searching the web…'

  return (
    <div className="px-4 pb-2 space-y-1.5">
      {userTranscript && (
        <div className="flex gap-2 items-start">
          <span className="text-white/30 text-[10px] uppercase tracking-widest mt-0.5 shrink-0">You</span>
          <p className="text-white/70 text-xs leading-relaxed line-clamp-3">{userTranscript}</p>
        </div>
      )}
      {agentTranscript && (
        <div className="flex gap-2 items-start">
          <span className="text-blue-400/60 text-[10px] uppercase tracking-widest mt-0.5 shrink-0">GW</span>
          <p className="text-white/90 text-xs leading-relaxed line-clamp-3">{agentTranscript}</p>
        </div>
      )}
      {showSearchLine && (
        <div className="flex gap-2 items-center">
          <span className="text-amber-400/60 text-[10px] uppercase tracking-widest shrink-0">GW</span>
          <p className="text-amber-300/70 text-xs tracking-wide">{searchLabel}</p>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusLabel(
  status: SessionStatus,
  errorMessage: string | null,
  agentId: string,
  sourceCount: number | null,
): string {
  if (!agentId) return 'Set ElevenLabs Agent ID in Settings'
  switch (status) {
    case 'idle':
      return 'Press hotkey to speak…'
    case 'connecting':
      return 'Connecting…'
    case 'listening':
      return 'Listening…'
    case 'speaking':
      return 'Speaking…'
    case 'searching':
      if (sourceCount !== null) {
        return sourceCount === 0 ? 'No sources found' : `Found ${sourceCount} source${sourceCount === 1 ? '' : 's'}`
      }
      return 'Searching the web…'
    case 'error':
      return errorMessage ?? 'Error'
  }
}
