import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,           // send httpOnly cookie
  timeout: 15000,
})

// ── Request interceptor — attach Bearer token ─────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('es_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor — handle 401 globally ───────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('es_token')
      localStorage.removeItem('es_user')
      // let the individual call decide what to do
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data)   => api.post('/auth/register', data),
  login:    (data)   => api.post('/auth/login',    data),
  logout:   ()       => api.post('/auth/logout'),
  me:       ()       => api.get ('/auth/me'),
  update:   (data)   => api.patch('/auth/update-profile', data),
}

// ── Events ────────────────────────────────────────────────────────────────
export const eventsApi = {
  getAll:    (params)        => api.get('/events',              { params }),
  getById:   (id)            => api.get(`/events/${id}`),
  getMyEvents: ()            => api.get('/events/organizer/my'),
  create:    (formData)      => api.post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:    (id, formData)  => api.patch(`/events/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:    (id)            => api.delete(`/events/${id}`),
  approve:   (id)            => api.patch(`/events/${id}/approve`),
  reject:    (id)            => api.patch(`/events/${id}/reject`),
}

// ── Registrations ─────────────────────────────────────────────────────────
export const registrationsApi = {
  register:        (eventId) => api.post(`/registrations/${eventId}`),
  cancel:          (eventId) => api.delete(`/registrations/${eventId}`),
  getMyReg:        ()        => api.get('/registrations/my'),
  getEventReg:     (eventId) => api.get(`/registrations/event/${eventId}`),
  scanQr:          (qrToken) => api.post('/registrations/scan', { qrToken }),
}

// ── Notifications ─────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll:      ()   => api.get('/notifications'),
  markAllRead: ()   => api.patch('/notifications/read-all'),
  markRead:    (id) => api.patch(`/notifications/${id}/read`),
}

// ── Gallery ───────────────────────────────────────────────────────────────
export const galleryApi = {
  getAll:  (params)   => api.get('/gallery', { params }),
  upload:  (formData) => api.post('/gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:  (id)       => api.delete(`/gallery/${id}`),
}

// ── Admin ─────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats:       ()                  => api.get('/admin/stats'),
  getUsers:       (params)            => api.get('/admin/users', { params }),
  toggleUser:     (id)                => api.patch(`/admin/users/${id}/toggle`),
  changeRole:     (id, role)          => api.patch(`/admin/users/${id}/role`, { role }),
  sendAnnounce:   (text, roles)       => api.post('/admin/announce', { text, roles }),
}
