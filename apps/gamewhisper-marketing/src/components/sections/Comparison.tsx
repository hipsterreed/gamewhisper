import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const rows = [
  { old: 'Leaves your game', new: 'Stays in-game' },
  { old: 'Breaks immersion', new: 'Voice-first' },
  { old: 'Slower to use', new: 'One hotkey' },
  { old: 'Requires typing and searching', new: 'Spoken answers' },
  { old: 'Too many tabs', new: 'Game-aware context' },
  { old: 'Easy to lose focus', new: 'Fast source-backed help' },
]

export default function Comparison() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section style={{ padding: '120px 24px' }}>
      <div className="section-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 42px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#fff',
            margin: '0 0 12px',
          }}>
            Why search the old way?
          </h2>
          <p style={{ fontSize: 16, color: 'var(--color-muted)', margin: 0 }}>
            The difference is night and day.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ maxWidth: 760, margin: '0 auto', overflowX: 'auto' }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left', padding: '14px 20px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: '12px 0 0 0',
                  color: '#ef4444', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
                }}>
                  ✕ &nbsp;Browser + Wiki
                </th>
                <th style={{
                  textAlign: 'left', padding: '14px 20px',
                  background: 'rgba(79,163,255,0.08)',
                  border: '1px solid rgba(79,163,255,0.15)',
                  borderRadius: '0 12px 0 0',
                  color: 'var(--color-blue)', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
                }}>
                  ✓ &nbsp;Game Whisper
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td style={{
                    padding: '14px 20px',
                    background: 'rgba(239,68,68,0.04)',
                    border: '1px solid rgba(239,68,68,0.1)',
                    color: 'var(--color-muted-bright)', fontSize: 15,
                    borderRadius: i === rows.length - 1 ? '0 0 0 12px' : 0,
                  }}>
                    {row.old}
                  </td>
                  <td style={{
                    padding: '14px 20px',
                    background: 'rgba(79,163,255,0.04)',
                    border: '1px solid rgba(79,163,255,0.1)',
                    color: '#e2e8f0', fontSize: 15, fontWeight: 500,
                    borderRadius: i === rows.length - 1 ? '0 0 12px 0' : 0,
                  }}>
                    {row.new}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  )
}
