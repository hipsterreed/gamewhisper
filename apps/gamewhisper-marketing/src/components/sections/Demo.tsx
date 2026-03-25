import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import coverImage from '../../assets/gamewhisper_social_final_cover.jpg'

export default function Demo() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="demo" style={{ padding: '120px 24px' }}>
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
            See it in action.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--color-muted)', margin: 0 }}>
            Watch Game Whisper answer in real time without leaving the game.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{ position: 'relative' }}
        >
          <video
            src="https://firebasestorage.googleapis.com/v0/b/gamewhisper-69fae.firebasestorage.app/o/gamewhisper_social_final.mp4?alt=media&token=5f9c86c1-3c03-455c-9a97-266ac34ea6af"
            controls
            playsInline
            poster={coverImage}
            style={{
              width: '100%',
              maxWidth: 340,
              display: 'block',
              margin: '0 auto',
              borderRadius: 16,
              border: '1px solid rgba(79,163,255,0.2)',
              boxShadow: '0 0 80px rgba(79,163,255,0.06), 0 40px 80px rgba(0,0,0,0.5)',
            }}
          />
          {/* Glow beneath */}
          <div style={{
            position: 'absolute', bottom: -40, left: '15%', right: '15%', height: 80,
            background: 'rgba(79,163,255,0.05)',
            filter: 'blur(40px)',
            borderRadius: '50%',
          }} />
        </motion.div>
      </div>
    </section>
  )
}
