import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface FinalCTAProps {
  onTryLive?: () => void
}

export default function FinalCTA({ onTryLive }: FinalCTAProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <>
      <section
        id="download"
        style={{
          padding: '140px 24px',
          position: 'relative',
          overflow: 'hidden',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
        }}
      >
        {/* Glow background */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700, height: 400,
          background: 'radial-gradient(circle, rgba(79,163,255,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div ref={ref} style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          {/* Small wisp */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 32px',
              background: 'radial-gradient(circle at 35% 35%, #4fa3ffcc, #4fa3ff44)',
              boxShadow: '0 0 24px 6px rgba(79,163,255,0.25), 0 0 60px 12px rgba(79,163,255,0.12)',
              animation: 'wisp-float 3s ease-in-out infinite',
            }}
          />

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#fff',
              margin: '0 0 20px',
              lineHeight: 1.05,
            }}
          >
            Stay in the game.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ fontSize: 18, color: 'var(--color-muted-bright)', lineHeight: 1.6, margin: '0 0 40px' }}
          >
            Ask out loud. Get answers instantly. No alt-tab required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <a href="#" className="btn-secondary hide-mobile" style={{ fontSize: 16, padding: '14px 32px', opacity: 0.6 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v9M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Download for Windows
            </a>
            {onTryLive && (
              <button onClick={onTryLive} className="btn-primary" style={{ fontSize: 16, padding: '14px 32px', background: '#ef4444', boxShadow: '0 0 20px rgba(239,68,68,0.35)', animation: 'tryLivePulse 2s ease-in-out infinite' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" opacity="0.9" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                Try it live
              </button>
            )}
            <a href="#demo" className="btn-secondary" style={{ fontSize: 16, padding: '14px 28px' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M6.5 5.5l5 2.5-5 2.5V5.5z" fill="currentColor" /></svg>
              Watch Demo
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '32px 24px',
        textAlign: 'center',
      }}>
        <div className="section-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #4fa3ffcc, #4fa3ff44)',
              boxShadow: '0 0 8px 2px rgba(79,163,255,0.2)',
            }} />
            <span style={{ color: 'var(--color-muted)', fontSize: 14, fontWeight: 600 }}>Game Whisper</span>
          </div>
          <div style={{ color: 'var(--color-muted)', fontSize: 13 }}>
            © {new Date().getFullYear()} Game Whisper. Windows desktop app.
          </div>
        </div>
      </footer>
    </>
  )
}
