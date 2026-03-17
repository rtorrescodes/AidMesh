import { User, AuthState } from '@/types'

const TOKEN_KEY = 'aidmesh_token'
const REFRESH_KEY = 'aidmesh_refresh'
const USER_KEY = 'aidmesh_user'

export function saveAuth(state: AuthState) {
  if (typeof window === 'undefined') return
  if (state.access_token) localStorage.setItem(TOKEN_KEY, state.access_token)
  if (state.refresh_token) localStorage.setItem(REFRESH_KEY, state.refresh_token)
  if (state.user) localStorage.setItem(USER_KEY, JSON.stringify(state.user))
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false
  if (user.trust_level === 3) return true
  return user.permissions?.[permission] === true
}

export function isAuthenticated(): boolean {
  return !!getToken() && !!getUser()
}