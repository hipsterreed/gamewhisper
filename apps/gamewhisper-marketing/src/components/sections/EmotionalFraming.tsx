import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function EmotionalFraming() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 300,
        background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div ref={ref} style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: '#fff',
            margin: '0 0 24px',
          }}
        >
          It's not just about faster answers.<br />
          <span style={{ color: 'var(--color-purple)' }}>It's about staying in the moment.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{ fontSize: 18, color: 'var(--color-muted-bright)', lineHeight: 1.7, margin: 0 }}
        >
          Game Whisper keeps your hands on the game, your focus on the screen, and the answer one hotkey away.
        </motion.p>
      </div>
    </section>
  )
}
