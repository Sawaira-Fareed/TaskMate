import { useEffect } from 'react'
import useAuthStore from '../store/authStore'

export function useAuth() {
  const { user, session, loading, error, initialize, clearAuth } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return { user, session, loading, error, isAuthenticated: !!user, clearAuth }
}