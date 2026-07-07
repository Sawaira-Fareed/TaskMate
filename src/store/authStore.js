import { create } from 'zustand'
import { getCurrentUser, getSession } from '../lib/auth'

const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const [user, session] = await Promise.all([getCurrentUser(), getSession()])
      set({ user, session, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  clearAuth: () => set({ user: null, session: null }),
}))