// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import * as authApi from '../api/auth'
import { getToken, getStoredUser } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(getStoredUser())
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!getToken()) { setLoading(false); return }
      try {
        const me = await authApi.me()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [])

  async function login(email, password) {
    const data = await authApi.login(email, password)
    setUser(data.user)
    return data.user
  }

  async function register(payload) {
    const data = await authApi.register(payload)
    setUser(data.user)
    return data.user
  }

  async function logout() {
    await authApi.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}