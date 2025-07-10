import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client - SHARED INSTANCE
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ygypgeehlnebgnznsvlb.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneXBnZWVobG5lYmduem5zdmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDExOTksImV4cCI6MjA2NjMxNzE5OX0.W2NjppWokpDg8rRNFniGiQkaVS52QLDX-IbhxX7qoCg'

// Single shared Supabase instance
export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to make authenticated API calls to our backend
const makeAuthenticatedRequest = async (url, options = {}) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`/api${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// API service functions
export const apiService = {
  // Dashboard
  getDashboard: () => makeAuthenticatedRequest('/analytics/dashboard'),
  
  // URLs
  getUrls: () => makeAuthenticatedRequest('/urls'),
  createUrl: (data) => makeAuthenticatedRequest('/urls', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateUrl: (id, data) => makeAuthenticatedRequest(`/urls/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteUrl: (id) => makeAuthenticatedRequest(`/urls/${id}`, {
    method: 'DELETE',
  }),
  
  // Forms
  getForms: () => makeAuthenticatedRequest('/forms'),
  getFormTemplates: () => makeAuthenticatedRequest('/forms/templates'),
  createForm: (data) => makeAuthenticatedRequest('/forms', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateForm: (id, data) => makeAuthenticatedRequest(`/forms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteForm: (id) => makeAuthenticatedRequest(`/forms/${id}`, {
    method: 'DELETE',
  }),
  
  // Analytics
  getUrlAnalytics: (id) => makeAuthenticatedRequest(`/analytics/urls/${id}`),
  getFormAnalytics: (id) => makeAuthenticatedRequest(`/analytics/forms/${id}`),
}