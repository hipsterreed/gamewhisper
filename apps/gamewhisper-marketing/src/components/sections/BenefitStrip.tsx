import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const benefits = [
  { icon: '⚡', title: 'Instant', desc: 'Answers in seconds.' },
  { icon: '🎙️', title: 'Voice First', desc: 'Ask naturally out loud.' },
  { icon: '🎮', title: 'In-Game', desc: 'Stay focused on the action.' },
  { icon: '🧠', title: 'Game-Aware', desc: 'Searches the right wiki automatically.' },
]

export default function BenefitStrip() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section style={{ padding: '80px 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
      <div className="section-container">
        <div
          ref={ref}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 32,
          }}
        >
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{b.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 6 }}>{b.title}</div>
              <div style={{ color: 'var(--color-muted)', fontSize: 14, lineHeight: 1.5 }}>{b.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
