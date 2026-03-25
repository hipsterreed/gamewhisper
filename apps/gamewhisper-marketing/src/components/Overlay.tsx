import { useEffect } from 'react'
import { useElevenLabs, type SessionStatus } from '../hooks/useElevenLabs'
import icon from '../assets/gamewhisper_icon_circle.png'

interface OverlayProps {
  isOpen: boolean
  agentId: string
  onClose: () => void
}

export function Overlay({ isOpen, agentId, onClose }: OverlayProps) {
  const el = useElevenLabs()

  useEffect(() => {
    el.startSession('Minecraft', agentId)
    return () => {
      el.endSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!el.sessionTimedOut) return
    const t = setTimeout(onClose, 3_000)
    return () => clearTimeout(t)
  }, [el.sessionTimedOut, onClose])

  const statusLabel = getStatusLabel(el.status, el.errorMessage, agentId, el.sourceCount)

  return (
    <div
      className={isOpen ? 'overlay-enter' : 'overlay-exit'}
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 360,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          userSelect: 'none',
          overflow: 'hidden',
          background: 'rgba(8, 8, 18, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={icon} alt="GameWhisper" style={{ width: 20, height: 20, borderRadius: 6, opacity: 0.8 }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>
              GameWhisper
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              borderRadius: 999,
              background: 'rgba(59,130,246,0.2)',
              color: '#93c5fd',
              fontSize: 12,
              padding: '4px 12px',
              border: '1px solid rgba(59,130,246,0.3)',
            }}>
              Minecraft
            </span>
            <button
              onClick={onClose}
              title="Close"
              style={{
                width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer',
                color: 'rgba(255,255,255,0.25)', transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Voice orb */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
          <VoiceOrb status={el.status} amplitude={el.amplitude} sessionProgress={el.sessionProgress} />
        </div>

        {/* Transcripts */}
        <TranscriptArea
          userTranscript={el.userTranscript}
          agentTranscript={el.agentTranscript}
          status={el.status}
          sourceCount={el.sourceCount}
        />

        {/* Status label */}
        <div style={{ paddingBottom: 16, paddingTop: 4, textAlign: 'center' }}>
          <p style={{
            fontSize: 10,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            margin: 0,
            color: el.status === 'error' ? 'rgba(239,68,68,0.8)' : el.status === 'searching' ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.4)',
            transition: 'color 0.3s',
          }}>
            {statusLabel}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

  const orbColor = isError
    ? 'radial-gradient(circle at 35% 35%, rgba(239,68,68,0.9), rgba(185,28,28,0.8))'
    : isSpeaking
      ? 'radial-gradient(circle at 35% 35%, rgba(168,85,247,0.9), rgba(109,40,217,0.8))'
      : isSearching
        ? 'radial-gradient(circle at 35% 35%, rgba(251,191,36,0.9), rgba(217,119,6,0.8))'
        : 'radial-gradient(circle at 35% 35%, rgba(99,155,255,0.9), rgba(37,99,235,0.8))'

  const glowColor = isError ? 'rgba(239,68,68,0.35)' : isSpeaking ? 'rgba(168,85,247,0.35)' : isSearching ? 'rgba(251,191,36,0.35)' : 'rgba(59,130,246,0.35)'

  const orbScale = isListening ? 1 + amplitude * 0.25 : isSpeaking || isSearching ? undefined : 1
  const orbAnimation = isConnecting ? 'orbPulse 2s ease-in-out infinite' : isSpeaking ? 'orbSpeak 1.2s ease-in-out infinite' : isSearching ? 'orbPulse 1.8s ease-in-out infinite' : undefined

  const R = 44
  const C = 2 * Math.PI * R
  const dash = sessionProgress * C
  const gap = C - dash

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 112, height: 112 }}>
      {sessionProgress > 0 && (
        <svg width={112} height={112} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <circle cx={56} cy={56} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
          <circle
            cx={56} cy={56} r={R} fill="none"
            stroke={sessionProgress > 0.8 ? 'rgba(239,68,68,0.7)' : 'rgba(99,155,255,0.5)'}
            strokeWidth={3}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s linear' }}
          />
        </svg>
      )}

      <div style={{
        position: 'absolute', borderRadius: '50%', width: 96, height: 96,
        background: `radial-gradient(circle, ${glowColor.replace('0.35', '0.15')} 0%, transparent 70%)`,
        boxShadow: `0 0 32px 8px ${glowColor.replace('0.35', '0.12')}`,
        transition: 'box-shadow 0.3s ease',
      }} />

      <div style={{
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 64, height: 64,
        background: orbColor,
        boxShadow: `0 0 20px 4px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        transform: orbScale !== undefined ? `scale(${orbScale})` : undefined,
        animation: orbAnimation,
        transition: 'transform 0.05s ease, background 0.3s ease, box-shadow 0.3s ease',
      }}>
        <OrbIcon status={status} />
      </div>
    </div>
  )
}

function OrbIcon({ status }: { status: SessionStatus }) {
  if (status === 'searching') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.9 }}>
        <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" />
        <path d="M16.5 16.5L21 21" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M11 8v3l2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (status === 'error') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.9 }}>
        <path d="M12 8v5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1" fill="white" />
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (status === 'speaking') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.9 }}>
        <rect x="2" y="9" width="3" height="6" rx="1" fill="white" opacity="0.6" />
        <rect x="7" y="6" width="3" height="12" rx="1" fill="white" opacity="0.8" />
        <rect x="12" y="3" width="3" height="18" rx="1" fill="white" />
        <rect x="17" y="7" width="3" height="10" rx="1" fill="white" opacity="0.7" />
      </svg>
    )
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.8 }}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="white" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" strokeLinecap="round" />
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
    <div style={{ padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {userTranscript && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2, flexShrink: 0 }}>You</span>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{userTranscript}</p>
        </div>
      )}
      {agentTranscript && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ color: 'rgba(99,155,255,0.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2, flexShrink: 0 }}>GW</span>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{agentTranscript}</p>
        </div>
      )}
      {showSearchLine && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: 'rgba(251,191,36,0.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>GW</span>
          <p style={{ color: 'rgba(253,230,138,0.7)', fontSize: 12, letterSpacing: '0.02em', margin: 0 }}>{searchLabel}</p>
        </div>
      )}
    </div>
  )
}

function getStatusLabel(status: SessionStatus, errorMessage: string | null, agentId: string, sourceCount: number | null): string {
  if (!agentId) return 'Agent not configured'
  switch (status) {
    case 'idle': return 'Starting…'
    case 'connecting': return 'Connecting…'
    case 'listening': return 'Listening…'
    case 'speaking': return 'Speaking…'
    case 'searching':
      if (sourceCount !== null) return sourceCount === 0 ? 'No sources found' : `Found ${sourceCount} source${sourceCount === 1 ? '' : 's'}`
      return 'Searching the web…'
    case 'error': return errorMessage ?? 'Error'
  }
}
