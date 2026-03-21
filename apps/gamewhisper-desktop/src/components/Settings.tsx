import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useSettingsStore, type OverlayPosition } from '../stores/settings.store'

export function Settings() {
  const {
    hotkey,
    overlayTransparent,
    overlayPosition,
    elevenLabsAgentId,
    elevenLabsApiKey,
    initialized,
    setHotkey,
    setOverlayTransparent,
    setOverlayPosition,
    setElevenLabsConfig,
  } = useSettingsStore()

  const [agentId, setAgentId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [capturingHotkey, setCapturingHotkey] = useState(false)
  const [hotkeyError, setHotkeyError] = useState('')
  const captureRef = useRef<HTMLDivElement>(null)

  // Sync local state from store once initialized
  useEffect(() => {
    if (initialized) {
      setAgentId(elevenLabsAgentId)
      setApiKey(elevenLabsApiKey)
    }
  }, [initialized, elevenLabsAgentId, elevenLabsApiKey])

  function handleHotkeyCapture(e: React.KeyboardEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (e.key === 'Escape') {
      setCapturingHotkey(false)
      return
    }

    // Build key combo string
    const parts: string[] = []
    if (e.altKey) parts.push('Alt')
    if (e.ctrlKey) parts.push('Control')
    if (e.shiftKey) parts.push('Shift')
    if (e.metaKey) parts.push('Meta')

    const key = e.key
    if (!['Alt', 'Control', 'Shift', 'Meta'].includes(key)) {
      parts.push(key.length === 1 ? key.toUpperCase() : key)
      const combo = parts.join('+')
      setCapturingHotkey(false)
      setHotkeyError('')
      setHotkey(combo).then(() => {
        invoke('update_hotkey', { hotkey: combo }).catch((err: string) => {
          setHotkeyError(`Failed to register: ${err}`)
        })
      })
    }
  }

  async function handleElevenLabsSave() {
    await setElevenLabsConfig(agentId, apiKey)
  }

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/40 text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0d0d18] text-white">
      <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">GameWhisper Settings</h1>
          <p className="text-white/40 text-sm mt-1">Configure your AI gaming companion</p>
        </div>

        {/* Hotkey */}
        <Section title="Hotkey">
          <div className="space-y-2">
            <label className="text-sm text-white/60">Global shortcut</label>
            <div
              ref={captureRef}
              tabIndex={0}
              onKeyDown={capturingHotkey ? handleHotkeyCapture : undefined}
              onClick={() => setCapturingHotkey(true)}
              onBlur={() => setCapturingHotkey(false)}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer select-none text-sm font-mono
                ${capturingHotkey
                  ? 'border-blue-500 bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/40'
                  : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20'
                }
              `}
            >
              {capturingHotkey ? 'Press keys…' : hotkey}
            </div>
            {hotkeyError && <p className="text-red-400 text-xs">{hotkeyError}</p>}
            <p className="text-white/30 text-xs">Click the badge then press your desired key combination</p>
          </div>
        </Section>

        {/* Display */}
        <Section title="Display">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Transparent overlay</p>
                <p className="text-xs text-white/30 mt-0.5">Disable if overlay appears broken on your GPU</p>
              </div>
              <Toggle
                enabled={overlayTransparent}
                onChange={(v) => setOverlayTransparent(v)}
              />
            </div>
            <div>
              <p className="text-sm text-white/80 mb-2">Overlay position</p>
              <PositionPicker
                value={overlayPosition}
                onChange={(pos) => {
                  setOverlayPosition(pos)
                  invoke('set_overlay_position', { position: pos })
                }}
              />
            </div>
          </div>
        </Section>

        {/* ElevenLabs */}
        <Section title="ElevenLabs Voice">
          <p className="text-xs text-white/30 mb-4">Required for Stage 2 voice features</p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-white/60 mb-1">Agent ID</label>
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                onBlur={handleElevenLabsSave}
                placeholder="agent_xxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onBlur={handleElevenLabsSave}
                placeholder="••••••••••••••••"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60"
              />
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3">{title}</h2>
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
        {children}
      </div>
    </div>
  )
}

const POSITIONS: { value: OverlayPosition; label: string; icon: string }[] = [
  { value: 'top-left', label: 'Top Left', icon: '↖' },
  { value: 'center', label: 'Center', icon: '⊕' },
  { value: 'top-right', label: 'Top Right', icon: '↗' },
]

function PositionPicker({ value, onChange }: { value: OverlayPosition; onChange: (v: OverlayPosition) => void }) {
  return (
    <div className="flex gap-2">
      {POSITIONS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg border text-xs transition-colors ${
            value === p.value
              ? 'border-blue-500 bg-blue-500/15 text-blue-300'
              : 'border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/60'
          }`}
        >
          <span className="text-base leading-none">{p.icon}</span>
          <span>{p.label}</span>
        </button>
      ))}
    </div>
  )
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-500' : 'bg-white/20'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
