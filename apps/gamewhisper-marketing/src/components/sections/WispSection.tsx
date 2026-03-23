import { useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import WispOrb, { STATE_COLORS } from '../ui/WispOrb'
import type { WispState } from '../ui/WispOrb'
import logoVideo from '../../assets/gamewhisper_icon_animation.mp4'

const states: WispState[] = ['listening', 'searching', 'speaking', 'error']

export default function WispSection() {
  const [activeState, setActiveState] = useState<WispState>('listening')
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow matching active state */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800, height: 500,
        background: `radial-gradient(circle, ${STATE_COLORS[activeState].dim} 0%, transparent 65%)`,
        opacity: 0.5, pointerEvents: 'none',
        transition: 'background 0.5s ease',
      }} />

      <div className="section-container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 72 }}
        >
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 42px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#fff',
            margin: '0 0 16px',
          }}>
            Meet your in-game guide.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--color-muted-bright)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
            The wisp gives instant visual feedback so you always know what Game Whisper is doing.
          </p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 56 }}>
          {/* Orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {activeState === 'listening' ? (
              <video
                src={logoVideo}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: 200,
                  height: 200,
                  objectFit: 'cover',
                  maskImage: 'radial-gradient(circle, black 10%, transparent 45%)',
                  WebkitMaskImage: 'radial-gradient(circle, black 10%, transparent 45%)',
                  display: 'block',
                }}
              />
            ) : (
              <WispOrb state={activeState} size={120} />
            )}
          </motion.div>

          {/* State selector */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}
          >
            {states.map(state => {
              const { color, label } = STATE_COLORS[state]
              const active = activeState === state
              return (
                <button
                  key={state}
                  onClick={() => setActiveState(state)}
                  style={{
                    background: active ? `${color}18` : 'transparent',
                    border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 100,
                    padding: '8px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: color,
                    boxShadow: active ? `0 0 8px ${color}` : 'none',
                    transition: 'box-shadow 0.2s',
                  }} />
                  <span style={{ color: active ? color : 'var(--color-muted-bright)', fontWeight: 600, fontSize: 14 }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </motion.div>

          {/* State description */}
          <motion.div
            key={activeState}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              padding: '20px 32px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              textAlign: 'center',
              maxWidth: 400,
            }}
          >
            <div style={{ color: STATE_COLORS[activeState].color, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
              {STATE_COLORS[activeState].label}
            </div>
            <div style={{ color: 'var(--color-muted-bright)', fontSize: 14 }}>
              {activeState === 'listening' && 'Game Whisper is listening to your voice.'}
              {activeState === 'searching' && 'Searching the right wiki for your game.'}
              {activeState === 'speaking' && 'Speaking the answer back to you.'}
              {activeState === 'error' && 'Something went wrong. Check your mic or connection.'}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
