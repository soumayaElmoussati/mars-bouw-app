// src/api/auth.js
import { api, setToken, setStoredUser, clearToken } from './client'

export async function login(email, password) {
  const data = await api.post('/auth/login', { email, password })
  setToken(data.token)
  setStoredUser(data.user)
  return data
}

export async function register(payload) {
  const data = await api.post('/auth/register', payload)
  setToken(data.token)
  setStoredUser(data.user)
  return data
}

export async function me() {
  return api.get('/auth/me')
}

export async function logout() {
  try { await api.post('/auth/logout') } catch { /* ignore */ }
  clearToken()
}