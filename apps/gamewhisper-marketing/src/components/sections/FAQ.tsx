import { useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'

const faqs = [
  { q: 'What games does Game Whisper support?', a: 'Game Whisper supports selected PC games today and is expanding over time. It works best in games where players frequently look up quests, crafting, item locations, builds, and progression help.' },
  { q: 'Does it work in fullscreen?', a: 'Game Whisper is designed to work as an overlay while you play supported games.' },
  { q: 'Do I need to alt-tab or click anything?', a: 'No. Press your hotkey, ask naturally, and stay in the game.' },
  { q: 'How does it know what game I\'m playing?', a: 'Game Whisper detects the active game and uses that context automatically.' },
  { q: 'Where do the answers come from?', a: 'Game Whisper pulls from game-specific wiki sources and includes source-backed results, so answers are grounded instead of guessed.' },
  { q: 'Can I view past sessions?', a: 'Yes. Session history includes transcripts, timestamps, and sources.' },
  { q: 'Can I change the hotkey?', a: 'Yes. The hotkey is configurable.' },
  { q: 'Is it Windows only?', a: 'Yes. Game Whisper is currently a Windows desktop app.' },
  { q: 'Can I choose my microphone and speakers?', a: 'Yes. Input and output devices are configurable.' },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      borderBottom: '1px solid var(--color-border)',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: 'none', border: 'none',
          padding: '20px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{q}</span>
        <span style={{
          color: 'var(--color-muted)', fontSize: 20, flexShrink: 0,
          transition: 'transform 0.25s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          display: 'inline-block',
        }}>+</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ margin: '0 0 20px', fontSize: 15, color: 'var(--color-muted-bright)', lineHeight: 1.7 }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="faq" style={{ padding: '120px 24px' }}>
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
            FAQ
          </h2>
          <p style={{ fontSize: 16, color: 'var(--color-muted)', margin: 0 }}>
            Everything you need to know before you download.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{ maxWidth: 680, margin: '0 auto' }}
        >
          {faqs.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
