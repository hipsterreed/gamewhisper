import { useRef, useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useSettingsStore, type OverlayPosition } from '../stores/settings.store'
import { useAuthStore } from '../stores/auth.store'

interface AudioDevice {
  deviceId: string
  label: string
}

export function Settings() {
  const {
    hotkey,
    overlayTransparent,
    overlayPosition,
    micDeviceId,
    outputDeviceId,
    setHotkey,
    setOverlayTransparent,
    setOverlayPosition,
    setAudioDevices,
  } = useSettingsStore()

  const { user, isLoading: authLoading, isSigningIn, error: authError, signIn, signOut } = useAuthStore()

  const [capturingHotkey, setCapturingHotkey] = useState(false)
  const [hotkeyError, setHotkeyError] = useState('')
  const captureRef = useRef<HTMLDivElement>(null)

  const [micDevices, setMicDevices] = useState<AudioDevice[]>([])
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([])

  useEffect(() => {
    async function loadDevices() {
      try {
        // Request mic permission briefly so labels are populated
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        stream.getTracks().forEach((t) => t.stop())
      } catch {
        // Permission denied — we'll still enumerate, just without labels
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const inputs = devices.filter((d) => d.kind === 'audioinput')
        const outputs = devices.filter((d) => d.kind === 'audiooutput')
        setMicDevices(inputs.map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${i + 1}`,
        })))
        setOutputDevices(outputs.map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${i + 1}`,
        })))
      } catch {
        // enumerateDevices not available
      }
    }
    loadDevices()
  }, [])

  function handleHotkeyCapture(e: React.KeyboardEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.key === 'Escape') { setCapturingHotkey(false); return }

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

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden select-none"
      style={{ background: '#08080f' }}
    >
      {/* Invisible drag strip with floating window controls */}
      <div data-tauri-drag-region className="relative shrink-0 h-10">
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
          <button
            onClick={() => getCurrentWindow().minimize()}
            className="w-7 h-7 flex items-center justify-center rounded-md text-white/25 hover:text-white/70 hover:bg-white/10 transition-all"
          >
            <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor">
              <rect width="10" height="1.5" rx="0.75" />
            </svg>
          </button>
          <button
            onClick={() => getCurrentWindow().close()}
            className="w-7 h-7 flex items-center justify-center rounded-md text-white/25 hover:text-white hover:bg-red-500/70 transition-all"
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="8" y2="8" />
              <line x1="8" y1="1" x2="1" y2="8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2 select-text">

        <div className="pb-1">
          <h1 className="text-lg font-semibold tracking-tight text-white/90">GameWhisper</h1>
          <p className="text-xs text-white/35 mt-0.5 tracking-wide">Settings</p>
        </div>

        <Section title="Account">
          {authLoading ? (
            <div className="px-4 py-3">
              <p className="text-sm text-white/30">Loading…</p>
            </div>
          ) : user ? (
            <Row
              label={user.displayName ?? user.email ?? 'Signed in'}
              hint={user.displayName ? (user.email ?? '') : ''}
            >
              <button
                onClick={signOut}
                className="text-xs px-3 py-1.5 rounded-md border border-white/12 bg-white/[0.06] text-white/60 hover:text-white/90 hover:border-white/25 transition-all"
              >
                Sign out
              </button>
            </Row>
          ) : (
            <div className="px-4 py-3 flex flex-col gap-2">
              <button
                onClick={signIn}
                disabled={isSigningIn}
                className="flex items-center justify-center gap-2.5 w-full py-2 px-4 rounded-lg border border-white/12 bg-white/[0.06] text-sm text-white/80 hover:bg-white/[0.10] hover:border-white/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn ? (
                  <span className="text-white/50">Waiting for sign-in…</span>
                ) : (
                  <><GoogleIcon />Sign in with Google</>
                )}
              </button>
              {authError && <p className="text-xs text-red-400 text-center">{authError}</p>}
            </div>
          )}
        </Section>

        <Section title="Hotkey">
          <Row label="Global shortcut" hint="Click then press your desired key combination">
            <div
              ref={captureRef}
              tabIndex={0}
              onKeyDown={capturingHotkey ? handleHotkeyCapture : undefined}
              onClick={() => setCapturingHotkey(true)}
              onBlur={() => setCapturingHotkey(false)}
              className={`
                inline-flex items-center px-3 py-1.5 rounded-md border cursor-pointer select-none text-xs font-mono transition-all
                ${capturingHotkey
                  ? 'border-blue-500/70 bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/30'
                  : 'border-white/12 bg-white/[0.06] text-white/80 hover:border-white/25 hover:bg-white/[0.09]'
                }
              `}
            >
              {capturingHotkey ? 'Press keys…' : hotkey}
            </div>
            {hotkeyError && <p className="text-red-400 text-xs mt-1">{hotkeyError}</p>}
          </Row>
        </Section>

        <Section title="Overlay">
          <Row label="Position" hint="Where the overlay appears on screen">
            <PositionPicker
              value={overlayPosition}
              onChange={(pos) => {
                setOverlayPosition(pos)
                invoke('set_overlay_position', { position: pos })
              }}
            />
          </Row>
          <Divider />
          <Row label="Transparent background" hint="Disable if overlay looks broken on your GPU">
            <Toggle enabled={overlayTransparent} onChange={(v) => setOverlayTransparent(v)} />
          </Row>
        </Section>

        <Section title="Audio">
          <Row label="Microphone" hint="Input device for voice sessions">
            <DeviceSelect
              devices={micDevices}
              value={micDeviceId}
              onChange={(id) => setAudioDevices(id, outputDeviceId)}
            />
          </Row>
          <Divider />
          <Row label="Output" hint="Playback device for agent audio">
            <DeviceSelect
              devices={outputDevices}
              value={outputDeviceId}
              onChange={(id) => setAudioDevices(micDeviceId, id)}
            />
          </Row>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
    >
      <div
        className="px-4 py-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="text-[10px] font-semibold tracking-widest uppercase text-white/30">{title}</span>
      </div>
      <div>{children}</div>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-white/80 leading-none">{label}</p>
        {hint && <p className="text-xs text-white/30 mt-1 leading-snug">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Divider() {
  return <div className="mx-4" style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
}

const POSITIONS: { value: OverlayPosition; label: string; icon: string }[] = [
  { value: 'top-left',   label: 'Top Left',   icon: '↖' },
  { value: 'top-center', label: 'Top Center', icon: '↑' },
  { value: 'top-right',  label: 'Top Right',  icon: '↗' },
  { value: 'center',     label: 'Center',     icon: '⊕' },
]

function PositionPicker({ value, onChange }: { value: OverlayPosition; onChange: (v: OverlayPosition) => void }) {
  return (
    <div className="flex gap-1.5">
      {POSITIONS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`flex flex-col items-center gap-1 py-1.5 px-2.5 rounded-md border text-[10px] transition-all ${
            value === p.value
              ? 'border-blue-500/70 bg-blue-500/15 text-blue-300'
              : 'border-white/10 bg-white/[0.03] text-white/35 hover:border-white/20 hover:text-white/60'
          }`}
        >
          <span className="text-sm leading-none">{p.icon}</span>
          <span className="whitespace-nowrap">{p.label}</span>
        </button>
      ))}
    </div>
  )
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-500' : 'bg-white/15'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function DeviceSelect({
  devices,
  value,
  onChange,
}: {
  devices: AudioDevice[]
  value: string
  onChange: (deviceId: string) => void
}) {
  if (devices.length === 0) {
    return <span className="text-xs text-white/25 italic">No devices found</span>
  }
  return (
    <select
      value={value || 'default'}
      onChange={(e) => onChange(e.target.value === 'default' ? '' : e.target.value)}
      className="text-xs rounded-md px-2.5 py-1.5 border border-white/12 bg-white/[0.06] text-white/80 hover:border-white/25 transition-all cursor-pointer outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30"
      style={{ maxWidth: 200 }}
    >
      <option value="default" style={{ background: '#0d0d1a' }}>System Default</option>
      {devices
        .filter((d) => d.deviceId !== 'default' && d.deviceId !== 'communications')
        .map((d) => (
          <option key={d.deviceId} value={d.deviceId} style={{ background: '#0d0d1a' }}>
            {d.label}
          </option>
        ))}
    </select>
  )
}
