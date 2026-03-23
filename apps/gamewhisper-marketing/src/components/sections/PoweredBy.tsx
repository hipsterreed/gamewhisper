import { motion } from 'framer-motion'
import elevenLabsLogo from '../../assets/elevenlabs-logo-white.png'
import firecrawlLogo from '../../assets/firecrawl-wordmark-white.svg'

export default function PoweredBy() {
  return (
    <section style={{
      padding: '48px 24px',
      borderTop: '1px solid var(--color-border)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Powered by
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
            <img src={elevenLabsLogo} alt="ElevenLabs" style={{ height: 24, opacity: 0.8 }} />
            <div style={{ width: 1, height: 24, background: 'var(--color-border-bright)' }} />
            <img src={firecrawlLogo} alt="Firecrawl" style={{ height: 36, opacity: 0.8 }} />
          </div>

        </motion.div>
      </div>
    </section>
  )
}
