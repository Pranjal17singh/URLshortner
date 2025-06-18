import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const urlAPI = {
  getUrls: (params) => api.get('/urls', { params }),
  createUrl: (data) => api.post('/urls', data),
  getUrl: (id) => api.get(`/urls/${id}`),
  updateUrl: (id, data) => api.put(`/urls/${id}`, data),
  deleteUrl: (id) => api.delete(`/urls/${id}`),
  getUrlStats: (id) => api.get(`/urls/${id}/stats`),
  exportCsv: (id) => api.get(`/urls/${id}/export`, { responseType: 'blob' }),
}

export const formAPI = {
  getForms: (params) => api.get('/forms', { params }),
  getTemplates: () => api.get('/forms/templates'),
  createForm: (data) => api.post('/forms', data),
  getForm: (id) => api.get(`/forms/${id}`),
  updateForm: (id, data) => api.put(`/forms/${id}`, data),
  deleteForm: (id) => api.delete(`/forms/${id}`),
}

export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getOverallAnalytics: (timeRange) => api.get('/analytics/overall', { params: { timeRange } }),
  getUrlAnalytics: (urlId, params) => api.get(`/analytics/url/${urlId}`, { params }),
  exportData: (urlId, params) => api.get(`/analytics/export/${urlId}`, { params }),
}

export default api