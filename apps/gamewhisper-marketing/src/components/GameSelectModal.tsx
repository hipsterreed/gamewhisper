import logoVideo from '../assets/gamewhisper_icon_animation.mp4'
import stardewLogo from '../assets/stardew-valley-logo.png'
import minecraftLogo from '../assets/minecraft_logo.svg'
import eldenRingLogo from '../assets/elden_ring_logo.jpg'

interface GameSelectModalProps {
  onSelect: (game: string) => void
  onClose: () => void
}

const GAMES = [
  { name: 'Stardew Valley', color: '#7c5cbf', glow: 'rgba(124,92,191,0.4)', image: stardewLogo,   imageScale: 1.3 },
  { name: 'Minecraft',      color: '#5a9c6e', glow: 'rgba(90,156,110,0.4)', image: minecraftLogo, imageScale: 1 },
  { name: 'Elden Ring',     color: '#c8a84b', glow: 'rgba(200,168,75,0.4)', image: eldenRingLogo, imageScale: 1 },
]

export function GameSelectModal({ onSelect, onClose }: GameSelectModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 100,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 101,
          width: '100%',
          maxWidth: 480,
          padding: '0 24px',
        }}
      >
        <div
          style={{
            background: '#0e0e1a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: '40px 36px',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          }}
        >
          {/* Logo video */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <video
              src={logoVideo}
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: 180,
                height: 180,
                objectFit: 'cover',
                maskImage: 'radial-gradient(circle, black 10%, transparent 45%)',
                WebkitMaskImage: 'radial-gradient(circle, black 10%, transparent 45%)',
              }}
            />
          </div>

          <p style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 16,
            textAlign: 'center',
            lineHeight: 1.6,
            margin: '0 0 32px',
          }}>
            GameWhisper is usually loaded on your desktop while you are playing a game.<br /><br />For demo purposes, select a game.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {GAMES.map((game) => (
              <button
                key={game.name}
                onClick={() => onSelect(game.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 20px',
                  borderRadius: 12,
                  border: `1px solid ${game.color}40`,
                  background: `${game.color}12`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${game.color}22`
                  e.currentTarget.style.borderColor = `${game.color}80`
                  e.currentTarget.style.boxShadow = `0 0 16px ${game.glow}`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = `${game.color}12`
                  e.currentTarget.style.borderColor = `${game.color}40`
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={game.image} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${game.imageScale})` }} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: 500 }}>
                  {game.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
