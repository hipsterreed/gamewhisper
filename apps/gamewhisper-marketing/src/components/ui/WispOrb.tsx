type WispState = 'idle' | 'listening' | 'searching' | 'speaking' | 'error'

interface WispOrbProps {
  state?: WispState
  size?: number
  className?: string
}

const STATE_COLORS: Record<WispState, { color: string; dim: string; label: string }> = {
  idle: { color: '#4fa3ff', dim: 'rgba(79,163,255,0.2)', label: 'Idle' },
  listening: { color: '#4fa3ff', dim: 'rgba(79,163,255,0.3)', label: 'Listening' },
  searching: { color: '#f59e0b', dim: 'rgba(245,158,11,0.3)', label: 'Searching' },
  speaking: { color: '#a855f7', dim: 'rgba(168,85,247,0.3)', label: 'Speaking' },
  error: { color: '#ef4444', dim: 'rgba(239,68,68,0.3)', label: 'Error' },
}

export default function WispOrb({ state = 'idle', size = 80, className = '' }: WispOrbProps) {
  const { color, dim } = STATE_COLORS[state]

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}44)`,
        boxShadow: `0 0 ${size * 0.3}px ${size * 0.08}px ${dim}, 0 0 ${size * 0.8}px ${size * 0.15}px ${dim}`,
        animation: 'wisp-float 3s ease-in-out infinite, wisp-glow-pulse 2.5s ease-in-out infinite',
        flexShrink: 0,
        ['--orb-color-dim' as string]: dim,
      }}
    />
  )
}

export { STATE_COLORS }
export type { WispState }
