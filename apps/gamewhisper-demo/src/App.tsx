import { useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './lib/firebase'
import { GameBackground } from './components/GameBackground'
import { HotkeyHint } from './components/HotkeyHint'
import { Overlay } from './components/Overlay'

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID ?? ''

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [overlayMounted, setOverlayMounted] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, setUser)
  }, [])

  const openOverlay = useCallback(() => {
    setOverlayMounted(true)
    requestAnimationFrame(() => setOverlayOpen(true))
  }, [])

  const closeOverlay = useCallback(() => {
    setOverlayOpen(false)
    setTimeout(() => setOverlayMounted(false), 260)
  }, [])

  // Alt+G hotkey
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (overlayOpen) {
          closeOverlay()
        } else if (user) {
          openOverlay()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [overlayOpen, user, openOverlay, closeOverlay])

  // Escape closes overlay
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && overlayOpen) closeOverlay()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [overlayOpen, closeOverlay])

  return (
    <div className="relative w-full h-full overflow-hidden">
      <GameBackground dimmed={overlayOpen} />

      {!overlayOpen && (
        <HotkeyHint onActivate={openOverlay} disabled={!user} />
      )}

      {overlayMounted && (
        <Overlay
          isOpen={overlayOpen}
          agentId={AGENT_ID}
          onClose={closeOverlay}
        />
      )}
    </div>
  )
}
