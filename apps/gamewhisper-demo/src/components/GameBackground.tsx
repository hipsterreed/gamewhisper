interface GameBackgroundProps {
  dimmed: boolean
}

export function GameBackground({ dimmed }: GameBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, #1a2a6c 0%, #2d5a8e 40%, #4a89b5 70%, #87ceeb 100%)' }}
      />

      {/* Sun */}
      <div
        className="absolute"
        style={{
          top: '8%',
          right: '15%',
          width: 48,
          height: 48,
          background: '#FFD700',
          boxShadow: '0 0 40px 10px rgba(255, 215, 0, 0.4)',
        }}
      />

      {/* Far mountains */}
      <div className="absolute" style={{ bottom: '33%', left: '5%', width: 80, height: 100, background: '#3a5e3a' }} />
      <div className="absolute" style={{ bottom: '33%', left: '8%', width: 60, height: 130, background: '#2d4d2d' }} />
      <div className="absolute" style={{ bottom: '33%', right: '10%', width: 100, height: 90, background: '#3a5e3a' }} />
      <div className="absolute" style={{ bottom: '33%', right: '15%', width: 70, height: 120, background: '#2d4d2d' }} />

      {/* Ground layers */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '33%', background: '#4a7c59' }} />
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '27%', background: '#8b6343' }} />

      {/* Grass top strip */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: '33%',
          height: 12,
          background: 'repeating-linear-gradient(90deg, #5a9c6e 0px, #5a9c6e 16px, #4a7c59 16px, #4a7c59 32px)',
        }}
      />

      {/* Tree 1 */}
      <div className="absolute" style={{ bottom: 'calc(33% + 0px)', left: '20%', width: 16, height: 60, background: '#5c3d1e' }} />
      <div className="absolute" style={{ bottom: 'calc(33% + 48px)', left: 'calc(20% - 24px)', width: 64, height: 48, background: '#2d6a3f' }} />

      {/* Tree 2 */}
      <div className="absolute" style={{ bottom: 'calc(33% + 0px)', left: '70%', width: 16, height: 70, background: '#5c3d1e' }} />
      <div className="absolute" style={{ bottom: 'calc(33% + 52px)', left: 'calc(70% - 28px)', width: 72, height: 56, background: '#2d6a3f' }} />

      {/* Now Playing HUD badge */}
      <div
        className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg"
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-white/80 text-xs font-medium">Now Playing: Minecraft</span>
      </div>

      {/* Dim overlay when voice panel is active */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.45)',
          opacity: dimmed ? 1 : 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
