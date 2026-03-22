import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const games = [
  { name: 'Minecraft', genre: 'Sandbox / Survival', emoji: '⛏️' },
  { name: 'Stardew Valley', genre: 'RPG / Farming', emoji: '🌾' },
  { name: 'Elden Ring', genre: 'Action RPG', emoji: '⚔️' },
  { name: "Baldur's Gate 3", genre: 'CRPG', emoji: '🎲' },
  { name: 'Cyberpunk 2077', genre: 'Action RPG', emoji: '🌆' },
]

export default function SupportedGames() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="games" style={{ padding: '120px 24px' }}>
      <div className="section-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 42px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#fff',
            margin: '0 0 16px',
          }}>
            Built for games that send you to the wiki.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--color-muted-bright)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
            From RPGs and strategy games to sandbox and survival worlds, Game Whisper helps players get answers without breaking focus.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {games.map((game, i) => (
            <motion.div
              key={game.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: i * 0.09 }}
              className="card"
              style={{ textAlign: 'center', padding: '24px 20px' }}
            >
              <div
                className="media-placeholder"
                style={{ aspectRatio: '16/9', marginBottom: 16, borderRadius: 10, fontSize: 32 }}
              >
                {game.emoji}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 4 }}>{game.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 500 }}>{game.genre}</div>
            </motion.div>
          ))}

          {/* "And more" card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: games.length * 0.09 }}
            className="card"
            style={{
              textAlign: 'center', padding: '24px 20px',
              background: 'rgba(79,163,255,0.04)',
              borderColor: 'rgba(79,163,255,0.15)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎮</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-blue)', marginBottom: 4 }}>And many more</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Growing list of supported games</div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
