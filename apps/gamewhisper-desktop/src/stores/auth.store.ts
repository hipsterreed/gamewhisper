import { create } from 'zustand'
import { signOut as firebaseSignOut, onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { startGoogleSignIn } from '../lib/googleAuth'

interface AuthState {
  user: User | null
  isLoading: boolean
  isSigningIn: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => {
  onAuthStateChanged(auth, (user) => {
    set({ user, isLoading: false })
  })

  return {
    user: null,
    isLoading: true,
    isSigningIn: false,
    error: null,

    async signIn() {
      set({ error: null, isSigningIn: true })
      try {
        await startGoogleSignIn()
        // onAuthStateChanged fires and sets user when signInWithCredential succeeds
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('signIn error:', err)
        set({ error: msg })
      } finally {
        set({ isSigningIn: false })
      }
    },

    async signOut() {
      await firebaseSignOut(auth)
    },
  }
})
