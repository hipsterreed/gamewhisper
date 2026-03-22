import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function Demo() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="demo" style={{ padding: '120px 24px' }}>
      <div className="section-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 42px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#fff',
            margin: '0 0 12px',
          }}>
            See it in action.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--color-muted)', margin: 0 }}>
            Watch Game Whisper answer in real time without leaving the game.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{ position: 'relative' }}
        >
          <div
            className="media-placeholder"
            style={{
              aspectRatio: '16/9',
              maxWidth: 900,
              margin: '0 auto',
              borderColor: 'rgba(79,163,255,0.2)',
              boxShadow: '0 0 80px rgba(79,163,255,0.06), 0 40px 80px rgba(0,0,0,0.5)',
            }}
          >
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" opacity={0.25}>
              <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="2" />
              <path d="M22 18l20 10-20 10V18z" fill="currentColor" />
            </svg>
            <span style={{ fontSize: 15 }}>Demo Video Placeholder</span>
            <span style={{ fontSize: 12, opacity: 0.5 }}>Replace with embedded demo or video loop</span>
          </div>
          {/* Glow beneath */}
          <div style={{
            position: 'absolute', bottom: -40, left: '15%', right: '15%', height: 80,
            background: 'rgba(79,163,255,0.05)',
            filter: 'blur(40px)',
            borderRadius: '50%',
          }} />
        </motion.div>
      </div>
    </section>
  )
}
