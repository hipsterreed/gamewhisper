import { useEffect, useCallback } from 'react'
import { doc, deleteDoc } from 'firebase/firestore'
import { useAuthStore } from '../stores/auth.store'
import { useHistoryStore } from '../stores/history.store'
import { auth, db } from '../lib/firebase'

const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.gamewhisper.io'

export function useHistory() {
  const user = useAuthStore((s) => s.user)
  const { sessions, isLoading, hasMore, fetchError, fetchMore, removeSession, reset } = useHistoryStore()

  useEffect(() => {
    if (user) {
      useHistoryStore.getState().subscribeRealtime(user.uid)
    } else {
      useHistoryStore.getState().unsubscribe()
      reset()
    }
    return () => {
      useHistoryStore.getState().unsubscribe()
    }
  }, [user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    const uid = auth.currentUser?.uid
    if (!uid) return false

    // Remove from local state immediately
    removeSession(sessionId)

    // Delete from Firestore
    deleteDoc(doc(db, 'users', uid, 'sessions', sessionId)).catch(() => {})

    // Fire-and-forget API call to clean up _sessionIndex
    auth.currentUser?.getIdToken().then((token) => {
      fetch(`${API_URL}/session/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }).catch(() => {})

    return true
  }, [removeSession])

  return {
    sessions,
    isLoading,
    hasMore,
    fetchError,
    fetchMore: () => { if (user) fetchMore(user.uid) },
    deleteSession,
  }
}
