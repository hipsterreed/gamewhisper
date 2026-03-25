import { createRoot } from 'react-dom/client'
import { signInAnonymously } from 'firebase/auth'
import { auth } from './lib/firebase'
import { initAnalytics } from './lib/analytics'
import './index.css'
import App from './App.tsx'

initAnalytics()

signInAnonymously(auth)
  .then(() => console.log('[GameWhisper] signInAnonymously succeeded'))
  .catch((err) => console.error('[GameWhisper] signInAnonymously failed:', err))

createRoot(document.getElementById('root')!).render(<App />)
