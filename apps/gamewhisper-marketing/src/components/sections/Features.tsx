import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const features = [
  { icon: '🎮', title: 'Automatic Game Detection', desc: 'Game Whisper knows what you\'re playing and uses that context automatically.' },
  { icon: '🎙️', title: 'Voice AI Responses', desc: 'Ask naturally and hear a spoken answer back in real time.' },
  { icon: '🔍', title: 'Real-Time Wiki Search', desc: 'Pulls from game-specific wiki sources when the answer needs proof.' },
  { icon: '🪟', title: 'Transparent In-Game Overlay', desc: 'A sleek overlay sits on top of your game without getting in the way.' },
  { icon: '📝', title: 'Live Transcripts', desc: 'See what you said and what Game Whisper heard.' },
  { icon: '🕐', title: 'Session History', desc: 'Revisit past answers with transcripts, sources, and timestamps.' },
  { icon: '🔗', title: 'Source Links', desc: 'Open the wiki pages behind the answer anytime.' },
  { icon: '🎧', title: 'Audio Device Selection', desc: 'Choose your preferred mic and output setup.' },
  { icon: '⚙️', title: 'Fully Configurable', desc: 'Hotkey, corner placement, transparency, audio devices, and more.' },
]

export default function Features() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="features" style={{ padding: '120px 24px' }}>
      <div className="section-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 42px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#fff',
            margin: '0 0 12px',
          }}>
            Everything you need to stay immersed.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--color-muted)', margin: 0 }}>
            Built to live inside your game session without breaking it.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: Math.min(i * 0.07, 0.5) }}
              className="card"
              style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 4, letterSpacing: '-0.01em' }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-muted-bright)', lineHeight: 1.6 }}>
                  {f.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
