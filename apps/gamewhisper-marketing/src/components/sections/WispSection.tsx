import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import logoVideo from '../../assets/gamewhisper_icon_animation.mp4'

export default function WispSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800, height: 500,
        background: 'radial-gradient(circle, rgba(79,163,255,0.08) 0%, transparent 65%)',
        opacity: 0.5, pointerEvents: 'none',
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
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
          </motion.div>
        </div>
      </div>
    </section>
  )
}
