import { useEffect } from 'react'
import { useSettingsStore } from './stores/settings.store'
import { useAuthStore } from './stores/auth.store'
import { Overlay } from './components/Overlay'
import { Dashboard } from './components/Dashboard'
import { SignIn } from './components/SignIn'

const isOverlay = window.location.hash === '#overlay'

function App() {
  const initialize = useSettingsStore((s) => s.initialize)
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isOverlay) {
    return <Overlay />
  }

  if (isLoading) {
    return null
  }

  if (!user) {
    return <SignIn />
  }

  return <Dashboard />
}

export default App
