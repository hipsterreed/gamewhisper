import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function Problem() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="problem-section" style={{ padding: '100px 24px' }}>
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

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <video
            src="https://firebasestorage.googleapis.com/v0/b/gamewhisper-69fae.firebasestorage.app/o/google_search_animation_1-1.mp4?alt=media&token=ea3ccedd-6a92-49ce-b48b-4e718548fbeb"
            autoPlay
            loop
            muted
            playsInline
            className="problem-video"
            style={{
              width: '50%',
              display: 'block',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
            }}
          />
        </motion.div>

      </div>
    </section>
  )
}
