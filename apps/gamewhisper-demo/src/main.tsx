import { createRoot } from 'react-dom/client'
import { signInAnonymously } from 'firebase/auth'
import { auth } from './lib/firebase'
import './index.css'
import App from './App'

// Trigger anonymous sign-in. Idempotent — Firebase restores persisted sessions
// via onAuthStateChanged if the user already has an anonymous uid from a prior visit.
signInAnonymously(auth).catch(() => {})

createRoot(document.getElementById('root')!).render(<App />)
