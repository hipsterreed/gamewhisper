import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const steps = [
  {
    number: '01',
    title: 'Press your hotkey',
    desc: 'Summon Game Whisper instantly from any supported game.',
    color: 'var(--color-blue)',
    colorDim: 'rgba(79,163,255,0.1)',
  },
  {
    number: '02',
    title: 'Ask out loud',
    desc: 'Speak naturally — no typing, no clicking, no browser tabs.',
    color: 'var(--color-amber)',
    colorDim: 'rgba(245,158,11,0.1)',
  },
  {
    number: '03',
    title: 'Hear the answer',
    desc: 'Game Whisper detects your game, checks the right wiki, and speaks the answer back in seconds.',
    color: 'var(--color-purple)',
    colorDim: 'rgba(168,85,247,0.1)',
  },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="how-it-works" style={{ padding: '120px 24px' }}>
      <div className="section-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 72 }}
        >
          <h2 style={{
            fontSize: 'clamp(28px, 4.5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#fff',
            margin: '0 0 12px',
          }}>
            One key. One question. One answer.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--color-muted)', margin: 0 }}>No browser. No typing. Just your voice.</p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
        }}>
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="card"
              style={{ background: step.colorDim, borderColor: `${step.color}20` }}
            >
              <div style={{
                fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
                color: step.color, marginBottom: 20,
              }}>
                STEP {step.number}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 15, color: 'var(--color-muted-bright)', lineHeight: 1.6, margin: 0 }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
