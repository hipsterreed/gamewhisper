import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function Problem() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section style={{ padding: '100px 24px' }}>
      <div className="section-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <h2 style={{
            fontSize: 'clamp(26px, 4.5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#fff',
            margin: '0 0 16px',
          }}>
            Looking something up mid-game<br />kills the moment.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--color-muted-bright)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
            Boss strategies. Quest steps. Build advice. Item locations. Every answer used to mean alt-tabbing, opening a browser, searching a wiki, and breaking immersion. Game Whisper keeps you in the game.
          </p>
        </motion.div>

        {/* Split comparison visual */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {/* Before */}
          <div style={{
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 16,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>THE OLD WAY</span>
            </div>
            <div
              className="media-placeholder"
              style={{
                margin: 24,
                aspectRatio: '4/3',
                borderColor: 'rgba(239,68,68,0.2)',
              }}
            >
              <span style={{ color: '#ef4444', opacity: 0.6 }}>Cluttered Alt-Tab Workflow Placeholder</span>
              <span style={{ fontSize: 11, opacity: 0.4 }}>Browser tabs, wiki searches, broken focus</span>
            </div>
          </div>

          {/* After */}
          <div style={{
            background: 'rgba(79,163,255,0.04)',
            border: '1px solid rgba(79,163,255,0.15)',
            borderRadius: 16,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(79,163,255,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-blue)', boxShadow: '0 0 6px var(--color-blue)' }} />
              <span style={{ color: 'var(--color-blue)', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>WITH GAME WHISPER</span>
            </div>
            <div
              className="media-placeholder"
              style={{
                margin: 24,
                aspectRatio: '4/3',
                borderColor: 'rgba(79,163,255,0.2)',
              }}
            >
              <span style={{ color: 'var(--color-blue)', opacity: 0.6 }}>Gameplay Overlay Placeholder</span>
              <span style={{ fontSize: 11, opacity: 0.4 }}>Game Whisper answering inside the game</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
