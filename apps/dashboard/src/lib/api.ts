import axios from 'axios'
import { getToken } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),

  register: (data: {
    email: string
    password: string
    name: string
    trust_level?: number
    role_name?: string
  }) => api.post('/api/auth/register', data),

  me: () => api.get('/api/auth/me'),
}

export const eventsAPI = {
  getAll: (org_id?: string) =>
    api.get('/api/events', { params: { org_id } }),

  getActive: () => api.get('/api/events/active'),

  getById: (id: string) => api.get(`/api/events/${id}`),

  create: (data: {
    name: string
    type: string
    deployment_profile?: string
    description?: string
    escalation_timeout_min?: number
  }) => api.post('/api/events', data),

  transition: (id: string, status: string) =>
    api.patch(`/api/events/${id}/status`, { status }),

  update: (id: string, data: any) =>
    api.patch(`/api/events/${id}`, data),
}

export const alertsAPI = {
  getAll: (event_id?: string) =>
    api.get('/api/alerts', { params: { event_id } }),

  getActive: (event_id?: string) =>
    api.get('/api/alerts/active', { params: { event_id } }),

  getById: (id: string) => api.get(`/api/alerts/${id}`),

  create: (data: {
    type: string
    severity: string
    title?: string
    description?: string
    latitude: number
    longitude: number
    radius_km?: number
    event_id: string
  }) => api.post('/api/alerts', data),

  resolve: (id: string) => api.patch(`/api/alerts/${id}/resolve`),
}

export const ticketsAPI = {
  getByEvent: (event_id: string, status?: string) =>
    api.get('/api/tickets', { params: { event_id, status } }),

  getById: (id: string) => api.get(`/api/tickets/${id}`),

  create: (data: {
    event_id: string
    need_type: string
    resource_category: string
    priority: string
    quantity?: number
    latitude: number
    longitude: number
    description?: string
  }) => api.post('/api/tickets', data),

  update: (id: string, data: {
    status?: string
    assigned_to?: string
    priority?: string
  }) => api.patch(`/api/tickets/${id}`, data),
}

export const signalsAPI = {
  getPending: (event_id: string) =>
    api.get('/api/signals', { params: { event_id } }),

  create: (data: {
    event_id: string
    raw_message: string
    latitude?: number
    longitude?: number
    contact_info?: string
  }) => api.post('/api/signals', data),

  review: (id: string, action: 'confirm' | 'reject', linked_ticket_id?: string) =>
    api.patch(`/api/signals/${id}/review`, { action, linked_ticket_id }),
}

export const mapsAPI = {
  getLayers: (event_id: string) =>
    api.get('/api/layers', { params: { event_id } }),

  createLayer: (data: {
    name: string
    layer_type: string
    event_id: string
    geom: Record<string, any>
    metadata?: Record<string, any>
  }) => api.post('/api/layers', data),

  getRoutes: (event_id: string) =>
    api.get('/api/routes', { params: { event_id } }),

  createRoute: (data: {
    name: string
    event_id: string
    waypoints: Record<string, any>[]
    description?: string
  }) => api.post('/api/routes', data),
}

export default api