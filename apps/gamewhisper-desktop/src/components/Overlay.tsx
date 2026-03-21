import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'

export function Overlay() {
  const [game, setGame] = useState<string | null>(null)

  // Listen for game-detected events from Rust
  useEffect(() => {
    const unlisten = listen<string>('game-detected', (event) => {
      setGame(event.payload || null)
    })
    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])

  // Escape key dismisses the overlay
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        getCurrentWindow().hide()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div
      className="flex flex-col h-full w-full rounded-2xl border border-white/[0.08] select-none"
      style={{
        background: 'rgba(8, 8, 18, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="text-white/70 text-sm font-semibold tracking-widest uppercase">
          GameWhisper
        </span>
        <GameBadge game={game} />
      </div>

      {/* Center: voice orb */}
      <div className="flex-1 flex items-center justify-center">
        <VoiceOrb />
      </div>

      {/* Bottom: status text */}
      <div className="pb-5 text-center">
        <p className="text-white/40 text-xs tracking-[0.2em] uppercase">
          Press hotkey to speak…
        </p>
      </div>
    </div>
  )
}

function GameBadge({ game }: { game: string | null }) {
  if (game) {
    return (
      <span className="rounded-full bg-blue-500/20 text-blue-300 text-xs px-3 py-1 border border-blue-500/30">
        Playing: {game}
      </span>
    )
  }
  return (
    <span className="rounded-full bg-white/5 text-white/30 text-xs px-3 py-1 border border-white/10">
      No game detected
    </span>
  )
}

function VoiceOrb() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 96,
          height: 96,
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          boxShadow: '0 0 32px 8px rgba(59,130,246,0.12)',
        }}
      />
      {/* Inner orb */}
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: 64,
          height: 64,
          background: 'radial-gradient(circle at 35% 35%, rgba(99,155,255,0.9), rgba(37,99,235,0.8))',
          boxShadow: '0 0 20px 4px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        {/* Mic icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-80">
          <path
            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
            fill="white"
          />
          <path
            d="M19 10v2a7 7 0 0 1-14 0v-2"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="23" x2="16" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
