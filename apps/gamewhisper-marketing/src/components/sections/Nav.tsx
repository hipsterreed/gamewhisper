import { useState, useEffect } from 'react'
import logoVideo from '../../assets/gamewhisper_icon_animation.mp4'
import elevenLabsLogo from '../../assets/elevenlabs-logo-white.png'
import firecrawlLogo from '../../assets/firecrawl-wordmark-white.svg'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'background 0.3s ease, border-color 0.3s ease',
        background: scrolled ? 'rgba(7,7,15,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
      }}
    >
      <div className="nav-inner" style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 64 }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <video
            src={logoVideo}
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={e => { e.currentTarget.currentTime = 0; e.currentTarget.pause() }}
            style={{
              width: 112,
              height: 112,
              objectFit: 'cover',
              maskImage: 'radial-gradient(circle, black 10%, transparent 45%)',
              WebkitMaskImage: 'radial-gradient(circle, black 10%, transparent 45%)',
            }}
          />
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', marginLeft: -28, position: 'relative', zIndex: 1 }}>
            Game Whisper
          </span>
        </a>

        <div className="nav-powered" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Powered by
          </span>
          <div className="nav-powered-logos" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center' }}>
              <img src={elevenLabsLogo} alt="ElevenLabs" style={{ height: 18, opacity: 0.6 }} />
            </a>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)' }} />
            <a href="https://www.firecrawl.dev/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center' }}>
              <img src={firecrawlLogo} alt="Firecrawl" style={{ height: 27, opacity: 0.6 }} />
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
