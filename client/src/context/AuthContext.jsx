import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('es_user')) } catch { return null }
  })
  const [token,   setToken]   = useState(() => localStorage.getItem('es_token'))
  const [loading, setLoading] = useState(false)

  // Persist helpers
  const persist = useCallback((userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('es_user', JSON.stringify(userData))
    localStorage.setItem('es_token', authToken)
  }, [])

  const clear = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('es_user')
    localStorage.removeItem('es_token')
  }, [])

  // ── Login ───────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await authApi.login({ email, password })
      persist(data.user, data.token)
      return { success: true, user: data.user }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [persist])

  // ── Register ────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    setLoading(true)
    try {
      const { data } = await authApi.register(formData)
      persist(data.user, data.token)
      return { success: true, user: data.user }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed'
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [persist])

  // ── Logout ──────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clear()
  }, [clear])

  // ── Update profile ──────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    try {
      const { data } = await authApi.update(updates)
      const updated = { ...user, ...data.user }
      setUser(updated)
      localStorage.setItem('es_user', JSON.stringify(updated))
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Update failed' }
    }
  }, [user])

  // ── Validate token on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!token) return
    authApi.me()
      .then(({ data }) => {
        setUser(data.user)
        localStorage.setItem('es_user', JSON.stringify(data.user))
      })
      .catch(() => clear())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount only

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuth: !!user,
      role: user?.role,
      login, register, logout, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
