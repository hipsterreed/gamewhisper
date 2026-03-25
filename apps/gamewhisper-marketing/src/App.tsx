import { useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './lib/firebase'
import { analytics } from './lib/analytics'
import { Overlay } from './components/Overlay'
import { GameSelectModal } from './components/GameSelectModal'
import Nav from './components/sections/Nav'
import Hero from './components/sections/Hero'
import PoweredBy from './components/sections/PoweredBy'
import Problem from './components/sections/Problem'
import Demo from './components/sections/Demo'
import Credibility from './components/sections/Credibility'
import FAQ from './components/sections/FAQ'
import FinalCTA from './components/sections/FinalCTA'

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID ?? ''

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [overlayMounted, setOverlayMounted] = useState(false)

  useEffect(() => {
    analytics.pageViewed()
  }, [])

  useEffect(() => {
    console.log('[GameWhisper] Initializing anonymous auth...')
    return onAuthStateChanged(auth, (u) => {
      console.log('[GameWhisper] Auth state changed:', u ? `uid=${u.uid}` : 'null')
      setUser(u)
    })
  }, [])

  const openModal = useCallback((location: 'hero' | 'final_cta' = 'hero') => {
    analytics.ctaClicked(location)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => setModalOpen(false), [])

  const handleGameSelect = useCallback((game: string) => {
    analytics.gameSelected(game)
    setSelectedGame(game)
    setModalOpen(false)
    setOverlayMounted(true)
    requestAnimationFrame(() => setOverlayOpen(true))
  }, [])

  const closeOverlay = useCallback(() => {
    setOverlayOpen(false)
    setTimeout(() => {
      setOverlayMounted(false)
      setSelectedGame(null)
    }, 260)
  }, [])

  // Alt+G hotkey
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (overlayOpen) {
          closeOverlay()
        } else if (modalOpen) {
          closeModal()
        } else if (user) {
          openModal('hero')
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [overlayOpen, modalOpen, user, openModal, closeModal, closeOverlay])

  // Escape closes overlay or modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (overlayOpen) closeOverlay()
        else if (modalOpen) closeModal()
        else if (comingSoonOpen) closeComingSoon()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [overlayOpen, modalOpen, closeOverlay, closeModal])

  const [comingSoonOpen, setComingSoonOpen] = useState(false)
  const openComingSoon = useCallback(() => setComingSoonOpen(true), [])
  const closeComingSoon = useCallback(() => setComingSoonOpen(false), [])

  const dimmed = overlayOpen || modalOpen || comingSoonOpen

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Nav />
      <main>
        <Hero onTryLive={user ? () => openModal('hero') : undefined} onDownload={openComingSoon} />
        <PoweredBy />
        <Problem />
        <Demo />
        <Credibility />
        <FAQ />
        <FinalCTA onTryLive={user ? () => openModal('final_cta') : undefined} onDownload={openComingSoon} />
      </main>

      {/* Dark backdrop */}
      <div
        onClick={overlayOpen ? closeOverlay : comingSoonOpen ? closeComingSoon : undefined}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 99,
          opacity: dimmed ? 1 : 0,
          pointerEvents: dimmed ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {modalOpen && (
        <GameSelectModal onSelect={handleGameSelect} onClose={closeModal} />
      )}

      {overlayMounted && selectedGame && (
        <Overlay isOpen={overlayOpen} agentId={AGENT_ID} game={selectedGame} onClose={closeOverlay} />
      )}

      {comingSoonOpen && (
        <div
          onClick={closeComingSoon}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 101,
            width: '100%',
            maxWidth: 400,
            padding: '0 24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0e0e1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '40px 36px',
              boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
              textAlign: 'center',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: '50%', margin: '0 auto 24px',
              background: 'radial-gradient(circle at 35% 35%, #4fa3ffcc, #4fa3ff44)',
              boxShadow: '0 0 24px 6px rgba(79,163,255,0.25)',
            }} />
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Coming Soon
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.6, margin: '0 0 28px' }}>
              The Windows app is in development. Try the live demo in the meantime!
            </p>
            <button
              onClick={closeComingSoon}
              className="btn-secondary"
              style={{ fontSize: 14, padding: '10px 24px' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
