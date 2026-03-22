import { useEffect } from 'react'
import { useAuthStore } from '../stores/auth.store'
import { useHistoryStore } from '../stores/history.store'

export function useHistory() {
  const user = useAuthStore((s) => s.user)
  const { sessions, isLoading, hasMore, fetchInitial, fetchMore, reset } = useHistoryStore()

  useEffect(() => {
    if (user) {
      fetchInitial(user.uid)
    } else {
      reset()
    }
  }, [user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    sessions,
    isLoading,
    hasMore,
    fetchMore: () => { if (user) fetchMore(user.uid) },
  }
}
