import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const cases = [
  { emoji: '⚔️', title: 'Stuck on a boss?', desc: 'Ask for strategy without opening a guide.' },
  { emoji: '🗺️', title: 'Lost in a questline?', desc: 'Find the next step without leaving the game.' },
  { emoji: '🛡️', title: 'Need a build recommendation?', desc: 'Get a quick answer while staying focused.' },
  { emoji: '📍', title: 'Looking for an item or location?', desc: 'Let Game Whisper search the wiki for you.' },
]

export default function UseCases() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section style={{ padding: '100px 24px' }}>
      <div className="section-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#fff',
            margin: '0 0 12px',
          }}>
            Built for real gaming moments.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--color-muted)', margin: 0 }}>
            The moments you know all too well.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="card"
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>{c.emoji}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                {c.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-muted-bright)', lineHeight: 1.6, margin: 0 }}>
                {c.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
