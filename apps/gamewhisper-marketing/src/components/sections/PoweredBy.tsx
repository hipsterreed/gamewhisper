import { motion } from 'framer-motion'

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

          <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* ElevenLabs */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                height: 36,
                padding: '0 20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px dashed rgba(255,255,255,0.12)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-muted-bright)',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                minWidth: 140,
              }}>
                ElevenLabs
              </div>
            </div>

            {/* Divider dot */}
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-border-bright)' }} />

            {/* Firecrawl */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                height: 36,
                padding: '0 20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px dashed rgba(255,255,255,0.12)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-muted-bright)',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                minWidth: 140,
              }}>
                Firecrawl
              </div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0, textAlign: 'center' }}>
            Natural voice interaction + live game wiki retrieval
          </p>
        </motion.div>
      </div>
    </section>
  )
}
