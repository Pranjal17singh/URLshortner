import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { urlAPI, analyticsAPI, formAPI } from '../utils/api'
import { 
  Plus, 
  Copy, 
  ExternalLink, 
  Trash2, 
  BarChart3, 
  Eye, 
  Users, 
  TrendingUp,
  Link as LinkIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import copy from 'copy-to-clipboard'

const Dashboard = () => {
  const [urls, setUrls] = useState([])
  const [stats, setStats] = useState({
    totalUrls: 0,
    totalClicks: 0,
    totalLeads: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [urlsResponse, statsResponse] = await Promise.all([
        urlAPI.getUrls(),
        analyticsAPI.getDashboard()
      ])
      
      setUrls(urlsResponse.data.urls)
      setStats(statsResponse.data)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (url) => {
    const shortUrl = `${window.location.origin}/${url.customAlias || url.shortCode}`
    copy(shortUrl)
    toast.success('Short URL copied to clipboard!')
  }

  const deleteUrl = async (id) => {
    if (!confirm('Are you sure you want to delete this URL?')) return
    
    try {
      await urlAPI.deleteUrl(id)
      setUrls(urls.filter(url => url.id !== id))
      toast.success('URL deleted successfully')
    } catch (error) {
      toast.error('Failed to delete URL')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Manage your short URLs and track performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <LinkIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total URLs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUrls}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClicks}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your URLs</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Short URL</span>
        </button>
      </div>

      {/* URLs List */}
      {urls.length === 0 ? (
        <div className="card text-center py-12">
          <LinkIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No URLs yet</h3>
          <p className="text-gray-600 mb-4">Create your first short URL to get started</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            Create Short URL
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Short Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {urls.map((url) => (
                  <tr key={url.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {url.title || url.originalUrl}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {url.originalUrl}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">
                        {url.customAlias || url.shortCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {url.clicks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {url.leads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(url)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy URL"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={url.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                          title="Visit original URL"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <Link
                          to={`/url/${url.id}`}
                          className="text-gray-400 hover:text-gray-600"
                          title="View analytics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteUrl(url.id)}
                          className="text-red-400 hover:text-red-600"
                          title="Delete URL"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create URL Modal */}
      {showCreateForm && (
        <CreateURLModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}

const CreateURLModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    originalUrl: '',
    customAlias: '',
    title: '',
    description: '',
    formId: '',
    theme: 'modern'
  })
  const [forms, setForms] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [formsResponse, templatesResponse] = await Promise.all([
        formAPI.getForms(),
        formAPI.getTemplates()
      ])
      setForms(formsResponse.data.forms)
      setTemplates(templatesResponse.data.templates)
    } catch (error) {
      console.error('Failed to load forms:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let finalFormData = { ...formData }
      
      // Clean up empty string values for optional fields
      if (finalFormData.customAlias === '') {
        finalFormData.customAlias = undefined
      }
      if (finalFormData.title === '') {
        finalFormData.title = undefined
      }
      if (finalFormData.description === '') {
        finalFormData.description = undefined
      }
      if (finalFormData.formId === '') {
        finalFormData.formId = undefined
      }
      
      
      // If a template is selected, create a custom form from template first
      if (formData.formId && templates.find(t => t.id === formData.formId)) {
        const template = templates.find(t => t.id === formData.formId)
        const newForm = await formAPI.createForm({
          name: `${template.name} - ${new Date().toLocaleDateString()}`,
          fields: template.fields
        })
        finalFormData.formId = newForm.data.form.id
      }
      
      await urlAPI.createUrl(finalFormData)
      toast.success('Short URL created successfully!')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create URL')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Short URL</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original URL *
            </label>
            <input
              type="url"
              required
              className="input-field"
              placeholder="https://example.com"
              value={formData.originalUrl}
              onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Alias (optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="my-custom-link"
              value={formData.customAlias}
              onChange={(e) => setFormData({ ...formData, customAlias: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to auto-generate a random short code
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Link title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              className="input-field"
              rows="3"
              placeholder="Link description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Form (optional)
            </label>
            <select
              className="input-field"
              value={formData.formId}
              onChange={(e) => setFormData({ ...formData, formId: e.target.value })}
            >
              <option value="">No form - Direct redirect</option>
              
              {templates.length > 0 && (
                <optgroup label="📝 Quick Templates">
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.fields.length} fields)
                    </option>
                  ))}
                </optgroup>
              )}
              
              {forms.length > 0 && (
                <optgroup label="🔧 Your Custom Forms">
                  {forms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.name} ({form.fields.length} fields)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            
            {forms.length === 0 && templates.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No forms available. <Link to="/forms" className="text-blue-600 hover:text-blue-800">Create your first form →</Link>
              </p>
            )}
            
            {formData.formId && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                {templates.find(t => t.id === formData.formId) ? (
                  <span className="text-blue-700">
                    📝 Template will be converted to your custom form
                  </span>
                ) : (
                  <span className="text-blue-700">
                    🔧 Using your custom form
                  </span>
                )}
              </div>
            )}
          </div>

          {formData.formId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme
              </label>
              <select
                className="input-field"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              >
                <option value="modern">Ocean Breeze</option>
                <option value="dark">Midnight Galaxy</option>
                <option value="gradient">Sunrise Bloom</option>
                <option value="neon">Electric Dreams</option>
                <option value="forest">Forest Mystique</option>
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Creating...' : 'Create URL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Dashboard