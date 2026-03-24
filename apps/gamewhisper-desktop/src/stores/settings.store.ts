import { create } from 'zustand'
import { load, Store } from '@tauri-apps/plugin-store'

export type OverlayPosition = 'center' | 'top-left' | 'top-center' | 'top-right'

interface SettingsState {
  hotkey: string
  overlayTransparent: boolean
  overlayPosition: OverlayPosition
  monitorIndex: number
  elevenLabsAgentId: string
  elevenLabsApiKey: string
  micDeviceId: string
  outputDeviceId: string
  initialized: boolean

  initialize: () => Promise<void>
  setHotkey: (hotkey: string) => Promise<void>
  setOverlayTransparent: (transparent: boolean) => Promise<void>
  setOverlayPosition: (position: OverlayPosition) => Promise<void>
  setMonitorIndex: (index: number) => Promise<void>
  setElevenLabsConfig: (agentId: string, apiKey: string) => Promise<void>
  setAudioDevices: (micDeviceId: string, outputDeviceId: string) => Promise<void>
}

let _store: Store | null = null

async function getStore(): Promise<Store> {
  if (!_store) {
    _store = await load('settings.json', { autoSave: false, defaults: {} })
  }
  return _store
}

async function persist(updates: Record<string, unknown>) {
  const store = await getStore()
  for (const [key, value] of Object.entries(updates)) {
    await store.set(key, value)
  }
  await store.save()
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hotkey: 'Alt+G',
  overlayTransparent: true,
  overlayPosition: 'center',
  monitorIndex: 0,
  elevenLabsAgentId: '',
  elevenLabsApiKey: '',
  micDeviceId: '',
  outputDeviceId: '',
  initialized: false,

  async initialize() {
    if (get().initialized) return
    try {
      const store = await getStore()
      const hotkey = (await store.get<string>('hotkey')) ?? 'Alt+G'
      const overlayTransparent = (await store.get<boolean>('overlayTransparent')) ?? true
      const overlayPosition = (await store.get<OverlayPosition>('overlayPosition')) ?? 'center'
      const elevenLabsAgentId = (await store.get<string>('elevenLabsAgentId')) ?? ''
      const elevenLabsApiKey = (await store.get<string>('elevenLabsApiKey')) ?? ''
      const monitorIndex = (await store.get<number>('monitorIndex')) ?? 0
      const micDeviceId = (await store.get<string>('micDeviceId')) ?? ''
      const outputDeviceId = (await store.get<string>('outputDeviceId')) ?? ''
      set({ hotkey, overlayTransparent, overlayPosition, monitorIndex, elevenLabsAgentId, elevenLabsApiKey, micDeviceId, outputDeviceId, initialized: true })
    } catch {
      set({ initialized: true })
    }
  },

  async setHotkey(hotkey) {
    set({ hotkey })
    await persist({ hotkey })
  },

  async setOverlayTransparent(overlayTransparent) {
    set({ overlayTransparent })
    await persist({ overlayTransparent })
  },

  async setOverlayPosition(overlayPosition) {
    set({ overlayPosition })
    await persist({ overlayPosition })
  },

  async setMonitorIndex(monitorIndex) {
    set({ monitorIndex })
    await persist({ monitorIndex })
  },

  async setElevenLabsConfig(elevenLabsAgentId, elevenLabsApiKey) {
    set({ elevenLabsAgentId, elevenLabsApiKey })
    await persist({ elevenLabsAgentId, elevenLabsApiKey })
  },

  async setAudioDevices(micDeviceId, outputDeviceId) {
    set({ micDeviceId, outputDeviceId })
    await persist({ micDeviceId, outputDeviceId })
  },
}))
