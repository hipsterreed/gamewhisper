import { useEffect } from 'react'
import { useSettingsStore } from './stores/settings.store'
import { Overlay } from './components/Overlay'
import { Settings } from './components/Settings'

const isOverlay = window.location.hash === '#overlay'

function App() {
  const initialize = useSettingsStore((s) => s.initialize)

  useEffect(() => {
    if (!isOverlay) {
      initialize()
    }
  }, [initialize])

  if (isOverlay) {
    return <Overlay />
  }

  return <Settings />
}

export default App
