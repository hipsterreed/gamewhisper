import { useState, useCallback, useEffect } from 'react'
import { analytics } from './lib/analytics'
import Nav from './components/sections/Nav'
import Hero from './components/sections/Hero'
import PoweredBy from './components/sections/PoweredBy'
import Problem from './components/sections/Problem'
import Demo from './components/sections/Demo'
import Credibility from './components/sections/Credibility'
import FAQ from './components/sections/FAQ'
import FinalCTA from './components/sections/FinalCTA'

export default function App() {
  useEffect(() => {
    analytics.pageViewed()
  }, [])

  const [comingSoonOpen, setComingSoonOpen] = useState(false)
  const openComingSoon = useCallback(() => setComingSoonOpen(true), [])
  const closeComingSoon = useCallback(() => setComingSoonOpen(false), [])

  // Escape closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeComingSoon()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeComingSoon])

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Nav />
      <main>
        <Hero onDownload={openComingSoon} />
        <PoweredBy />
        <Problem />
        <Demo />
        <Credibility />
        <FAQ />
        <FinalCTA onDownload={openComingSoon} />
      </main>

      {/* Dark backdrop */}
      <div
        onClick={closeComingSoon}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 99,
          opacity: comingSoonOpen ? 1 : 0,
          pointerEvents: comingSoonOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

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
