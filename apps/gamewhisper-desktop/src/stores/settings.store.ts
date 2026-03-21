import { create } from 'zustand'
import { load, Store } from '@tauri-apps/plugin-store'

export type OverlayPosition = 'center' | 'top-left' | 'top-right'

interface SettingsState {
  hotkey: string
  overlayTransparent: boolean
  overlayPosition: OverlayPosition
  elevenLabsAgentId: string
  elevenLabsApiKey: string
  initialized: boolean

  initialize: () => Promise<void>
  setHotkey: (hotkey: string) => Promise<void>
  setOverlayTransparent: (transparent: boolean) => Promise<void>
  setOverlayPosition: (position: OverlayPosition) => Promise<void>
  setElevenLabsConfig: (agentId: string, apiKey: string) => Promise<void>
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
  elevenLabsAgentId: '',
  elevenLabsApiKey: '',
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
      set({ hotkey, overlayTransparent, overlayPosition, elevenLabsAgentId, elevenLabsApiKey, initialized: true })
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

  async setElevenLabsConfig(elevenLabsAgentId, elevenLabsApiKey) {
    set({ elevenLabsAgentId, elevenLabsApiKey })
    await persist({ elevenLabsAgentId, elevenLabsApiKey })
  },
}))
