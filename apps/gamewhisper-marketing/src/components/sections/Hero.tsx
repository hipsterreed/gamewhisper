import { motion } from 'framer-motion'
import logoVideo from '../../assets/gamewhisper_icon_animation.mp4'

interface HeroProps {
  onTryLive?: () => void
  onDownload?: () => void
}

export default function Hero({ onTryLive, onDownload }: HeroProps) {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 0 80px',
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
      {/* Ambient orb glow */}
      <div style={{
        position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,163,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '80rem', padding: '0 clamp(12px, 4vw, 24px)',
      }}>
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontSize: 'clamp(48px, 8vw, 88px)',
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            margin: '0 0 32px',
            paddingBottom: '0.1em',
            background: 'linear-gradient(to bottom right, #ffffff 30%, rgba(255,255,255,0.4))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          } as React.CSSProperties}
        >
          Never alt-tab<br className="mobile-break" /> again.
        </motion.h1>

        {/* Video + subheadline row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hero-wisp-row"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 }}
        >
          <video
            className="hero-wisp"
            src={logoVideo}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: 170,
              height: 170,
              objectFit: 'cover',
              flexShrink: 0,
              maskImage: 'radial-gradient(circle, black 10%, transparent 45%)',
              WebkitMaskImage: 'radial-gradient(circle, black 10%, transparent 45%)',
            }}
          />
          <p
            className="hero-subheadline"
            style={{
              fontSize: 'clamp(15px, 1.6vw, 19px)',
              color: '#9ca3af',
              lineHeight: 1.6,
              letterSpacing: '-0.015em',
              margin: 0,
              marginLeft: -90,
              position: 'relative',
              zIndex: 1,
              maxWidth: 480,
              textWrap: 'balance',
            } as React.CSSProperties}
          >
            Your in-game voice guide for quests, builds, bosses, and everything in between.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}
        >
          <button onClick={onDownload} className="btn-secondary hide-mobile" style={{ fontSize: 16, padding: '14px 32px', opacity: 0.6 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v9M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Download for Windows
          </button>
          {onTryLive && (
            <button onClick={onTryLive} className="btn-primary" style={{ fontSize: 16, padding: '14px 32px', background: '#ef4444', boxShadow: '0 0 20px rgba(239,68,68,0.35)', animation: 'tryLivePulse 2s ease-in-out infinite' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" opacity="0.9" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              Try it live
            </button>
          )}
          <a href="#demo" className="btn-secondary" style={{ fontSize: 16, padding: '14px 28px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M6.5 5.5l5 2.5-5 2.5V5.5z" fill="currentColor" /></svg>
            Watch Demo
          </a>
        </motion.div>

      </div>

      {/* Hero media placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '80rem', padding: '0 24px', marginTop: 64 }}
      >
        {/* Example prompts */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: 'var(--color-muted)', fontWeight: 500 }}>Ask things like:</span>
          {[
            { prompt: '"How do I make an enchanting table?"', game: 'Minecraft' },
            { prompt: '"What gifts does Abigail love?"', game: 'Stardew Valley' },
            { prompt: '"Where do I go after Margit?"', game: 'Elden Ring' },
          ].map(({ prompt, game }) => (
            <span
              key={prompt}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, padding: '5px 12px',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--color-muted-bright)', fontStyle: 'italic' }}>{prompt}</span>
              <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, letterSpacing: '0.02em' }}>{game}</span>
            </span>
          ))}
        </div>
        <video
          src="https://firebasestorage.googleapis.com/v0/b/gamewhisper-69fae.firebasestorage.app/o/hero_video.mp4?alt=media&token=ff842da4-2750-4985-815d-971a8bfb9c5c"
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            display: 'block',
            borderRadius: 16,
            border: '1px solid rgba(79,163,255,0.2)',
            boxShadow: '0 0 60px rgba(79,163,255,0.08), 0 40px 80px rgba(0,0,0,0.5)',
          }}
        />
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
