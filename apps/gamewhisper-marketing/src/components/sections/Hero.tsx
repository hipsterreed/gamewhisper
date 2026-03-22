import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      {/* Background radial gradient */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30,40,90,0.6) 0%, transparent 70%)',
      }} />
      {/* Ambient orb glow top-center */}
      <div style={{
        position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,163,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760 }}>
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontSize: 'clamp(44px, 8vw, 80px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            margin: '0 0 24px',
            color: '#fff',
          }}
        >
          Never alt-tab again.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: 'var(--color-muted-bright)',
            lineHeight: 1.6,
            margin: '0 0 40px',
            maxWidth: 560,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Game Whisper is the voice-powered gaming assistant that listens, finds the answer, and speaks it back while you keep playing.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}
        >
          <a href="#download" className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v9M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Download for Windows
          </a>
          <a href="#demo" className="btn-secondary" style={{ fontSize: 16, padding: '14px 28px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M6.5 5.5l5 2.5-5 2.5V5.5z" fill="currentColor" /></svg>
            Watch Demo
          </a>
        </motion.div>

        {/* Trust pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          {['Windows Desktop', 'Powered by ElevenLabs', 'Real-Time Wiki Search', 'No Alt-Tab Required'].map(item => (
            <span
              key={item}
              style={{
                fontSize: 12, color: 'var(--color-muted)', fontWeight: 500,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 100, padding: '5px 12px',
              }}
            >
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Hero media placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 900, marginTop: 64 }}
      >
        <div
          className="media-placeholder"
          style={{
            aspectRatio: '16/9',
            borderColor: 'rgba(79,163,255,0.2)',
            boxShadow: '0 0 60px rgba(79,163,255,0.08), 0 40px 80px rgba(0,0,0,0.5)',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity={0.3}>
            <rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="2" />
            <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M20 19l10 5-10 5V19z" fill="currentColor" />
          </svg>
          <span>Hero Product Demo Placeholder</span>
          <span style={{ fontSize: 11, opacity: 0.5 }}>Replace with gameplay footage or product loop</span>
        </div>
        {/* Glow beneath */}
        <div style={{
          position: 'absolute', bottom: -40, left: '10%', right: '10%', height: 80,
          background: 'rgba(79,163,255,0.06)',
          filter: 'blur(40px)',
          borderRadius: '50%',
        }} />
      </motion.div>
    </section>
  )
}
