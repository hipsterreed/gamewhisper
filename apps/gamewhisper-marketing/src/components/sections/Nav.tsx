import { useState, useEffect } from 'react'
import logo from '../../assets/gamewhisper_icon_circle.png'

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
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 64 }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src={logo} alt="Game Whisper" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>
            Game Whisper
          </span>
        </a>
      </div>
    </nav>
  )
}
