interface HotkeyHintProps {
  onActivate: () => void
  disabled: boolean
}

export function HotkeyHint({ onActivate, disabled }: HotkeyHintProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 gap-5 pointer-events-none">
      <div className="text-center pointer-events-none">
        <p className="text-white/50 text-sm tracking-wide mb-4">
          {disabled ? 'Connecting…' : 'Press to summon your AI guide'}
        </p>
        <div className="flex items-center justify-center gap-2">
          <KeyBadge label="ALT" />
          <span className="text-white/30 text-sm font-light">+</span>
          <KeyBadge label="G" />
        </div>
      </div>

      <button
        onClick={onActivate}
        disabled={disabled}
        className="pointer-events-auto px-6 py-2.5 rounded-full border border-white/20 text-white/60 text-sm hover:border-white/40 hover:text-white/80 hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Try it now
      </button>
    </div>
  )
}

function KeyBadge({ label }: { label: string }) {
  return (
    <div
      className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 text-white/70 text-sm font-mono font-medium"
      style={{ boxShadow: '0 2px 0 rgba(255,255,255,0.1), 0 3px 0 rgba(0,0,0,0.3)' }}
    >
      {label}
    </div>
  )
}
