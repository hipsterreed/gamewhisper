import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'


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
          <p style={{ fontSize: 16, color: 'var(--color-muted-bright)', lineHeight: 1.6, maxWidth: 580, margin: '0 auto' }}>
            Game Whisper combines natural voice interaction from ElevenLabs with real-time wiki retrieval from Firecrawl to create a gaming assistant that works without pulling you out of the game.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
