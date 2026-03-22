import { useEffect } from 'react'
import { useSettingsStore } from './stores/settings.store'
import { Overlay } from './components/Overlay'
import { Dashboard } from './components/Dashboard'

const isOverlay = window.location.hash === '#overlay'

function App() {
  const initialize = useSettingsStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isOverlay) {
    return <Overlay />
  }

  return <Dashboard />
}

export default App
