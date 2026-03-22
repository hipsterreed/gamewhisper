import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const points = [
  { icon: '🎙️', label: 'Powered by ElevenLabs Conversational AI' },
  { icon: '🕷️', label: 'Real-time wiki search powered by Firecrawl' },
  { icon: '🪟', label: 'Windows desktop app' },
  { icon: '🔐', label: 'Google sign-in and synced session history' },
]

export default function Credibility() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section style={{ padding: '100px 24px', borderTop: '1px solid var(--color-border)' }}>
      <div className="section-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 100, padding: '6px 14px', marginBottom: 24,
          }}>
            <span style={{ color: 'var(--color-amber)', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>
              🏆 ELEVENLABS HACKATHON
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#fff',
            margin: '0 0 16px',
          }}>
            Built for the ElevenLabs Hackathon.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--color-muted-bright)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 48px' }}>
            Game Whisper combines real-time voice interaction, game-aware context, and wiki search into a seamless in-session assistant for players.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          maxWidth: 800,
          margin: '0 auto',
        }}>
          {points.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '16px 20px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
              }}
            >
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <span style={{ fontSize: 14, color: 'var(--color-muted-bright)', fontWeight: 500, lineHeight: 1.4 }}>{p.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
