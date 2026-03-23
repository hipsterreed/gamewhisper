import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const features = [
  { icon: '🕐', title: 'Session History', desc: 'Revisit past answers with full transcripts, sources, and timestamps.' },
  { icon: '📝', title: 'Live Transcripts', desc: 'See exactly what you said and what Game Whisper heard in real time.' },
  { icon: '🔗', title: 'Source Links', desc: 'Open the wiki page behind any answer directly from the overlay.' },
  { icon: '🎧', title: 'Audio Device Selection', desc: 'Choose your preferred microphone and speaker output independently.' },
  { icon: '⌨️', title: 'Hotkey Customization', desc: 'Set any key combination to summon Game Whisper from any game.' },
  { icon: '🪟', title: 'Overlay Placement', desc: 'Pin the overlay to any corner of your screen so it never blocks gameplay.' },
  { icon: '🔆', title: 'Transparency Control', desc: 'Adjust overlay opacity so it fits your setup.' },
  { icon: '💾', title: 'Settings Persistence', desc: 'Your preferences are saved and restored across every session.' },
  { icon: '🖥️', title: 'System Tray', desc: 'Game Whisper lives quietly in the tray until you need it.' },
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
            The details that make it feel at home in your setup.
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
