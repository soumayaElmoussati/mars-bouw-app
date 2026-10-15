// src/api/client.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

export function clearToken() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  if (user) localStorage.setItem('user', JSON.stringify(user))
  else localStorage.removeItem('user')
}

export async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  // 401 → token invalide → déconnexion
  if (res.status === 401) {
    clearToken()
    // redirige vers login si on n'y est pas déjà
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
    throw new Error('Session expired')
  }

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data
}

export const api = {
  get:    (path)       => apiFetch(path, { method: 'GET' }),
  post:   (path, body) => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (path, body) => apiFetch(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)       => apiFetch(path, { method: 'DELETE' }),
}

export { API_URL }